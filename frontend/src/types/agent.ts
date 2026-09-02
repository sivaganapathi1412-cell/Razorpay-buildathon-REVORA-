export type AgentType = 
  | "ORCHESTRATOR"
  | "SHOPPING_AGENT"
  | "CATALOG_AGENT"
  | "GROWTH_AGENT"
  | "OFFER_AGENT"
  | "RECOVERY_AGENT"
  | "PAYMENT_AGENT"
  | "SAFETY_AGENT"
  | "ANALYTICS_AGENT";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PolicyResult = "PASSED" | "REJECTED" | "GATED";
export type CustomerOutcome = "VIEWED" | "ACCEPTED" | "DECLINED" | "IGNORED";

export interface AgentDecision {
  id: string;
  session_id: string;
  trace_id: string;
  agent_type: AgentType;
  action_name: string;
  business_explanation: string;
  input_snapshot: Record<string, any>;
  financial_impact: number;
  risk_level: RiskLevel;
  policy_result: PolicyResult;
  policy_details: Record<string, any>;
  customer_outcome: CustomerOutcome;
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  structured_payload?: Record<string, any>;
  created_at: string;
}
