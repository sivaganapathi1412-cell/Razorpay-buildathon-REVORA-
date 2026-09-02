import uuid
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VerifyPaymentRequest(BaseModel):
    order_id: uuid.UUID = Field(..., description="Internal Order UUID")
    razorpay_order_id: str = Field(..., description="Razorpay Order ID")
    razorpay_payment_id: str = Field(..., description="Razorpay Payment ID")
    razorpay_signature: str = Field(..., description="Razorpay HMAC SHA256 Signature")


class VerifyPaymentResponse(BaseModel):
    order_id: uuid.UUID
    order_number: str
    payment_id: uuid.UUID
    razorpay_payment_id: str
    status: str
    currency: str
    total_paid_revenue: Decimal
    baseline_revenue: Decimal
    ai_incremental_revenue: Decimal
    is_recovered: bool
    recovered_revenue: Decimal
    message: str


class PaymentSummary(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    amount: Decimal
    currency: str
    status: str
    provenance: str

    model_config = ConfigDict(from_attributes=True)
