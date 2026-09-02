import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MerchantProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, description="Store display name")
    business_category: Optional[str] = Field(None, description="Store industry category")
    description: Optional[str] = Field(None, description="Store description")
    currency: Optional[str] = Field(None, max_length=10, description="Store currency")


class MerchantProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    currency: str
    country: str
    business_category: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    settings: dict = {}

    model_config = ConfigDict(from_attributes=True)
