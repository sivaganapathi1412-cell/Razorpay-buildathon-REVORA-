import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import EventProvenance, ItemOrigin, OrderStatus, PaymentStatus, RecoveryStatus
from app.core.security import create_access_token
from app.models import Cart, CartItem, Customer, Merchant, Order, OrderItem, Payment, Product, RecoveryEvent, User


@pytest.mark.asyncio
async def test_customer_registration_and_login(client: AsyncClient, db_session: AsyncSession):
    """Verifies that shoppers can register, log in, and receive customer JWT tokens."""
    test_email = f"shopper.{uuid.uuid4().hex[:6]}@test.revora.ai"
    
    # 1. Register Customer
    reg_res = await client.post(
        "/api/v1/customer/auth/register",
        json={
            "email": test_email,
            "password": "ShopperPassword123!",
            "full_name": "Test Athlete Shopper",
            "phone": "+919876543210",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["customer"]["email"] == test_email
    assert reg_data["customer"]["full_name"] == "Test Athlete Shopper"

    # 2. Login Customer
    login_res = await client.post(
        "/api/v1/customer/auth/login",
        json={
            "email": test_email,
            "password": "ShopperPassword123!",
        },
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token is not None

    # 3. Access Customer Profile
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/customer/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email


@pytest.mark.asyncio
async def test_customer_cannot_access_merchant_administration(client: AsyncClient, db_session: AsyncSession):
    """Guarantees that Customer accounts are strictly rejected when attempting to access Merchant administration endpoints."""
    # Create Customer
    customer = Customer(
        email=f"customer.{uuid.uuid4().hex[:6]}@revora.test",
        full_name="Standard Shopper",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.commit()

    # Generate Customer Token (role="CUSTOMER", no merchant_id)
    customer_token = create_access_token(
        subject=customer.id,
        role="CUSTOMER",
    )
    cust_headers = {"Authorization": f"Bearer {customer_token}"}

    # 1. Attempt to access Merchant User Profile -> Blocked (401 or 403)
    res_prof = await client.get("/api/v1/auth/me", headers=cust_headers)
    assert res_prof.status_code in (401, 403)

    # 2. Attempt to access Merchant Analytics Overview -> Blocked
    res_analytics = await client.get("/api/v1/analytics/overview", headers=cust_headers)
    assert res_analytics.status_code in (401, 403)

    # 3. Attempt to access Approvals -> Blocked
    res_app = await client.get("/api/v1/approvals", headers=cust_headers)
    assert res_app.status_code in (401, 403)

    # 4. Attempt to access Safety Rules -> Blocked
    res_safety = await client.get("/api/v1/safety/rules", headers=cust_headers)
    assert res_safety.status_code in (401, 403)


@pytest.mark.asyncio
async def test_customer_order_isolation(client: AsyncClient, db_session: AsyncSession):
    """Verifies that Customer A can only see their own order history and never Customer B's orders."""
    # Setup Merchant
    merchant = Merchant(name="Store", slug=f"store-{uuid.uuid4().hex[:6]}", currency="INR")
    db_session.add(merchant)
    await db_session.flush()

    # Setup Customer A & Customer B
    cust_a = Customer(email=f"a.{uuid.uuid4().hex[:6]}@test.com", full_name="Customer A", is_active=True)
    cust_b = Customer(email=f"b.{uuid.uuid4().hex[:6]}@test.com", full_name="Customer B", is_active=True)
    db_session.add_all([cust_a, cust_b])
    await db_session.flush()

    # Create Order for Customer A
    order_a = Order(
        merchant_id=merchant.id,
        customer_id=cust_a.id,
        order_number="REV-ORD-CUST-A",
        status=OrderStatus.PAID,
        currency="INR",
        subtotal=Decimal("2499.00"),
        discount_total=Decimal("0.00"),
        total_amount=Decimal("2499.00"),
        baseline_revenue=Decimal("2499.00"),
        ai_incremental_revenue=Decimal("0.00"),
    )
    # Create Order for Customer B
    order_b = Order(
        merchant_id=merchant.id,
        customer_id=cust_b.id,
        order_number="REV-ORD-CUST-B",
        status=OrderStatus.PAID,
        currency="INR",
        subtotal=Decimal("3899.00"),
        discount_total=Decimal("0.00"),
        total_amount=Decimal("3899.00"),
        baseline_revenue=Decimal("3899.00"),
        ai_incremental_revenue=Decimal("0.00"),
    )
    db_session.add_all([order_a, order_b])
    await db_session.commit()

    token_a = create_access_token(subject=cust_a.id, role="CUSTOMER")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Query Orders as Customer A
    orders_res = await client.get("/api/v1/customer/orders", headers=headers_a)
    assert orders_res.status_code == 200
    orders_list = orders_res.json()

    # Must contain Order A, must NEVER contain Order B
    order_numbers = [o["order_number"] for o in orders_list]
    assert "REV-ORD-CUST-A" in order_numbers
    assert "REV-ORD-CUST-B" not in order_numbers


@pytest.mark.asyncio
async def test_anonymous_cart_preservation_around_login(client: AsyncClient, db_session: AsyncSession):
    """Verifies that an anonymous user who adds items to cart retains their cart intact after customer login."""
    # 1. Create a product
    merchant = Merchant(name="Store", slug=f"store-{uuid.uuid4().hex[:6]}", currency="INR")
    db_session.add(merchant)
    await db_session.flush()

    prod = Product(
        merchant_id=merchant.id,
        sku=f"REV-TEST-{uuid.uuid4().hex[:4]}",
        name="Velocity Nitro Running Shoes",
        description="High performance running shoe.",
        category="Footwear",
        price=Decimal("2499.00"),
        stock_quantity=50,
        image_url="https://example.com/shoe.svg",
    )
    db_session.add(prod)
    await db_session.commit()

    # 2. Add product anonymously with custom session_id
    session_id = f"anon_session_{uuid.uuid4().hex[:8]}"
    headers = {"X-Session-ID": session_id}

    add_res = await client.post(
        "/api/v1/cart/items",
        json={"product_id": str(prod.id), "quantity": 1},
        headers=headers,
    )
    assert add_res.status_code == 200

    # 3. Customer registers with the same session_id
    cust_email = f"marathoner.{uuid.uuid4().hex[:6]}@test.com"
    reg_res = await client.post(
        "/api/v1/customer/auth/register",
        json={
            "email": cust_email,
            "password": "Password123!",
            "full_name": "Marathoner Pro",
            "session_id": session_id,
        },
    )
    assert reg_res.status_code == 201

    # 4. Fetch Cart again — must still contain the Velocity Nitro Running Shoes
    cart_res = await client.get("/api/v1/cart", headers=headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()
    assert len(cart_data["items"]) == 1
    assert cart_data["items"][0]["name"] == "Velocity Nitro Running Shoes"
    assert Decimal(str(cart_data["total_amount"])) == Decimal("2499.00")
