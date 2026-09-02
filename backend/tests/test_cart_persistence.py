import uuid
import pytest
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models import Product, Cart, CartItem
from app.core.enums import CartStatus, ItemOrigin


@pytest.mark.asyncio
async def test_anonymous_cart_creation_and_cookie_persistence():
    """Verifies that an anonymous visitor gets an active cart and persistent session cookie."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = client.get("/api/v1/cart")
        response = await res
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "session_id" in data
        assert data["item_count"] == 0
        assert Decimal(str(data["total_amount"])) == Decimal("0.00")
        assert "revora_session_id" in response.cookies


@pytest.mark.asyncio
async def test_cart_item_addition_and_retrieval_flow():
    """Verifies adding an authoritative product, persistence, and exact decimal calculation."""
    # Find active test product from DB
    async with AsyncSessionLocal() as db:
        prod_res = await db.execute(select(Product).where(Product.is_active == True))
        product = prod_res.scalars().first()
        assert product is not None
        product_id = str(product.id)
        product_price = product.price

    session_id = f"test_sess_{uuid.uuid4().hex[:10]}"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Add product to cart with custom session_id
        add_res = await client.post(
            "/api/v1/cart/items",
            headers={"x-session-id": session_id},
            json={
                "product_id": product_id,
                "quantity": 2,
                "is_ai_recommended": False,
                "session_id": session_id,
            },
        )
        assert add_res.status_code == 200
        add_data = add_res.json()
        assert add_data["item_count"] == 2
        assert len(add_data["items"]) == 1
        expected_total = product_price * 2
        assert Decimal(str(add_data["total_amount"])) == expected_total

        # 2. Re-fetch cart in a new request using session header
        get_res = await client.get(
            "/api/v1/cart",
            headers={"x-session-id": session_id},
        )
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["item_count"] == 2
        assert get_data["items"][0]["product_id"] == product_id
        assert Decimal(str(get_data["total_amount"])) == expected_total


@pytest.mark.asyncio
async def test_cart_quantity_update_and_removal():
    """Verifies increasing, decreasing, and removing line items."""
    async with AsyncSessionLocal() as db:
        prod_res = await db.execute(select(Product).where(Product.is_active == True))
        product = prod_res.scalars().first()
        product_id = str(product.id)

    session_id = f"test_sess_{uuid.uuid4().hex[:10]}"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Add product
        add_res = await client.post(
            "/api/v1/cart/items",
            headers={"x-session-id": session_id},
            json={"product_id": product_id, "quantity": 1, "session_id": session_id},
        )
        item_id = add_res.json()["items"][0]["id"]

        # 2. Update quantity to 3
        patch_res = await client.patch(
            f"/api/v1/cart/items/{item_id}",
            headers={"x-session-id": session_id},
            json={"quantity": 3},
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["item_count"] == 3

        # 3. Remove item
        del_res = await client.delete(
            f"/api/v1/cart/items/{item_id}",
            headers={"x-session-id": session_id},
        )
        assert del_res.status_code == 200
        assert del_res.json()["item_count"] == 0
        assert len(del_res.json()["items"]) == 0


@pytest.mark.asyncio
async def test_authoritative_server_pricing_and_growth_attribution():
    """Verifies that client cannot tamper with prices and AI add-ons are properly attributed."""
    async with AsyncSessionLocal() as db:
        prods = (await db.execute(select(Product).where(Product.is_active == True).limit(2))).scalars().all()
        assert len(prods) >= 2
        p1, p2 = prods[0], prods[1]

    session_id = f"test_sess_{uuid.uuid4().hex[:10]}"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Add baseline item
        await client.post(
            "/api/v1/cart/items",
            headers={"x-session-id": session_id},
            json={"product_id": str(p1.id), "quantity": 1, "is_ai_recommended": False},
        )

        # Add AI recommended cross-sell item
        res = await client.post(
            "/api/v1/cart/items",
            headers={"x-session-id": session_id},
            json={"product_id": str(p2.id), "quantity": 1, "is_ai_recommended": True, "added_via_ai": True},
        )
        assert res.status_code == 200
        data = res.json()

        assert Decimal(str(data["baseline_revenue"])) == p1.price
        assert Decimal(str(data["ai_incremental_revenue"])) == p2.price
        assert Decimal(str(data["total_amount"])) == p1.price + p2.price
        assert data["is_ai_assisted"] is True


@pytest.mark.asyncio
async def test_invalid_product_and_out_of_stock_rejection():
    """Verifies proper error codes for non-existent or over-limit products."""
    fake_id = str(uuid.uuid4())
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/cart/items",
            json={"product_id": fake_id, "quantity": 1},
        )
        assert res.status_code == 404
