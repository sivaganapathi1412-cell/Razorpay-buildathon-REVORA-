import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import bcrypt
import jwt
from app.core.config import settings

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Generates a secure salted bcrypt hash for a plaintext password."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as e:
        logger.warning(f"Password verification failed due to error: {e}")
        return False


def create_access_token(
    subject: Union[str, Any],
    merchant_id: Optional[Union[str, Any]] = None,
    role: str = "OWNER",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Creates a signed, expiration-bounded JWT access token with user and optional merchant claims."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "revora-auth",
    }
    if merchant_id:
        payload["merchant_id"] = str(merchant_id)

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates signature, issuer, and expiration of a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token signature has expired.")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None
