from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import EventProvenance, OrderStatus, RecoveryStatus
from app.models import Category, Merchant, Order, Product, RecoveryEvent


@pytest.mark.asyncio
async def test_full_e2e_checkout_failure_and_recovery_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """Full End-to-End Test for Phase 4:

    1. Seed merchant & products (Shoes ₹2,499, Socks ₹299).
    2. Add baseline shoes + AI cross-sell socks to cart -> Cart ₹2,798.
    3. Checkout -> Server-side order created (₹2,798, Baseline ₹2,499, AI ₹299).
    4. Controlled Failure -> RecoveryEvent created with DEMO_SIMULATION provenance.
    5. Recovery Retry -> Customer authorizes retry -> fresh attempt.
    6. Verify Payment -> Order marked PAID, RecoveryEvent marked RECOVERED.
    7. Attribution Integrity -> Total Paid = ₹2,798, Recovered = ₹2,798, No double counting.
    8. Duplicate Verification -> Idempotent response.
    """
    # 1. Setup Merchant and Products
    merchant = Merchant(
        name="Revora Athletics Test",
        slug="revora-test-store",
        currency="INR",
        country="India",
        is_active=True,
    )
    db_session.add(merchant)
    await db_session.flush()

    category = Category(
        name="Footwear",
        slug="footwear",
        is_active=True,
    )
    db_session.add(category)
    await db_session.flush()

    shoe = Product(
        merchant_id=merchant.id,
        category_id=category.id,
        sku="TEST-SHOE-01",
        name="Velocity Nitro Shoes",
        description="High performance running shoes",
        category="Footwear & Running",
        price=Decimal("2499.00"),
        cost_price=Decimal("1400.00"),
        stock_quantity=50,
        image_url="https://images.unsplash.com/test-shoe.jpg",
        is_active=True,
    )
    socks = Product(
        merchant_id=merchant.id,
        category_id=category.id,
        sku="TEST-SOCK-01",
        name="Sports Cushion Socks",
        description="Anti-blister running socks",
        category="Accessories & Gear",
        price=Decimal("299.00"),
        cost_price=Decimal("90.00"),
        stock_quantity=100,
        image_url="https://images.unsplash.com/test-sock.jpg",
        is_active=True,
    )
    db_session.add_all([shoe, socks])
    await db_session.commit()

    # 2. Add Baseline and AI Cross-Sell to Cart
    headers = {"Cookie": "revora_session_id=test_session_e2e"}
    
    # Add Shoes (Baseline)
    res_shoe = await client.post(
        "/api/v1/cart/items",
        json={"product_id": str(shoe.id), "quantity": 1, "added_via_ai": False},
        headers=headers,
    )
    assert res_shoe.status_code == 200

    # Add Socks (AI Cross-Sell)
    res_sock = await client.post(
        "/api/v1/cart/items",
        json={"product_id": str(socks.id), "quantity": 1, "added_via_ai": True},
        headers=headers,
    )
    assert res_sock.status_code == 200
    cart_data = res_sock.json()
    assert Decimal(str(cart_data["total_amount"])) == Decimal("2798.00")
    assert Decimal(str(cart_data["baseline_revenue"])) == Decimal("2499.00")
    assert Decimal(str(cart_data["ai_incremental_revenue"])) == Decimal("299.00")

    # 3. Create Checkout Order
    checkout_res = await client.post(
        "/api/v1/checkout/create-order",
        json={
            "customer_email": "runner@test.com",
            "customer_name": "Pro Runner",
            "session_id": "test_session_e2e",
        },
        headers=headers,
    )
    assert checkout_res.status_code == 201
    checkout_data = checkout_res.json()
    order_id = checkout_data["order_id"]
    rzp_order_id = checkout_data["razorpay_order_id"]
    assert checkout_data["amount_paise"] == 279800
    assert Decimal(str(checkout_data["total_amount"])) == Decimal("2798.00")

    # 4. Trigger Controlled Demo Failure Simulation
    sim_res = await client.post(
        "/api/v1/checkout/simulate-failure",
        json={
            "order_id": order_id,
            "failure_code": "BANK_AUTH_TIMEOUT",
            "failure_reason": "Bank OTP authentication timed out.",
            "failure_source": "bank",
        },
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    recovery_event_id = sim_data["recovery_event_id"]
    assert sim_data["status"] == "PAYMENT_FAILED"
    assert sim_data["provenance"] == "DEMO_SIMULATION"
    assert "Bank authentication timed out" in sim_data["diagnostic_summary"]

    # Verify database state
    rec_res = await db_session.execute(select(RecoveryEvent).where(RecoveryEvent.id == recovery_event_id))
    rec_event = rec_res.scalar_one()
    assert rec_event.status == RecoveryStatus.ACTIVE
    assert rec_event.provenance == EventProvenance.DEMO_SIMULATION

    # 5. Customer Authorizes Safe Retry
    retry_res = await client.post(
        "/api/v1/recovery/retry",
        json={"recovery_event_id": recovery_event_id},
    )
    assert retry_res.status_code == 200
    retry_data = retry_res.json()
    assert retry_data["status"] == "RETRIED"
    assert retry_data["amount_paise"] == 279800

    # 6. Verify Payment Signature
    verify_res = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order_id,
            "razorpay_order_id": retry_data["razorpay_order_id"],
            "razorpay_payment_id": "pay_test_recovery_success_123",
            "razorpay_signature": "demo_test_sig_valid_hash",
        },
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "PAID"
    assert verify_data["is_recovered"] is True
    assert Decimal(str(verify_data["total_paid_revenue"])) == Decimal("2798.00")
    assert Decimal(str(verify_data["recovered_revenue"])) == Decimal("2798.00")
    assert Decimal(str(verify_data["baseline_revenue"])) == Decimal("2499.00")
    assert Decimal(str(verify_data["ai_incremental_revenue"])) == Decimal("299.00")

    # 7. Non-Double Counting Check
    # Verify that total revenue is exactly ₹2,798 (Baseline ₹2,499 + AI Incremental ₹299), NOT ₹5,596
    ord_res = await db_session.execute(select(Order).where(Order.id == order_id))
    order_db = ord_res.scalar_one()
    assert order_db.total_amount == Decimal("2798.00")
    assert order_db.baseline_revenue + order_db.ai_incremental_revenue == order_db.total_amount
    assert order_db.is_recovered is True
    assert order_db.recovered_revenue == Decimal("2798.00")

    # 8. Idempotency Check: Calling verify again returns 200 with existing paid state
    dup_verify_res = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order_id,
            "razorpay_order_id": retry_data["razorpay_order_id"],
            "razorpay_payment_id": "pay_test_recovery_success_123",
            "razorpay_signature": "demo_test_sig_valid_hash",
        },
    )
    assert dup_verify_res.status_code == 200
    assert dup_verify_res.json()["status"] == "PAID"

    # 9. Blocked Retry Check: Retrying a paid order returns 400
    bad_retry_res = await client.post(
        "/api/v1/recovery/retry",
        json={"recovery_event_id": recovery_event_id},
    )
    assert bad_retry_res.status_code == 400
    assert "already PAID" in bad_retry_res.json()["detail"]
