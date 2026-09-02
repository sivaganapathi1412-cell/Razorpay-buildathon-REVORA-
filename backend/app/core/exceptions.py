from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class RevoraException(HTTPException):
    """Base application exception for Revora AI."""
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        detail: str = "An error occurred",
        error_code: str = "REVORA_ERROR",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.metadata = metadata or {}


class EntityNotFoundException(RevoraException):
    def __init__(self, entity_name: str, entity_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_name} with id '{entity_id}' not found.",
            error_code="ENTITY_NOT_FOUND",
            metadata={"entity": entity_name, "id": str(entity_id)},
        )


class PolicyViolationException(RevoraException):
    def __init__(self, rule_name: str, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Action violates safety rule '{rule_name}': {reason}",
            error_code="POLICY_VIOLATION",
            metadata={"rule_name": rule_name, "reason": reason, "details": details or {}},
        )


class PaymentException(RevoraException):
    def __init__(self, detail: str, error_code: str = "PAYMENT_ERROR", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code=error_code,
            metadata=metadata or {},
        )
