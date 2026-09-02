import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_merchant
from app.core.config import settings
from app.core.database import get_db
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    EventProvenance,
    OrderStatus,
    PaymentAttemptStatus,
    RecoveryStatus,
)
from app.models import AuditLog, Merchant, Order, PaymentAttempt, RecoveryEvent
from app.schemas.recovery import (
    RecoveryEventSummary,
    RecoveryRetryRequest,
    RecoveryRetryResponse,
)
from app.services.razorpay_service import inr_to_paise, razorpay_service

router = APIRouter()


@router.get(
    "/order/{order_id}",
    response_model=RecoveryEventSummary,
    summary="Get Recovery Event Details by Order ID",
    description="Returns the diagnostic diagnosis and preserved cart strategy for a customer recovering an order."
)
async def get_recovery_by_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(RecoveryEvent)
        .where(RecoveryEvent.order_id == order_id)
        .options(selectinload(RecoveryEvent.order))
        .order_by(RecoveryEvent.created_at.desc())
    )
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recovery record found for this order.",
        )

    return RecoveryEventSummary(
        id=event.id,
        order_id=event.order_id,
        order_number=event.order.order_number if event.order else None,
        cart_id=event.cart_id,
        failure_type=event.failure_type,
        failure_code=event.failure_code,
        failure_source=event.failure_source,
        status=event.status.value,
        diagnostic_summary=event.diagnostic_summary,
        recovery_strategy=event.recovery_strategy,
        is_recovered=event.is_recovered,
        recovered_amount=event.recovered_amount,
        provenance=event.provenance.value,
        created_at=event.created_at,
    )


@router.post(
    "/retry",
    response_model=RecoveryRetryResponse,
    summary="Customer-Authorized Safe Payment Retry",
    description="Validates order recoverability, prevents double charging, and initiates a fresh Razorpay Test Mode checkout attempt."
)
async def authorize_recovery_retry(
    req: RecoveryRetryRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Fetch RecoveryEvent with Order
    res = await db.execute(
        select(RecoveryEvent)
        .where(RecoveryEvent.id == req.recovery_event_id)
        .options(selectinload(RecoveryEvent.order).selectinload(Order.payment_attempts))
    )
    event = res.scalar_one_or_none()

    if not event or not event.order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery event not found.",
        )

    order = event.order

    # 2. Strict Paid Order Check (Prevent duplicate charges)
    if order.status == OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order is already PAID. Duplicate payment attempts are blocked.",
        )

    # 3. Create fresh Razorpay order if needed
    rzp_order = await razorpay_service.create_order(
        amount_inr=order.total_amount,
        receipt=f"{order.order_number}-R",
        currency="INR",
        notes={"order_id": str(order.id), "recovery_event_id": str(event.id)},
    )
    order.razorpay_order_id = rzp_order["id"]

    # 4. Increment Payment Attempt
    attempt_num = len(order.payment_attempts) + 1 if order.payment_attempts else 2
    attempt = PaymentAttempt(
        order_id=order.id,
        razorpay_order_id=rzp_order["id"],
        attempt_number=attempt_num,
        amount=order.total_amount,
        status=PaymentAttemptStatus.INITIATED,
        provenance=event.provenance,
    )
    db.add(attempt)

    # 5. Transition Recovery State
    event.status = RecoveryStatus.RETRIED

    # 6. Audit Log
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=order.merchant_id,
        customer_id=order.customer_id,
        session_id=None,
        order_id=order.id,
        agent_source="RECOVERY_AGENT",
        event_category=AuditCategory.RECOVERY_ACTION,
        event_type="RECOVERY_RETRY_INITIATED",
        summary=f"Customer authorized safe retry for order #{order.order_number} (₹{order.total_amount}).",
        financial_delta=order.total_amount,
        provenance=event.provenance,
        severity=AuditSeverity.INFO,
        metadata_json={
            "recovery_event_id": str(event.id),
            "attempt_number": attempt_num,
            "razorpay_order_id": rzp_order["id"],
        },
    )
    db.add(audit)
    await db.commit()

    return RecoveryRetryResponse(
        recovery_event_id=event.id,
        order_id=order.id,
        order_number=order.order_number,
        razorpay_order_id=rzp_order["id"],
        amount_paise=inr_to_paise(order.total_amount),
        amount_inr=order.total_amount,
        currency="INR",
        razorpay_key_id=settings.RAZORPAY_KEY_ID or "rzp_test_revora_demo",
        status=event.status.value,
        message="Safe payment retry authorized. Ready for Razorpay Test Mode checkout.",
    )


@router.get(
    "/merchant/events",
    response_model=List[RecoveryEventSummary],
    summary="Get Merchant Recovery Events Feed",
    description="Returns all persisted recovery events for the authenticated merchant store."
)
async def get_merchant_recovery_events(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(RecoveryEvent)
        .join(Order, RecoveryEvent.order_id == Order.id)
        .where(Order.merchant_id == current_merchant.id)
        .options(selectinload(RecoveryEvent.order))
        .order_by(RecoveryEvent.created_at.desc())
    )
    events = res.scalars().all()

    return [
        RecoveryEventSummary(
            id=ev.id,
            order_id=ev.order_id,
            order_number=ev.order.order_number if ev.order else None,
            cart_id=ev.cart_id,
            failure_type=ev.failure_type,
            failure_code=ev.failure_code,
            failure_source=ev.failure_source,
            status=ev.status.value,
            diagnostic_summary=ev.diagnostic_summary,
            recovery_strategy=ev.recovery_strategy,
            is_recovered=ev.is_recovered,
            recovered_amount=ev.recovered_amount,
            provenance=ev.provenance.value,
            created_at=ev.created_at,
        )
        for ev in events
    ]
