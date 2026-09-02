import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    trace_id: str
    merchant_id: uuid.UUID
    customer_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    agent_source: str
    event_category: AuditCategory
    event_type: str
    summary: str
    financial_delta: Decimal
    provenance: EventProvenance
    severity: AuditSeverity
    metadata_json: dict
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
