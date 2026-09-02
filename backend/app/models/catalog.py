import uuid
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Integer, Boolean, JSON, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant
    from app.models.cart import CartItem
    from app.models.order import OrderItem


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category_rel")


class Product(Base, TimestampMixin):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="check_product_price_non_negative"),
        CheckConstraint("cost_price >= 0", name="check_product_cost_price_non_negative"),
        CheckConstraint("stock_quantity >= 0", name="check_product_stock_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    
    # Financial fields with Decimal precision
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="products")
    category_rel: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")
