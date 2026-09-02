from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health state")
    service: str = Field(..., description="Service identifier")
    database: str = Field(..., description="Database connectivity status")
    version: str = Field(..., description="API Version")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
