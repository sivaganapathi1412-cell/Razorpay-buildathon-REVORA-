import asyncio
import logging
import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path

# Ensure backend root is in sys.path when executed directly
backend_root = str(Path(__file__).resolve().parent.parent.parent)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from sqlalchemy import select, delete, update
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    CustomerOutcome,
    EventProvenance,
    GrowthOpportunityStatus,
    ItemOrigin,
    OrderStatus,
    PaymentStatus,
    PolicyResult,
    RecoveryStatus,
    RiskLevel,
)
from app.core.security import hash_password
from app.models import (
    AgentDecision,
    AuditLog,
    Cart,
    CartItem,
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
from app.seed.demo_data import DEMO_MERCHANT, DEMO_CATEGORIES, DEMO_PRODUCTS

logger = logging.getLogger("revora.seed")
logging.basicConfig(level=logging.INFO)


async def seed_database():
    """
    Seeds the authoritative 100-product catalog across 5 athletic categories (20 each),
    merchant profile, safety policies, and canonical demo attribution records.
    Guaranteed idempotent: running multiple times preserves exactly 100 active demo products.
    """
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure new customer columns exist on legacy SQLite tables
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE customers ADD COLUMN hashed_password VARCHAR(255)"))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        except Exception:
            pass

    async with AsyncSessionLocal() as session:
        # 1. Seed or Fetch Merchant
        res = await session.execute(select(Merchant).where(Merchant.slug == DEMO_MERCHANT["slug"]))
        merchant = res.scalar_one_or_none()
        if not merchant:
            logger.info(f"Seeding merchant: {DEMO_MERCHANT['name']}")
            merchant = Merchant(**DEMO_MERCHANT)
            session.add(merchant)
            await session.flush()
        else:
            merchant.name = DEMO_MERCHANT["name"]
            merchant.currency = DEMO_MERCHANT["currency"]
            merchant.is_active = True
            merchant.settings = DEMO_MERCHANT["settings"]
            logger.info(f"Updated existing merchant: {merchant.name}")

        # 2. Seed Demo Owner User
        demo_email = "owner@revora.demo"
        user_res = await session.execute(select(User).where(User.email == demo_email))
        user = user_res.scalar_one_or_none()
        if not user:
            logger.info(f"Seeding demo owner account: {demo_email}")
            user = User(
                merchant_id=merchant.id,
                email=demo_email,
                hashed_password=hash_password("demo_password_123"),
                full_name="Alex Vance (Demo Owner)",
                role="OWNER",
                is_active=True,
            )
            session.add(user)
        else:
            user.merchant_id = merchant.id
            user.is_active = True

        # 3. Seed Default Merchant Safety Rule
        rule_res = await session.execute(select(MerchantRule).where(MerchantRule.merchant_id == merchant.id))
        rule = rule_res.scalar_one_or_none()
        if not rule:
            logger.info("Seeding default merchant safety policy...")
            rule = MerchantRule(
                merchant_id=merchant.id,
                rule_name="DEFAULT_MERCHANT_POLICY",
                max_discount_percentage=Decimal("10.00"),
                max_discount_amount=Decimal("300.00"),
                max_bundle_discount_pct=Decimal("15.00"),
                auto_recovery_incentive_max=Decimal("100.00"),
                require_approval_above_amount=Decimal("5000.00"),
                is_active=True,
                custom_rules={"allow_bundle_override": False},
            )
            session.add(rule)
        else:
            rule.max_discount_percentage = Decimal("10.00")
            rule.max_discount_amount = Decimal("300.00")
            rule.max_bundle_discount_pct = Decimal("15.00")
            rule.require_approval_above_amount = Decimal("5000.00")
            rule.is_active = True

        # 4. Seed Categories
        category_map = {}
        for cat_data in DEMO_CATEGORIES:
            cat_res = await session.execute(select(Category).where(Category.slug == cat_data["slug"]))
            cat = cat_res.scalar_one_or_none()
            if not cat:
                logger.info(f"Seeding category: {cat_data['name']}")
                cat = Category(**cat_data)
                session.add(cat)
                await session.flush()
            else:
                cat.name = cat_data["name"]
                cat.description = cat_data["description"]
                cat.is_active = True
            category_map[cat.slug] = cat.id

        # 5. Seed 60 Authoritative Products (Idempotent: update if existing, insert if new)
        valid_skus = set()
        product_map = {}
        for prod_data in DEMO_PRODUCTS:
            sku = prod_data["sku"]
            valid_skus.add(sku)
            cat_slug = prod_data.get("category_slug")
            cat_id = category_map.get(cat_slug)

            prod_res = await session.execute(select(Product).where(Product.sku == sku))
            prod = prod_res.scalar_one_or_none()

            clean_prod = {k: v for k, v in prod_data.items() if k != "category_slug"}

            if not prod:
                logger.info(f"Seeding new product: {prod_data['name']} ({sku})")
                product = Product(
                    merchant_id=merchant.id,
                    category_id=cat_id,
                    is_active=True,
                    **clean_prod
                )
                session.add(product)
                await session.flush()
                product_map[sku] = product
            else:
                # Update existing product attributes to keep catalog fresh & aligned
                prod.name = clean_prod["name"]
                prod.description = clean_prod["description"]
                prod.category = clean_prod["category"]
                prod.category_id = cat_id
                prod.price = clean_prod["price"]
                prod.cost_price = clean_prod.get("cost_price", prod.cost_price)
                prod.stock_quantity = clean_prod["stock_quantity"]
                prod.image_url = clean_prod["image_url"]
                prod.tags = clean_prod.get("tags", prod.tags)
                prod.metadata_json = clean_prod.get("metadata_json", prod.metadata_json)
                prod.is_active = True
                product_map[sku] = prod

        # 6. Deactivate any stray/obsolete products not in the official 60-SKU list
        res_all = await session.execute(select(Product))
        all_prods = res_all.scalars().all()
        for p in all_prods:
            if p.sku not in valid_skus:
                p.is_active = False
                logger.info(f"Deactivated obsolete product record: {p.name} ({p.sku})")

        # 7. Seed Demo Customers (with pre-hashed password for demo logins)
        cust_pwd = hash_password("password123")
        cust_res = await session.execute(select(Customer).where(Customer.email == "rahul.sharma@demo.revora.ai"))
        cust1 = cust_res.scalar_one_or_none()
        if not cust1:
            cust1 = Customer(
                email="rahul.sharma@demo.revora.ai",
                phone="+919876543210",
                full_name="Rahul Sharma",
                hashed_password=cust_pwd,
                is_active=True,
            )
            session.add(cust1)
            await session.flush()
        else:
            cust1.hashed_password = cust_pwd
            cust1.is_active = True

        cust2_res = await session.execute(select(Customer).where(Customer.email == "ananya.iyer@demo.revora.ai"))
        cust2 = cust2_res.scalar_one_or_none()
        if not cust2:
            cust2 = Customer(
                email="ananya.iyer@demo.revora.ai",
                phone="+919876501234",
                full_name="Ananya Iyer",
                hashed_password=cust_pwd,
                is_active=True,
            )
            session.add(cust2)
            await session.flush()
        else:
            cust2.hashed_password = cust_pwd
            cust2.is_active = True

        # 8. Seed Growth Opportunities (Gated & Approved policy examples)
        opp_res = await session.execute(select(GrowthOpportunity).where(GrowthOpportunity.bundle_name == "Pro Marathon Speed Pack"))
        if not opp_res.scalar_one_or_none():
            shoe_prod = product_map.get("REV-SHOE-01")
            sock_prod = product_map.get("REV-SOCK-01")
            gel_prod = product_map.get("REV-NUT-04")

            # Gated Opportunity: 12% discount exceeds 10% auto-limit
            gated_opp = GrowthOpportunity(
                merchant_id=merchant.id,
                primary_product_id=shoe_prod.id if shoe_prod else None,
                bundled_product_ids=[str(sock_prod.id), str(gel_prod.id)] if sock_prod and gel_prod else [],
                bundle_name="Pro Marathon Speed Pack",
                description="Pair Velocity Nitro Shoes with Sports Cushion Socks & Endurance Energy Gels.",
                projected_aov_lift_pct=Decimal("34.50"),
                proposed_discount_pct=Decimal("12.00"),
                status=GrowthOpportunityStatus.GATED,
                provenance=EventProvenance.AI,
                metadata_json={
                    "gating_reason": "Proposed discount of 12.00% exceeds merchant automatic limit of 10.00%.",
                    "trigger": "Shopping Cart High Intent",
                },
            )
            session.add(gated_opp)

            # Approved Opportunity: 8% discount within 10% limit
            appr_opp = GrowthOpportunity(
                merchant_id=merchant.id,
                primary_product_id=shoe_prod.id if shoe_prod else None,
                bundled_product_ids=[str(sock_prod.id)] if sock_prod else [],
                bundle_name="Velocity Runners Essential Bundle",
                description="Running Shoes + Anti-Blister Cushion Socks Cross-sell.",
                projected_aov_lift_pct=Decimal("11.96"),
                proposed_discount_pct=Decimal("8.00"),
                status=GrowthOpportunityStatus.APPROVED,
                provenance=EventProvenance.AI,
                metadata_json={"gating_reason": "Within automatic policy limits."},
            )
            session.add(appr_opp)

        # 9. Clean Transactional Reset for Fresh Buildathon State
        # Ensures Total Paid Revenue starts at strictly ₹0.00 until genuine customer purchase
        await session.execute(delete(RecoveryEvent))
        await session.execute(delete(PaymentAttempt))
        await session.execute(delete(Payment))
        await session.execute(delete(OrderItem))
        await session.execute(delete(Order))
        await session.execute(delete(CartItem))
        await session.execute(delete(Cart))

        await session.commit()
        logger.info("Authoritative 60-Product Demo Catalog synchronized & Transactional History reset to pristine ₹0 state!")


async def reset_transactional_data():
    """Explicit utility to clean all transactional revenue data while preserving catalog and config."""
    async with AsyncSessionLocal() as session:
        await session.execute(delete(RecoveryEvent))
        await session.execute(delete(PaymentAttempt))
        await session.execute(delete(Payment))
        await session.execute(delete(OrderItem))
        await session.execute(delete(Order))
        await session.execute(delete(CartItem))
        await session.execute(delete(Cart))
        await session.commit()
        logger.info("Transactional data successfully reset.")


if __name__ == "__main__":
    asyncio.run(seed_database())
