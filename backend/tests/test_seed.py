import pytest
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Merchant, Category, Product, MerchantRule
from app.seed.seed_db import seed_database
from app.core.database import AsyncSessionLocal


@pytest.mark.asyncio
async def test_seed_database_execution():
    """Verifies that seed_database initializes all required Phase 1 records cleanly."""
    await seed_database()

    async with AsyncSessionLocal() as session:
        # Check merchant
        merchants = (await session.execute(select(Merchant))).scalars().all()
        assert len(merchants) >= 1
        assert merchants[0].slug == "revora-athletics"

        # Check safety rule
        rules = (await session.execute(select(MerchantRule))).scalars().all()
        assert len(rules) >= 1
        assert rules[0].max_discount_percentage == 10.0

        # Check categories
        categories = (await session.execute(select(Category))).scalars().all()
        assert len(categories) == 5

        # Check products
        products = (await session.execute(select(Product))).scalars().all()
        assert len(products) >= 10

        # Verify all products have positive prices and valid skus
        for prod in products:
            assert prod.price > 0
            assert prod.cost_price >= 0
            assert prod.stock_quantity > 0
            assert len(prod.sku) > 0
            assert prod.category_id is not None
