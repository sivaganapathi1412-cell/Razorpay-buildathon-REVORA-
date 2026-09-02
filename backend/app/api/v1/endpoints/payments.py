import uuid
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    CartStatus,
    EventProvenance,
    OrderStatus,
    PaymentAttemptStatus,
    PaymentStatus,
)
from app.models import AuditLog, Cart, Order, Payment, PaymentAttempt
from app.schemas.payment import VerifyPaymentRequest, VerifyPaymentResponse
from app.services.razorpay_service import razorpay_service
from app.services.recovery_engine import recovery_engine

router = APIRouter()


@router.post(
    "/verify",
    response_model=VerifyPaymentResponse,
    summary="Verify Razorpay Payment Signature & Transition to PAID",
    description="Validates the HMAC-SHA256 signature server-side and atomically confirms the order, payment, and recovery attribution."
)
async def verify_payment(
    req: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Fetch Order with Payments and Attempts
    order_res = await db.execute(
        select(Order)
        .where(Order.id == req.order_id)
        .options(selectinload(Order.payments), selectinload(Order.payment_attempts))
    )
    order = order_res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # 2. Idempotency Check: if order is already PAID, return successful status directly
    if order.status == OrderStatus.PAID:
        active_payment = order.payments[0] if order.payments else None
        return VerifyPaymentResponse(
            order_id=order.id,
            order_number=order.order_number,
            payment_id=active_payment.id if active_payment else uuid.uuid4(),
            razorpay_payment_id=req.razorpay_payment_id,
            status="PAID",
            currency=order.currency,
            total_paid_revenue=order.total_amount,
            baseline_revenue=order.baseline_revenue,
            ai_incremental_revenue=order.ai_incremental_revenue,
            is_recovered=order.is_recovered,
            recovered_revenue=order.recovered_revenue,
            message="Payment already verified and order is PAID.",
        )

    # 3. Server-side Razorpay HMAC Signature Verification
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature,
    )

    if not is_valid:
        # Record failed verification attempt
        if order.payment_attempts:
            order.payment_attempts[-1].status = PaymentAttemptStatus.FAILED
            order.payment_attempts[-1].error_code = "INVALID_SIGNATURE"
            order.payment_attempts[-1].error_description = "Server-side signature mismatch."
            await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed. Tampered or invalid callback.",
        )

    # 4. Update Payment and PaymentAttempt records
    payment = None
    if order.payments:
        payment = order.payments[0]
        payment.razorpay_payment_id = req.razorpay_payment_id
        payment.razorpay_signature = req.razorpay_signature
        payment.status = PaymentStatus.COMPLETED
    else:
        payment = Payment(
            order_id=order.id,
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            razorpay_signature=req.razorpay_signature,
            amount=order.total_amount,
            currency=order.currency,
            status=PaymentStatus.COMPLETED,
            provenance=EventProvenance.REAL_RAZORPAY_TEST,
        )
        db.add(payment)

    if order.payment_attempts:
        attempt = order.payment_attempts[-1]
        attempt.status = PaymentAttemptStatus.CAPTURED
        attempt.razorpay_payment_id = req.razorpay_payment_id

    # 5. Transition Order to PAID
    order.status = OrderStatus.PAID

    # 6. Check if this order was recovered via Revenue Recovery Engine
    await recovery_engine.finalize_recovery_success(order=order, payment=payment, db=db)

    # 7. Convert active customer cart to CONVERTED
    if order.customer_id:
        carts_res = await db.execute(
            select(Cart).where(Cart.customer_id == order.customer_id, Cart.status == CartStatus.ACTIVE)
        )
        for c in carts_res.scalars().all():
            c.status = CartStatus.CONVERTED

    # 8. Audit Log
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=order.merchant_id,
        customer_id=order.customer_id,
        session_id=None,
        order_id=order.id,
        agent_source="PAYMENT_AGENT",
        event_category=AuditCategory.PAYMENT_EVENT,
        event_type="PAYMENT_VERIFIED",
        summary=f"Payment of ₹{order.total_amount} verified for order #{order.order_number} (Razorpay: {req.razorpay_payment_id}).",
        financial_delta=order.total_amount,
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
        severity=AuditSeverity.INFO,
        metadata_json={
            "order_number": order.order_number,
            "razorpay_payment_id": req.razorpay_payment_id,
            "is_recovered": order.is_recovered,
            "baseline_revenue": str(order.baseline_revenue),
            "ai_incremental_revenue": str(order.ai_incremental_revenue),
            "recovered_revenue": str(order.recovered_revenue),
        },
    )
    db.add(audit)
    await db.commit()

    return VerifyPaymentResponse(
        order_id=order.id,
        order_number=order.order_number,
        payment_id=payment.id,
        razorpay_payment_id=req.razorpay_payment_id,
        status="PAID",
        currency=order.currency,
        total_paid_revenue=order.total_amount,
        baseline_revenue=order.baseline_revenue,
        ai_incremental_revenue=order.ai_incremental_revenue,
        is_recovered=order.is_recovered,
        recovered_revenue=order.recovered_revenue,
        message="Payment verified and order successfully confirmed!",
    )
