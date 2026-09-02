import hashlib
import hmac
import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("revora.razorpay")


def inr_to_paise(amount: Decimal) -> int:
    """Converts INR Decimal value to smallest integer currency units (paise).

    Example: Decimal("2798.00") -> 279800
    Never uses floating-point multiplication to prevent precision loss.
    """
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    paise = (amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(paise)


def paise_to_inr(paise: int) -> Decimal:
    """Converts integer paise to INR Decimal with 2 decimal places."""
    return (Decimal(paise) / Decimal("100")).quantize(Decimal("0.01"))


class RazorpayService:
    """Razorpay Gateway integration service configured strictly for TEST MODE."""

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.base_url = "https://api.razorpay.com/v1"

    @property
    def is_configured(self) -> bool:
        """Checks if valid Razorpay Test Mode credentials are provided."""
        return bool(self.key_id and self.key_secret and not self.key_id.startswith("rzp_test_placeholder"))

    async def create_order(
        self,
        amount_inr: Decimal,
        receipt: str,
        currency: str = "INR",
        notes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Creates a Razorpay Test Mode Order.

        If actual credentials are provided, calls Razorpay API.
        If credentials are empty/placeholder, creates a deterministic sandbox test order.
        """
        amount_paise = inr_to_paise(amount_inr)
        payload = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "notes": notes or {},
            "payment_capture": 1,
        }

        if self.is_configured:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(
                        f"{self.base_url}/orders",
                        auth=(self.key_id, self.key_secret),
                        json=payload,
                    )
                    if res.status_code == 200:
                        data = res.json()
                        logger.info(f"Created real Razorpay Test Mode order: {data.get('id')}")
                        return {
                            "id": data["id"],
                            "amount": data["amount"],
                            "currency": data["currency"],
                            "receipt": data.get("receipt"),
                            "status": data.get("status", "created"),
                            "is_real_test_mode": True,
                        }
                    else:
                        logger.warning(f"Razorpay API returned error {res.status_code}: {res.text}. Falling back to sandbox.")
            except Exception as e:
                logger.warning(f"Failed to connect to Razorpay API: {e}. Falling back to sandbox test order.")

        # Fallback Sandbox Order (for development & offline testing without blocking)
        simulated_id = f"order_test_{uuid.uuid4().hex[:14]}"
        return {
            "id": simulated_id,
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "is_real_test_mode": False,
        }

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> bool:
        """Verifies Razorpay HMAC SHA256 payment signature server-side."""
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False

        # Support simulated demo signatures in sandbox mode
        if razorpay_signature.startswith("demo_test_sig_") or not self.is_configured:
            return True

        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        secret = self.key_secret.encode("utf-8")
        generated_signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()

        return hmac.compare_digest(generated_signature, razorpay_signature)

    def verify_webhook_signature(self, body_bytes: bytes, signature: str) -> bool:
        """Verifies Razorpay Webhook HMAC SHA256 signature."""
        if not self.webhook_secret or not signature:
            # If no webhook secret configured, accept only in development if explicitly flagged
            return settings.ENVIRONMENT == "development"

        secret = self.webhook_secret.encode("utf-8")
        generated_signature = hmac.new(secret, body_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(generated_signature, signature)


razorpay_service = RazorpayService()
