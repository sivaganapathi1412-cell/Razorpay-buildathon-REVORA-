import { EventProvenance } from "./commerce";

export type AuditCategory = 
  | "GROWTH_ACTION"
  | "RECOVERY_ACTION"
  | "POLICY_CHECK"
  | "PAYMENT_EVENT"
  | "MERCHANT_APPROVAL"
  | "SYSTEM_EVENT";

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AuditLog {
  id: string;
  trace_id: string;
  merchant_id: string;
  customer_id?: string;
  session_id?: string;
  order_id?: string;
  agent_source: string;
  event_category: AuditCategory;
  event_type: string;
  summary: string;
  financial_delta: number;
  provenance: EventProvenance;
  severity: AuditSeverity;
  metadata_json: Record<string, any>;
  timestamp: string;
}
