import uuid
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Integer, Enum, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import CartStatus, ItemOrigin
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.catalog import Product
    from app.models.recovery import RecoveryEvent


class Cart(Base, TimestampMixin):
    __tablename__ = "carts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    status: Mapped[CartStatus] = mapped_column(
        Enum(CartStatus, native_enum=False),
        default=CartStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="carts")
    items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    recovery_events: Mapped[List["RecoveryEvent"]] = relationship("RecoveryEvent", back_populates="cart")


class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="check_cart_item_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="check_cart_item_unit_price_non_negative"),
        CheckConstraint("discount_amount >= 0", name="check_cart_item_discount_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    
    origin: Mapped[ItemOrigin] = mapped_column(
        Enum(ItemOrigin, native_enum=False),
        default=ItemOrigin.DIRECT,
        nullable=False,
    )
    bundle_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")
