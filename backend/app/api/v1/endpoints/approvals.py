import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_merchant
from app.core.database import get_db
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance, GrowthOpportunityStatus
from app.models import GrowthOpportunity, Merchant, AuditLog, Product

router = APIRouter()


class ApprovalActionRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Optional merchant review notes")


@router.get(
    "",
    summary="List Merchant Approvals Queue",
    description="Retrieves gated and reviewed growth opportunities requiring human-in-the-loop merchant decision."
)
async def list_merchant_approvals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: GATED, APPROVED, REJECTED"),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    query = (
        select(GrowthOpportunity)
        .where(GrowthOpportunity.merchant_id == current_merchant.id)
        .options(selectinload(GrowthOpportunity.primary_product))
        .order_by(GrowthOpportunity.created_at.desc())
    )

    if status_filter and status_filter.upper() != "ALL":
        try:
            status_enum = GrowthOpportunityStatus(status_filter.upper())
            query = query.where(GrowthOpportunity.status == status_enum)
        except ValueError:
            pass

    res = await db.execute(query)
    opportunities = res.scalars().all()

    return [
        {
            "id": opp.id,
            "bundle_name": opp.bundle_name,
            "description": opp.description,
            "primary_product": {
                "id": opp.primary_product.id if opp.primary_product else None,
                "name": opp.primary_product.name if opp.primary_product else "Unknown Product",
                "price": opp.primary_product.price if opp.primary_product else 0,
                "sku": opp.primary_product.sku if opp.primary_product else "",
            },
            "bundled_product_ids": opp.bundled_product_ids,
            "proposed_discount_pct": opp.proposed_discount_pct,
            "projected_aov_lift_pct": opp.projected_aov_lift_pct,
            "status": opp.status.value,
            "provenance": opp.provenance.value,
            "metadata_json": opp.metadata_json,
            "created_at": opp.created_at.isoformat(),
        }
        for opp in opportunities
    ]


@router.post(
    "/{opportunity_id}/approve",
    summary="Approve Gated Growth Opportunity",
    description="Merchant explicitly approves a gated AI opportunity, transitioning it to APPROVED and logging audit trail."
)
async def approve_opportunity(
    opportunity_id: uuid.UUID,
    req: ApprovalActionRequest = ApprovalActionRequest(),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(GrowthOpportunity)
        .where(GrowthOpportunity.id == opportunity_id, GrowthOpportunity.merchant_id == current_merchant.id)
        .options(selectinload(GrowthOpportunity.primary_product))
    )
    opp = res.scalar_one_or_none()

    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")

    if opp.status not in [GrowthOpportunityStatus.GATED, GrowthOpportunityStatus.PROPOSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve opportunity in status '{opp.status.value}'. Must be GATED or PROPOSED.",
        )

    previous_status = opp.status.value
    opp.status = GrowthOpportunityStatus.APPROVED
    opp.metadata_json = {
        **(opp.metadata_json or {}),
        "approved_by_merchant": True,
        "approval_notes": req.notes,
    }

    # Record Immutable Audit Entry
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=current_merchant.id,
        agent_source="MERCHANT",
        event_category=AuditCategory.MERCHANT_APPROVAL,
        event_type="OPPORTUNITY_APPROVED",
        summary=f"Merchant approved gated opportunity '{opp.bundle_name}' ({opp.proposed_discount_pct}% discount)",
        provenance=EventProvenance.MERCHANT,
        severity=AuditSeverity.INFO,
        metadata_json={
            "opportunity_id": str(opp.id),
            "bundle_name": opp.bundle_name,
            "previous_status": previous_status,
            "new_status": opp.status.value,
            "proposed_discount_pct": str(opp.proposed_discount_pct),
            "notes": req.notes,
        },
    )
    db.add(audit)
    await db.commit()

    return {
        "message": "Opportunity approved successfully.",
        "opportunity_id": opp.id,
        "status": opp.status.value,
    }


@router.post(
    "/{opportunity_id}/reject",
    summary="Reject Gated Growth Opportunity",
    description="Merchant explicitly rejects a gated AI opportunity, transitioning it to REJECTED."
)
async def reject_opportunity(
    opportunity_id: uuid.UUID,
    req: ApprovalActionRequest = ApprovalActionRequest(),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(GrowthOpportunity)
        .where(GrowthOpportunity.id == opportunity_id, GrowthOpportunity.merchant_id == current_merchant.id)
    )
    opp = res.scalar_one_or_none()

    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")

    previous_status = opp.status.value
    opp.status = GrowthOpportunityStatus.REJECTED
    opp.metadata_json = {
        **(opp.metadata_json or {}),
        "rejected_by_merchant": True,
        "rejection_notes": req.notes,
    }

    # Record Immutable Audit Entry
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=current_merchant.id,
        agent_source="MERCHANT",
        event_category=AuditCategory.MERCHANT_APPROVAL,
        event_type="OPPORTUNITY_REJECTED",
        summary=f"Merchant rejected opportunity '{opp.bundle_name}' ({opp.proposed_discount_pct}% discount)",
        provenance=EventProvenance.MERCHANT,
        severity=AuditSeverity.INFO,
        metadata_json={
            "opportunity_id": str(opp.id),
            "bundle_name": opp.bundle_name,
            "previous_status": previous_status,
            "new_status": opp.status.value,
            "notes": req.notes,
        },
    )
    db.add(audit)
    await db.commit()

    return {
        "message": "Opportunity rejected.",
        "opportunity_id": opp.id,
        "status": opp.status.value,
    }
