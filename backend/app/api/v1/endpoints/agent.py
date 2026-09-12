import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.enums import PolicyResult, RiskLevel
from app.core.x402 import X402PaymentGuard, X402VerificationResult
from app.models import Category, Merchant, MerchantRule, Product
from app.schemas.agent import (
    AgentGrowthSuggestion,
    AgentManifestEndpoint,
    AgentManifestPricing,
    AgentManifestResponse,
    AgentProductItem,
    AgentRecommendationRequest,
    AgentRecommendationResponse,
    AgentRecoveryRequest,
    AgentRecoveryResponse,
)
from app.services.safety_engine import evaluate_financial_action, get_or_create_merchant_rule

router = APIRouter()

# Instantiate isolated x402 payment guards for paid endpoints
recommendations_payment_guard = X402PaymentGuard(
    amount_atomic=settings.X402_RECOMMENDATIONS_PRICE_ATOMIC,
    description="REVORA AI Product Recommendations & Growth Discovery API",
    tags=["recommendations", "ecommerce", "growth"],
)

recovery_payment_guard = X402PaymentGuard(
    amount_atomic=settings.X402_RECOVERY_PRICE_ATOMIC,
    description="REVORA AI Revenue Recovery Strategy API",
    tags=["recovery", "checkout", "finance"],
)


# ============================================================================
# Task 8: Public Manifest Endpoint (Unpaid)
# ============================================================================

@router.get(
    "/manifest",
    response_model=AgentManifestResponse,
    summary="PayForAPI x402 v2 Agent Manifest",
    description="Machine-readable specification declaring API capabilities, pricing, and Base USDC settlement details.",
)
async def get_agent_manifest() -> Any:
    rec_price_atomic = settings.X402_RECOMMENDATIONS_PRICE_ATOMIC
    rec_human = f"${Decimal(rec_price_atomic) / Decimal('1000000'):.2f} USDC"

    recov_price_atomic = settings.X402_RECOVERY_PRICE_ATOMIC
    recov_human = f"${Decimal(recov_price_atomic) / Decimal('1000000'):.2f} USDC"

    return AgentManifestResponse(
        service_name="REVORA AI",
        version=settings.VERSION,
        x402_version=2,
        network=settings.X402_NETWORK,
        asset=settings.X402_USDC_ASSET,
        asset_symbol="USDC",
        pay_to=settings.X402_PAY_TO,
        description="Autonomous AI Commerce Engine: Intent-based product discovery, margin-safe cross-sells, and payment failure recovery strategies.",
        documentation_url="/PAYFORAPI_X402.md",
        endpoints=[
            AgentManifestEndpoint(
                path="/api/v1/agent/recommendations",
                method="POST",
                summary="AI Product Recommendations & Safe Bundles",
                description="Queries authoritative catalog with natural language intent extraction and returns explainable product matches with safety-bounded cross-sells.",
                pricing=AgentManifestPricing(
                    scheme="exact",
                    amountAtomic=rec_price_atomic,
                    humanPrice=rec_human,
                    asset=settings.X402_USDC_ASSET,
                    network=settings.X402_NETWORK,
                ),
                request_schema=AgentRecommendationRequest.model_json_schema(),
                response_schema=AgentRecommendationResponse.model_json_schema(),
            ),
            AgentManifestEndpoint(
                path="/api/v1/agent/recovery-strategy",
                method="POST",
                summary="AI Revenue Recovery Strategy Formulator",
                description="Analyzes checkout/payment interruption diagnostic signals and formulates an actionable, risk-evaluated recovery strategy with merchant safety bounds.",
                pricing=AgentManifestPricing(
                    scheme="exact",
                    amountAtomic=recov_price_atomic,
                    humanPrice=recov_human,
                    asset=settings.X402_USDC_ASSET,
                    network=settings.X402_NETWORK,
                ),
                request_schema=AgentRecoveryRequest.model_json_schema(),
                response_schema=AgentRecoveryResponse.model_json_schema(),
            ),
        ],
    )


# ============================================================================
# Task 2: Product Recommendation / Growth API (x402 Protected)
# ============================================================================

@router.post(
    "/recommendations",
    response_model=AgentRecommendationResponse,
    summary="Get AI Product Recommendations (x402 v2 Paid)",
    description="Paid external agent endpoint returning explainable product recommendations and margin-safe cross-sells.",
)
async def get_agent_recommendations(
    req: AgentRecommendationRequest,
    payment_verification: X402VerificationResult = Depends(recommendations_payment_guard),
    db: AsyncSession = Depends(get_db),
) -> Any:
    msg_lower = req.query.lower().strip()

    # 1. Intent Extraction & Category Detection
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

    if req.category:
        target_category_slug = req.category.strip().lower().replace(" ", "-").replace("&", "and")

    # 2. Budget Detection
    max_price = req.budget_max
    if max_price is None:
        if "3000" in msg_lower or "3,000" in msg_lower:
            max_price = Decimal("3000.00")
        elif "2000" in msg_lower or "2,000" in msg_lower:
            max_price = Decimal("2000.00")
        elif "1000" in msg_lower or "1,000" in msg_lower:
            max_price = Decimal("1000.00")
        elif "4000" in msg_lower or "4,000" in msg_lower:
            max_price = Decimal("4000.00")

    # 3. Authoritative Database Query
    query = select(Product).options(selectinload(Product.category_rel)).where(Product.is_active == True, Product.stock_quantity > 0)
    if target_category_slug:
        query = query.join(Product.category_rel).where(Category.slug == target_category_slug)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    query = query.order_by(Product.price.desc()).limit(3)
    res = await db.execute(query)
    products = res.scalars().all()

    # Fallback to top products if no direct category match
    if not products:
        fallback_query = select(Product).options(selectinload(Product.category_rel)).where(Product.is_active == True, Product.stock_quantity > 0).limit(3)
        res_fb = await db.execute(fallback_query)
        products = res_fb.scalars().all()

    # Build Product Items
    recommended_items: List[AgentProductItem] = []
    merchant_id = None
    for p in products:
        if not merchant_id:
            merchant_id = p.merchant_id
        cat_name = p.category or (p.category_rel.name if p.category_rel else "Athletics")
        explanation = (
            f"Within ₹{max_price} constraint; top-rated product in {cat_name}."
            if max_price
            else f"Top rated athletic gear in {cat_name} with verified stock."
        )
        recommended_items.append(
            AgentProductItem(
                id=p.id,
                sku=p.sku,
                name=p.name,
                price=p.price,
                currency="INR",
                category=cat_name,
                image_url=p.image_url,
                stock_available=p.stock_quantity,
                explanation=explanation,
            )
        )

    # 4. Contextual Growth Suggestions (Cross-Sell / Bundles)
    growth_suggestions: List[AgentGrowthSuggestion] = []
    safety_decision_dict: Optional[Dict[str, Any]] = None

    if recommended_items:
        # Fetch complementary accessory (e.g. Sports Cushion Socks)
        sock_res = await db.execute(
            select(Product)
            .options(selectinload(Product.category_rel))
            .where(Product.sku == "REV-SOCK-01", Product.is_active == True)
        )
        addon_prod = sock_res.scalar_one_or_none()
        if not addon_prod:
            addon_res = await db.execute(
                select(Product)
                .options(selectinload(Product.category_rel))
                .where(Product.is_active == True, Product.stock_quantity > 0)
                .order_by(Product.price.asc())
                .limit(1)
            )
            addon_prod = addon_res.scalar_one_or_none()

        if addon_prod and merchant_id:
            addon_cat = addon_prod.category or (addon_prod.category_rel.name if addon_prod.category_rel else "Accessories")
            addon_item = AgentProductItem(
                id=addon_prod.id,
                sku=addon_prod.sku,
                name=addon_prod.name,
                price=addon_prod.price,
                currency="INR",
                category=addon_cat,
                image_url=addon_prod.image_url,
                stock_available=addon_prod.stock_quantity,
                explanation=f"High-affinity pairing with {recommended_items[0].name}.",
            )

            # Evaluate through Safety Engine
            safety_decision = await evaluate_financial_action(
                merchant_id=merchant_id,
                action_type="CROSS_SELL",
                discount_pct=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                order_amount=recommended_items[0].price,
                product_id=addon_prod.id,
                db=db,
            )
            safety_decision_dict = safety_decision.model_dump()

            growth_suggestions.append(
                AgentGrowthSuggestion(
                    type="CROSS_SELL",
                    title="Frequently Paired Athletic Gear",
                    recommended_product=addon_item,
                    discount_pct_proposed=Decimal("0.00"),
                    potential_incremental_revenue=addon_prod.price,
                    explanation=f"Pair with {addon_prod.name} (₹{addon_prod.price}) to boost performance.",
                    policy_result=safety_decision.policy_result.value,
                )
            )

    return AgentRecommendationResponse(
        status="success",
        query=req.query,
        detected_intent=intent,
        recommended_products=recommended_items,
        growth_suggestions=growth_suggestions,
        safety_policy_decision=safety_decision_dict,
        metadata={
            "provider": "REVORA Autonomous Commerce Engine",
            "x402_settlement_mode": payment_verification.mode,
            "currency": "INR",
        },
    )


# ============================================================================
# Task 3: Revenue Recovery Strategy API (x402 Protected, Decoupled)
# ============================================================================

@router.post(
    "/recovery-strategy",
    response_model=AgentRecoveryResponse,
    summary="Formulate Revenue Recovery Strategy (x402 v2 Paid)",
    description="Paid external agent endpoint that analyzes checkout interruptions and formulates a policy-bounded recovery strategy without requiring an existing order ID.",
)
async def get_agent_recovery_strategy(
    req: AgentRecoveryRequest,
    payment_verification: X402VerificationResult = Depends(recovery_payment_guard),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Fetch default active merchant and safety rules
    m_res = await db.execute(select(Merchant).where(Merchant.is_active == True))
    merchant = m_res.scalars().first()
    merchant_id = merchant.id if merchant else uuid.uuid4()
    merchant_rule = await get_or_create_merchant_rule(merchant_id, db)

    # 2. Diagnostic Summary Formulation based on Failure Source & Code
    src_lower = req.failure_source.lower()
    code_upper = req.failure_code.upper()

    if "bank" in src_lower or "timeout" in code_upper or "otp" in code_upper:
        diagnostic_summary = (
            f"Bank authentication timed out during verification ({req.failure_code}). "
            f"Account was not debited. Cart of {req.currency} {req.cart_amount} preserved for safe retry."
        )
        strategy_type = "PRESERVE_CART_AND_RETRY"
        recommended_action = "RETRY_SAME_PAYMENT_METHOD"
    elif "network" in src_lower or "gateway" in src_lower or "500" in code_upper:
        diagnostic_summary = (
            f"Network interruption between merchant and payment gateway ({req.failure_code}). "
            f"Funds remain intact. Cart of {req.currency} {req.cart_amount} held for retry."
        )
        strategy_type = "SWITCH_PAYMENT_METHOD"
        recommended_action = "RETRY_WITH_FALLBACK_METHOD"
    elif "insufficient" in code_upper or "limit" in code_upper:
        diagnostic_summary = (
            f"Payment was declined due to card limits or balance constraints ({req.failure_code}). "
            f"Cart of {req.currency} {req.cart_amount} preserved."
        )
        strategy_type = "SWITCH_PAYMENT_METHOD"
        recommended_action = "PROPOSE_UPI_OR_NETBANKING"
    else:
        diagnostic_summary = (
            f"Checkout interrupted ({req.failure_description or req.failure_code}). "
            f"Cart of {req.currency} {req.cart_amount} preserved for instant customer recovery."
        )
        strategy_type = "PRESERVE_CART_AND_RETRY"
        recommended_action = "SEND_EXPIRY_RECOVERY_LINK"

    # 3. Policy & Guardrail Bounds Evaluation
    requires_approval = False
    risk_level = RiskLevel.LOW.value
    incentive_allowed = False
    incentive_amount = Decimal("0.00")

    # High-value transaction policy check
    if req.cart_amount >= merchant_rule.require_approval_above_amount:
        requires_approval = True
        risk_level = RiskLevel.MEDIUM.value
        policy_explanation = (
            f"Cart amount ({req.currency} {req.cart_amount}) exceeds merchant high-value threshold "
            f"({req.currency} {merchant_rule.require_approval_above_amount}). Manual approval required for incentives."
        )
    else:
        # Safe automatic recovery incentive check
        custom_rules = merchant_rule.custom_rules or {}
        if custom_rules.get("recovery_enabled", True):
            incentive_allowed = True
            # Propose incentive up to merchant configured cap (default ₹100) or 5% of cart
            candidate_incentive = min(
                merchant_rule.auto_recovery_incentive_max,
                (req.cart_amount * Decimal("0.05")).quantize(Decimal("1.00")),
            )
            incentive_amount = candidate_incentive if candidate_incentive > Decimal("0") else Decimal("0.00")
            policy_explanation = (
                f"Recovery within automatic merchant threshold. "
                f"Auto-incentive of {req.currency} {incentive_amount} permissible under safety rules."
            )
        else:
            policy_explanation = "Recovery incentives are disabled in merchant safety settings."

    return AgentRecoveryResponse(
        status="success",
        failure_code=req.failure_code,
        failure_source=req.failure_source,
        diagnostic_summary=diagnostic_summary,
        strategy_type=strategy_type,
        recommended_action=recommended_action,
        risk_level=risk_level,
        incentive_allowed=incentive_allowed,
        incentive_amount=incentive_amount,
        requires_approval=requires_approval,
        policy_explanation=policy_explanation,
        financial_delta=req.cart_amount,
        metadata={
            "provider": "REVORA Autonomous Revenue Recovery Engine",
            "x402_settlement_mode": payment_verification.mode,
            "merchant_approval_threshold": str(merchant_rule.require_approval_above_amount),
            "safe_retry_eligible": True,
        },
    )
