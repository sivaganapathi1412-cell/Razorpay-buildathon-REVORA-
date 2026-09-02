/**
 * REVORA AI — Authoritative Frontend Cart Service
 * Guarantees cross-navigation cart persistence, session bridging,
 * and real-time state synchronization across all storefront components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface CartProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url: string;
}

export interface CartItemData {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount_applied: number;
  paid_price: number;
  added_via_ai: boolean;
  image_url: string;
  stock_quantity: number;
  origin?: string;
}

export interface CartData {
  id: string;
  cart_id: string;
  session_id: string;
  currency: string;
  items: CartItemData[];
  item_count: number;
  subtotal: number;
  discount_total: number;
  total_amount: number;
  baseline_revenue: number;
  baseline_subtotal: number;
  ai_incremental_revenue: number;
  ai_incremental_subtotal: number;
  is_ai_assisted: boolean;
}

/**
 * Retrieves or generates a single canonical persistent customer session UUID.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("revora_session_id");
  if (!sid || sid.includes(",")) {
    sid = "sess_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
    localStorage.setItem("revora_session_id", sid);
    try {
      document.cookie = `revora_session_id=${sid}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      // Ignore SSR cookie errors
    }
  }
  return sid;
}

/**
 * Retrieves cached active cart ID if available.
 */
export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("revora_cart_id");
}

/**
 * Standard single-entry fetch headers ensuring clean session attribution.
 */
function getHeaders(): HeadersInit {
  const sid = getSessionId();
  const cartId = getStoredCartId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Session-ID": sid,
  };
  if (cartId) {
    headers["X-Cart-ID"] = cartId;
  }
  return headers;
}

/**
 * Dispatches a global event to immediately update cart badges and views.
 */
function dispatchCartUpdate(cartData?: CartData | null) {
  if (typeof window === "undefined") return;
  if (cartData) {
    if (cartData.id) localStorage.setItem("revora_cart_id", cartData.id);
    if (cartData.session_id) localStorage.setItem("revora_session_id", cartData.session_id);
  }
  window.dispatchEvent(new CustomEvent("revora-cart-updated", { detail: cartData }));
}

/**
 * Fetches current authoritative active cart from backend.
 */
export async function fetchActiveCart(): Promise<CartData | null> {
  try {
    const sid = getSessionId();
    const cartId = getStoredCartId();
    let url = `${API_BASE}/cart?session_id=${encodeURIComponent(sid)}`;
    if (cartId) {
      url += `&cart_id=${encodeURIComponent(cartId)}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    if (res.ok) {
      const data: CartData = await res.json();
      if (data.id) localStorage.setItem("revora_cart_id", data.id);
      return data;
    }
    return null;
  } catch (err) {
    console.error("CartService: Failed to fetch active cart:", err);
    return null;
  }
}

/**
 * Adds an item to the active cart and updates session state.
 */
export async function addToCart(
  productId: string,
  quantity = 1,
  isAiRecommended = false,
  growthOpportunityId?: string
): Promise<CartData | null> {
  try {
    const sid = getSessionId();
    const cartId = getStoredCartId();

    const res = await fetch(`${API_BASE}/cart/items`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify({
        product_id: productId,
        quantity: Math.max(1, quantity),
        is_ai_recommended: isAiRecommended,
        added_via_ai: isAiRecommended,
        growth_opportunity_id: growthOpportunityId || null,
        session_id: sid,
        cart_id: cartId || null,
      }),
    });

    if (res.ok) {
      const data: CartData = await res.json();
      dispatchCartUpdate(data);
      return data;
    } else {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add item to cart.");
    }
  } catch (err) {
    console.error("CartService: Error adding item to cart:", err);
    throw err;
  }
}

/**
 * Updates quantity of an existing cart item line.
 */
export async function updateCartItemQuantity(itemId: string, newQuantity: number): Promise<CartData | null> {
  try {
    const sid = getSessionId();
    const cartId = getStoredCartId();
    let url = `${API_BASE}/cart/items/${itemId}?session_id=${encodeURIComponent(sid)}`;
    if (cartId) {
      url += `&cart_id=${encodeURIComponent(cartId)}`;
    }

    let res: Response;
    if (newQuantity <= 0) {
      res = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });
    } else {
      res = await fetch(url, {
        method: "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify({ quantity: newQuantity }),
      });
    }

    if (res.ok) {
      const data: CartData = await res.json();
      dispatchCartUpdate(data);
      return data;
    }
    return null;
  } catch (err) {
    console.error("CartService: Error updating cart quantity:", err);
    return null;
  }
}

/**
 * Removes an item from the cart.
 */
export async function removeCartItem(itemId: string): Promise<CartData | null> {
  return updateCartItemQuantity(itemId, 0);
}

/**
 * Clears all items in the active cart.
 */
export async function clearActiveCart(): Promise<CartData | null> {
  try {
    const sid = getSessionId();
    const cartId = getStoredCartId();
    let url = `${API_BASE}/cart?session_id=${encodeURIComponent(sid)}`;
    if (cartId) {
      url += `&cart_id=${encodeURIComponent(cartId)}`;
    }

    const res = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    });

    if (res.ok) {
      const data: CartData = await res.json();
      dispatchCartUpdate(data);
      return data;
    }
    return null;
  } catch (err) {
    console.error("CartService: Error clearing cart:", err);
    return null;
  }
}

/**
 * Helper to subscribe to cart updates across React components.
 */
export function onCartUpdate(callback: (cart: CartData | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CartData>;
    callback(customEvent.detail || null);
  };
  window.addEventListener("revora-cart-updated", handler);
  return () => {
    window.removeEventListener("revora-cart-updated", handler);
  };
}
