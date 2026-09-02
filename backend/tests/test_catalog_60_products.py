import pytest
from decimal import Decimal
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import Product, Category
from app.seed.seed_db import seed_database


@pytest.mark.asyncio
async def test_exactly_60_active_products_in_catalog():
    """Verifies that the database contains exactly 60 active products."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Product).where(Product.is_active == True))
        active_products = res.scalars().all()
        assert len(active_products) == 60, f"Expected 60 active products, got {len(active_products)}"


@pytest.mark.asyncio
async def test_exactly_12_products_per_category():
    """Verifies that each of the 5 categories has exactly 12 active products."""
    categories = [
        "Footwear & Running",
        "Apparel & Activewear",
        "Accessories & Gear",
        "Electronics & Wearables",
        "Nutrition & Recovery",
    ]

    async with AsyncSessionLocal() as session:
        for cat_name in categories:
            res = await session.execute(
                select(Product).where(Product.category == cat_name, Product.is_active == True)
            )
            products_in_cat = res.scalars().all()
            assert len(products_in_cat) == 12, (
                f"Expected 12 products in '{cat_name}', found {len(products_in_cat)}"
            )


@pytest.mark.asyncio
async def test_canonical_demo_products_exist_with_exact_prices():
    """Verifies canonical baseline shoe (₹2,499) and AI cross-sell socks (₹299) exist."""
    async with AsyncSessionLocal() as session:
        res_shoe = await session.execute(
            select(Product).where(Product.sku == "REV-SHOE-01", Product.is_active == True)
        )
        shoe = res_shoe.scalar_one_or_none()
        assert shoe is not None
        assert shoe.name == "Velocity Nitro Running Shoes"
        assert shoe.price == Decimal("2499.00")
        assert shoe.stock_quantity > 0

        res_sock = await session.execute(
            select(Product).where(Product.sku == "REV-SOCK-01", Product.is_active == True)
        )
        sock = res_sock.scalar_one_or_none()
        assert sock is not None
        assert "Socks" in sock.name
        assert sock.price == Decimal("299.00")
        assert sock.stock_quantity > 0


@pytest.mark.asyncio
async def test_product_data_integrity_and_unique_skus():
    """Verifies unique SKUs, valid positive prices, valid stock, and non-empty images."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Product).where(Product.is_active == True))
        products = res.scalars().all()

        skus = set()
        for p in products:
            assert p.sku not in skus, f"Duplicate SKU found: {p.sku}"
            skus.add(p.sku)
            assert p.price > Decimal("0.00"), f"Invalid price for {p.sku}: {p.price}"
            assert p.stock_quantity >= 0, f"Negative stock for {p.sku}: {p.stock_quantity}"
            assert p.image_url and len(p.image_url.strip()) > 0, f"Missing image for {p.sku}"
            assert p.description and len(p.description.strip()) > 0, f"Missing description for {p.sku}"


@pytest.mark.asyncio
async def test_seed_idempotency():
    """Verifies that executing the seed process repeatedly maintains exactly 60 active products."""
    await seed_database()
    await seed_database()

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Product).where(Product.is_active == True))
        products = res.scalars().all()
        assert len(products) == 60, (
            f"Idempotency failed: expected 60 products after reseeding, got {len(products)}"
        )
