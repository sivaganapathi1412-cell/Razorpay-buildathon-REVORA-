import uuid
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Enum, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import GrowthOpportunityStatus, EventProvenance
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant
    from app.models.catalog import Product


class GrowthOpportunity(Base, TimestampMixin):
    __tablename__ = "growth_opportunities"
    __table_args__ = (
        CheckConstraint("projected_aov_lift_pct >= 0", name="check_opp_aov_lift_non_negative"),
        CheckConstraint("proposed_discount_pct >= 0", name="check_opp_discount_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    primary_product_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    bundled_product_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    bundle_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    projected_aov_lift_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    proposed_discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    
    status: Mapped[GrowthOpportunityStatus] = mapped_column(
        Enum(GrowthOpportunityStatus, native_enum=False),
        default=GrowthOpportunityStatus.DETECTED,
        nullable=False,
        index=True,
    )
    
    provenance: Mapped[EventProvenance] = mapped_column(
        Enum(EventProvenance, native_enum=False),
        default=EventProvenance.AI,
        nullable=False,
    )
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="growth_opportunities")
    primary_product: Mapped["Product"] = relationship("Product")
