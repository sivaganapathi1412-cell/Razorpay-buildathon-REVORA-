from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.core.database import verify_database_connection
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application and Database Health Check",
    description="Returns service status and database connectivity without exposing sensitive credentials."
)
async def health_check():
    db_connected = await verify_database_connection()
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        service="revora-api",
        database="connected" if db_connected else "disconnected",
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
