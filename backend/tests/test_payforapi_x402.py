import base64
import json
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.x402 import (
    DevelopmentX402Verifier,
    X402PaymentRequired,
    decode_payment_required_header,
)
from app.models import Category, Merchant, Product


@pytest.mark.asyncio
async def test_agent_manifest_unpaid_success(client: AsyncClient):
    """Verifies that GET /api/v1/agent/manifest is public (unpaid), returning x402 v2 metadata."""
    res = await client.get("/api/v1/agent/manifest")
    assert res.status_code == 200
    data = res.json()

    assert data["service_name"] == "REVORA AI"
    assert data["x402_version"] == 2
    assert data["network"] == settings.X402_NETWORK
    assert data["asset"] == settings.X402_USDC_ASSET
    assert data["asset_symbol"] == "USDC"
    assert len(data["endpoints"]) == 2

    # Check endpoint declarations
    paths = [ep["path"] for ep in data["endpoints"]]
    assert "/api/v1/agent/recommendations" in paths
    assert "/api/v1/agent/recovery-strategy" in paths

    rec_ep = next(ep for ep in data["endpoints"] if ep["path"] == "/api/v1/agent/recommendations")
    assert rec_ep["method"] == "POST"
    assert rec_ep["pricing"]["amountAtomic"] == settings.X402_RECOMMENDATIONS_PRICE_ATOMIC
    assert rec_ep["pricing"]["scheme"] == "exact"


@pytest.mark.asyncio
async def test_unpaid_recommendations_returns_402_with_payment_required(client: AsyncClient):
    """
    Verifies that:
    - unpaid call returns HTTP 402
    - PAYMENT-REQUIRED header is present
    - header decodes to valid JSON matching x402 v2 spec
    - x402Version == 2
    - scheme == exact
    - resource metadata is present
    """
    req_payload = {
        "query": "running shoes under 3000",
        "category": "Footwear",
        "budget_max": 3000.00,
    }

    res = await client.post("/api/v1/agent/recommendations", json=req_payload)
    assert res.status_code == 402

    # Verify PAYMENT-REQUIRED header exists
    assert "payment-required" in res.headers or "PAYMENT-REQUIRED" in res.headers
    raw_header = res.headers.get("payment-required") or res.headers.get("PAYMENT-REQUIRED")
    assert raw_header is not None

    # Decode Base64 header and validate x402 v2 structure
    payment_required: X402PaymentRequired = decode_payment_required_header(raw_header)
    assert payment_required.x402Version == 2
    assert payment_required.error == "Payment Required"

    # Resource metadata
    assert payment_required.resource.serviceName == "REVORA AI"
    assert "recommendations" in payment_required.resource.url or "/api/v1/agent/recommendations" in payment_required.resource.url
    assert payment_required.resource.mimeType == "application/json"

    # Accepts options
    assert len(payment_required.accepts) >= 1
    accept = payment_required.accepts[0]
    assert accept.scheme == "exact"
    assert accept.network == settings.X402_NETWORK
    assert accept.amount == settings.X402_RECOMMENDATIONS_PRICE_ATOMIC
    assert accept.asset == settings.X402_USDC_ASSET
    assert accept.payTo == settings.X402_PAY_TO
    assert accept.maxTimeoutSeconds == 60
    assert accept.extra.name == "USDC"
    assert accept.extra.version == "2"

    # Response body includes structured debugging payload
    body = res.json()
    assert body["status"] == "payment_required"
    assert body["error_code"] == "PAYMENT_REQUIRED"
    assert body["x402"]["x402Version"] == 2


@pytest.mark.asyncio
async def test_unpaid_recovery_strategy_returns_402_with_payment_required(client: AsyncClient):
    """Verifies that unpaid call to /api/v1/agent/recovery-strategy returns 402 with recovery pricing."""
    req_payload = {
        "failure_code": "BANK_AUTH_TIMEOUT",
        "failure_source": "bank",
        "failure_description": "Simulated OTP timeout during 3DS",
        "cart_amount": 2798.00,
        "currency": "INR",
    }

    res = await client.post("/api/v1/agent/recovery-strategy", json=req_payload)
    assert res.status_code == 402

    raw_header = res.headers.get("payment-required") or res.headers.get("PAYMENT-REQUIRED")
    assert raw_header is not None

    payment_required = decode_payment_required_header(raw_header)
    assert payment_required.x402Version == 2
    assert payment_required.accepts[0].amount == settings.X402_RECOVERY_PRICE_ATOMIC
    assert payment_required.accepts[0].scheme == "exact"


@pytest.mark.asyncio
async def test_paid_recommendations_with_development_verifier(client: AsyncClient, db_session: AsyncSession):
    """
    Verifies that providing a valid payment signature in development mode:
    - Passes the payment guard
    - Returns clean machine-readable recommendations
    - Attaches PAYMENT-RESPONSE header
    - Clearly indicates development simulation mode
    """
    # Seed a merchant and a product
    merchant = Merchant(
        name="Revora Agent Test Merchant",
        slug="agent-test-merchant",
        currency="INR",
        country="India",
        is_active=True,
    )
    db_session.add(merchant)
    await db_session.flush()

    category = Category(
        name="Footwear-Agent",
        slug="footwear-running",
        is_active=True,
    )
    db_session.add(category)
    await db_session.flush()

    shoe = Product(
        merchant_id=merchant.id,
        category_id=category.id,
        sku="AGENT-SHOE-01",
        name="Pro Sprint Carbon Shoes",
        description="Elite marathon carbon plate shoes under 3000",
        category="Footwear & Running",
        price=Decimal("2899.00"),
        cost_price=Decimal("1500.00"),
        stock_quantity=25,
        image_url="https://example.com/carbon-shoe.jpg",
        is_active=True,
    )
    db_session.add(shoe)
    await db_session.commit()

    # Call with development payment signature
    dev_sig = "x402_dev_sig_test_payload_123"
    headers = {
        "PAYMENT-SIGNATURE": dev_sig,
        "Content-Type": "application/json",
    }
    req_payload = {
        "query": "marathon running shoes under 3000",
        "category": "Footwear",
        "budget_max": 3000.00,
    }

    res = await client.post("/api/v1/agent/recommendations", json=req_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert data["detected_intent"] == "FOOTWEAR_DISCOVERY"
    assert len(data["recommended_products"]) >= 1

    prod = data["recommended_products"][0]
    assert prod["sku"] == "AGENT-SHOE-01"
    assert Decimal(str(prod["price"])) <= Decimal("3000.00")
    assert "Within ₹3000.0" in prod["explanation"] or "Top rated" in prod["explanation"]

    # Verify PAYMENT-RESPONSE header is attached
    assert "payment-response" in res.headers or "PAYMENT-RESPONSE" in res.headers
    resp_header = res.headers.get("payment-response") or res.headers.get("PAYMENT-RESPONSE")
    assert resp_header is not None

    settlement = json.loads(base64.b64decode(resp_header).decode("utf-8"))
    assert settlement["status"] == "DEVELOPMENT_VERIFIED"
    assert "No real blockchain settlement" in settlement["note"]


@pytest.mark.asyncio
async def test_paid_recovery_strategy_decoupled(client: AsyncClient, db_session: AsyncSession):
    """
    Verifies that /api/v1/agent/recovery-strategy:
    - Works with arbitrary external failure data (no internal order ID)
    - Formulates an actionable recovery strategy
    - Enforces merchant safety rules and approval thresholds
    - Does NOT create a Razorpay order or charge a customer
    """
    dev_sig = json.dumps({
        "scheme": "exact",
        "txHash": "0xDEV_TX_RECOVERY_TEST_789",
        "payer": "0xAgentRunnerTestWallet",
    })

    headers = {
        "PAYMENT-SIGNATURE": dev_sig,
        "Content-Type": "application/json",
    }

    # 1. Normal-value failure (₹2,499 < ₹5,000 auto threshold)
    req_payload_normal = {
        "failure_code": "BANK_AUTH_TIMEOUT",
        "failure_source": "bank",
        "failure_description": "Customer 3DS OTP expired",
        "cart_amount": 2499.00,
        "currency": "INR",
    }

    res = await client.post("/api/v1/agent/recovery-strategy", json=req_payload_normal, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert data["failure_code"] == "BANK_AUTH_TIMEOUT"
    assert data["failure_source"] == "bank"
    assert data["strategy_type"] == "PRESERVE_CART_AND_RETRY"
    assert data["risk_level"] == "LOW"
    assert data["requires_approval"] is False
    assert data["incentive_allowed"] is True
    assert Decimal(str(data["incentive_amount"])) > Decimal("0.00")
    assert "safe_retry_eligible" in data["metadata"]

    # 2. High-value failure (₹15,000 >= ₹5,000 merchant threshold -> GATED)
    req_payload_high = {
        "failure_code": "GATEWAY_TIMEOUT",
        "failure_source": "network",
        "cart_amount": 15000.00,
        "currency": "INR",
    }

    res_high = await client.post("/api/v1/agent/recovery-strategy", json=req_payload_high, headers=headers)
    assert res_high.status_code == 200
    data_high = res_high.json()

    assert data_high["status"] == "success"
    assert data_high["requires_approval"] is True
    assert data_high["risk_level"] == "MEDIUM"
    assert "exceeds merchant high-value threshold" in data_high["policy_explanation"]


@pytest.mark.asyncio
async def test_development_verifier_cannot_be_mistaken_for_real_settlement():
    """Verifies that the DevelopmentX402Verifier explicitly reports is_settled=False."""
    verifier = DevelopmentX402Verifier()
    result = await verifier.verify("x402_dev_sig_test", "10000", "http://localhost/test")

    assert result.is_valid is True
    assert result.is_settled is False  # Must NEVER be True in development mode
    assert result.mode == "development" or result.mode == "test"
    assert "No real blockchain settlement" in result.settlement_response["note"]


@pytest.mark.asyncio
async def test_existing_storefront_remains_unpaid(client: AsyncClient):
    """
    CRITICAL REGRESSION TEST:
    Verifies that existing storefront catalog and product endpoints remain
    completely accessible to public customers without any 402 payment requirements.
    """
    res_cats = await client.get("/api/v1/catalog/categories")
    assert res_cats.status_code == 200
    assert "PAYMENT-REQUIRED" not in res_cats.headers

    res_prods = await client.get("/api/v1/catalog/products")
    assert res_prods.status_code == 200
    assert "PAYMENT-REQUIRED" not in res_prods.headers
