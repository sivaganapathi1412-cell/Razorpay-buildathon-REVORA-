import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# Product Recommendation & Growth Schemas
# ============================================================================

class AgentRecommendationRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search or requirement query")
    category: Optional[str] = Field(None, description="Optional category filter (e.g. Footwear, Apparel)")
    budget_max: Optional[Decimal] = Field(None, ge=0, description="Optional upper price limit in merchant currency")
    cart_context: Optional[List[str]] = Field(default_factory=list, description="List of product IDs or SKUs currently in customer cart")


class AgentProductItem(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    price: Decimal
    currency: str = "INR"
    category: str
    image_url: Optional[str] = None
    stock_available: int
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class AgentGrowthSuggestion(BaseModel):
    type: str = Field(..., description="Action type: CROSS_SELL, BUNDLE, UPSELL")
    title: str
    recommended_product: AgentProductItem
    discount_pct_proposed: Decimal = Field(Decimal("0.00"), description="Discount percentage proposed")
    potential_incremental_revenue: Decimal
    explanation: str
    policy_result: str = Field("PASSED", description="Safety policy result: PASSED, GATED, REJECTED")


class AgentRecommendationResponse(BaseModel):
    status: str = "success"
    query: str
    detected_intent: str
    recommended_products: List[AgentProductItem]
    growth_suggestions: List[AgentGrowthSuggestion] = Field(default_factory=list)
    safety_policy_decision: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# Revenue Recovery Strategy Schemas
# ============================================================================

class AgentRecoveryRequest(BaseModel):
    failure_code: str = Field(..., min_length=1, description="Standard payment/checkout interruption code")
    failure_source: str = Field(..., min_length=1, description="Interruption origin: bank, network, user, gateway")
    failure_description: Optional[str] = Field(None, description="Detailed failure message or reason")
    cart_amount: Decimal = Field(..., ge=0, description="Interrupted cart total value")
    currency: str = Field("INR", description="Transaction currency code")


class AgentRecoveryResponse(BaseModel):
    status: str = "success"
    failure_code: str
    failure_source: str
    diagnostic_summary: str
    strategy_type: str = Field(..., description="Calculated recovery strategy: PRESERVE_CART_AND_RETRY, SWITCH_PAYMENT_METHOD, etc.")
    recommended_action: str
    risk_level: str = Field(..., description="Risk assessment: LOW, MEDIUM, HIGH")
    incentive_allowed: bool
    incentive_amount: Decimal = Field(Decimal("0.00"), description="Safe incentive amount allowed under policy")
    requires_approval: bool
    policy_explanation: str
    financial_delta: Decimal
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# Machine-Readable Manifest Schemas
# ============================================================================

class AgentManifestPricing(BaseModel):
    scheme: str = "exact"
    amountAtomic: str
    humanPrice: str
    asset: str
    assetSymbol: str = "USDC"
    network: str


class AgentManifestEndpoint(BaseModel):
    path: str
    method: str
    summary: str
    description: str
    pricing: AgentManifestPricing
    request_schema: Dict[str, Any]
    response_schema: Dict[str, Any]


class AgentManifestResponse(BaseModel):
    service_name: str = "REVORA AI"
    version: str = "1.0.0"
    x402_version: int = 2
    network: str
    asset: str
    asset_symbol: str = "USDC"
    pay_to: str
    description: str
    documentation_url: str
    endpoints: List[AgentManifestEndpoint]
