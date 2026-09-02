from enum import Enum


class EventProvenance(str, Enum):
    """Origin tracking for audit and transparent hackathon demo isolation."""
    REAL_RAZORPAY_TEST = "REAL_RAZORPAY_TEST"
    DEMO_SIMULATION = "DEMO_SIMULATION"
    SYSTEM = "SYSTEM"
    AI = "AI"
    MERCHANT = "MERCHANT"
    CUSTOMER = "CUSTOMER"


class CartStatus(str, Enum):
    """Cart lifecycle state."""
    ACTIVE = "ACTIVE"
    ABANDONED = "ABANDONED"
    CONVERTED = "CONVERTED"
    EXPIRED = "EXPIRED"


class OrderStatus(str, Enum):
    """Order transactional state."""
    DRAFT = "DRAFT"
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAID = "PAID"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    """Aggregated payment state."""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentAttemptStatus(str, Enum):
    """Individual payment attempt state."""
    INITIATED = "INITIATED"
    AUTHORIZED = "AUTHORIZED"
    CAPTURED = "CAPTURED"
    FAILED = "FAILED"


class ItemOrigin(str, Enum):
    """Provenance/Origin of line items for attribution calculation."""
    DIRECT = "DIRECT"
    AI_RECOMMENDATION = "AI_RECOMMENDATION"
    AI_UPSELL = "AI_UPSELL"
    AI_CROSS_SELL = "AI_CROSS_SELL"
    AI_BUNDLE = "AI_BUNDLE"


class GrowthOpportunityStatus(str, Enum):
    """Lifecycle of AI growth opportunities and bundle proposals."""
    DETECTED = "DETECTED"
    PROPOSED = "PROPOSED"
    GATED = "GATED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"


class RecoveryStatus(str, Enum):
    """Lifecycle of cart/payment revenue recovery workflows."""
    DETECTED = "DETECTED"
    ANALYZING = "ANALYZING"
    STRATEGY_READY = "STRATEGY_READY"
    SAFETY_VALIDATED = "SAFETY_VALIDATED"
    GATED = "GATED"
    ACTIVE = "ACTIVE"
    RETRIED = "RETRIED"
    RECOVERED = "RECOVERED"
    EXPIRED = "EXPIRED"


class RiskLevel(str, Enum):
    """Safety risk assessment."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class PolicyResult(str, Enum):
    """Deterministic policy engine decision."""
    PASSED = "PASSED"
    REJECTED = "REJECTED"
    GATED = "GATED"


class CustomerOutcome(str, Enum):
    """Customer interaction outcome with AI proposal."""
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    IGNORED = "IGNORED"


class AgentType(str, Enum):
    """Specialized agent identification."""
    ORCHESTRATOR = "ORCHESTRATOR"
    SHOPPING_AGENT = "SHOPPING_AGENT"
    CATALOG_AGENT = "CATALOG_AGENT"
    GROWTH_AGENT = "GROWTH_AGENT"
    OFFER_AGENT = "OFFER_AGENT"
    RECOVERY_AGENT = "RECOVERY_AGENT"
    PAYMENT_AGENT = "PAYMENT_AGENT"
    SAFETY_AGENT = "SAFETY_AGENT"
    ANALYTICS_AGENT = "ANALYTICS_AGENT"


class AuditCategory(str, Enum):
    """Audit event classification."""
    SHOPPING = "SHOPPING"
    GROWTH = "GROWTH"
    GROWTH_ACTION = "GROWTH_ACTION"
    SAFETY = "SAFETY"
    POLICY_CHECK = "POLICY_CHECK"
    PAYMENT = "PAYMENT"
    PAYMENT_EVENT = "PAYMENT_EVENT"
    RECOVERY = "RECOVERY"
    RECOVERY_ACTION = "RECOVERY_ACTION"
    MERCHANT_ACTION = "MERCHANT_ACTION"
    MERCHANT_APPROVAL = "MERCHANT_APPROVAL"
    SYSTEM = "SYSTEM"
    SYSTEM_EVENT = "SYSTEM_EVENT"


class AuditSeverity(str, Enum):
    """Audit log severity."""
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
