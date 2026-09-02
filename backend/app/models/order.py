import uuid
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Integer, Boolean, Enum, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import OrderStatus, ItemOrigin, EventProvenance
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant
    from app.models.customer import Customer
    from app.models.catalog import Product
    from app.models.payment import Payment, PaymentAttempt
    from app.models.recovery import RecoveryEvent
    from app.models.audit import AuditLog


class Order(Base, TimestampMixin):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="check_order_subtotal_non_negative"),
        CheckConstraint("discount_total >= 0", name="check_order_discount_non_negative"),
        CheckConstraint("total_amount >= 0", name="check_order_total_amount_non_negative"),
        CheckConstraint("baseline_revenue >= 0", name="check_order_baseline_rev_non_negative"),
        CheckConstraint("ai_incremental_revenue >= 0", name="check_order_incremental_rev_non_negative"),
        CheckConstraint("recovered_revenue >= 0", name="check_order_recovered_rev_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False),
        default=OrderStatus.PENDING_PAYMENT,
        nullable=False,
        index=True,
    )
    
    # Financial Core (Decimal precision, never floats)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)  # Actual Net Merchant Revenue

    # Multi-Dimensional Attribution (Preventing Double Counting)
    is_ai_assisted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    baseline_revenue: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    ai_incremental_revenue: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    is_recovered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    recovered_revenue: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    # Provenance Tracking
    provenance: Mapped[EventProvenance] = mapped_column(
        Enum(EventProvenance, native_enum=False),
        default=EventProvenance.REAL_RAZORPAY_TEST,
        nullable=False,
    )
    
    # Razorpay Gateway Tracking
    razorpay_order_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    customer_notes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="orders")
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    payment_attempts: Mapped[List["PaymentAttempt"]] = relationship("PaymentAttempt", back_populates="order", cascade="all, delete-orphan")
    recovery_events: Mapped[List["RecoveryEvent"]] = relationship("RecoveryEvent", back_populates="order")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="order")


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="check_order_item_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="check_order_item_unit_price_non_negative"),
        CheckConstraint("discount_amount >= 0", name="check_order_item_discount_non_negative"),
        CheckConstraint("paid_price >= 0", name="check_order_item_paid_price_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    paid_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    origin: Mapped[ItemOrigin] = mapped_column(
        Enum(ItemOrigin, native_enum=False),
        default=ItemOrigin.DIRECT,
        nullable=False,
        index=True,
    )
    bundle_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")
