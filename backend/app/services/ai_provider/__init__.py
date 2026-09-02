from app.core.config import settings
from app.services.ai_provider.base import AIProviderBase
from app.services.ai_provider.gemini_provider import GeminiProvider, MockAIProvider


def get_ai_provider() -> AIProviderBase:
    """Factory providing the configured AI provider instance."""
    provider_type = settings.AI_PROVIDER.lower()
    if provider_type == "gemini":
        return GeminiProvider()
    elif provider_type == "mock":
        return MockAIProvider()
    else:
        return MockAIProvider()


__all__ = ["AIProviderBase", "GeminiProvider", "MockAIProvider", "get_ai_provider"]
