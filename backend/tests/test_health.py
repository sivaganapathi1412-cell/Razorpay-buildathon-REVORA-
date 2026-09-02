import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Verifies that the /api/v1/health endpoint responds with expected JSON structure."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "revora-api"
    assert data["database"] == "connected"
    assert "version" in data
    assert "timestamp" in data
