import base64
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from fastapi import Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from app.core.config import settings

logger = logging.getLogger("revora.x402")


# ============================================================================
# x402 v2 Protocol Schemas
# ============================================================================

class X402Resource(BaseModel):
    """x402 v2 Resource metadata describing the protected service/endpoint."""
    url: str = Field(..., description="Canonical or requested endpoint URL")
    description: str = Field(..., description="Human and agent-readable description")
    mimeType: str = Field("application/json", description="Resource MIME type")
    serviceName: str = Field("REVORA AI", description="Issuing service name")
    tags: List[str] = Field(default_factory=list, description="Categorization tags")


class X402AcceptExtra(BaseModel):
    """Extra metadata for token assets under x402 v2."""
    name: str = Field("USDC", description="Token asset name")
    version: str = Field("2", description="Asset contract version / EIP-712 domain version")


class X402AcceptOption(BaseModel):
    """Acceptable payment parameters for exact micropayment settlement."""
    scheme: str = Field("exact", description="Payment scheme: exact")
    network: str = Field(..., description="Target blockchain network (e.g. base, base-sepolia)")
    amount: str = Field(..., description="Atomic token units required (e.g. 10000 = 0.01 USDC)")
    asset: str = Field(..., description="Token contract address on target network")
    payTo: str = Field(..., description="Merchant/platform receiver address")
    maxTimeoutSeconds: int = Field(60, description="Payment validity timeout in seconds")
    extra: X402AcceptExtra = Field(default_factory=X402AcceptExtra)


class X402PaymentRequired(BaseModel):
    """Standard x402 v2 PaymentRequired structure serialized into the PAYMENT-REQUIRED header."""
    x402Version: int = Field(2, description="Protocol major version")
    error: str = Field("Payment Required", description="Human-readable protocol reason")
    resource: X402Resource = Field(..., description="Protected resource metadata")
    accepts: List[X402AcceptOption] = Field(..., description="Accepted payment routes")
    extensions: Dict[str, Any] = Field(default_factory=dict, description="Custom protocol extensions")


class X402VerificationResult(BaseModel):
    """Internal result of an x402 payment signature verification."""
    is_valid: bool
    transaction_hash: Optional[str] = None
    payer_address: Optional[str] = None
    network: Optional[str] = None
    amount_atomic: Optional[str] = None
    mode: str = "development"
    is_settled: bool = False  # NEVER True for development adapter
    failure_reason: Optional[str] = None
    settlement_response: Optional[Dict[str, Any]] = None


# ============================================================================
# Verifier Abstraction Layer
# ============================================================================

class BaseX402PaymentVerifier(ABC):
    """Abstract interface for verifying x402 payment signatures."""

    @abstractmethod
    async def verify(
        self,
        signature_payload: str,
        expected_amount: str,
        resource_url: str,
    ) -> X402VerificationResult:
        """Verifies payment signature against expected amount and recipient."""
        pass


class DevelopmentX402Verifier(BaseX402PaymentVerifier):
    """
    Development/Testing Verifier.
    
    IMPORTANT:
    - Strictly labels all actions as 'development' or 'test'.
    - NEVER claims real on-chain blockchain settlement occurred.
    - Rejects mock tokens if settings.X402_MODE is set to 'production'.
    - Accepts structured test signatures (e.g. JSON or 'x402_dev_sig_*') during development.
    """

    async def verify(
        self,
        signature_payload: str,
        expected_amount: str,
        resource_url: str,
    ) -> X402VerificationResult:
        if settings.X402_MODE == "production":
            return X402VerificationResult(
                is_valid=False,
                mode="production",
                is_settled=False,
                failure_reason="Development verifier is disabled in production mode. Configure a real facilitator or node RPC.",
            )

        sig_clean = signature_payload.strip()
        if not sig_clean:
            return X402VerificationResult(
                is_valid=False,
                mode=settings.X402_MODE,
                is_settled=False,
                failure_reason="Empty payment signature payload.",
            )

        # 1. Parse JSON payload if provided (e.g., base64 or raw JSON)
        payload_data: Dict[str, Any] = {}
        try:
            if sig_clean.startswith("{") and sig_clean.endswith("}"):
                payload_data = json.loads(sig_clean)
            else:
                # Try base64 decode
                try:
                    decoded = base64.b64decode(sig_clean).decode("utf-8")
                    payload_data = json.loads(decoded)
                except Exception:
                    pass
        except Exception as e:
            logger.debug(f"Could not parse payment signature as JSON: {e}")

        # 2. Check for recognized dev tokens or structured test signatures
        is_dev_token = (
            sig_clean.startswith("x402_dev_sig_") or
            sig_clean == "dev_mock_signature" or
            payload_data.get("scheme") == "exact" or
            "txHash" in payload_data or
            "signature" in payload_data or
            "test_payer" in payload_data
        )

        if not is_dev_token:
            return X402VerificationResult(
                is_valid=False,
                mode=settings.X402_MODE,
                is_settled=False,
                failure_reason="Invalid signature format. Must be a valid x402 payment signature or dev test token.",
            )

        # Construct development verification result (explicitly stating non-settled status)
        payer = payload_data.get("payer") or payload_data.get("payer_address") or "0xDEV0000000000000000000000000000000000001"
        tx_hash = payload_data.get("txHash") or payload_data.get("transaction_hash") or "0xDEV_SIMULATED_TRANSACTION_HASH"

        return X402VerificationResult(
            is_valid=True,
            transaction_hash=tx_hash,
            payer_address=payer,
            network=settings.X402_NETWORK,
            amount_atomic=expected_amount,
            mode=settings.X402_MODE,
            is_settled=False,  # Explicitly False: development adapter does not settle real funds
            settlement_response={
                "status": "DEVELOPMENT_VERIFIED",
                "network": settings.X402_NETWORK,
                "amount": expected_amount,
                "asset": settings.X402_USDC_ASSET,
                "payer": payer,
                "note": "Payment verified via DevelopmentX402Verifier. No real blockchain settlement executed.",
            },
        )


class FacilitatorX402Verifier(BaseX402PaymentVerifier):
    """
    Production adapter stub for PayForAPI / external facilitator verification.
    When configured with a live facilitator URL, delegates signature verification and on-chain settlement.
    """

    async def verify(
        self,
        signature_payload: str,
        expected_amount: str,
        resource_url: str,
    ) -> X402VerificationResult:
        if not settings.X402_FACILITATOR_URL:
            return X402VerificationResult(
                is_valid=False,
                mode="facilitator",
                is_settled=False,
                failure_reason="X402_FACILITATOR_URL is not configured on this server.",
            )
        
        # Skeleton for live HTTP calls to facilitator
        return X402VerificationResult(
            is_valid=False,
            mode="facilitator",
            is_settled=False,
            failure_reason="Facilitator integration pending live deployment configuration.",
        )


def get_payment_verifier() -> BaseX402PaymentVerifier:
    """Factory yielding active x402 verifier based on server configuration."""
    if settings.X402_MODE == "production" and settings.X402_FACILITATOR_URL:
        return FacilitatorX402Verifier()
    return DevelopmentX402Verifier()


# ============================================================================
# Protocol Helpers & Payment Guard
# ============================================================================

def build_payment_required_obj(
    resource_url: str,
    description: str,
    amount_atomic: str,
    tags: Optional[List[str]] = None,
) -> X402PaymentRequired:
    """Builds authoritative X402PaymentRequired model with server settings."""
    return X402PaymentRequired(
        x402Version=2,
        error="Payment Required",
        resource=X402Resource(
            url=resource_url,
            description=description,
            mimeType="application/json",
            serviceName="REVORA AI",
            tags=tags or ["ecommerce", "revora", "ai"],
        ),
        accepts=[
            X402AcceptOption(
                scheme="exact",
                network=settings.X402_NETWORK,
                amount=amount_atomic,
                asset=settings.X402_USDC_ASSET,
                payTo=settings.X402_PAY_TO,
                maxTimeoutSeconds=settings.X402_MAX_TIMEOUT_SECONDS,
                extra=X402AcceptExtra(name="USDC", version="2"),
            )
        ],
        extensions={},
    )


def encode_payment_required_header(payment_req: X402PaymentRequired) -> str:
    """Encodes PaymentRequired object to standard x402 v2 Base64 UTF-8 string."""
    json_str = payment_req.model_dump_json(exclude_none=True)
    return base64.b64encode(json_str.encode("utf-8")).decode("utf-8")


def decode_payment_required_header(header_value: str) -> X402PaymentRequired:
    """Decodes PAYMENT-REQUIRED Base64 header into Pydantic model (useful for clients & tests)."""
    raw_json = base64.b64decode(header_value).decode("utf-8")
    return X402PaymentRequired.model_validate_json(raw_json)


class X402PaymentRequiredException(HTTPException):
    """Specific HTTP 402 exception bearing x402 v2 payment requirements and headers."""
    def __init__(
        self,
        payment_required_obj: X402PaymentRequired,
        encoded_header: str,
        error_code: str = "PAYMENT_REQUIRED",
        message: Optional[str] = None,
    ):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "status": "payment_required",
                "error_code": error_code,
                "message": message or "x402 v2 payment required. Settle in USDC on Base to access this API.",
                "x402": payment_required_obj.model_dump(),
                "manifest_url": "/api/v1/agent/manifest",
            },
            headers={
                "PAYMENT-REQUIRED": encoded_header,
                "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
            },
        )


class X402PaymentGuard:
    """
    Callable FastAPI dependency enforcing x402 v2 payment requirements.
    
    If PAYMENT-SIGNATURE is absent:
        Returns HTTP 402 with PAYMENT-REQUIRED Base64 header.
    If PAYMENT-SIGNATURE is present:
        Verifies payment via X402PaymentVerifier.
    """

    def __init__(self, amount_atomic: str, description: str, tags: Optional[List[str]] = None):
        self.amount_atomic = amount_atomic
        self.description = description
        self.tags = tags or ["ecommerce", "revora", "ai"]

    async def __call__(
        self,
        request: Request,
        response: Response,
        payment_signature: Optional[str] = Header(None, alias="PAYMENT-SIGNATURE"),
    ) -> X402VerificationResult:
        if not settings.X402_ENABLED:
            # Payment guard disabled by merchant/env configuration
            return X402VerificationResult(
                is_valid=True,
                mode="bypassed",
                is_settled=False,
                amount_atomic=self.amount_atomic,
            )

        resource_url = str(request.url)
        payment_required_obj = build_payment_required_obj(
            resource_url=resource_url,
            description=self.description,
            amount_atomic=self.amount_atomic,
            tags=self.tags,
        )
        encoded_header = encode_payment_required_header(payment_required_obj)

        # 1. Unpaid Request: return HTTP 402
        if not payment_signature:
            raise X402PaymentRequiredException(
                payment_required_obj=payment_required_obj,
                encoded_header=encoded_header,
            )

        # 2. Payment Signature supplied: Verify through verifier abstraction
        verifier = get_payment_verifier()
        result = await verifier.verify(
            signature_payload=payment_signature,
            expected_amount=self.amount_atomic,
            resource_url=resource_url,
        )

        if not result.is_valid:
            logger.warning(f"x402 verification rejected: {result.failure_reason}")
            raise X402PaymentRequiredException(
                payment_required_obj=payment_required_obj,
                encoded_header=encoded_header,
                error_code="INVALID_PAYMENT_SIGNATURE",
                message=f"Payment signature verification failed: {result.failure_reason}",
            )

        # 3. Valid Payment verified: Attach PAYMENT-RESPONSE header if settlement details present
        if result.settlement_response:
            encoded_settlement = base64.b64encode(
                json.dumps(result.settlement_response).encode("utf-8")
            ).decode("utf-8")
            response.headers["PAYMENT-RESPONSE"] = encoded_settlement
            response.headers["Access-Control-Expose-Headers"] = "PAYMENT-REQUIRED, PAYMENT-RESPONSE"

        return result
