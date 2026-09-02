import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RecoveryEventSummary(BaseModel):
    id: uuid.UUID
    order_id: Optional[uuid.UUID]
    order_number: Optional[str] = None
    cart_id: Optional[uuid.UUID] = None
    failure_type: str
    failure_code: Optional[str] = None
    failure_source: Optional[str] = None
    status: str
    diagnostic_summary: str
    recovery_strategy: Dict[str, Any]
    is_recovered: bool
    recovered_amount: Decimal
    provenance: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecoveryRetryRequest(BaseModel):
    recovery_event_id: uuid.UUID = Field(..., description="Target Recovery Event UUID")


class RecoveryRetryResponse(BaseModel):
    recovery_event_id: uuid.UUID
    order_id: uuid.UUID
    order_number: str
    razorpay_order_id: str
    amount_paise: int
    amount_inr: Decimal
    currency: str
    razorpay_key_id: str
    status: str
    message: str
