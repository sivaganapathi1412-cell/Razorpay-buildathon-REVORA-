import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.cart import Cart
    from app.models.order import Order
    from app.models.ai import AISession


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    carts: Mapped[List["Cart"]] = relationship("Cart", back_populates="customer")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer")
    ai_sessions: Mapped[List["AISession"]] = relationship("AISession", back_populates="customer")
