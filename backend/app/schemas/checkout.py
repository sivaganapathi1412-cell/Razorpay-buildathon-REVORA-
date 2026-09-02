import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CreateCheckoutOrderRequest(BaseModel):
    customer_email: EmailStr = Field(..., description="Customer billing and contact email")
    customer_name: Optional[str] = Field("Valued Athlete", description="Customer full name")
    customer_phone: Optional[str] = Field(None, description="Customer contact phone")
    session_id: Optional[str] = Field(None, description="Customer session cookie ID for cart loading")
    delivery_address: Optional[Dict[str, Any]] = Field(None, description="Shipping destination address")


class CheckoutOrderItemSummary(BaseModel):
    product_id: uuid.UUID
    product_name: str
    sku: str
    quantity: int
    unit_price: Decimal
    discount_amount: Decimal
    paid_price: Decimal
    origin: str

    model_config = ConfigDict(from_attributes=True)


class CheckoutOrderResponse(BaseModel):
    order_id: uuid.UUID
    order_number: str
    razorpay_order_id: str
    amount_paise: int
    amount_inr: Decimal
    currency: str
    razorpay_key_id: str
    customer_email: str
    customer_name: str
    subtotal: Decimal
    discount_total: Decimal
    total_amount: Decimal
    baseline_revenue: Decimal
    ai_incremental_revenue: Decimal
    is_ai_assisted: bool
    is_test_mode: bool
    items: List[CheckoutOrderItemSummary]


class SimulateFailureRequest(BaseModel):
    order_id: uuid.UUID = Field(..., description="Target Order ID to simulate payment failure on")
    failure_code: Optional[str] = Field("BANK_AUTH_TIMEOUT", description="Simulated failure reason code")
    failure_description: Optional[str] = Field(
        "Issuer bank failed to respond during 3D-Secure OTP verification.",
        description="Customer-safe simulated diagnostic description",
    )
    failure_reason: Optional[str] = Field(None, description="Optional alias for failure description")
    failure_source: Optional[str] = Field("bank", description="Simulated failure source: bank, network, gateway, customer")


class SimulateFailureResponse(BaseModel):
    order_id: uuid.UUID
    order_number: str
    status: str
    recovery_event_id: uuid.UUID
    diagnostic_summary: str
    strategy: Dict[str, Any]
    provenance: str = "DEMO_SIMULATION"
