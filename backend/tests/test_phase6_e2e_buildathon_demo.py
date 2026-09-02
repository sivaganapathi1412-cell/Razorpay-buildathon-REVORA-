import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import (
    AuditCategory,
    EventProvenance,
    GrowthOpportunityStatus,
    OrderStatus,
    PaymentStatus,
    PolicyResult,
    RecoveryStatus,
)
from app.models import (
    AuditLog,
    Category,
    Customer,
    GrowthOpportunity,
    Merchant,
    MerchantRule,
    Order,
    OrderItem,
    Payment,
    PaymentAttempt,
    Product,
    RecoveryEvent,
    User,
)
from app.services.safety_engine import evaluate_financial_action


@pytest.mark.asyncio
async def test_canonical_buildathon_e2e_journey(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """
    End-to-End Buildathon Demo Flow Test:
    1. Conversational intent: 'I need running shoes under ₹3000' -> Velocity Nitro Shoes (₹2,499).
    2. Add Shoes + Cross-sell Socks (₹299) -> Cart total = ₹2,798.
    3. Checkout -> Controlled Demo Simulation Failure.
    4. Recovery Engine diagnoses failure and provides customer-authorized retry.
    5. Safe retry checkout -> Payment verified -> Order PAID -> Status RECOVERED.
    6. Attribution exactness: Paid = ₹2,798, Baseline = ₹2,499, Incremental = ₹299, Recovered = ₹2,798 (NO double counting).
    7. Audit trail records complete multi-agent timeline under trace_id.
    """
    # 1. Setup Merchant and Products
    merchant = Merchant(
        name="Revora Demo Athletics",
        slug=f"revora-athletics-{uuid.uuid4().hex[:6]}",
        currency="INR",
    )
    db_session.add(merchant)
    await db_session.flush()

    rule = MerchantRule(
        merchant_id=merchant.id,
        rule_name="DEFAULT_POLICY",
        max_discount_percentage=Decimal("10.00"),
        max_discount_amount=Decimal("300.00"),
        max_bundle_discount_pct=Decimal("15.00"),
        auto_recovery_incentive_max=Decimal("100.00"),
        require_approval_above_amount=Decimal("5000.00"),
        is_active=True,
    )
    db_session.add(rule)

    shoe_cat = Category(
        name=f"Footwear-{uuid.uuid4().hex[:4]}",
        slug="footwear-running",
        is_active=True,
    )
    db_session.add(shoe_cat)
    await db_session.flush()

    shoe = Product(
        merchant_id=merchant.id,
        category_id=shoe_cat.id,
        sku=f"REV-SHOE-{uuid.uuid4().hex[:4]}",
        name="Velocity Nitro Running Shoes",
        description="High performance running shoes under 3000.",
        category="Footwear & Running",
        price=Decimal("2499.00"),
        cost_price=Decimal("1400.00"),
        stock_quantity=50,
        image_url="https://example.com/shoe.jpg",
        tags=["running", "shoes"],
    )
    sock = Product(
        merchant_id=merchant.id,
        sku=f"REV-SOCK-{uuid.uuid4().hex[:4]}",
        name="Sports Cushion Socks",
        description="Anti-blister seamless socks.",
        category="Accessories & Gear",
        price=Decimal("299.00"),
        cost_price=Decimal("90.00"),
        stock_quantity=100,
        image_url="https://example.com/sock.jpg",
        tags=["socks", "accessory"],
    )
    db_session.add_all([shoe, sock])
    await db_session.commit()

    # Step 1: Shop with Revora AI Intent Discovery
    chat_res = await client.post(
        "/api/v1/ai-shopping/chat",
        json={"message": "I need running shoes under ₹3000"},
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert len(chat_data["recommendations"]) > 0
    assert any("Velocity Nitro" in r["name"] for r in chat_data["recommendations"])

    # Step 2: Customer Adds Shoes + Cross-sell Socks to Cart
    cart_res = await client.post(
        "/api/v1/cart/items",
        json={"product_id": str(shoe.id), "quantity": 1, "is_ai_recommended": False},
    )
    assert cart_res.status_code == 200
    cart_id = cart_res.json()["id"]

    # Add AI Incremental Cross-sell
    cross_res = await client.post(
        "/api/v1/cart/items",
        json={"cart_id": cart_id, "product_id": str(sock.id), "quantity": 1, "is_ai_recommended": True},
    )
    assert cross_res.status_code == 200
    cart_data = cross_res.json()
    assert Decimal(str(cart_data["total_amount"])) == Decimal("2798.00")
    assert Decimal(str(cart_data["baseline_subtotal"])) == Decimal("2499.00")
    assert Decimal(str(cart_data["ai_incremental_subtotal"])) == Decimal("299.00")

    # Step 3: Checkout and Create Order
    checkout_res = await client.post(
        "/api/v1/checkout/create-order",
        json={
            "cart_id": cart_id,
            "merchant_id": str(merchant.id),
            "customer_email": "runner.buildathon@demo.revora.ai",
            "customer_name": "Buildathon Runner",
        },
    )
    assert checkout_res.status_code == 201
    order_data = checkout_res.json()
    order_id = order_data["order_id"]
    assert Decimal(str(order_data["amount_inr"])) == Decimal("2798.00")

    # Step 4: Controlled Demo Failure Simulation (Bank Timeout)
    fail_res = await client.post(
        "/api/v1/checkout/simulate-failure",
        json={
            "order_id": order_id,
            "failure_code": "BANK_GATEWAY_TIMEOUT",
            "error_description": "Controlled demo simulation: Bank payment network timeout.",
        },
    )
    assert fail_res.status_code == 200
    fail_data = fail_res.json()
    assert fail_data["provenance"] == EventProvenance.DEMO_SIMULATION.value
    assert fail_data["recovery_event_id"] is not None
    recovery_event_id = fail_data["recovery_event_id"]

    # Step 5: Safe Customer-Authorized Recovery Retry
    retry_res = await client.post(
        "/api/v1/recovery/retry",
        json={"recovery_event_id": recovery_event_id},
    )
    assert retry_res.status_code == 200
    retry_data = retry_res.json()
    assert Decimal(str(retry_data["amount_inr"])) == Decimal("2798.00")

    # Step 6: Payment Verification
    verify_res = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order_id,
            "razorpay_order_id": retry_data["razorpay_order_id"],
            "razorpay_payment_id": f"pay_test_{uuid.uuid4().hex[:8]}",
            "razorpay_signature": "demo_test_sig_valid",
            "provenance": EventProvenance.REAL_RAZORPAY_TEST.value,
        },
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "PAID"
    assert verify_data["is_recovered"] is True

    # Step 7: Verify Attribution Invariant & Multi-Dimensional Ledger
    db_order = await db_session.get(Order, uuid.UUID(order_id))
    assert db_order.status == OrderStatus.PAID
    assert db_order.total_amount == Decimal("2798.00")
    assert db_order.baseline_revenue == Decimal("2499.00")
    assert db_order.ai_incremental_revenue == Decimal("299.00")
    assert db_order.is_recovered is True
    assert db_order.recovered_revenue == Decimal("2798.00")

    # Invariant check: Paid = Baseline + Incremental
    assert db_order.total_amount == db_order.baseline_revenue + db_order.ai_incremental_revenue

    # Step 8: Verify Complete Journey Trace in Audit Log
    trace_events_res = await db_session.execute(
        select(AuditLog).where(AuditLog.order_id == uuid.UUID(order_id)).order_by(AuditLog.timestamp.asc())
    )
    trace_events = trace_events_res.scalars().all()
    assert len(trace_events) >= 2


@pytest.mark.asyncio
async def test_safety_gating_scenarios(db_session: AsyncSession):
    """
    Validates 3 Safety Engine gating scenarios:
    - 7% discount: PASSED (automatic)
    - 12% discount: GATED (human-in-the-loop review required)
    - 30% discount: REJECTED (hard system ceiling)
    """
    merchant = Merchant(name="Safety Test Merchant", slug=f"safety-{uuid.uuid4().hex[:6]}")
    db_session.add(merchant)
    await db_session.flush()

    rule = MerchantRule(
        merchant_id=merchant.id,
        rule_name="MERCHANT_RULES",
        max_discount_percentage=Decimal("10.00"),
        max_discount_amount=Decimal("300.00"),
        max_bundle_discount_pct=Decimal("15.00"),
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    # Scenario A: 7% -> PASSED
    dec_a = await evaluate_financial_action(
        merchant_id=merchant.id,
        action_type="CART_DISCOUNT",
        discount_pct=Decimal("7.00"),
        discount_amount=Decimal("140.00"),
        order_amount=Decimal("2000.00"),
        db=db_session,
    )
    assert dec_a.policy_result == PolicyResult.PASSED
    assert dec_a.allowed is True
    assert dec_a.requires_approval is False

    # Scenario B: 12% -> GATED
    dec_b = await evaluate_financial_action(
        merchant_id=merchant.id,
        action_type="CART_DISCOUNT",
        discount_pct=Decimal("12.00"),
        discount_amount=Decimal("240.00"),
        order_amount=Decimal("2000.00"),
        db=db_session,
    )
    assert dec_b.policy_result == PolicyResult.GATED
    assert dec_b.allowed is False
    assert dec_b.requires_approval is True

    # Scenario C: 30% -> REJECTED
    dec_c = await evaluate_financial_action(
        merchant_id=merchant.id,
        action_type="CART_DISCOUNT",
        discount_pct=Decimal("30.00"),
        discount_amount=Decimal("600.00"),
        order_amount=Decimal("2000.00"),
        db=db_session,
    )
    assert dec_c.policy_result == PolicyResult.REJECTED
    assert dec_c.allowed is False
    assert dec_c.requires_approval is False
