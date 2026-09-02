import json
import logging
from typing import Any, Dict, Optional, Type
from pydantic import BaseModel
from app.core.config import settings
from app.services.ai_provider.base import AIProviderBase

logger = logging.getLogger(__name__)


class GeminiProvider(AIProviderBase):
    """Google Gemini implementation of the AI Provider interface."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.LLM_MODEL

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        # Note: Actual HTTP client calls to Gemini API will be utilized in Phase 4
        # For Phase 1 architecture verification, this acts as the structured provider shell.
        if not self.api_key:
            return "Gemini API key not configured. Mock provider active."
        return f"[Gemini {self.model_name} response placeholder]"

    async def extract_structured_json(
        self,
        prompt: str,
        schema_model: Type[BaseModel],
        system_instruction: Optional[str] = None,
    ) -> BaseModel:
        # Structured JSON extraction with schema compliance
        logger.info(f"Extracting structured JSON using schema: {schema_model.__name__}")
        raise NotImplementedError("Will be wired in Phase 4 with live LLM client")

    async def health_check(self) -> Dict[str, Any]:
        return {
            "provider": "google-gemini",
            "model": self.model_name,
            "configured": bool(self.api_key),
        }


class MockAIProvider(AIProviderBase):
    """Deterministic Mock AI provider for offline testing and continuous integration."""

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        return "I recommend the Velocity Nitro Running Shoes paired with our Sports Cushion Socks for optimal performance."

    async def extract_structured_json(
        self,
        prompt: str,
        schema_model: Type[BaseModel],
        system_instruction: Optional[str] = None,
    ) -> BaseModel:
        return schema_model()

    async def health_check(self) -> Dict[str, Any]:
        return {
            "provider": "mock",
            "model": "mock-deterministic-v1",
            "configured": True,
        }
