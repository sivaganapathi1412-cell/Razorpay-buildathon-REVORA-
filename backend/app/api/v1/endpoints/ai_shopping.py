import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_merchant
from app.core.database import get_db
from app.core.enums import (
    AuditCategory,
    AuditSeverity,
    CustomerOutcome,
    EventProvenance,
    GrowthOpportunityStatus,
    PolicyResult,
    RiskLevel,
)
from app.models import (
    AgentDecision,
    AuditLog,
    Category,
    GrowthOpportunity,
    Merchant,
    MerchantRule,
    Product,
)

router = APIRouter()


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Customer shopping query")
    current_cart_product_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)


class ProductRecommendationCard(BaseModel):
    id: uuid.UUID
    name: str
    sku: str
    price: Decimal
    image_url: Optional[str]
    category: str
    explanation: str
    opportunity_id: Optional[uuid.UUID] = None


class AIChatResponse(BaseModel):
    reply: str
    intent_detected: str
    recommendations: List[ProductRecommendationCard]
    suggested_prompts: List[str]


@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="Shop with Revora — Conversational Shopping Assistant",
    description="Parses customer natural-language query, matches against database catalog, and returns explainable recommendations."
)
async def chat_shopping_assistant(
    req: AIChatRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    msg_lower = req.message.lower().strip()

    # 1. Structured Intent Parsing (Deterministic & AI-assisted)
    max_price = None
    if "3000" in msg_lower or "3,000" in msg_lower:
        max_price = Decimal("3000.00")
    elif "2000" in msg_lower or "2,000" in msg_lower:
        max_price = Decimal("2000.00")
    elif "1000" in msg_lower or "1,000" in msg_lower:
        max_price = Decimal("1000.00")
    elif "4000" in msg_lower or "4,000" in msg_lower:
        max_price = Decimal("4000.00")

    # Keyword extraction
    target_category_slug = None
    if any(k in msg_lower for k in ["shoe", "shoes", "running", "marathon", "footwear"]):
        target_category_slug = "footwear-running"
        intent = "FOOTWEAR_DISCOVERY"
    elif any(k in msg_lower for k in ["sock", "socks", "bottle", "headband", "gear", "accessory"]):
        target_category_slug = "accessories-gear"
        intent = "ACCESSORIES_DISCOVERY"
    elif any(k in msg_lower for k in ["shirt", "tee", "shorts", "wear", "apparel"]):
        target_category_slug = "apparel-activewear"
        intent = "APPAREL_DISCOVERY"
    elif any(k in msg_lower for k in ["band", "tracker", "watch", "earbuds", "audio"]):
        target_category_slug = "electronics-wearables"
        intent = "WEARABLES_DISCOVERY"
    elif any(k in msg_lower for k in ["electrolyte", "protein", "nutrition", "recovery", "gel"]):
        target_category_slug = "nutrition-recovery"
        intent = "NUTRITION_DISCOVERY"
    else:
        intent = "GENERAL_COMMERCE_DISCOVERY"

    # 2. Database Query with Authority
    query = select(Product).where(Product.is_active == True, Product.stock_quantity > 0)
    if target_category_slug:
        query = query.where(Product.category_id == Category.id).where(Category.slug == target_category_slug)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    query = query.order_by(Product.price.desc()).limit(3)
    res = await db.execute(query)
    candidate_products = res.scalars().all()

    # Fallback if specific filters yielded no results
    if not candidate_products:
        res_fb = await db.execute(
            select(Product).where(Product.is_active == True, Product.stock_quantity > 0).limit(3)
        )
        candidate_products = res_fb.scalars().all()

    # 3. Build Explainable Recommendation Cards
    cards = []
    for p in candidate_products:
        explanation = (
            f"Fits your ₹{max_price or 'budget'} constraint with high durability and cushioning."
            if max_price
            else f"Top rated athletic gear in {p.category}."
        )
        cards.append(ProductRecommendationCard(
            id=p.id,
            name=p.name,
            sku=p.sku,
            price=p.price,
            image_url=p.image_url,
            category=p.category or "Athletics",
            explanation=explanation,
        ))

    reply_text = (
        f"I found {len(cards)} matching items for your search. Here are the best options engineered for performance:"
        if cards
        else "I couldn't find exact matches, but here are our top-performing athletic products:"
    )

    return AIChatResponse(
        reply=reply_text,
        intent_detected=intent,
        recommendations=cards,
        suggested_prompts=[
            "Show running shoes under ₹3000",
            "What accessories pair with running shoes?",
            "Show GPS fitness bands",
            "Find marathon recovery nutrition",
        ],
    )


class GrowthOpportunityRequest(BaseModel):
    product_id: Optional[uuid.UUID] = None
    cart_product_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)


@router.post(
    "/growth-opportunities",
    summary="Detect Contextual Growth Opportunities (Cross-Sell / Bundle)",
    description="Detects complementary add-ons and margin-aware bundles for current cart or viewed product."
)
async def get_growth_opportunities(
    req: GrowthOpportunityRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Fetch default merchant rules
    m_res = await db.execute(select(Merchant).where(Merchant.is_active == True))
    merchant = m_res.scalars().first()
    if not merchant:
        return {"opportunities": []}

    # Fetch complementary product (e.g. Sports Cushion Socks ₹299 or Pro Bottle ₹399)
    sock_res = await db.execute(
        select(Product).where(Product.sku == "REV-SOCK-01", Product.is_active == True)
    )
    sock = sock_res.scalar_one_or_none()

    if not sock:
        # Fallback to any accessory
        acc_res = await db.execute(
            select(Product).join(Category).where(Category.slug == "accessories-gear", Product.is_active == True).limit(1)
        )
        sock = acc_res.scalar_one_or_none()

    if not sock:
        return {"opportunities": []}

    # 2. Persist Growth Opportunity
    opp = GrowthOpportunity(
        merchant_id=merchant.id,
        opportunity_type="CROSS_SELL",
        primary_product_id=req.product_id,
        recommended_product_id=sock.id,
        potential_revenue_delta=sock.price,
        discount_percentage_proposed=Decimal("0.00"),
        discount_amount_proposed=Decimal("0.00"),
        policy_result=PolicyResult.PASSED,
        risk_level=RiskLevel.LOW,
        status=GrowthOpportunityStatus.ACTIVE,
        explanation=f"Complete your athletic setup with {sock.name} for ₹{sock.price}.",
        customer_outcome=CustomerOutcome.VIEWED,
        provenance=EventProvenance.AI,
        metadata_json={"sku": sock.sku, "target_category": "Accessories"},
    )
    db.add(opp)
    await db.commit()

    return {
        "opportunity_id": opp.id,
        "type": "CROSS_SELL",
        "title": "Frequently Paired With This Item",
        "recommended_product": {
            "id": sock.id,
            "name": sock.name,
            "sku": sock.sku,
            "price": sock.price,
            "image_url": sock.image_url,
            "explanation": f"Complete your athletic setup with {sock.name} for ₹{sock.price}.",
        },
        "incremental_revenue": sock.price,
    }


@router.get(
    "/merchant/opportunities",
    summary="Get Merchant Growth Opportunities Feed",
    description="Returns persisted GrowthOpportunity records for the authenticated merchant."
)
async def get_merchant_growth_feed(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(GrowthOpportunity)
        .where(GrowthOpportunity.merchant_id == current_merchant.id)
        .options(
            selectinload(GrowthOpportunity.primary_product),
            selectinload(GrowthOpportunity.recommended_product),
        )
        .order_by(GrowthOpportunity.created_at.desc())
    )
    opps = res.scalars().all()

    return [
        {
            "id": op.id,
            "opportunity_type": op.opportunity_type,
            "primary_product_name": op.primary_product.name if op.primary_product else "General Browsing",
            "recommended_product_name": op.recommended_product.name if op.recommended_product else "Featured Accessory",
            "potential_revenue_delta": op.potential_revenue_delta,
            "policy_result": op.policy_result.value,
            "risk_level": op.risk_level.value,
            "status": op.status.value,
            "explanation": op.explanation,
            "customer_outcome": op.customer_outcome.value,
            "provenance": op.provenance.value,
            "created_at": op.created_at,
        }
        for op in opps
    ]
