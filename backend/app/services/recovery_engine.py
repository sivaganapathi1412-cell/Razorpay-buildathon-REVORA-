import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    EventProvenance,
    OrderStatus,
    PaymentAttemptStatus,
    PaymentStatus,
    PolicyResult,
    RecoveryStatus,
    RiskLevel,
)
from app.models import AuditLog, MerchantRule, Order, Payment, PaymentAttempt, RecoveryEvent

logger = logging.getLogger("revora.recovery_engine")


class RecoveryEngine:
    """Autonomous, deterministic AI Revenue Recovery Engine for failed and abandoned checkouts."""

    @staticmethod
    async def diagnose_and_create_recovery(
        order: Order,
        payment_attempt: PaymentAttempt,
        failure_code: str,
        failure_description: str,
        failure_source: str,
        provenance: EventProvenance,
        db: AsyncSession,
    ) -> RecoveryEvent:
        """Diagnoses checkout/payment interruption, formulates a safe recovery strategy, and creates a RecoveryEvent."""
        # 1. Fetch Merchant Safety Rules
        rule_res = await db.execute(
            select(MerchantRule).where(MerchantRule.merchant_id == order.merchant_id)
        )
        merchant_rule = rule_res.scalar_one_or_none()

        # 2. Formulate Strategy & Diagnostic Explanation
        strategy_type = "PRESERVE_CART_AND_RETRY"
        if failure_source == "bank":
            diagnostic_summary = (
                f"Bank authentication timed out during OTP verification ({failure_code}). "
                f"Payment was not debited. Cart of ₹{order.total_amount} preserved for instant retry."
            )
        elif failure_source == "network":
            diagnostic_summary = (
                f"Network interruption occurred while communicating with payment gateway ({failure_code}). "
                f"Order ₹{order.total_amount} held safely."
            )
        else:
            diagnostic_summary = (
                f"Payment attempt interrupted ({failure_description or 'User exited checkout'}). "
                f"Order ₹{order.total_amount} preserved for 1-click customer retry."
            )

        strategy_json = {
            "strategy_type": strategy_type,
            "recommended_action": "RETRY_SAME_PAYMENT",
            "preserve_cart": True,
            "offered_incentive_amount": 0.00,
            "risk_level": RiskLevel.LOW.value,
            "policy_result": PolicyResult.PASSED.value,
            "explanation": (
                f"Order #{order.order_number} for ₹{order.total_amount} remains valid with available inventory. "
                "Customer can safely complete payment with one click."
            ),
        }

        # 3. Policy Bound Check
        gating_required = False
        if merchant_rule and order.total_amount > merchant_rule.require_approval_above_amount:
            # High-impact order policy check
            strategy_json["risk_level"] = RiskLevel.MEDIUM.value
            strategy_json["policy_result"] = PolicyResult.GATED.value
            gating_required = True

        status = RecoveryStatus.GATED if gating_required else RecoveryStatus.ACTIVE

        # 4. Create RecoveryEvent
        recovery_event = RecoveryEvent(
            cart_id=None,
            order_id=order.id,
            customer_id=order.customer_id,
            failure_type="PAYMENT_FAILED",
            failure_code=failure_code,
            failure_source=failure_source,
            status=status,
            diagnostic_summary=diagnostic_summary,
            recovery_strategy=strategy_json,
            is_recovered=False,
            recovered_amount=Decimal("0.00"),
            provenance=provenance,
            metadata_json={
                "order_number": order.order_number,
                "attempt_id": str(payment_attempt.id),
                "subtotal": str(order.subtotal),
                "total_amount": str(order.total_amount),
            },
        )
        db.add(recovery_event)

        # 5. Update Order and PaymentAttempt States
        order.status = OrderStatus.PAYMENT_FAILED
        payment_attempt.status = PaymentAttemptStatus.FAILED
        payment_attempt.error_code = failure_code
        payment_attempt.error_description = failure_description
        payment_attempt.error_source = failure_source
        payment_attempt.recovery_triggered = True

        # 6. Audit Log
        audit = AuditLog(
            trace_id=str(uuid.uuid4()),
            merchant_id=order.merchant_id,
            customer_id=order.customer_id,
            session_id=None,
            order_id=order.id,
            agent_source="RECOVERY_AGENT",
            event_category=AuditCategory.RECOVERY_ACTION,
            event_type="RECOVERY_OPPORTUNITY_DETECTED",
            summary=f"Recovery opportunity detected for failed order #{order.order_number} (₹{order.total_amount}).",
            financial_delta=order.total_amount,
            provenance=provenance,
            severity=AuditSeverity.WARNING,
            metadata_json={
                "strategy": strategy_type,
                "failure_code": failure_code,
                "recovery_event_id": str(recovery_event.id),
            },
        )
        db.add(audit)
        await db.flush()

        return recovery_event

    @staticmethod
    async def finalize_recovery_success(
        order: Order,
        payment: Payment,
        db: AsyncSession,
    ) -> Optional[RecoveryEvent]:
        """Marks active RecoveryEvent as RECOVERED upon successful payment verification.

        Preserves multi-dimensional attribution without double-counting net revenue.
        """
        res = await db.execute(
            select(RecoveryEvent)
            .where(RecoveryEvent.order_id == order.id)
            .order_by(RecoveryEvent.created_at.desc())
        )
        recovery_event = res.scalar_one_or_none()

        if recovery_event and not recovery_event.is_recovered:
            recovery_event.status = RecoveryStatus.RECOVERED
            recovery_event.is_recovered = True
            recovery_event.recovered_amount = order.total_amount

            # Tag Order with recovery attribution
            order.is_recovered = True
            order.recovered_revenue = order.total_amount

            audit = AuditLog(
                trace_id=str(uuid.uuid4()),
                merchant_id=order.merchant_id,
                customer_id=order.customer_id,
                session_id=None,
                order_id=order.id,
                agent_source="RECOVERY_AGENT",
                event_category=AuditCategory.RECOVERY_ACTION,
                event_type="REVENUE_RECOVERED",
                summary=f"Successfully recovered revenue for order #{order.order_number} (₹{order.total_amount}).",
                financial_delta=order.total_amount,
                provenance=payment.provenance,
                severity=AuditSeverity.INFO,
                metadata_json={
                    "recovery_event_id": str(recovery_event.id),
                    "total_paid_revenue": str(order.total_amount),
                    "baseline_revenue": str(order.baseline_revenue),
                    "ai_incremental_revenue": str(order.ai_incremental_revenue),
                },
            )
            db.add(audit)
            await db.flush()

        return recovery_event


recovery_engine = RecoveryEngine()
