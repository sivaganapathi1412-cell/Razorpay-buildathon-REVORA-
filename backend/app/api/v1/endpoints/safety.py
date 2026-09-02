import uuid
from decimal import Decimal
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_merchant
from app.core.database import get_db
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance, PolicyResult
from app.models import Merchant, MerchantRule, AuditLog
from app.services.safety_engine import evaluate_financial_action, get_or_create_merchant_rule

router = APIRouter()


class MerchantRuleUpdateRequest(BaseModel):
    max_discount_percentage: Decimal = Field(..., ge=0, le=25, description="Max auto discount % (capped at 25%)")
    max_discount_amount: Decimal = Field(..., ge=0, le=2000, description="Max auto discount amount (capped at ₹2000)")
    max_bundle_discount_pct: Decimal = Field(..., ge=0, le=30, description="Max bundle discount % (capped at 30%)")
    auto_recovery_incentive_max: Decimal = Field(..., ge=0, le=500, description="Max auto recovery incentive")
    require_approval_above_amount: Decimal = Field(..., ge=500, le=50000, description="High-value approval threshold")
    custom_rules: Optional[dict] = Field(default_factory=dict)


class EvaluateSafetyActionRequest(BaseModel):
    action_type: str = Field(..., description="Action type: PROMOTIONAL_DISCOUNT, CROSS_SELL, UPSELL, BUNDLE, RECOVERY")
    discount_pct: Decimal = Field(Decimal("0.00"), ge=0, le=100)
    discount_amount: Decimal = Field(Decimal("0.00"), ge=0)
    order_amount: Decimal = Field(Decimal("0.00"), ge=0)
    product_id: Optional[uuid.UUID] = None


@router.get(
    "/rules",
    summary="Get Merchant Safety Rules",
    description="Retrieves current active deterministic safety rules and bounds for the authenticated merchant."
)
async def get_merchant_safety_rules(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    rule = await get_or_create_merchant_rule(current_merchant.id, db)
    return {
        "id": rule.id,
        "merchant_id": rule.merchant_id,
        "rule_name": rule.rule_name,
        "max_discount_percentage": rule.max_discount_percentage,
        "max_discount_amount": rule.max_discount_amount,
        "max_bundle_discount_pct": rule.max_bundle_discount_pct,
        "auto_recovery_incentive_max": rule.auto_recovery_incentive_max,
        "require_approval_above_amount": rule.require_approval_above_amount,
        "is_active": rule.is_active,
        "custom_rules": rule.custom_rules or {
            "upsell_enabled": True,
            "cross_sell_enabled": True,
            "bundle_enabled": True,
            "recovery_enabled": True,
        },
        "summary_text": f"Revora can automatically apply discounts up to {rule.max_discount_percentage}%, capped at ₹{rule.max_discount_amount}. Bundle discounts up to {rule.max_bundle_discount_pct}%. Orders above ₹{rule.require_approval_above_amount} require manual approval.",
    }


@router.put(
    "/rules",
    summary="Update Merchant Safety Rules",
    description="Updates merchant safety bounds with strict server-authoritative guardrail validation."
)
async def update_merchant_safety_rules(
    req: MerchantRuleUpdateRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    rule = await get_or_create_merchant_rule(current_merchant.id, db)

    # Server-Authoritative Hard Limits
    if req.max_discount_percentage > Decimal("25.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum automatic discount percentage cannot exceed 25.00% under system guardrails.",
        )
    if req.max_discount_amount > Decimal("2000.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum automatic discount amount cannot exceed ₹2,000.00.",
        )

    prev_state = {
        "max_discount_percentage": str(rule.max_discount_percentage),
        "max_discount_amount": str(rule.max_discount_amount),
        "max_bundle_discount_pct": str(rule.max_bundle_discount_pct),
        "require_approval_above_amount": str(rule.require_approval_above_amount),
    }

    rule.max_discount_percentage = req.max_discount_percentage
    rule.max_discount_amount = req.max_discount_amount
    rule.max_bundle_discount_pct = req.max_bundle_discount_pct
    rule.auto_recovery_incentive_max = req.auto_recovery_incentive_max
    rule.require_approval_above_amount = req.require_approval_above_amount
    if req.custom_rules:
        rule.custom_rules = {**(rule.custom_rules or {}), **req.custom_rules}

    # Record Immutable Audit Entry
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=current_merchant.id,
        agent_source="MERCHANT",
        event_category=AuditCategory.SAFETY,
        event_type="MERCHANT_RULES_UPDATED",
        summary=f"Merchant updated safety guardrails (Max Discount: {req.max_discount_percentage}%, Cap: ₹{req.max_discount_amount})",
        provenance=EventProvenance.MERCHANT,
        severity=AuditSeverity.INFO,
        metadata_json={
            "previous_state": prev_state,
            "new_state": {
                "max_discount_percentage": str(req.max_discount_percentage),
                "max_discount_amount": str(req.max_discount_amount),
                "max_bundle_discount_pct": str(req.max_bundle_discount_pct),
                "require_approval_above_amount": str(req.require_approval_above_amount),
                "custom_rules": req.custom_rules,
            },
        },
    )
    db.add(audit)
    await db.commit()

    return {
        "message": "Merchant safety rules updated successfully.",
        "rules": {
            "id": rule.id,
            "max_discount_percentage": rule.max_discount_percentage,
            "max_discount_amount": rule.max_discount_amount,
            "max_bundle_discount_pct": rule.max_bundle_discount_pct,
            "auto_recovery_incentive_max": rule.auto_recovery_incentive_max,
            "require_approval_above_amount": rule.require_approval_above_amount,
            "custom_rules": rule.custom_rules,
        },
    }


@router.post(
    "/evaluate",
    summary="Evaluate Action Against Safety Policy",
    description="Interactive evaluation of any commerce proposal against active merchant safety rules."
)
async def evaluate_safety_action(
    req: EvaluateSafetyActionRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    decision = await evaluate_financial_action(
        merchant_id=current_merchant.id,
        action_type=req.action_type,
        discount_pct=req.discount_pct,
        discount_amount=req.discount_amount,
        order_amount=req.order_amount,
        product_id=req.product_id,
        db=db,
    )
    await db.commit()
    return decision
