import logging
import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_customer
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Cart, Customer, Order, OrderItem
from app.schemas.customer_auth import (
    CustomerAuthResponse,
    CustomerLoginRequest,
    CustomerOrderItemSummary,
    CustomerOrderSummary,
    CustomerRegisterRequest,
    CustomerSummary,
)

logger = logging.getLogger("revora.customer_auth")
router = APIRouter()


@router.post(
    "/register",
    response_model=CustomerAuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Customer Account",
    description="Registers a new customer, hashes credentials, preserves active session cart, and returns signed JWT."
)
async def register_customer(
    req: CustomerRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Check if email already exists
    existing_res = await db.execute(select(Customer).where(Customer.email == req.email))
    existing_cust = existing_res.scalar_one_or_none()

    if existing_cust and existing_cust.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )

    hashed_pwd = hash_password(req.password)

    if existing_cust:
        # Existing guest customer record updating to full account
        existing_cust.hashed_password = hashed_pwd
        existing_cust.full_name = req.full_name or existing_cust.full_name
        existing_cust.phone = req.phone or existing_cust.phone
        existing_cust.is_active = True
        customer = existing_cust
    else:
        customer = Customer(
            email=req.email,
            hashed_password=hashed_pwd,
            full_name=req.full_name,
            phone=req.phone,
            is_active=True,
        )
        db.add(customer)

    await db.flush()

    # 2. Bind active anonymous cart to customer if session_id passed
    if req.session_id:
        cart_res = await db.execute(
            select(Cart).where(Cart.session_id == req.session_id, Cart.status == "ACTIVE")
        )
        active_cart = cart_res.scalar_one_or_none()
        if active_cart:
            active_cart.customer_id = customer.id
            logger.info(f"Associated anonymous cart {active_cart.id} with customer {customer.id}")

    await db.commit()
    await db.refresh(customer)

    # 3. Create access token with role="CUSTOMER"
    token = create_access_token(
        subject=customer.id,
        role="CUSTOMER",
        expires_delta=None,  # standard default expiration
    )

    response.set_cookie(
        key="revora_customer_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return CustomerAuthResponse(
        access_token=token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        customer=CustomerSummary.model_validate(customer),
    )


@router.post(
    "/login",
    response_model=CustomerAuthResponse,
    summary="Customer Login",
    description="Authenticates shopper credentials, binds active guest cart, and returns signed JWT."
)
async def login_customer(
    req: CustomerLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Query customer by email
    res = await db.execute(select(Customer).where(Customer.email == req.email))
    customer = res.scalar_one_or_none()

    if not customer or not customer.hashed_password or not verify_password(req.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    # 2. Preserve & merge active anonymous cart
    if req.session_id:
        cart_res = await db.execute(
            select(Cart).where(Cart.session_id == req.session_id, Cart.status == "ACTIVE")
        )
        active_cart = cart_res.scalar_one_or_none()
        if active_cart:
            active_cart.customer_id = customer.id
            logger.info(f"Associated anonymous cart {active_cart.id} with customer {customer.id}")
            await db.commit()

    # 3. Create access token with role="CUSTOMER"
    token = create_access_token(
        subject=customer.id,
        role="CUSTOMER",
    )

    response.set_cookie(
        key="revora_customer_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return CustomerAuthResponse(
        access_token=token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        customer=CustomerSummary.model_validate(customer),
    )


@router.get(
    "/me",
    response_model=CustomerSummary,
    summary="Get Authenticated Customer Profile",
    description="Returns current customer profile data."
)
async def get_customer_me(
    current_customer: Customer = Depends(get_current_customer),
) -> Any:
    return CustomerSummary.model_validate(current_customer)


@router.post(
    "/logout",
    summary="Customer Logout",
    description="Clears customer authentication session cookie."
)
async def logout_customer(response: Response) -> Any:
    response.delete_cookie(key="revora_customer_token")
    return {"status": "success", "message": "Customer logged out successfully."}


@router.get(
    "/orders",
    response_model=List[CustomerOrderSummary],
    summary="Get Customer Orders",
    description="Returns all orders placed by the authenticated customer (strictly scoped, isolated from other customers)."
)
async def get_customer_orders(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(Order)
        .where(Order.customer_id == current_customer.id)
        .order_by(Order.created_at.desc())
    )
    orders = res.scalars().all()

    summaries = []
    for o in orders:
        # Fetch items
        items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))
        items = items_res.scalars().all()

        item_summaries = [
            CustomerOrderItemSummary(
                product_name=it.product_name,
                sku=it.sku,
                unit_price=it.unit_price,
                quantity=it.quantity,
                paid_price=it.paid_price,
            )
            for it in items
        ]

        summaries.append(
            CustomerOrderSummary(
                id=o.id,
                order_number=o.order_number,
                created_at=o.created_at.isoformat(),
                total_amount=o.total_amount,
                currency=o.currency or "INR",
                status=str(o.status.value) if hasattr(o.status, "value") else str(o.status),
                is_ai_assisted=o.is_ai_assisted,
                is_recovered=o.is_recovered,
                items_count=len(items),
                items=item_summaries,
            )
        )

    return summaries
