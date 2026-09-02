import uuid
from decimal import Decimal
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_merchant, get_current_user
from app.core.database import get_db
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance
from app.models import AuditLog, Customer, Merchant, Order, OrderItem, User
from app.schemas.merchant import MerchantProfileResponse, MerchantProfileUpdate

router = APIRouter()


@router.get(
    "/profile",
    response_model=MerchantProfileResponse,
    summary="Get Merchant Store Profile",
    description="Returns the profile and settings for the authenticated merchant tenant."
)
async def get_profile(
    current_merchant: Merchant = Depends(get_current_merchant),
) -> Any:
    return MerchantProfileResponse.model_validate(current_merchant)


@router.put(
    "/profile",
    response_model=MerchantProfileResponse,
    summary="Update Merchant Store Profile",
    description="Updates store profile metadata for the authenticated merchant tenant."
)
async def update_profile(
    update_data: MerchantProfileUpdate,
    current_user: User = Depends(get_current_user),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    if update_data.name is not None:
        current_merchant.name = update_data.name
    if update_data.business_category is not None:
        current_merchant.business_category = update_data.business_category
    if update_data.description is not None:
        current_merchant.description = update_data.description
    if update_data.currency is not None:
        current_merchant.currency = update_data.currency

    # Audit profile modification
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=current_merchant.id,
        customer_id=None,
        session_id=None,
        order_id=None,
        agent_source="MERCHANT_PORTAL",
        event_category=AuditCategory.SYSTEM_EVENT,
        event_type="MERCHANT_PROFILE_UPDATED",
        summary=f"Merchant profile updated by user '{current_user.email}'.",
        financial_delta=Decimal("0.00"),
        provenance=EventProvenance.MERCHANT,
        severity=AuditSeverity.INFO,
        metadata_json={"updated_by": str(current_user.id)},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(current_merchant)

    return MerchantProfileResponse.model_validate(current_merchant)


@router.get(
    "/orders",
    summary="Get Merchant Orders Feed",
    description="Returns all orders for the authenticated merchant tenant with multi-dimensional attribution breakdown."
)
async def get_merchant_orders(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(Order)
        .where(Order.merchant_id == current_merchant.id)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .order_by(Order.created_at.desc())
    )
    orders = res.scalars().all()

    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": o.customer.full_name if o.customer else "Guest Customer",
            "customer_email": o.customer.email if o.customer else "guest@revora.ai",
            "status": o.status.value,
            "currency": o.currency,
            "total_amount": o.total_amount,
            "baseline_revenue": o.baseline_revenue,
            "ai_incremental_revenue": o.ai_incremental_revenue,
            "is_ai_assisted": o.is_ai_assisted,
            "is_recovered": o.is_recovered,
            "recovered_revenue": o.recovered_revenue,
            "provenance": o.provenance.value,
            "created_at": o.created_at,
            "item_count": len(o.items),
        }
        for o in orders
    ]
