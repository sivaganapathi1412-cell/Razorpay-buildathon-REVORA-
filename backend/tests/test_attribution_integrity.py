import uuid
from decimal import Decimal
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Merchant, Order, OrderItem
from app.core.enums import OrderStatus, ItemOrigin, EventProvenance
from app.schemas.attribution import MultiDimensionalAttribution


@pytest.mark.asyncio
async def test_multi_dimensional_attribution_integrity(db_session: AsyncSession):
    """Guarantees that AI incremental growth revenue and recovered revenue

    are tracked as separate analytical dimensions without double-counting total paid merchant revenue.
    """
    # 1. Setup Merchant
    merchant = Merchant(name="Revora Store", slug="revora-store", currency="INR")
    db_session.add(merchant)
    await db_session.flush()

    # Scenario:
    # Baseline product (Running Shoes): ₹2,499.00
    # AI Cross-Sell Add-on (Sports Socks): ₹299.00
    # Total Paid Order Amount = ₹2,798.00
    # The order subsequently suffered payment failure, was recovered by Revora Recovery Agent, and paid.
    
    baseline_val = Decimal("2499.00")
    ai_incremental_val = Decimal("299.00")
    total_order_amount = Decimal("2798.00")
    recovered_val = Decimal("2798.00")  # The full value of the order saved from loss

    order = Order(
        merchant_id=merchant.id,
        order_number="REV-ORD-TEST-101",
        status=OrderStatus.PAID,
        currency="INR",
        subtotal=total_order_amount,
        discount_total=Decimal("0.00"),
        total_amount=total_order_amount,  # Actual net revenue
        is_ai_assisted=True,
        baseline_revenue=baseline_val,
        ai_incremental_revenue=ai_incremental_val,
        is_recovered=True,
        recovered_revenue=recovered_val,
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
    )
    db_session.add(order)
    await db_session.commit()

    # Query and verify attribution dimensions
    res = await db_session.execute(select(Order).where(Order.order_number == "REV-ORD-TEST-101"))
    saved_order = res.scalar_one()

    # Integrity Assertions
    assert saved_order.total_amount == Decimal("2798.00")
    assert saved_order.baseline_revenue + saved_order.ai_incremental_revenue == saved_order.total_amount
    assert saved_order.is_recovered is True
    assert saved_order.recovered_revenue == Decimal("2798.00")

    # Ensure schema validation prevents false aggregation:
    # Total merchant revenue MUST NOT be 2499 + 299 + 2798 = 5596
    total_revenue_collected = saved_order.total_amount
    assert total_revenue_collected == Decimal("2798.00")

    attr_schema = MultiDimensionalAttribution(
        order_id=str(saved_order.id),
        order_number=saved_order.order_number,
        total_paid_revenue=saved_order.total_amount,
        is_ai_assisted=saved_order.is_ai_assisted,
        baseline_revenue=saved_order.baseline_revenue,
        ai_incremental_revenue=saved_order.ai_incremental_revenue,
        is_recovered=saved_order.is_recovered,
        recovered_revenue=saved_order.recovered_revenue,
        provenance=saved_order.provenance,
    )
    assert attr_schema.validate_integrity(attr_schema.baseline_revenue, attr_schema.ai_incremental_revenue, attr_schema.total_paid_revenue) is True
