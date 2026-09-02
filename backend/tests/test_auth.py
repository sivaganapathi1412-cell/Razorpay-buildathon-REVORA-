from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password
from app.models import Merchant, MerchantRule, User


@pytest.mark.asyncio
async def test_merchant_registration_flow(client: AsyncClient, db_session: AsyncSession):
    """Tests atomic registration of merchant, owner user, and default safety rules."""
    payload = {
        "email": "Owner@RevoraRun.com",  # Should normalize to lowercase
        "password": "SuperSecretPassword123!",
        "full_name": "Marcus Aurelius",
        "store_name": "Imperium Athletics",
        "store_slug": "imperium-athletics",
        "business_category": "Running & Trail",
        "currency": "INR",
    }

    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "owner@revorarun.com"
    assert data["user"]["role"] == "OWNER"
    assert data["merchant"]["name"] == "Imperium Athletics"
    assert data["merchant"]["slug"] == "imperium-athletics"

    # Verify password was stored hashed, never plaintext
    res = await db_session.execute(select(User).where(User.email == "owner@revorarun.com"))
    user = res.scalar_one()
    assert user.hashed_password != payload["password"]
    assert verify_password(payload["password"], user.hashed_password) is True

    # Verify default MerchantRule was created
    rule_res = await db_session.execute(select(MerchantRule).where(MerchantRule.merchant_id == user.merchant_id))
    rule = rule_res.scalar_one()
    assert rule.max_discount_percentage == Decimal("10.00")
    assert rule.max_discount_amount == Decimal("300.00")
    assert rule.require_approval_above_amount == Decimal("5000.00")


@pytest.mark.asyncio
async def test_login_success_and_failure(client: AsyncClient):
    """Tests login validation with valid and invalid credentials."""
    # 1. Register account
    register_payload = {
        "email": "testlogin@revora.com",
        "password": "Password12345!",
        "full_name": "Test User",
        "store_name": "Test Store",
    }
    reg_res = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201

    # 2. Login with correct credentials
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "testlogin@revora.com", "password": "Password12345!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    # 3. Login with wrong password
    bad_login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "testlogin@revora.com", "password": "WrongPassword!"},
    )
    assert bad_login_res.status_code == 401
    assert "Invalid email or password" in bad_login_res.json()["detail"]

    # 4. Access /auth/me with valid token
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == "testlogin@revora.com"
    assert me_data["merchant"]["name"] == "Test Store"


@pytest.mark.asyncio
async def test_duplicate_email_rejected(client: AsyncClient):
    """Verifies that duplicate email registrations return 400."""
    payload = {
        "email": "duplicate@revora.com",
        "password": "Password12345!",
        "full_name": "First User",
        "store_name": "First Store",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_unauthenticated_and_tampered_token_rejected(client: AsyncClient):
    """Verifies that missing or tampered tokens cannot access protected routes."""
    # Missing token
    res1 = await client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # Tampered token
    res2 = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"},
    )
    assert res2.status_code == 401
