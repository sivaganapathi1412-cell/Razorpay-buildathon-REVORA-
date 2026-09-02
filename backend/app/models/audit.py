import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Numeric, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance
from app.models.base import GUID

if TYPE_CHECKING:
    from app.models.merchant import Merchant
    from app.models.order import Order


class AuditLog(Base):
    """Append-only, immutable audit trail for all AI actions, policy decisions, and transactions."""
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    trace_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    
    merchant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True, index=True)
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True, index=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    agent_source: Mapped[str] = mapped_column(String(50), nullable=False)
    event_category: Mapped[AuditCategory] = mapped_column(
        Enum(AuditCategory, native_enum=False),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    
    financial_delta: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    
    provenance: Mapped[EventProvenance] = mapped_column(
        Enum(EventProvenance, native_enum=False),
        default=EventProvenance.SYSTEM,
        nullable=False,
        index=True,
    )
    severity: Mapped[AuditSeverity] = mapped_column(
        Enum(AuditSeverity, native_enum=False),
        default=AuditSeverity.INFO,
        nullable=False,
    )
    
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="audit_logs")
    order: Mapped[Optional["Order"]] = relationship("Order", back_populates="audit_logs")
