import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_merchant
from app.core.database import get_db
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance
from app.models import AuditLog, Merchant

router = APIRouter()


@router.get(
    "",
    summary="List Immutable Audit Log Entries",
    description="Retrieves append-only audit trail records with multi-dimensional filtering by category, provenance, severity, and order."
)
async def list_audit_logs(
    category: Optional[str] = Query(None, description="Filter by event category: SHOPPING, GROWTH, SAFETY, PAYMENT, RECOVERY, MERCHANT_ACTION, SYSTEM"),
    provenance: Optional[str] = Query(None, description="Filter by provenance: REAL_RAZORPAY_TEST, DEMO_SIMULATION, SYSTEM, AI, MERCHANT, CUSTOMER"),
    severity: Optional[str] = Query(None, description="Filter by severity: INFO, WARNING, CRITICAL"),
    trace_id: Optional[str] = Query(None, description="Filter by transaction trace ID"),
    order_id: Optional[uuid.UUID] = Query(None, description="Filter by associated Order ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    query = select(AuditLog).where(AuditLog.merchant_id == current_merchant.id)

    if category:
        try:
            cat_enum = AuditCategory(category.upper())
            query = query.where(AuditLog.event_category == cat_enum)
        except ValueError:
            pass

    if provenance:
        try:
            prov_enum = EventProvenance(provenance.upper())
            query = query.where(AuditLog.provenance == prov_enum)
        except ValueError:
            pass

    if severity:
        try:
            sev_enum = AuditSeverity(severity.upper())
            query = query.where(AuditLog.severity == sev_enum)
        except ValueError:
            pass

    if trace_id:
        query = query.where(AuditLog.trace_id == trace_id)

    if order_id:
        query = query.where(AuditLog.order_id == order_id)

    query = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit)
    res = await db.execute(query)
    logs = res.scalars().all()

    return [
        {
            "id": log.id,
            "trace_id": log.trace_id,
            "order_id": log.order_id,
            "agent_source": log.agent_source,
            "event_category": log.event_category.value,
            "event_type": log.event_type,
            "summary": log.summary,
            "financial_delta": log.financial_delta,
            "provenance": log.provenance.value,
            "severity": log.severity.value,
            "metadata_json": log.metadata_json,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]


@router.get(
    "/trace/{trace_id}",
    summary="Get End-to-End Commerce Journey Trace",
    description="Retrieves chronological timeline of all participating AI agents, safety evaluations, and payment events for a single journey trace."
)
async def get_journey_trace(
    trace_id: str,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(AuditLog)
        .where(AuditLog.trace_id == trace_id, AuditLog.merchant_id == current_merchant.id)
        .order_by(AuditLog.timestamp.asc())
    )
    logs = res.scalars().all()

    return {
        "trace_id": trace_id,
        "event_count": len(logs),
        "events": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "agent_source": log.agent_source,
                "event_category": log.event_category.value,
                "event_type": log.event_type,
                "summary": log.summary,
                "financial_delta": log.financial_delta,
                "provenance": log.provenance.value,
                "severity": log.severity.value,
                "metadata_json": log.metadata_json,
            }
            for log in logs
        ],
    }
