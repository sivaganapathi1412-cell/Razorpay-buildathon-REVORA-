import uuid
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Integer, Boolean, Enum, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import PaymentStatus, PaymentAttemptStatus, EventProvenance
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.order import Order


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="check_payment_amount_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    razorpay_order_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    razorpay_signature: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True,
    )
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    provenance: Mapped[EventProvenance] = mapped_column(
        Enum(EventProvenance, native_enum=False),
        default=EventProvenance.REAL_RAZORPAY_TEST,
        nullable=False,
    )
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="payments")


class PaymentAttempt(Base, TimestampMixin):
    __tablename__ = "payment_attempts"
    __table_args__ = (
        CheckConstraint("attempt_number >= 1", name="check_payment_attempt_num_positive"),
        CheckConstraint("amount >= 0", name="check_payment_attempt_amount_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    razorpay_order_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    status: Mapped[PaymentAttemptStatus] = mapped_column(
        Enum(PaymentAttemptStatus, native_enum=False),
        default=PaymentAttemptStatus.INITIATED,
        nullable=False,
        index=True,
    )
    
    # Error diagnostics
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    error_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # bank, gateway, customer
    
    recovery_triggered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Explicit Provenance
    provenance: Mapped[EventProvenance] = mapped_column(
        Enum(EventProvenance, native_enum=False),
        default=EventProvenance.REAL_RAZORPAY_TEST,
        nullable=False,
        index=True,
    )
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="payment_attempts")
