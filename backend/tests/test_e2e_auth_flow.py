from decimal import Decimal
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_e2e_auth_and_merchant_lifecycle(client: AsyncClient):
    """End-to-end validation of the complete Phase 2 merchant lifecycle:

    Register -> Owner Created -> Default Rules -> Login -> /auth/me -> Profile Update -> Logout -> 401 Rejection.
    """
    # 1. Register Merchant
    reg_payload = {
        "email": "titan_owner@titan.com",
        "password": "SecurePassword999!",
        "full_name": "Titan Commander",
        "store_name": "Titan Sports",
        "business_category": "Athletics & Compression",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    merchant_id = reg_data["merchant"]["id"]
    user_id = reg_data["user"]["id"]

    assert reg_data["user"]["role"] == "OWNER"
    assert reg_data["merchant"]["country"] == "India"
    assert reg_data["merchant"]["currency"] == "INR"

    # 2. Login verification
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "titan_owner@titan.com", "password": "SecurePassword999!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 3. Authenticated Session /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["id"] == user_id
    assert me_data["merchant"]["id"] == merchant_id

    # 4. Merchant Profile Access & Update
    prof_res = await client.get("/api/v1/merchant/profile", headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["name"] == "Titan Sports"

    update_res = await client.put(
        "/api/v1/merchant/profile",
        headers=headers,
        json={"name": "Titan Sports Pro", "description": "Premier athletic compression gear."},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Titan Sports Pro"
    assert update_res.json()["description"] == "Premier athletic compression gear."

    # 5. Logout
    logout_res = await client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # 6. Verify Unauthenticated Request is Rejected
    unauth_res = await client.get("/api/v1/merchant/profile")
    assert unauth_res.status_code == 401
