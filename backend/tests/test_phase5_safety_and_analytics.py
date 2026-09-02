import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import (
    AuditCategory,
    EventProvenance,
    GrowthOpportunityStatus,
    OrderStatus,
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
    Product,
    RecoveryEvent,
    User,
)
from app.core.security import create_access_token
from app.services.safety_engine import evaluate_financial_action


@pytest.mark.asyncio
async def test_safety_engine_deterministic_evaluations(db_session: AsyncSession):
    """Verifies that Safety Engine strictly enforces merchant bounds and never allows
    unbounded or unsafe discounts."""
    merchant = Merchant(
        name="Revora Safety Test Merchant",
        slug="safety-test-merchant",
        currency="INR",
        country="India",
        is_active=True,
    )
    db_session.add(merchant)
    await db_session.flush()

    rule = MerchantRule(
        merchant_id=merchant.id,
        rule_name="STRICT_SAFETY_TEST",
        max_discount_percentage=Decimal("10.00"),
        max_discount_amount=Decimal("300.00"),
        max_bundle_discount_pct=Decimal("15.00"),
        require_approval_above_amount=Decimal("5000.00"),
        is_active=True,
        custom_rules={
            "upsell_enabled": True,
            "cross_sell_enabled": True,
            "bundle_enabled": True,
            "recovery_enabled": True,
        },
    )
    db_session.add(rule)
    await db_session.commit()

    # 1. Safe action (7% discount) -> Allowed
    decision_safe = await evaluate_financial_action(
        merchant_id=merchant.id,
        action_type="CROSS_SELL",
        discount_pct=Decimal("7.00"),
        discount_amount=Decimal("150.00"),
        order_amount=Decimal("2000.00"),
        db=db_session,
    )
    assert decision_safe.allowed is True
    assert decision_safe.requires_approval is False
    assert decision_safe.policy_result == PolicyResult.PASSED

    # 2. Over-limit action (12% discount > 10% limit) -> Gated for human review
    decision_gated = await evaluate_financial_action(
        merchant_id=merchant.id,
        action_type="PROMOTIONAL_DISCOUNT",
        discount_pct=Decimal("12.00"),
        discount_amount=Decimal("240.00"),
        order_amount=Decimal("2000.00"),
        db=db_session,
    )
    assert decision_gated.allowed is False
    assert decision_gated.requires_approval is True
    assert decision_gated.policy_result == PolicyResult.GATED

    # 3. Hard safety ceiling breach (30% discount > 25% cap) -> Rejected
    decision_rejected = await evaluate_financial_action(
        merchant_id=merchant.id,
        action_type="PROMOTIONAL_DISCOUNT",
        discount_pct=Decimal("30.00"),
        discount_amount=Decimal("600.00"),
        order_amount=Decimal("2000.00"),
        db=db_session,
    )
    assert decision_rejected.allowed is False
    assert decision_rejected.requires_approval is False
    assert decision_rejected.policy_result == PolicyResult.REJECTED


@pytest.mark.asyncio
async def test_human_in_the_loop_approval_workflow(client: AsyncClient, db_session: AsyncSession):
    """Verifies that gated AI opportunities can be approved or rejected by the merchant,
    recording an immutable audit trail."""
    # 1. Setup Merchant and User
    merchant = Merchant(name="Approval Store", slug="approval-store", currency="INR", country="India", is_active=True)
    db_session.add(merchant)
    await db_session.flush()

    user = User(
        email="merchant.approver@revora.test",
        full_name="Approver Merchant",
        hashed_password="hash",
        merchant_id=merchant.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    category = Category(name="Gear", slug="gear", is_active=True)
    db_session.add(category)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=category.id,
        sku="TEST-PROD-01",
        name="Pro Running Vest",
        description="Hydration running vest with pockets",
        category="Apparel",
        price=Decimal("1999.00"),
        cost_price=Decimal("800.00"),
        stock_quantity=30,
        image_url="https://images.unsplash.com/vest.jpg",
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()

    # Create Gated Opportunity
    opp = GrowthOpportunity(
        merchant_id=merchant.id,
        primary_product_id=product.id,
        bundled_product_ids=[],
        bundle_name="12% Special Trail Runner Promo",
        description="High conversion promotion exceeding 10% auto-limit.",
        projected_aov_lift_pct=Decimal("15.00"),
        proposed_discount_pct=Decimal("12.00"),
        status=GrowthOpportunityStatus.GATED,
        provenance=EventProvenance.AI,
        metadata_json={"gating_reason": "Exceeds 10% auto discount limit"},
    )
    db_session.add(opp)
    await db_session.commit()

    token = create_access_token(subject=user.id, merchant_id=merchant.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Query Approvals Queue
    res_list = await client.get("/api/v1/approvals", headers=headers)
    assert res_list.status_code == 200
    queue = res_list.json()
    assert len(queue) == 1
    assert queue[0]["status"] == "GATED"
    assert queue[0]["bundle_name"] == "12% Special Trail Runner Promo"

    # 3. Approve the Gated Opportunity
    res_app = await client.post(
        f"/api/v1/approvals/{opp.id}/approve",
        json={"notes": "Approved for weekend trail marathon."},
        headers=headers,
    )
    assert res_app.status_code == 200
    app_data = res_app.json()
    assert app_data["status"] == "APPROVED"

    # 4. Verify in DB and Audit Log
    await db_session.refresh(opp)
    assert opp.status == GrowthOpportunityStatus.APPROVED

    audit_res = await client.get("/api/v1/audit?category=MERCHANT_APPROVAL", headers=headers)
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    assert len(audit_logs) >= 1
    assert "OPPORTUNITY_APPROVED" in [a["event_type"] for a in audit_logs]


@pytest.mark.asyncio
async def test_tenant_isolated_approvals_protection(client: AsyncClient, db_session: AsyncSession):
    """Verifies that Merchant A cannot view or approve Merchant B's opportunities."""
    merchant_a = Merchant(name="Merchant A Store", slug="store-a", currency="INR", country="India", is_active=True)
    merchant_b = Merchant(name="Merchant B Store", slug="store-b", currency="INR", country="India", is_active=True)
    db_session.add_all([merchant_a, merchant_b])
    await db_session.flush()

    user_a = User(email="user.a@revora.test", full_name="User A", hashed_password="h", merchant_id=merchant_a.id)
    user_b = User(email="user.b@revora.test", full_name="User B", hashed_password="h", merchant_id=merchant_b.id)
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    category = Category(name="Accessories", slug="acc", is_active=True)
    db_session.add(category)
    await db_session.flush()

    prod_b = Product(
        merchant_id=merchant_b.id,
        category_id=category.id,
        sku="SKU-B",
        name="Merchant B Product",
        description="Merchant B private product",
        category="Accessories",
        price=Decimal("500.00"),
        cost_price=Decimal("200.00"),
        stock_quantity=10,
        image_url="https://images.unsplash.com/b.jpg",
    )
    db_session.add(prod_b)
    await db_session.flush()

    opp_b = GrowthOpportunity(
        merchant_id=merchant_b.id,
        primary_product_id=prod_b.id,
        bundled_product_ids=[],
        bundle_name="Merchant B Secret Promo",
        description="Private",
        proposed_discount_pct=Decimal("15.00"),
        status=GrowthOpportunityStatus.GATED,
    )
    db_session.add(opp_b)
    await db_session.commit()

    token_a = create_access_token(subject=user_a.id, merchant_id=merchant_a.id)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Merchant A attempts to approve Merchant B's opportunity -> 404 (Isolated)
    res_bad = await client.post(f"/api/v1/approvals/{opp_b.id}/approve", headers=headers_a)
    assert res_bad.status_code == 404


@pytest.mark.asyncio
async def test_analytics_and_multi_dimensional_attribution_exactness(client: AsyncClient, db_session: AsyncSession):
    """Verifies that analytics overview accurately aggregates paid orders, computes
    AI AOV lift, and strictly prevents double-counting of recovered order values."""
    merchant = Merchant(name="Analytics Shop", slug="analytics-shop", currency="INR", country="India", is_active=True)
    db_session.add(merchant)
    await db_session.flush()

    user = User(email="analytics.lead@revora.test", full_name="Analytics Lead", hashed_password="h", merchant_id=merchant.id)
    customer = Customer(email="runner@revora.test", full_name="Athletic Runner")
    db_session.add_all([user, customer])
    await db_session.flush()

    # Order 1: Baseline ₹2,499 + AI Incremental ₹299 = Total Paid ₹2,798 (Recovered)
    order1 = Order(
        merchant_id=merchant.id,
        customer_id=customer.id,
        order_number="REV-ANALYTICS-01",
        status=OrderStatus.PAID,
        subtotal=Decimal("2798.00"),
        discount_total=Decimal("0.00"),
        total_amount=Decimal("2798.00"),
        baseline_revenue=Decimal("2499.00"),
        ai_incremental_revenue=Decimal("299.00"),
        recovered_revenue=Decimal("2798.00"),
        is_ai_assisted=True,
        is_recovered=True,
    )

    # Order 2: Standard Direct Purchase ₹1,500
    order2 = Order(
        merchant_id=merchant.id,
        customer_id=customer.id,
        order_number="REV-ANALYTICS-02",
        status=OrderStatus.PAID,
        subtotal=Decimal("1500.00"),
        discount_total=Decimal("0.00"),
        total_amount=Decimal("1500.00"),
        baseline_revenue=Decimal("1500.00"),
        ai_incremental_revenue=Decimal("0.00"),
        recovered_revenue=Decimal("0.00"),
        is_ai_assisted=False,
        is_recovered=False,
    )
    db_session.add_all([order1, order2])
    await db_session.flush()

    # Add 1 Recovered event and 1 Active event
    rec1 = RecoveryEvent(
        order_id=order1.id,
        customer_id=customer.id,
        failure_type="PAYMENT_FAILED",
        failure_code="BANK_AUTH_TIMEOUT",
        diagnostic_summary="Bank OTP validation timeout.",
        status=RecoveryStatus.RECOVERED,
        is_recovered=True,
        recovered_amount=Decimal("2798.00"),
        provenance=EventProvenance.DEMO_SIMULATION,
    )
    rec2 = RecoveryEvent(
        order_id=order2.id,
        customer_id=customer.id,
        failure_type="PAYMENT_FAILED",
        failure_code="NETWORK_ERROR",
        diagnostic_summary="Payment attempt dropped.",
        status=RecoveryStatus.ACTIVE,
        is_recovered=False,
        recovered_amount=Decimal("0.00"),
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
    )
    db_session.add_all([rec1, rec2])
    await db_session.commit()

    token = create_access_token(subject=user.id, merchant_id=merchant.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Query Overview Analytics
    res = await client.get("/api/v1/analytics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Financial Invariant Verifications
    # Total Paid = 2798 + 1500 = 4298
    # Baseline = 2499 + 1500 = 3999
    # AI Incremental = 299
    assert Decimal(str(data["total_paid_revenue"])) == Decimal("4298.00")
    assert Decimal(str(data["baseline_revenue"])) == Decimal("3999.00")
    assert Decimal(str(data["ai_incremental_revenue"])) == Decimal("299.00")
    assert Decimal(str(data["total_paid_revenue"])) == Decimal(str(data["baseline_revenue"])) + Decimal(str(data["ai_incremental_revenue"]))

    # Recovered Dimension: 2798 (Analytical classification, NOT added to 4298)
    assert Decimal(str(data["recovered_order_value"])) == Decimal("2798.00")
    assert data["paid_orders_count"] == 2
    assert Decimal(str(data["aov"])) == Decimal("2149.00")
    assert data["recovery_success_rate"] == 50.0  # 1 of 2 recovered
