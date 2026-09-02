import uuid
from decimal import Decimal
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Merchant, Category, Product, Cart, CartItem, Order, OrderItem, AuditLog
from app.core.enums import CartStatus, ItemOrigin, OrderStatus, AuditCategory, AuditSeverity, EventProvenance


@pytest.mark.asyncio
async def test_model_persistence_and_decimal_precision(db_session: AsyncSession):
    """Verifies that entity relationships and Decimal monetary types persist accurately."""
    # 1. Create Merchant
    merchant = Merchant(
        name="Apex Test Store",
        slug="apex-test-store",
        currency="INR",
        settings={"tier": "enterprise"},
    )
    db_session.add(merchant)
    await db_session.flush()
    assert merchant.id is not None

    # 2. Create Category & Product with Decimal money fields
    category = Category(
        name="Running Shoes",
        slug="running-shoes",
        description="Performance footwear",
    )
    db_session.add(category)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=category.id,
        sku="TEST-SHOE-01",
        name="Nitro HyperRunner",
        description="Speed running shoe",
        category="Running Shoes",
        price=Decimal("2499.50"),
        cost_price=Decimal("1200.00"),
        stock_quantity=50,
        image_url="https://example.com/shoe.jpg",
        tags=["running", "speed"],
    )
    db_session.add(product)
    await db_session.flush()

    # Query product and check Decimal precision
    res = await db_session.execute(select(Product).where(Product.sku == "TEST-SHOE-01"))
    fetched_product = res.scalar_one()
    assert fetched_product.price == Decimal("2499.50")
    assert isinstance(fetched_product.price, Decimal)

    # 3. Create Cart & CartItem
    cart = Cart(
        session_id="test-session-12345",
        status=CartStatus.ACTIVE,
    )
    db_session.add(cart)
    await db_session.flush()

    cart_item = CartItem(
        cart_id=cart.id,
        product_id=product.id,
        quantity=2,
        unit_price=Decimal("2499.50"),
        discount_amount=Decimal("100.00"),
        origin=ItemOrigin.DIRECT,
    )
    db_session.add(cart_item)
    await db_session.flush()

    assert cart_item.quantity == 2
    assert cart_item.origin == ItemOrigin.DIRECT

    # 4. Create Audit Log
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=merchant.id,
        agent_source="TEST_SUITE",
        event_category=AuditCategory.SYSTEM_EVENT,
        event_type="FOUNDATION_TEST",
        summary="Phase 1 automated model persistence test completed.",
        financial_delta=Decimal("0.00"),
        provenance=EventProvenance.SYSTEM,
        severity=AuditSeverity.INFO,
        metadata_json={"test_passed": True},
    )
    db_session.add(audit)
    await db_session.commit()

    # Verify audit log retrieval
    audit_res = await db_session.execute(select(AuditLog).where(AuditLog.merchant_id == merchant.id))
    persisted_audit = audit_res.scalar_one()
    assert persisted_audit.summary == "Phase 1 automated model persistence test completed."
