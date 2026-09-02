import json
import logging
import uuid
from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    EventProvenance,
    OrderStatus,
    PaymentAttemptStatus,
    PaymentStatus,
)
from app.models import AuditLog, Order, Payment, PaymentAttempt
from app.services.razorpay_service import razorpay_service
from app.services.recovery_engine import recovery_engine

logger = logging.getLogger("revora.webhooks")
router = APIRouter()


@router.post(
    "/razorpay",
    summary="Handle Razorpay Test Mode Webhooks",
    description="Processes asynchronous Razorpay payment/order status webhooks with HMAC signature validation."
)
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    body_bytes = await request.body()

    # 1. Verify Webhook Signature
    if not razorpay_service.verify_webhook_signature(body_bytes, x_razorpay_signature or ""):
        logger.warning("Rejected webhook due to invalid or missing signature.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature.",
        )

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to parse webhook JSON: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_type = payload.get("event")
    contains = payload.get("payload", {})
    payment_entity = contains.get("payment", {}).get("entity", {})
    order_id_rzp = payment_entity.get("order_id") or contains.get("order", {}).get("entity", {}).get("id")

    if not order_id_rzp:
        return {"status": "ignored", "reason": "No order_id found in webhook payload."}

    # 2. Locate internal order by Razorpay order ID
    order_res = await db.execute(
        select(Order)
        .where(Order.razorpay_order_id == order_id_rzp)
        .options(selectinload(Order.payments), selectinload(Order.payment_attempts))
    )
    order = order_res.scalar_one_or_none()

    if not order:
        logger.info(f"Webhook received for unknown or unindexed order: {order_id_rzp}")
        return {"status": "ok", "message": "Order not indexed locally."}

    # 3. Handle Events Idempotently
    if event_type in ["payment.captured", "order.paid"]:
        if order.status != OrderStatus.PAID:
            order.status = OrderStatus.PAID
            
            payment = order.payments[0] if order.payments else None
            if payment:
                payment.status = PaymentStatus.COMPLETED
                payment.razorpay_payment_id = payment_entity.get("id")

            if order.payment_attempts:
                order.payment_attempts[-1].status = PaymentAttemptStatus.CAPTURED
                order.payment_attempts[-1].razorpay_payment_id = payment_entity.get("id")

            if payment:
                await recovery_engine.finalize_recovery_success(order=order, payment=payment, db=db)

            audit = AuditLog(
                trace_id=str(uuid.uuid4()),
                merchant_id=order.merchant_id,
                customer_id=order.customer_id,
                session_id=None,
                order_id=order.id,
                agent_source="PAYMENT_AGENT",
                event_category=AuditCategory.PAYMENT_EVENT,
                event_type="WEBHOOK_PAYMENT_CAPTURED",
                summary=f"Webhook confirmed payment capture for order #{order.order_number}.",
                financial_delta=order.total_amount,
                provenance=EventProvenance.REAL_RAZORPAY_TEST,
                severity=AuditSeverity.INFO,
                metadata_json={"event": event_type, "razorpay_order_id": order_id_rzp},
            )
            db.add(audit)
            await db.commit()

    elif event_type == "payment.failed":
        if order.status != OrderStatus.PAID:
            error_code = payment_entity.get("error_code") or "GATEWAY_ERROR"
            error_desc = payment_entity.get("error_description") or "Payment authorization failed."
            error_source = payment_entity.get("error_source") or "gateway"

            attempt = order.payment_attempts[-1] if order.payment_attempts else None
            if not attempt:
                attempt = PaymentAttempt(
                    order_id=order.id,
                    razorpay_order_id=order_id_rzp,
                    amount=order.total_amount,
                    status=PaymentAttemptStatus.INITIATED,
                    provenance=EventProvenance.REAL_RAZORPAY_TEST,
                )
                db.add(attempt)
                await db.flush()

            await recovery_engine.diagnose_and_create_recovery(
                order=order,
                payment_attempt=attempt,
                failure_code=error_code,
                failure_description=error_desc,
                failure_source=error_source,
                provenance=EventProvenance.REAL_RAZORPAY_TEST,
                db=db,
            )
            await db.commit()

    return {"status": "processed", "event": event_type, "order_number": order.order_number}
