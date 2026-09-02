import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tenant_isolation_and_profile_update(client: AsyncClient):
    """Guarantees strict server-derived tenant isolation between multiple distinct merchants."""
    # 1. Register Merchant A
    res_a = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner_a@merchant-a.com",
            "password": "Password12345!",
            "full_name": "Owner A",
            "store_name": "Store Alpha",
        },
    )
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    merchant_a_id = res_a.json()["merchant"]["id"]

    # 2. Register Merchant B
    res_b = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner_b@merchant-b.com",
            "password": "Password12345!",
            "full_name": "Owner B",
            "store_name": "Store Beta",
        },
    )
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    merchant_b_id = res_b.json()["merchant"]["id"]

    assert merchant_a_id != merchant_b_id

    # 3. User A queries profile -> gets Merchant A
    prof_a_res = await client.get("/api/v1/merchant/profile", headers={"Authorization": f"Bearer {token_a}"})
    assert prof_a_res.status_code == 200
    assert prof_a_res.json()["name"] == "Store Alpha"
    assert prof_a_res.json()["id"] == merchant_a_id

    # 4. User B queries profile -> gets Merchant B
    prof_b_res = await client.get("/api/v1/merchant/profile", headers={"Authorization": f"Bearer {token_b}"})
    assert prof_b_res.status_code == 200
    assert prof_b_res.json()["name"] == "Store Beta"
    assert prof_b_res.json()["id"] == merchant_b_id

    # 5. User A updates profile -> only Merchant A is modified
    update_res = await client.put(
        "/api/v1/merchant/profile",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"name": "Store Alpha Prime", "business_category": "Athletics"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Store Alpha Prime"

    # Verify Merchant B remains untouched
    verify_b_res = await client.get("/api/v1/merchant/profile", headers={"Authorization": f"Bearer {token_b}"})
    assert verify_b_res.json()["name"] == "Store Beta"
