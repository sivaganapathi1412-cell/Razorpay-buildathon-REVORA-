from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type
from pydantic import BaseModel


class AIProviderBase(ABC):
    """Abstract interface decoupling commerce and orchestrator logic from specific LLM vendors."""

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        """Generate conversational text response from LLM."""
        pass

    @abstractmethod
    async def extract_structured_json(
        self,
        prompt: str,
        schema_model: Type[BaseModel],
        system_instruction: Optional[str] = None,
    ) -> BaseModel:
        """Generate strictly validated structured JSON conforming to a Pydantic schema."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check status and reachability of the AI provider."""
        pass
