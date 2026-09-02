export type ItemOrigin = 
  | "DIRECT"
  | "AI_RECOMMENDATION"
  | "AI_UPSELL"
  | "AI_CROSS_SELL"
  | "AI_BUNDLE";

export type CartStatus = "ACTIVE" | "ABANDONED" | "CONVERTED" | "EXPIRED";

export type OrderStatus = 
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export type EventProvenance = 
  | "REAL_RAZORPAY_TEST"
  | "DEMO_SIMULATION"
  | "SYSTEM"
  | "AI"
  | "MERCHANT"
  | "CUSTOMER";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  merchant_id: string;
  category_id?: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string;
  tags: string[];
  is_active: boolean;
  metadata_json?: Record<string, any>;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  origin: ItemOrigin;
  bundle_id?: string;
  product?: Product;
}

export interface Cart {
  id: string;
  customer_id?: string;
  session_id: string;
  status: CartStatus;
  items: CartItem[];
  subtotal: number;
  discount_total: number;
  total: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  paid_price: number;
  origin: ItemOrigin;
  bundle_id?: string;
}

export interface Order {
  id: string;
  merchant_id: string;
  customer_id?: string;
  order_number: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  total_amount: number;
  
  // Multi-dimensional attribution (no double-counting)
  is_ai_assisted: boolean;
  baseline_revenue: number;
  ai_incremental_revenue: number;
  is_recovered: boolean;
  recovered_revenue: number;
  
  provenance: EventProvenance;
  razorpay_order_id?: string;
  items: OrderItem[];
  created_at: string;
}
