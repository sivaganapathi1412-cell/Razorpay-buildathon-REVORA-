/**
 * REVORA AI — Customer Authentication & Account Client Helper
 * Manages customer credentials, customer tokens (role='CUSTOMER'),
 * anonymous-to-customer cart binding, and customer order history.
 */

import { getSessionId } from "./cartService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
}

export interface CustomerOrderItem {
  id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  paid_price: number;
  origin: string;
}

export interface CustomerOrderSummary {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  items_count: number;
  items: CustomerOrderItem[];
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("revora_customer_token");
}

export function getCustomerUser(): CustomerUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("revora_customer_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setCustomerSession(token: string, customer: CustomerUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("revora_customer_token", token);
  localStorage.setItem("revora_customer_user", JSON.stringify(customer));
  window.dispatchEvent(new CustomEvent("revora-customer-auth-changed", { detail: customer }));
}

export function clearCustomerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("revora_customer_token");
  localStorage.removeItem("revora_customer_user");
  window.dispatchEvent(new CustomEvent("revora-customer-auth-changed", { detail: null }));
}

export async function customerRegister(payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<{ customer: CustomerUser; access_token: string }> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/customer/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      session_id: sessionId || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed. Please check your details.");
  }

  const data = await res.json();
  setCustomerSession(data.access_token, data.customer);
  return data;
}

export async function customerLogin(payload: {
  email: string;
  password: string;
}): Promise<{ customer: CustomerUser; access_token: string }> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/customer/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      session_id: sessionId || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Invalid customer credentials.");
  }

  const data = await res.json();
  setCustomerSession(data.access_token, data.customer);
  return data;
}

export async function customerLogout(): Promise<void> {
  const token = getCustomerToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/customer/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors during logout
    }
  }
  clearCustomerSession();
}

export async function getCustomerProfile(): Promise<CustomerUser | null> {
  const token = getCustomerToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/customer/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data: CustomerUser = await res.json();
      localStorage.setItem("revora_customer_user", JSON.stringify(data));
      return data;
    } else {
      clearCustomerSession();
      return null;
    }
  } catch (err) {
    console.error("Failed to fetch customer profile:", err);
    return null;
  }
}

export async function getCustomerOrders(): Promise<CustomerOrderSummary[]> {
  const token = getCustomerToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/customer/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch customer orders:", err);
    return [];
  }
}
