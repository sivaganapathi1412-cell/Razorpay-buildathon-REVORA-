"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Loader2,
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";
import { 
  fetchActiveCart, 
  updateCartItemQuantity, 
  removeCartItem, 
  clearActiveCart, 
  onCartUpdate, 
  CartData 
} from "@/lib/cartService";

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCartData = async () => {
    setLoading(true);
    const data = await fetchActiveCart();
    setCart(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCartData();
    const unsubscribe = onCartUpdate((updatedCart) => {
      if (updatedCart) {
        setCart(updatedCart);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    setUpdatingId(itemId);
    const updated = await updateCartItemQuantity(itemId, newQty);
    if (updated) setCart(updated);
    setUpdatingId(null);
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    const updated = await removeCartItem(itemId);
    if (updated) setCart(updated);
    setUpdatingId(null);
  };

  const handleClear = async () => {
    setLoading(true);
    const updated = await clearActiveCart();
    if (updated) setCart(updated);
    setLoading(false);
  };

  if (loading && !cart) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
        <p className="text-xs text-revora-muted">Retrieving your active shopping cart...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const itemCount = cart?.item_count || items.length;
  const subtotal = Number(cart?.subtotal || 0);
  const baseline = Number(cart?.baseline_subtotal || cart?.baseline_revenue || subtotal);
  const aiGrowth = Number(cart?.ai_incremental_subtotal || cart?.ai_incremental_revenue || 0);
  const total = Number(cart?.total_amount || subtotal);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-revora-surface border border-revora-border mx-auto text-revora-muted">
          <ShoppingBag className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Cart is Empty</h1>
          <p className="text-xs text-revora-muted max-w-sm mx-auto leading-relaxed">
            You haven&apos;t added any athletic gear to your cart yet. Explore our performance collection or ask Revora AI to match items to your goals.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/catalog">
            <Button variant="primary" size="md" className="gap-2 text-xs font-bold px-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
              <ShoppingBag className="h-4 w-4" />
              <span>Browse Catalog</span>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="md" className="text-xs font-semibold px-5 border-revora-border text-slate-300 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-revora-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Shopping Cart</h1>
            <Badge variant="mint" className="text-[10px] font-mono">{itemCount} items</Badge>
          </div>
          <p className="text-xs text-revora-muted mt-1">Review your merchandise, growth add-ons, and proceed to secure checkout.</p>
        </div>

        <button
          onClick={handleClear}
          className="text-xs text-revora-muted hover:text-red-400 flex items-center gap-1 self-start sm:self-auto transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          {items.map((item) => {
            const isAi = item.added_via_ai || item.origin?.includes("AI");
            return (
              <Card
                key={item.id}
                className="p-4 border-revora-border bg-revora-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <ProductImage
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    containerClassName="h-16 w-16 rounded-xl bg-revora-bg shrink-0 border border-revora-border overflow-hidden"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate block">
                        {item.name}
                      </span>
                      {isAi && (
                        <Badge variant="mint" className="text-[9px] py-0 px-1.5 font-bold flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          Recommended by Revora
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-revora-muted font-mono">
                      Unit: {formatCurrency(Number(item.price))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-revora-border/60">
                  {/* Quantity Controller */}
                  <div className="flex items-center gap-2 rounded-xl border border-revora-border bg-revora-bg p-1">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      disabled={updatingId === item.id}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-revora-surface disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold font-mono text-white px-1 min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      disabled={updatingId === item.id}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-revora-surface disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[75px]">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">
                      {formatCurrency(Number(item.paid_price || item.price * item.quantity))}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={updatingId === item.id}
                    className="text-revora-muted hover:text-red-400 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}

          <div className="pt-2">
            <Link href="/catalog" className="text-xs font-semibold text-emerald-400 hover:text-revora-mint flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue Shopping Collection</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-5">
          <Card className="p-6 space-y-5 border-revora-border bg-revora-surface rounded-2xl shadow-xl">
            <h3 className="text-sm font-bold text-white tracking-tight border-b border-revora-border pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-revora-muted">Baseline Merchandise:</span>
                <span className="font-mono font-medium text-white">{formatCurrency(baseline)}</span>
              </div>

              {aiGrowth > 0 && (
                <div className="flex justify-between items-center text-revora-mint">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    AI Incremental Lift:
                  </span>
                  <span className="font-mono font-bold">+{formatCurrency(aiGrowth)}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-revora-border pt-3 text-sm font-bold text-white">
                <span>Total Payable:</span>
                <span className="text-emerald-400 font-mono text-base font-extrabold">{formatCurrency(total)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full gap-2 text-xs font-bold h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <div className="space-y-2 pt-3 border-t border-revora-border text-[11px] text-revora-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Protected by Razorpay Test Mode Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-revora-mint shrink-0" />
                <span>Cart auto-preservation on payment interruptions</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
