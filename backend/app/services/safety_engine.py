import uuid
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    EventProvenance,
    PolicyResult,
)
from app.models.audit import AuditLog
from app.models.rules import MerchantRule


class SafetyDecision(BaseModel):
    """Structured, deterministic decision returned by the Safety Engine."""
    allowed: bool
    requires_approval: bool
    policy_result: PolicyResult
    policy_name: str
    reason: str
    financial_impact: Decimal
    rule_threshold: Decimal
    proposed_value: Decimal


async def get_or_create_merchant_rule(merchant_id: uuid.UUID, db: AsyncSession) -> MerchantRule:
    """Retrieves active merchant rule or initializes default policy if none exists."""
    res = await db.execute(
        select(MerchantRule).where(MerchantRule.merchant_id == merchant_id, MerchantRule.is_active == True)
    )
    rule = res.scalars().first()
    if not rule:
        rule = MerchantRule(
            merchant_id=merchant_id,
            rule_name="DEFAULT_MERCHANT_POLICY",
            max_discount_percentage=Decimal("10.00"),
            max_discount_amount=Decimal("300.00"),
            max_bundle_discount_pct=Decimal("15.00"),
            auto_recovery_incentive_max=Decimal("100.00"),
            require_approval_above_amount=Decimal("5000.00"),
            is_active=True,
            custom_rules={
                "upsell_enabled": True,
                "cross_sell_enabled": True,
                "bundle_enabled": True,
                "recovery_enabled": True,
            },
        )
        db.add(rule)
        await db.flush()
    return rule


async def evaluate_financial_action(
    merchant_id: uuid.UUID,
    action_type: str,
    discount_pct: Decimal = Decimal("0.00"),
    discount_amount: Decimal = Decimal("0.00"),
    order_amount: Decimal = Decimal("0.00"),
    product_id: Optional[uuid.UUID] = None,
    order_id: Optional[uuid.UUID] = None,
    trace_id: Optional[str] = None,
    db: Optional[AsyncSession] = None,
    rule_override: Optional[MerchantRule] = None,
) -> SafetyDecision:
    """Deterministic Safety Engine evaluation for every commerce and growth action.
    
    Guarantees:
    - Never allows an LLM or frontend to bypass merchant limits.
    - Gated actions (e.g. 12% discount exceeding 10% auto-limit) require human merchant approval.
    - Exceeding absolute ceilings (25% discount) is strictly rejected.
    """
    rule = rule_override
    if not rule and db:
        rule = await get_or_create_merchant_rule(merchant_id, db)
    elif not rule:
        rule = MerchantRule(
            merchant_id=merchant_id,
            max_discount_percentage=Decimal("10.00"),
            max_discount_amount=Decimal("300.00"),
            max_bundle_discount_pct=Decimal("15.00"),
            require_approval_above_amount=Decimal("5000.00"),
        )

    # 1. Feature Flag Validation
    custom_rules = rule.custom_rules or {}
    if action_type in ["UPSELL", "AI_UPSELL"] and not custom_rules.get("upsell_enabled", True):
        return _make_decision(False, False, PolicyResult.REJECTED, "FEATURE_FLAG_DISABLED", "Upsell actions disabled in merchant safety settings.", discount_amount, Decimal("0"), discount_pct)
    if action_type in ["CROSS_SELL", "AI_CROSS_SELL"] and not custom_rules.get("cross_sell_enabled", True):
        return _make_decision(False, False, PolicyResult.REJECTED, "FEATURE_FLAG_DISABLED", "Cross-sell actions disabled in merchant safety settings.", discount_amount, Decimal("0"), discount_pct)
    if action_type in ["BUNDLE", "AI_BUNDLE"] and not custom_rules.get("bundle_enabled", True):
        return _make_decision(False, False, PolicyResult.REJECTED, "FEATURE_FLAG_DISABLED", "Bundle actions disabled in merchant safety settings.", discount_amount, Decimal("0"), discount_pct)
    if action_type in ["RECOVERY", "RECOVERY_INCENTIVE"] and not custom_rules.get("recovery_enabled", True):
        return _make_decision(False, False, PolicyResult.REJECTED, "FEATURE_FLAG_DISABLED", "Recovery incentives disabled in merchant safety settings.", discount_amount, Decimal("0"), discount_pct)

    # 2. Hard Upper Ceilings
    if discount_pct > Decimal("25.00"):
        return _make_decision(
            allowed=False,
            requires_approval=False,
            policy_result=PolicyResult.REJECTED,
            policy_name="MAX_DISCOUNT_CEILING_EXCEEDED",
            reason=f"Proposed discount of {discount_pct}% exceeds maximum system safety ceiling (25.00%).",
            financial_impact=discount_amount,
            rule_threshold=Decimal("25.00"),
            proposed_value=discount_pct,
        )

    # 3. Bundle Discount Evaluation
    if action_type in ["BUNDLE", "AI_BUNDLE"]:
        if discount_pct > rule.max_bundle_discount_pct:
            return _make_decision(
                allowed=False,
                requires_approval=True,
                policy_result=PolicyResult.GATED,
                policy_name="BUNDLE_DISCOUNT_LIMIT_GATED",
                reason=f"Bundle discount of {discount_pct}% exceeds merchant automatic limit of {rule.max_bundle_discount_pct}%. Requires merchant approval.",
                financial_impact=discount_amount,
                rule_threshold=rule.max_bundle_discount_pct,
                proposed_value=discount_pct,
            )

    # 4. Standard Discount Percentage Evaluation
    if discount_pct > rule.max_discount_percentage:
        return _make_decision(
            allowed=False,
            requires_approval=True,
            policy_result=PolicyResult.GATED,
            policy_name="AUTO_DISCOUNT_LIMIT_GATED",
            reason=f"Proposed discount of {discount_pct}% exceeds merchant automatic limit of {rule.max_discount_percentage}%. Gated for merchant review.",
            financial_impact=discount_amount,
            rule_threshold=rule.max_discount_percentage,
            proposed_value=discount_pct,
        )

    # 5. Discount Absolute Amount Evaluation
    if discount_amount > rule.max_discount_amount:
        if discount_amount > (rule.max_discount_amount * Decimal("2.0")):
            return _make_decision(
                allowed=False,
                requires_approval=False,
                policy_result=PolicyResult.REJECTED,
                policy_name="MAX_DISCOUNT_AMOUNT_EXCEEDED",
                reason=f"Discount amount of ₹{discount_amount} exceeds absolute financial cap (₹{rule.max_discount_amount * Decimal('2.0')}).",
                financial_impact=discount_amount,
                rule_threshold=rule.max_discount_amount,
                proposed_value=discount_amount,
            )
        return _make_decision(
            allowed=False,
            requires_approval=True,
            policy_result=PolicyResult.GATED,
            policy_name="AUTO_DISCOUNT_AMOUNT_GATED",
            reason=f"Discount amount of ₹{discount_amount} exceeds automatic threshold of ₹{rule.max_discount_amount}. Gated for merchant review.",
            financial_impact=discount_amount,
            rule_threshold=rule.max_discount_amount,
            proposed_value=discount_amount,
        )

    # 6. High-Value Order Policy
    if order_amount >= rule.require_approval_above_amount and (discount_pct > Decimal("0") or discount_amount > Decimal("0")):
        return _make_decision(
            allowed=False,
            requires_approval=True,
            policy_result=PolicyResult.GATED,
            policy_name="HIGH_VALUE_TRANSACTION_GATED",
            reason=f"Order amount ₹{order_amount} exceeds high-value threshold (₹{rule.require_approval_above_amount}). Any discount requires manual review.",
            financial_impact=discount_amount,
            rule_threshold=rule.require_approval_above_amount,
            proposed_value=order_amount,
        )

    # 7. Safe Action Allowed
    decision = _make_decision(
        allowed=True,
        requires_approval=False,
        policy_result=PolicyResult.PASSED,
        policy_name="MERCHANT_POLICY_PASSED",
        reason=f"Action '{action_type}' ({discount_pct}%, ₹{discount_amount}) is within merchant automatic safety bounds.",
        financial_impact=discount_amount,
        rule_threshold=rule.max_discount_percentage,
        proposed_value=discount_pct,
    )

    # Record Audit Entry if DB session is active
    if db:
        audit = AuditLog(
            trace_id=trace_id or str(uuid.uuid4()),
            merchant_id=merchant_id,
            order_id=order_id,
            agent_source="SAFETY_AGENT",
            event_category=AuditCategory.POLICY_CHECK,
            event_type="SAFETY_POLICY_EVALUATED",
            summary=f"Safety Engine evaluated {action_type}: {decision.policy_result.value} ({decision.reason})",
            financial_delta=discount_amount,
            provenance=EventProvenance.SYSTEM,
            severity=AuditSeverity.INFO if decision.allowed else AuditSeverity.WARNING,
            metadata_json={
                "action_type": action_type,
                "policy_name": decision.policy_name,
                "policy_result": decision.policy_result.value,
                "discount_pct": str(discount_pct),
                "discount_amount": str(discount_amount),
                "order_amount": str(order_amount),
            },
        )
        db.add(audit)

    return decision


def _make_decision(
    allowed: bool,
    requires_approval: bool,
    policy_result: PolicyResult,
    policy_name: str,
    reason: str,
    financial_impact: Decimal,
    rule_threshold: Decimal,
    proposed_value: Decimal,
) -> SafetyDecision:
    return SafetyDecision(
        allowed=allowed,
        requires_approval=requires_approval,
        policy_result=policy_result,
        policy_name=policy_name,
        reason=reason,
        financial_impact=financial_impact,
        rule_threshold=rule_threshold,
        proposed_value=proposed_value,
    )
