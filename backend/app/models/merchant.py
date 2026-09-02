import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import Product
    from app.models.order import Order
    from app.models.rules import MerchantRule
    from app.models.growth import GrowthOpportunity
    from app.models.audit import AuditLog


class Merchant(Base, TimestampMixin):
    __tablename__ = "merchants"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    country: Mapped[str] = mapped_column(String(50), default="India", nullable=False)
    business_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="merchant", cascade="all, delete-orphan")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="merchant", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="merchant")
    rules: Mapped[List["MerchantRule"]] = relationship("MerchantRule", back_populates="merchant", cascade="all, delete-orphan")
    growth_opportunities: Mapped[List["GrowthOpportunity"]] = relationship("GrowthOpportunity", back_populates="merchant")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="merchant")
