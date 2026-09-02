import uuid
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Enum, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.enums import AgentType, RiskLevel, PolicyResult, CustomerOutcome
from app.models.base import GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.customer import Customer


class AISession(Base, TimestampMixin):
    __tablename__ = "ai_sessions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    session_token: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="ai_sessions")
    messages: Mapped[List["AIMessage"]] = relationship("AIMessage", back_populates="session", cascade="all, delete-orphan")
    actions: Mapped[List["AIAction"]] = relationship("AIAction", back_populates="session", cascade="all, delete-orphan")
    decisions: Mapped[List["AgentDecision"]] = relationship("AgentDecision", back_populates="session", cascade="all, delete-orphan")


class AIMessage(Base, TimestampMixin):
    __tablename__ = "ai_messages"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("ai_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    structured_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    session: Mapped["AISession"] = relationship("AISession", back_populates="messages")


class AIAction(Base, TimestampMixin):
    __tablename__ = "ai_actions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("ai_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    agent_type: Mapped[AgentType] = mapped_column(
        Enum(AgentType, native_enum=False),
        nullable=False,
        index=True,
    )
    action_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    financial_impact: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PROPOSED", nullable=False)  # PROPOSED, APPLIED, REJECTED
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    session: Mapped["AISession"] = relationship("AISession", back_populates="actions")
    decision: Mapped[Optional["AgentDecision"]] = relationship("AgentDecision", back_populates="action", uselist=False)


class AgentDecision(Base, TimestampMixin):
    """Structured, explainable business decision record.
    Strictly excludes raw model chain-of-thought to maintain explainability and security.
    """
    __tablename__ = "agent_decisions"
    __table_args__ = (
        CheckConstraint("financial_impact >= 0", name="check_decision_fin_impact_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("ai_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    action_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("ai_actions.id", ondelete="SET NULL"), nullable=True, index=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    trace_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    agent_type: Mapped[AgentType] = mapped_column(
        Enum(AgentType, native_enum=False),
        nullable=False,
        index=True,
    )
    action_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Explainable business justification
    business_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    input_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    financial_impact: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, native_enum=False),
        default=RiskLevel.LOW,
        nullable=False,
    )
    policy_result: Mapped[PolicyResult] = mapped_column(
        Enum(PolicyResult, native_enum=False),
        default=PolicyResult.PASSED,
        nullable=False,
    )
    policy_details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    customer_outcome: Mapped[CustomerOutcome] = mapped_column(
        Enum(CustomerOutcome, native_enum=False),
        default=CustomerOutcome.VIEWED,
        nullable=False,
    )

    # Relationships
    session: Mapped["AISession"] = relationship("AISession", back_populates="decisions")
    action: Mapped[Optional["AIAction"]] = relationship("AIAction", back_populates="decision")
