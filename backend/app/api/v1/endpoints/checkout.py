import time
import uuid
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.core.database import get_db
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    CartStatus,
    EventProvenance,
    ItemOrigin,
    OrderStatus,
    PaymentAttemptStatus,
    PaymentStatus,
)
from app.models import (
    AuditLog,
    Cart,
    CartItem,
    Customer,
    Merchant,
    Order,
    OrderItem,
    Payment,
    PaymentAttempt,
    Product,
)
from app.schemas.checkout import (
    CheckoutOrderItemSummary,
    CheckoutOrderResponse,
    CreateCheckoutOrderRequest,
    SimulateFailureRequest,
    SimulateFailureResponse,
)
from app.services.razorpay_service import inr_to_paise, razorpay_service
from app.services.recovery_engine import recovery_engine

router = APIRouter()


@router.post(
    "/create-order",
    response_model=CheckoutOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Server-Side Checkout & Razorpay Test Order",
    description="Validates cart stock and pricing against database authority, creates internal Order and Razorpay Test Order."
)
async def create_checkout_order(
    req: CreateCheckoutOrderRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Resolve Session ID
    session_id = req.session_id or request.cookies.get("revora_session_id") or "demo_session"

    # 2. Fetch Active Cart with Items and Products
    cart_res = await db.execute(
        select(Cart)
        .where(Cart.session_id == session_id, Cart.status == CartStatus.ACTIVE)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .order_by(Cart.created_at.desc())
    )
    cart = cart_res.scalar_one_or_none()

    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Please add products before checking out.",
        )

    # 3. Reload and validate every product and stock from database (Authoritative Backend Verification)
    subtotal = Decimal("0.00")
    discount_total = Decimal("0.00")
    baseline_revenue = Decimal("0.00")
    ai_incremental_revenue = Decimal("0.00")
    order_items_to_create = []
    merchant_id = None

    for item in cart.items:
        prod_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = prod_res.scalar_one_or_none()

        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{item.product.name if item.product else 'Item'}' is no longer available.",
            )

        if not merchant_id:
            merchant_id = product.merchant_id

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, requested: {item.quantity}.",
            )

        item_unit_price = product.price
        item_discount = item.discount_amount
        item_paid = (item_unit_price * item.quantity) - item_discount
        if item_paid < Decimal("0.00"):
            item_paid = Decimal("0.00")

        subtotal += (item_unit_price * item.quantity)
        discount_total += item_discount

        # Classify baseline vs AI incremental origin
        is_ai = (item.origin in [ItemOrigin.AI_CROSS_SELL, ItemOrigin.AI_UPSELL, ItemOrigin.AI_RECOMMENDATION, ItemOrigin.AI_BUNDLE]) or item.metadata_json.get("added_via_ai", False)
        origin = item.origin if is_ai else ItemOrigin.DIRECT
        if is_ai:
            ai_incremental_revenue += item_paid
        else:
            baseline_revenue += item_paid

        order_items_to_create.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "quantity": item.quantity,
            "unit_price": item_unit_price,
            "discount_amount": item_discount,
            "paid_price": item_paid,
            "origin": origin,
        })

    total_amount = subtotal - discount_total
    if total_amount < Decimal("0.00"):
        total_amount = Decimal("0.00")

    if not merchant_id:
        res_m = await db.execute(select(Merchant).where(Merchant.is_active == True))
        m = res_m.scalars().first()
        merchant_id = m.id if m else uuid.uuid4()

    # 4. Resolve or create Customer record
    customer = None
    if cart.customer_id:
        cust_res = await db.execute(select(Customer).where(Customer.id == cart.customer_id))
        customer = cust_res.scalar_one_or_none()

    if not customer and req.customer_email:
        cust_res = await db.execute(select(Customer).where(Customer.email == req.customer_email))
        customer = cust_res.scalar_one_or_none()

    if not customer:
        customer = Customer(
            email=req.customer_email,
            phone=req.customer_phone,
            full_name=req.customer_name or "Valued Athlete",
        )
        db.add(customer)
        await db.flush()

    # 5. Create Internal Order
    order_number = f"REV-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
    order = Order(
        merchant_id=merchant_id,
        customer_id=customer.id,
        order_number=order_number,
        status=OrderStatus.PENDING_PAYMENT,
        currency="INR",
        subtotal=subtotal,
        discount_total=discount_total,
        total_amount=total_amount,
        is_ai_assisted=(ai_incremental_revenue > Decimal("0.00")),
        baseline_revenue=baseline_revenue,
        ai_incremental_revenue=ai_incremental_revenue,
        is_recovered=False,
        recovered_revenue=Decimal("0.00"),
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
        customer_notes={"delivery_address": req.delivery_address or {}},
    )
    db.add(order)
    await db.flush()

    # 6. Create Order Items
    created_items_summary = []
    for item_data in order_items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            **item_data,
        )
        db.add(order_item)
        created_items_summary.append(CheckoutOrderItemSummary(
            product_id=order_item.product_id,
            product_name=order_item.product_name,
            sku=order_item.sku,
            quantity=order_item.quantity,
            unit_price=order_item.unit_price,
            discount_amount=order_item.discount_amount,
            paid_price=order_item.paid_price,
            origin=order_item.origin.value,
        ))

    # 7. Create Razorpay Test Mode Order via Service
    rzp_order = await razorpay_service.create_order(
        amount_inr=total_amount,
        receipt=order_number,
        currency="INR",
        notes={"internal_order_id": str(order.id), "order_number": order_number},
    )
    order.razorpay_order_id = rzp_order["id"]

    # 8. Create Payment & PaymentAttempt records
    payment = Payment(
        order_id=order.id,
        razorpay_order_id=rzp_order["id"],
        amount=total_amount,
        currency="INR",
        status=PaymentStatus.PENDING,
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
    )
    db.add(payment)
    await db.flush()

    payment_attempt = PaymentAttempt(
        order_id=order.id,
        razorpay_order_id=rzp_order["id"],
        attempt_number=1,
        amount=total_amount,
        status=PaymentAttemptStatus.INITIATED,
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
    )
    db.add(payment_attempt)

    # 9. Audit Log
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=order.merchant_id,
        customer_id=customer.id,
        session_id=cart.id,
        order_id=order.id,
        agent_source="PAYMENT_AGENT",
        event_category=AuditCategory.PAYMENT_EVENT,
        event_type="CHECKOUT_ORDER_CREATED",
        summary=f"Checkout Order #{order_number} initialized for ₹{total_amount} (Razorpay: {rzp_order['id']}).",
        financial_delta=total_amount,
        provenance=EventProvenance.REAL_RAZORPAY_TEST,
        severity=AuditSeverity.INFO,
        metadata_json={
            "order_number": order_number,
            "razorpay_order_id": rzp_order["id"],
            "subtotal": str(subtotal),
            "baseline_revenue": str(baseline_revenue),
            "ai_incremental_revenue": str(ai_incremental_revenue),
        },
    )
    db.add(audit)
    await db.commit()

    return CheckoutOrderResponse(
        order_id=order.id,
        order_number=order.order_number,
        razorpay_order_id=rzp_order["id"],
        amount_paise=inr_to_paise(total_amount),
        amount_inr=total_amount,
        currency="INR",
        razorpay_key_id=settings.RAZORPAY_KEY_ID or "rzp_test_revora_demo",
        customer_email=customer.email or req.customer_email,
        customer_name=customer.full_name or req.customer_name or "Valued Athlete",
        subtotal=subtotal,
        discount_total=discount_total,
        total_amount=total_amount,
        baseline_revenue=baseline_revenue,
        ai_incremental_revenue=ai_incremental_revenue,
        is_ai_assisted=order.is_ai_assisted,
        is_test_mode=True,
        items=created_items_summary,
    )


@router.post(
    "/simulate-failure",
    response_model=SimulateFailureResponse,
    summary="Controlled Demo Failure Simulation (Hackathon Presentation)",
    description="Explicitly triggers a controlled simulated payment failure for hackathon evaluation, labeled strictly with DEMO_SIMULATION provenance."
)
async def simulate_demo_failure(
    req: SimulateFailureRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Fetch Order and Latest Payment Attempt
    order_res = await db.execute(
        select(Order)
        .where(Order.id == req.order_id)
        .options(selectinload(Order.payment_attempts))
    )
    order = order_res.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status == OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already PAID and cannot be failed.",
        )

    # 2. Fetch or create PaymentAttempt
    attempt = None
    if order.payment_attempts:
        attempt = order.payment_attempts[-1]
    else:
        attempt = PaymentAttempt(
            order_id=order.id,
            razorpay_order_id=order.razorpay_order_id,
            attempt_number=1,
            amount=order.total_amount,
            status=PaymentAttemptStatus.INITIATED,
            provenance=EventProvenance.DEMO_SIMULATION,
        )
        db.add(attempt)
        await db.flush()

    # 3. Trigger Revenue Recovery Engine with DEMO_SIMULATION Provenance
    recovery_event = await recovery_engine.diagnose_and_create_recovery(
        order=order,
        payment_attempt=attempt,
        failure_code=req.failure_code or "BANK_AUTH_TIMEOUT",
        failure_description=req.failure_reason or "Simulated Bank Auth Timeout during 3DS OTP validation.",
        failure_source=req.failure_source or "bank",
        provenance=EventProvenance.DEMO_SIMULATION,
        db=db,
    )
    await db.commit()

    return SimulateFailureResponse(
        order_id=order.id,
        order_number=order.order_number,
        status="PAYMENT_FAILED",
        recovery_event_id=recovery_event.id,
        diagnostic_summary=recovery_event.diagnostic_summary,
        strategy=recovery_event.recovery_strategy,
        provenance=EventProvenance.DEMO_SIMULATION.value,
    )


@router.get(
    "/orders/{order_id}",
    summary="Get Order Checkout Summary",
    description="Returns order items, pricing breakdown, and payment status."
)
async def get_checkout_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.payments))
    )
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status.value,
        "currency": order.currency,
        "subtotal": order.subtotal,
        "discount_total": order.discount_total,
        "total_amount": order.total_amount,
        "baseline_revenue": order.baseline_revenue,
        "ai_incremental_revenue": order.ai_incremental_revenue,
        "is_ai_assisted": order.is_ai_assisted,
        "is_recovered": order.is_recovered,
        "recovered_revenue": order.recovered_revenue,
        "razorpay_order_id": order.razorpay_order_id,
        "items": [
            {
                "product_id": it.product_id,
                "product_name": it.product_name,
                "sku": it.sku,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "paid_price": it.paid_price,
                "origin": it.origin.value,
            }
            for it in order.items
        ],
    }
