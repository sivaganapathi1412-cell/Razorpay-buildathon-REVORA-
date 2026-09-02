import { EventProvenance } from "./commerce";

export interface MultiDimensionalAttribution {
  order_id: string;
  order_number: string;
  total_paid_revenue: number;
  is_ai_assisted: boolean;
  baseline_revenue: number;
  ai_incremental_revenue: number;
  is_recovered: boolean;
  recovered_revenue: number;
  provenance: EventProvenance;
}

export interface DashboardMetrics {
  total_revenue: number;
  ai_incremental_revenue: number;
  recovered_revenue: number;
  baseline_revenue: number;
  average_order_value: number;
  aov_lift_percentage: number;
  recovery_rate_percentage: number;
  total_orders_count: number;
  recovered_orders_count: number;
}
