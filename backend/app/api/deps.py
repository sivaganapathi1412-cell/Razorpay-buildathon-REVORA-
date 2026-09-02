import uuid
import logging
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, Merchant, Customer

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def extract_token_from_request(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[str]:
    """Extracts merchant JWT token from either the Authorization header or HttpOnly session cookie."""
    if bearer_token:
        return bearer_token
    
    # Fallback to session cookie
    cookie_token = request.cookies.get("revora_token")
    if cookie_token:
        return cookie_token
        
    return None


def extract_customer_token_from_request(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[str]:
    """Extracts customer JWT token from Authorization header or revora_customer_token cookie."""
    if bearer_token:
        return bearer_token
    
    cookie_token = request.cookies.get("revora_customer_token")
    if cookie_token:
        return cookie_token
        
    return None


async def get_current_user(
    token: Optional[str] = Depends(extract_token_from_request),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validates JWT access token and yields the authenticated User (Merchant Owner/Admin) entity.
    
    Strictly blocks Customer accounts from accessing Merchant administration.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    # Explicit role guard: Customer accounts can NEVER authenticate as Merchant Users
    role = payload.get("role")
    if role == "CUSTOMER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer accounts cannot access Merchant Administration.",
        )

    user_id_str: Optional[str] = payload.get("sub")
    token_merchant_id_str: Optional[str] = payload.get("merchant_id")

    if not user_id_str or not token_merchant_id_str:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # Query user from DB
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"Authenticated user ID {user_id_str} not found in database.")
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    # Verify merchant tenant relation matches server record
    if str(user.merchant_id) != token_merchant_id_str:
        logger.error(f"Tenant isolation mismatch: token merchant {token_merchant_id_str} != DB merchant {user.merchant_id}")
        raise credentials_exception

    return user


async def get_current_merchant(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Merchant:
    """Yields the authenticated Merchant tenant strictly derived from the validated current user."""
    result = await db.execute(select(Merchant).where(Merchant.id == current_user.merchant_id))
    merchant = result.scalar_one_or_none()

    if not merchant or not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant store is deactivated or not found.",
        )

    return merchant


async def get_current_customer(
    token: Optional[str] = Depends(extract_customer_token_from_request),
    db: AsyncSession = Depends(get_db),
) -> Customer:
    """Validates customer JWT access token and yields the authenticated Customer entity."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Customer authentication required. Please sign in.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    customer_id_str: Optional[str] = payload.get("sub")
    role: Optional[str] = payload.get("role")

    if not customer_id_str or role != "CUSTOMER":
        raise credentials_exception

    try:
        cust_uuid = uuid.UUID(customer_id_str)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(Customer).where(Customer.id == cust_uuid))
    customer = result.scalar_one_or_none()

    if not customer or not customer.is_active:
        raise credentials_exception

    return customer

