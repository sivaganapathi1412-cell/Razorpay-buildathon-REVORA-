import uuid
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import String, Numeric, Boolean, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant


class MerchantRule(Base, TimestampMixin):
    """Deterministic merchant safety rules, bounds, and gating thresholds."""
    __tablename__ = "merchant_rules"
    __table_args__ = (
        CheckConstraint("max_discount_percentage >= 0 AND max_discount_percentage <= 100", name="check_rule_discount_pct_bounds"),
        CheckConstraint("max_discount_amount >= 0", name="check_rule_discount_amt_non_negative"),
        CheckConstraint("max_bundle_discount_pct >= 0 AND max_bundle_discount_pct <= 100", name="check_rule_bundle_discount_bounds"),
        CheckConstraint("auto_recovery_incentive_max >= 0", name="check_rule_recovery_incentive_bounds"),
        CheckConstraint("require_approval_above_amount >= 0", name="check_rule_approval_threshold_bounds"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rule_name: Mapped[str] = mapped_column(String(100), default="DEFAULT_MERCHANT_POLICY", nullable=False)
    
    # Deterministic hard bounds
    max_discount_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("10.00"), nullable=False)
    max_discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("300.00"), nullable=False)
    max_bundle_discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("15.00"), nullable=False)
    auto_recovery_incentive_max: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("100.00"), nullable=False)
    require_approval_above_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("5000.00"), nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    custom_rules: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="rules")
