import re
import uuid
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_merchant, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.enums import AuditCategory, AuditSeverity, EventProvenance
from app.core.security import create_access_token, hash_password, verify_password
from app.models import AuditLog, Merchant, MerchantRule, User
from app.schemas.auth import (
    AuthMeResponse,
    AuthTokenResponse,
    MerchantSummary,
    UserLoginRequest,
    UserRegisterRequest,
    UserSummary,
)

router = APIRouter()


def slugify(text: str) -> str:
    """Generates a clean URL-safe slug from text."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    return slug.strip("-") or "store"


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Merchant & Primary Owner",
    description="Atomically provisions a new merchant tenant, owner user account, and default safety rules."
)
async def register(
    req: UserRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Check if email already registered
    existing_user = await db.execute(select(User).where(User.email == req.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Derive unique slug
    base_slug = slugify(req.store_slug or req.store_name)
    unique_slug = base_slug
    counter = 1
    while True:
        existing_merchant = await db.execute(select(Merchant).where(Merchant.slug == unique_slug))
        if not existing_merchant.scalar_one_or_none():
            break
        unique_slug = f"{base_slug}-{counter}"
        counter += 1

    # 3. Create Merchant
    merchant = Merchant(
        name=req.store_name,
        slug=unique_slug,
        currency=req.currency,
        country="India",
        business_category=req.business_category,
        is_active=True,
        settings={"theme": "dark"},
    )
    db.add(merchant)
    await db.flush()

    # 4. Create Owner User
    hashed_pwd = hash_password(req.password)
    user = User(
        merchant_id=merchant.id,
        email=req.email,
        hashed_password=hashed_pwd,
        full_name=req.full_name,
        role="OWNER",
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # 5. Create Default Deterministic Merchant Safety Rules
    default_rules = MerchantRule(
        merchant_id=merchant.id,
        rule_name="DEFAULT_MERCHANT_POLICY",
        max_discount_percentage=Decimal(str(settings.DEFAULT_MAX_DISCOUNT_PERCENTAGE)),
        max_discount_amount=Decimal(str(settings.DEFAULT_MAX_DISCOUNT_AMOUNT)),
        max_bundle_discount_pct=Decimal(str(settings.DEFAULT_MAX_BUNDLE_DISCOUNT_PCT)),
        auto_recovery_incentive_max=Decimal(str(settings.DEFAULT_AUTO_RECOVERY_INCENTIVE_MAX)),
        require_approval_above_amount=Decimal(str(settings.DEFAULT_REQUIRE_APPROVAL_ABOVE_AMOUNT)),
        is_active=True,
        custom_rules={"allow_bundle_override": False},
    )
    db.add(default_rules)

    # 6. Audit Log for Registration
    audit = AuditLog(
        trace_id=str(uuid.uuid4()),
        merchant_id=merchant.id,
        agent_source="AUTH_SERVICE",
        event_category=AuditCategory.SYSTEM_EVENT,
        event_type="MERCHANT_REGISTERED",
        summary=f"Merchant '{merchant.name}' registered with owner '{user.email}'.",
        financial_delta=Decimal("0.00"),
        provenance=EventProvenance.MERCHANT,
        severity=AuditSeverity.INFO,
        metadata_json={"slug": merchant.slug, "owner_id": str(user.id)},
    )
    db.add(audit)
    await db.commit()

    # 7. Issue JWT
    token = create_access_token(
        subject=user.id,
        merchant_id=merchant.id,
        role=user.role,
    )

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="revora_token",
        value=token,
        httponly=True,
        secure=False,  # Allow localhost development
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserSummary.model_validate(user),
        merchant=MerchantSummary.model_validate(merchant),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Merchant Login",
    description="Authenticates merchant user credentials and returns a signed JWT access token."
)
async def login(
    req: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. Query user
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    # 2. Query merchant
    merchant_res = await db.execute(select(Merchant).where(Merchant.id == user.merchant_id))
    merchant = merchant_res.scalar_one_or_none()

    if not merchant or not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant store is deactivated.",
        )

    # 3. Create access token
    token = create_access_token(
        subject=user.id,
        merchant_id=merchant.id,
        role=user.role,
    )

    response.set_cookie(
        key="revora_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserSummary.model_validate(user),
        merchant=MerchantSummary.model_validate(merchant),
    )


@router.get(
    "/me",
    response_model=AuthMeResponse,
    summary="Get Authenticated Session Profile",
    description="Returns current authenticated merchant user and store summary."
)
async def get_me(
    current_user: User = Depends(get_current_user),
    current_merchant: Merchant = Depends(get_current_merchant),
) -> Any:
    return AuthMeResponse(
        user=UserSummary.model_validate(current_user),
        merchant=MerchantSummary.model_validate(current_merchant),
    )


@router.post(
    "/logout",
    summary="Merchant Logout",
    description="Clears the server-side authentication session cookie."
)
async def logout(response: Response) -> Any:
    response.delete_cookie(key="revora_token")
    return {"status": "success", "message": "Successfully logged out."}
