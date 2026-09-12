# REVORA AI — PayForAPI & x402 v2 Integration Guide

## 1. Overview & Architecture

REVORA AI exposes its **Growth Engine** (Intent Discovery & Safe Bundles) and **Recovery Engine** (Interruption Diagnosis & Strategy Formulator) as autonomous, monetized API services compliant with the **x402 v2 HTTP specification** for listing on **PayForAPI**.

External AI agents pay per call in **USDC on the Base network (EVM Chain ID 8453)**.

### Architectural Separation
```
                      ┌────────────────────────────────────────────────────────┐
                      │                 REVORA AI FASTAPI SERVER               │
                      └────────────────────────────────────────────────────────┘
                                                   │
                       ┌───────────────────────────┴───────────────────────────┐
                       ▼                                                       ▼
      CUSTOMER STOREFRONT & DASHBOARD (FIAT / INR)           PAYFORAPI AGENT SURFACE (USDC ON BASE)
      ────────────────────────────────────────────           ──────────────────────────────────────
      • Routes: /catalog, /cart, /checkout, /payments        • Routes: /api/v1/agent/*
      • Settlement: Razorpay Test/Live Gateway               • Settlement: x402 v2 HTTP Protocol
      • Currency: INR (₹)                                    • Currency: USDC (Atomic units, 6 decimals)
      • Auth: Session Cookies & JWT                          • Auth: PAYMENT-SIGNATURE Header
      • Direct End Customers & Merchants                     • Autonomous AI Agents & Developers
```

> [!IMPORTANT]
> **Separation of Concerns:**
> The existing customer storefront, shopping cart, customer accounts, Razorpay INR payment flow, merchant dashboard, and attribution analytics are completely separate from the x402 agent API surface. Enabling or calling `/api/v1/agent/*` has **zero impact** on customer checkout or Razorpay webhooks.

---

## 2. The x402 v2 HTTP Flow

REVORA AI implements the standard two-step x402 v2 handshake:

```
Client Agent                                               REVORA AI Server
     │                                                            │
     │ 1. POST /api/v1/agent/recommendations (unpaid)            │
     ├───────────────────────────────────────────────────────────►│
     │                                                            │
     │ 2. HTTP 402 Payment Required                              │
     │    Header: PAYMENT-REQUIRED: <Base64-encoded JSON>         │
     │◄───────────────────────────────────────────────────────────┤
     │                                                            │
     │ 3. Decode header, sign/settle micropayment on Base         │
     │                                                            │
     │ 4. POST /api/v1/agent/recommendations                     │
     │    Header: PAYMENT-SIGNATURE: <PaymentPayload>             │
     ├───────────────────────────────────────────────────────────►│
     │                                                            │
     │ 5. Verify payment via X402PaymentVerifier                  │
     │ 6. HTTP 200 OK                                             │
     │    Header: PAYMENT-RESPONSE: <Base64-encoded Receipt>      │
     │    Body: { status: "success", recommendations: [...] }     │
     │◄───────────────────────────────────────────────────────────┤
```

### Protocol Headers
- **`PAYMENT-REQUIRED`**: Sent by the server with HTTP status 402. Contains a Base64-encoded UTF-8 string of the x402 v2 `PaymentRequired` JSON object.
- **`PAYMENT-SIGNATURE`**: Sent by the client agent in the retry request. Contains the signature proof or facilitator payment token.
- **`PAYMENT-RESPONSE`**: Returned by the server on HTTP 200 with the payment receipt/settlement acknowledgment.

---

## 3. Endpoints

### A. Machine-Readable Manifest (Public / Unpaid)
- **Route:** `GET /api/v1/agent/manifest`
- **Pricing:** Free (No payment required)
- **Description:** Returns service capabilities, endpoint paths, schemas, accepted networks, and pricing.

#### Example Request:
```bash
curl -X GET http://localhost:8000/api/v1/agent/manifest
```

#### Example Response:
```json
{
  "service_name": "REVORA AI",
  "version": "1.0.0",
  "x402_version": 2,
  "network": "base",
  "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "asset_symbol": "USDC",
  "pay_to": "0x0000000000000000000000000000000000000000",
  "description": "Autonomous AI Commerce Engine: Intent-based product discovery, margin-safe cross-sells, and payment failure recovery strategies.",
  "documentation_url": "/PAYFORAPI_X402.md",
  "endpoints": [
    {
      "path": "/api/v1/agent/recommendations",
      "method": "POST",
      "summary": "AI Product Recommendations & Safe Bundles",
      "pricing": {
        "scheme": "exact",
        "amountAtomic": "10000",
        "humanPrice": "$0.01 USDC",
        "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "network": "base"
      }
    },
    {
      "path": "/api/v1/agent/recovery-strategy",
      "method": "POST",
      "summary": "AI Revenue Recovery Strategy Formulator",
      "pricing": {
        "scheme": "exact",
        "amountAtomic": "20000",
        "humanPrice": "$0.02 USDC",
        "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "network": "base"
      }
    }
  ]
}
```

---

### B. Product Recommendations & Growth Discovery (x402 Paid)
- **Route:** `POST /api/v1/agent/recommendations`
- **Pricing:** `10000` atomic units ($0.01 USDC on Base)

#### Step 1: Unpaid Request
```bash
curl -i -X POST http://localhost:8000/api/v1/agent/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "query": "running shoes under 3000",
    "category": "Footwear",
    "budget_max": 3000.00
  }'
```

#### Server 402 Challenge Response:
```http
HTTP/1.1 402 Payment Required
content-type: application/json
payment-required: eyJ4NDAyVmVyc2lvbiI6Miw... (Base64 PaymentRequired JSON)
access-control-expose-headers: PAYMENT-REQUIRED, PAYMENT-RESPONSE

{
  "status": "payment_required",
  "error_code": "PAYMENT_REQUIRED",
  "message": "x402 v2 payment required. Settle in USDC on Base to access this API.",
  "x402": {
    "x402Version": 2,
    "error": "Payment Required",
    "resource": {
      "url": "http://localhost:8000/api/v1/agent/recommendations",
      "description": "REVORA AI Product Recommendations & Growth Discovery API",
      "mimeType": "application/json",
      "serviceName": "REVORA AI",
      "tags": ["recommendations", "ecommerce", "growth"]
    },
    "accepts": [
      {
        "scheme": "exact",
        "network": "base",
        "amount": "10000",
        "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "payTo": "0x0000000000000000000000000000000000000000",
        "maxTimeoutSeconds": 60,
        "extra": {
          "name": "USDC",
          "version": "2"
        }
      }
    ],
    "extensions": {}
  },
  "manifest_url": "/api/v1/agent/manifest"
}
```

#### Step 2: Paid Request (with PAYMENT-SIGNATURE)
```bash
curl -i -X POST http://localhost:8000/api/v1/agent/recommendations \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: x402_dev_sig_example_token_123" \
  -d '{
    "query": "running shoes under 3000",
    "category": "Footwear",
    "budget_max": 3000.00
  }'
```

#### Server 200 Success Response:
```http
HTTP/1.1 200 OK
content-type: application/json
payment-response: eyJzdGF0dXMiOi... (Base64 Receipt)

{
  "status": "success",
  "query": "running shoes under 3000",
  "detected_intent": "FOOTWEAR_DISCOVERY",
  "recommended_products": [
    {
      "id": "c7a8b139-4d64-4e2b-9273-05b1b46328a9",
      "sku": "REV-SHOE-01",
      "name": "Velocity Nitro Running Shoes",
      "price": "2499.00",
      "currency": "INR",
      "category": "Footwear & Running",
      "image_url": "https://example.com/shoe.jpg",
      "stock_available": 50,
      "explanation": "Within ₹3000.00 constraint; top-rated product in Footwear & Running."
    }
  ],
  "growth_suggestions": [
    {
      "type": "CROSS_SELL",
      "title": "Frequently Paired Athletic Gear",
      "recommended_product": {
        "id": "e982c7d1-5120-410c-bb23-f32db5177a42",
        "sku": "REV-SOCK-01",
        "name": "Sports Cushion Socks",
        "price": "299.00",
        "currency": "INR",
        "category": "Accessories & Gear",
        "image_url": "https://example.com/sock.jpg",
        "stock_available": 100,
        "explanation": "High-affinity pairing with Velocity Nitro Running Shoes."
      },
      "discount_pct_proposed": "0.00",
      "potential_incremental_revenue": "299.00",
      "explanation": "Pair with Sports Cushion Socks (₹299.00) to boost performance.",
      "policy_result": "PASSED"
    }
  ],
  "safety_policy_decision": {
    "allowed": true,
    "policy_result": "PASSED",
    "policy_name": "MERCHANT_POLICY_PASSED"
  },
  "metadata": {
    "provider": "REVORA Autonomous Commerce Engine",
    "x402_settlement_mode": "development",
    "currency": "INR"
  }
}
```

---

### C. Revenue Recovery Strategy Formulator (x402 Paid, Decoupled)
- **Route:** `POST /api/v1/agent/recovery-strategy`
- **Pricing:** `20000` atomic units ($0.02 USDC on Base)
- **Key Feature:** Does **NOT** require an existing REVORA database order ID. Accepts external failure diagnostic signals and formulates an actionable recovery strategy with merchant guardrails.

#### Paid Request Example:
```bash
curl -X POST http://localhost:8000/api/v1/agent/recovery-strategy \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: x402_dev_sig_example_token_123" \
  -d '{
    "failure_code": "BANK_AUTH_TIMEOUT",
    "failure_source": "bank",
    "failure_description": "Customer 3DS OTP expired",
    "cart_amount": 2499.00,
    "currency": "INR"
  }'
```

#### Response Example:
```json
{
  "status": "success",
  "failure_code": "BANK_AUTH_TIMEOUT",
  "failure_source": "bank",
  "diagnostic_summary": "Bank authentication timed out during verification (BANK_AUTH_TIMEOUT). Account was not debited. Cart of INR 2499.00 preserved for safe retry.",
  "strategy_type": "PRESERVE_CART_AND_RETRY",
  "recommended_action": "RETRY_SAME_PAYMENT_METHOD",
  "risk_level": "LOW",
  "incentive_allowed": true,
  "incentive_amount": "100.00",
  "requires_approval": false,
  "policy_explanation": "Recovery within automatic merchant threshold. Auto-incentive of INR 100.00 permissible under safety rules.",
  "financial_delta": "2499.00",
  "metadata": {
    "provider": "REVORA Autonomous Revenue Recovery Engine",
    "x402_settlement_mode": "development",
    "merchant_approval_threshold": "5000.00",
    "safe_retry_eligible": true
  }
}
```

---

## 4. Environment Variables Reference

| Variable | Type | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `X402_ENABLED` | bool | `true` | Enable or disable x402 payment enforcement on `/api/v1/agent/*`. |
| `X402_NETWORK` | str | `base` | Target settlement network (`base`, `base-sepolia`). |
| `X402_USDC_ASSET` | str | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | USDC smart contract address on Base. |
| `X402_PAY_TO` | str | `0x0000000000000000000000000000000000000000` | Recipient EVM wallet address for receiving agent micropayments. |
| `X402_RECOMMENDATIONS_PRICE_ATOMIC` | str | `10000` | Atomic USDC price for recommendations ($0.01 = 10,000 atomic units). |
| `X402_RECOVERY_PRICE_ATOMIC` | str | `20000` | Atomic USDC price for recovery strategy ($0.02 = 20,000 atomic units). |
| `X402_MAX_TIMEOUT_SECONDS` | int | `60` | Maximum validity window for payment signature. |
| `X402_FACILITATOR_URL` | str | `""` | Optional external facilitator endpoint (e.g. PayForAPI facilitator). |
| `X402_MODE` | str | `development` | Operating mode: `development`, `test`, or `production`. |

---

## 5. Development vs. Production Reality

### What Is Currently Functional (Development Ready)
1. **Full x402 v2 Protocol Lifecycle:** HTTP 402 challenge generation, Base64 `PAYMENT-REQUIRED` encoding/decoding, `PAYMENT-SIGNATURE` parsing, and `PAYMENT-RESPONSE` receipt headers.
2. **Machine-Readable Manifest:** `GET /api/v1/agent/manifest` dynamically reflects server settings.
3. **Decoupled Growth & Recovery Logic:** Endpoints return clean machine-readable JSON bounded by the server-authoritative `SafetyEngine`.
4. **Development Verifier (`DevelopmentX402Verifier`):**
   - Strictly labels all actions as `development` or `test`.
   - **Never** claims that real on-chain settlement occurred (`is_settled=False`).
   - Automatically disabled if `X402_MODE=production`.

### What Remains for Production Base USDC Settlement
1. **Merchant Receiving Wallet:** Replace `X402_PAY_TO` with the merchant's real Base EVM wallet address.
2. **On-Chain Settlement Verifier or Facilitator:**
   - Either configure `X402_FACILITATOR_URL` with a PayForAPI settlement facilitator, or
   - Implement direct on-chain RPC verification (verifying transfer events / EIP-3009 transferWithAuthorization receipts on Base mainnet).
3. **Switch Mode:** Set `X402_MODE=production` once real wallet and facilitator are configured.
