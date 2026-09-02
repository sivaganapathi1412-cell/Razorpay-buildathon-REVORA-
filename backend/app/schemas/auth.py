import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    full_name: str = Field(..., min_length=2, description="Merchant Owner Full Name")
    store_name: str = Field(..., min_length=2, description="E-Commerce Store Name")
    store_slug: Optional[str] = Field(None, description="Optional custom URL slug")
    business_category: Optional[str] = Field("Athletics & Apparel", description="Primary commerce category")
    currency: str = Field("INR", description="Store currency")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered merchant email")
    password: str = Field(..., description="Plaintext password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class UserSummary(BaseModel):
    id: uuid.UUID
    merchant_id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class MerchantSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    currency: str
    country: str
    business_category: Optional[str] = None
    description: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AuthMeResponse(BaseModel):
    user: UserSummary
    merchant: MerchantSummary


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserSummary
    merchant: MerchantSummary
