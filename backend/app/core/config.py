from typing import List
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Revora AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "revora_hackathon_super_secure_jwt_secret_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database: Supabase PostgreSQL (or fallback for testing)
    DATABASE_URL: str = "sqlite+aiosqlite:///./revora_dev.db"

    # AI Provider
    AI_PROVIDER: str = "gemini"  # Pluggable: gemini, openai, mock
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"

    # Razorpay Test Mode
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Merchant Safety Policy Defaults
    DEFAULT_MAX_DISCOUNT_PERCENTAGE: float = 10.0
    DEFAULT_MAX_DISCOUNT_AMOUNT: float = 300.0
    DEFAULT_MAX_BUNDLE_DISCOUNT_PCT: float = 15.0
    DEFAULT_AUTO_RECOVERY_INCENTIVE_MAX: float = 100.0
    DEFAULT_REQUIRE_APPROVAL_ABOVE_AMOUNT: float = 5000.0

    # PayForAPI x402 v2 Settings (Base USDC)
    X402_ENABLED: bool = True
    X402_NETWORK: str = "base"
    X402_USDC_ASSET: str = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"  # Canonical Base USDC
    X402_PAY_TO: str = "0x0000000000000000000000000000000000000000"  # Safe placeholder recipient
    X402_RECOMMENDATIONS_PRICE_ATOMIC: str = "10000"  # 0.01 USDC (6 decimals)
    X402_RECOVERY_PRICE_ATOMIC: str = "20000"  # 0.02 USDC (6 decimals)
    X402_MAX_TIMEOUT_SECONDS: int = 60
    X402_FACILITATOR_URL: str = ""
    X402_MODE: str = "development"  # development | production | test

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
