import uuid
from decimal import Decimal
from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_merchant
from app.core.database import get_db
from app.core.enums import (
    EventProvenance,
    GrowthOpportunityStatus,
    OrderStatus,
    RecoveryStatus,
)
from app.models import GrowthOpportunity, Merchant, Order, RecoveryEvent

router = APIRouter()


@router.get(
    "/overview",
    summary="Get Merchant Analytics Overview",
    description="Calculates real-time, authoritative financial metrics and multi-dimensional revenue attribution from the database."
)
@router.get(
    "/dashboard",
    summary="Get Merchant Analytics Dashboard",
    description="Alias for overview returning full attribution metrics."
)
async def get_analytics_overview(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Fetch all orders for the merchant
    orders_res = await db.execute(
        select(Order).where(Order.merchant_id == current_merchant.id)
    )
    orders = orders_res.scalars().all()

    total_orders_count = len(orders)
    paid_orders = [o for o in orders if o.status == OrderStatus.PAID]
    paid_orders_count = len(paid_orders)

    total_paid_revenue = Decimal("0.00")
    baseline_revenue = Decimal("0.00")
    ai_incremental_revenue = Decimal("0.00")
    ai_assisted_revenue = Decimal("0.00")
    recovered_order_value = Decimal("0.00")

    for o in paid_orders:
        total_paid_revenue += o.total_amount
        baseline_revenue += o.baseline_revenue
        ai_incremental_revenue += o.ai_incremental_revenue
        if o.is_ai_assisted:
            ai_assisted_revenue += o.total_amount
        if o.is_recovered:
            recovered_order_value += o.recovered_revenue

    # 2. AOV & AI AOV Lift Calculations
    aov = (total_paid_revenue / Decimal(paid_orders_count)) if paid_orders_count > 0 else Decimal("0.00")
    baseline_aov = (baseline_revenue / Decimal(paid_orders_count)) if paid_orders_count > 0 else Decimal("0.00")
    
    ai_aov_lift_pct = Decimal("0.00")
    if baseline_aov > Decimal("0.00"):
        ai_aov_lift_pct = ((aov - baseline_aov) / baseline_aov) * Decimal("100.00")

    ai_contribution_pct = Decimal("0.00")
    if total_paid_revenue > Decimal("0.00"):
        ai_contribution_pct = (ai_incremental_revenue / total_paid_revenue) * Decimal("100.00")

    # 3. Growth Opportunities & Approvals
    opps_res = await db.execute(
        select(GrowthOpportunity).where(GrowthOpportunity.merchant_id == current_merchant.id)
    )
    opportunities = opps_res.scalars().all()
    pending_approvals = [opp for opp in opportunities if opp.status == GrowthOpportunityStatus.GATED]

    # 4. Recovery Performance
    rec_res = await db.execute(
        select(RecoveryEvent)
        .join(Order, RecoveryEvent.order_id == Order.id)
        .where(Order.merchant_id == current_merchant.id)
    )
    recovery_events = rec_res.scalars().all()
    recovered_events = [r for r in recovery_events if r.is_recovered]
    recovery_rate = (
        round((len(recovered_events) / len(recovery_events)) * 100, 1)
        if len(recovery_events) > 0
        else 0.0
    )

    return {
        "currency": current_merchant.currency or "INR",
        "total_paid_revenue": round(total_paid_revenue, 2),
        "baseline_revenue": round(baseline_revenue, 2),
        "ai_incremental_revenue": round(ai_incremental_revenue, 2),
        "ai_assisted_revenue": round(ai_assisted_revenue, 2),
        "recovered_order_value": round(recovered_order_value, 2),
        "total_orders_count": total_orders_count,
        "paid_orders_count": paid_orders_count,
        "aov": round(aov, 2),
        "baseline_aov": round(baseline_aov, 2),
        "ai_aov_lift_pct": round(ai_aov_lift_pct, 2),
        "ai_contribution_pct": round(ai_contribution_pct, 1),
        "growth_opportunities_count": len(opportunities),
        "pending_approvals_count": len(pending_approvals),
        "recovery_events_count": len(recovery_events),
        "recovered_events_count": len(recovered_events),
        "recovery_success_rate": recovery_rate,
        "attribution_summary": {
            "formula": "Total Paid Revenue = Baseline Revenue + AI Incremental Revenue",
            "recovered_explanation": "Recovered Order Value is an analytical classification and strictly not double-counted into Total Paid Revenue.",
        },
    }


@router.get(
    "/revenue",
    summary="Get Detailed Revenue & Attribution Breakdown",
    description="Provides itemized financial attribution across direct baseline sales, AI cross-sells, and recovered baskets."
)
async def get_revenue_analytics(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    orders_res = await db.execute(
        select(Order)
        .where(Order.merchant_id == current_merchant.id, Order.status == OrderStatus.PAID)
        .order_by(Order.created_at.desc())
    )
    paid_orders = orders_res.scalars().all()

    total_paid = sum((o.total_amount for o in paid_orders), Decimal("0.00"))
    baseline = sum((o.baseline_revenue for o in paid_orders), Decimal("0.00"))
    ai_incremental = sum((o.ai_incremental_revenue for o in paid_orders), Decimal("0.00"))
    recovered = sum((o.recovered_revenue for o in paid_orders if o.is_recovered), Decimal("0.00"))

    # Recent transaction trend data
    recent_transactions = [
        {
            "order_number": o.order_number,
            "created_at": o.created_at.isoformat(),
            "total_amount": round(o.total_amount, 2),
            "baseline_revenue": round(o.baseline_revenue, 2),
            "ai_incremental_revenue": round(o.ai_incremental_revenue, 2),
            "is_ai_assisted": o.is_ai_assisted,
            "is_recovered": o.is_recovered,
        }
        for o in paid_orders[:10]
    ]

    return {
        "total_paid_revenue": round(total_paid, 2),
        "baseline_revenue": round(baseline, 2),
        "ai_incremental_revenue": round(ai_incremental, 2),
        "recovered_revenue_dimension": round(recovered, 2),
        "ai_revenue_share_pct": round((ai_incremental / total_paid * 100), 2) if total_paid > 0 else 0.0,
        "recent_transactions": recent_transactions,
    }


@router.get(
    "/growth",
    summary="Get AI Growth Opportunities Analytics",
    description="Analytics for AI recommendations, upsells, cross-sells, smart bundles, and approval outcomes."
)
async def get_growth_analytics(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(GrowthOpportunity).where(GrowthOpportunity.merchant_id == current_merchant.id)
    )
    opportunities = res.scalars().all()

    by_status = {
        "DETECTED": len([o for o in opportunities if o.status == GrowthOpportunityStatus.DETECTED]),
        "PROPOSED": len([o for o in opportunities if o.status == GrowthOpportunityStatus.PROPOSED]),
        "GATED": len([o for o in opportunities if o.status == GrowthOpportunityStatus.GATED]),
        "APPROVED": len([o for o in opportunities if o.status == GrowthOpportunityStatus.APPROVED]),
        "REJECTED": len([o for o in opportunities if o.status == GrowthOpportunityStatus.REJECTED]),
        "ACTIVE": len([o for o in opportunities if o.status == GrowthOpportunityStatus.ACTIVE]),
    }

    avg_lift = (
        sum((o.projected_aov_lift_pct for o in opportunities), Decimal("0.00")) / len(opportunities)
        if len(opportunities) > 0
        else Decimal("0.00")
    )

    return {
        "total_opportunities": len(opportunities),
        "status_breakdown": by_status,
        "average_projected_aov_lift": round(avg_lift, 2),
        "gated_opportunities_count": by_status["GATED"],
        "approved_count": by_status["APPROVED"],
    }


@router.get(
    "/recovery",
    summary="Get AI Revenue Recovery Analytics",
    description="Analytics on checkout failures, diagnostic causes, recovery success rates, and event provenance."
)
async def get_recovery_analytics(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(RecoveryEvent)
        .join(Order, RecoveryEvent.order_id == Order.id)
        .where(Order.merchant_id == current_merchant.id)
    )
    events = res.scalars().all()

    total_events = len(events)
    recovered_events = [e for e in events if e.is_recovered]
    total_recovered_amount = sum((e.recovered_amount for e in recovered_events), Decimal("0.00"))
    
    # Provenance breakdown
    demo_simulations = len([e for e in events if e.provenance == EventProvenance.DEMO_SIMULATION])
    razorpay_tests = len([e for e in events if e.provenance == EventProvenance.REAL_RAZORPAY_TEST])

    # Failure code distribution
    failure_codes: dict = {}
    for e in events:
        code = e.failure_code or "UNKNOWN"
        failure_codes[code] = failure_codes.get(code, 0) + 1

    recovery_rate = (
        round((len(recovered_events) / total_events) * 100, 1)
        if total_events > 0
        else 0.0
    )

    return {
        "total_recovery_events": total_events,
        "recovered_orders_count": len(recovered_events),
        "recovery_success_rate": recovery_rate,
        "total_recovered_revenue": round(total_recovered_amount, 2),
        "average_recovered_order_value": round(total_recovered_amount / len(recovered_events), 2) if len(recovered_events) > 0 else 0.0,
        "provenance_breakdown": {
            "demo_simulations": demo_simulations,
            "razorpay_tests": razorpay_tests,
        },
        "failure_reason_distribution": failure_codes,
    }
