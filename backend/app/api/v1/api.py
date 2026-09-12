from fastapi import APIRouter
from app.api.v1.endpoints import (
    agent,
    ai_shopping,
    analytics,
    approvals,
    audit,
    auth,
    cart,
    catalog,
    checkout,
    customer_auth,
    health,
    merchant,
    payments,
    recovery,
    safety,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(agent.router, prefix="/agent", tags=["External Agent API (x402 v2)"])
api_router.include_router(auth.router, prefix="/auth", tags=["Merchant Authentication"])
api_router.include_router(customer_auth.router, prefix="/customer/auth", tags=["Customer Authentication"])
api_router.include_router(customer_auth.router, prefix="/customer", tags=["Customer Account & Orders"])
api_router.include_router(merchant.router, prefix="/merchant", tags=["Merchant Profile & Operations"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["Product Catalog"])
api_router.include_router(catalog.router, tags=["Product Catalog Direct"])
api_router.include_router(cart.router, prefix="/cart", tags=["Shopping Cart"])
api_router.include_router(ai_shopping.router, prefix="/ai", tags=["AI Shopping & Growth"])
api_router.include_router(ai_shopping.router, prefix="/ai-shopping", tags=["AI Shopping & Growth"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["Checkout Lifecycle"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payment Verification"])
api_router.include_router(recovery.router, prefix="/recovery", tags=["AI Revenue Recovery Engine"])
api_router.include_router(safety.router, prefix="/safety", tags=["Safety Engine & Guardrails"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Human-in-the-Loop Approvals"])
api_router.include_router(audit.router, prefix="/audit", tags=["Immutable Audit Trail"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Revenue & Growth Analytics"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Razorpay Webhooks"])
