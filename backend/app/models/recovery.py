import uuid
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Boolean, Enum, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import RecoveryStatus, EventProvenance
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.cart import Cart
    from app.models.order import Order
    from app.models.customer import Customer


class RecoveryEvent(Base, TimestampMixin):
    __tablename__ = "recovery_events"
    __table_args__ = (
        CheckConstraint("recovered_amount >= 0", name="check_recov_amount_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("carts.id", ondelete="SET NULL"), nullable=True, index=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    
    failure_type: Mapped[str] = mapped_column(String(100), nullable=False)  # PAYMENT_FAILED, CART_ABANDONED, CHECKOUT_INTERRUPTED
    failure_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    failure_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    status: Mapped[RecoveryStatus] = mapped_column(
        Enum(RecoveryStatus, native_enum=False),
        default=RecoveryStatus.DETECTED,
        nullable=False,
        index=True,
    )
    
    diagnostic_summary: Mapped[str] = mapped_column(Text, nullable=False)
    recovery_strategy: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    is_recovered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    recovered_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    
    # Provenance
    provenance: Mapped[EventProvenance] = mapped_column(
        Enum(EventProvenance, native_enum=False),
        default=EventProvenance.REAL_RAZORPAY_TEST,
        nullable=False,
        index=True,
    )
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    cart: Mapped[Optional["Cart"]] = relationship("Cart", back_populates="recovery_events")
    order: Mapped[Optional["Order"]] = relationship("Order", back_populates="recovery_events")
    customer: Mapped[Optional["Customer"]] = relationship("Customer")
