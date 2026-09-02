import uuid
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Customer password")
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    session_id: Optional[str] = Field(None, description="Optional anonymous session ID to bind active cart")


class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str
    session_id: Optional[str] = Field(None, description="Optional anonymous session ID to bind active cart")


class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None


class CustomerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int = 86400 * 7
    customer: CustomerSummary


class CustomerOrderItemSummary(BaseModel):
    product_name: str
    sku: Optional[str] = None
    unit_price: Decimal
    quantity: int
    paid_price: Decimal


class CustomerOrderSummary(BaseModel):
    id: uuid.UUID
    order_number: str
    created_at: str
    total_amount: Decimal
    currency: str
    status: str
    is_ai_assisted: bool
    is_recovered: bool
    items_count: int
    items: List[CustomerOrderItemSummary] = []
