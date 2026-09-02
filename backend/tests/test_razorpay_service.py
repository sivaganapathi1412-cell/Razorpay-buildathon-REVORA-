from decimal import Decimal
import pytest
from app.services.razorpay_service import inr_to_paise, paise_to_inr, razorpay_service


def test_inr_to_paise_conversion_exactness():
    """Validates that monetary conversions to paise are 100% exact without float inaccuracies."""
    assert inr_to_paise(Decimal("2798.00")) == 279800
    assert inr_to_paise(Decimal("2499.00")) == 249900
    assert inr_to_paise(Decimal("299.00")) == 29900
    assert inr_to_paise(Decimal("299.50")) == 29950
    assert inr_to_paise(Decimal("0.00")) == 0
    assert inr_to_paise(Decimal("0.99")) == 99


def test_paise_to_inr_conversion():
    """Validates that integer paise converts back to exact 2-decimal place INR."""
    assert paise_to_inr(279800) == Decimal("2798.00")
    assert paise_to_inr(249900) == Decimal("2499.00")
    assert paise_to_inr(29900) == Decimal("299.00")
    assert paise_to_inr(99) == Decimal("0.99")
    assert paise_to_inr(0) == Decimal("0.00")


@pytest.mark.asyncio
async def test_razorpay_order_creation_sandbox_fallback():
    """Tests that Razorpay order creation produces valid test order attributes."""
    order_data = await razorpay_service.create_order(
        amount_inr=Decimal("2798.00"),
        receipt="REV-TEST-001",
        currency="INR",
    )
    assert order_data["amount"] == 279800
    assert order_data["currency"] == "INR"
    assert order_data["status"] == "created"
    assert order_data["id"].startswith("order_")


def test_razorpay_signature_verification_logic():
    """Tests signature verification for valid and invalid signatures."""
    # Demo sandbox signatures starting with demo_test_sig_ are verified
    assert razorpay_service.verify_payment_signature(
        razorpay_order_id="order_test_12345",
        razorpay_payment_id="pay_test_12345",
        razorpay_signature="demo_test_sig_valid_hash",
    ) is True

    # Empty signatures are rejected
    assert razorpay_service.verify_payment_signature(
        razorpay_order_id="order_test_12345",
        razorpay_payment_id="pay_test_12345",
        razorpay_signature="",
    ) is False
