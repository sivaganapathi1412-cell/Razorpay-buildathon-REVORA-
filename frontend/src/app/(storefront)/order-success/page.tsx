"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ShoppingBag, 
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/checkout/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to load order success data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-emerald border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Confirming transaction records and issuing receipt...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-revora-muted">Unable to locate this order reference.</p>
        <Link href="/catalog">
          <Button variant="primary" size="md" className="gap-2 text-xs">
            Return to Storefront
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Confirmation Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-950/50">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Payment Confirmed &amp; Order Placed!
        </h1>
        <p className="text-xs text-revora-muted max-w-md mx-auto">
          Thank you for shopping with Revora Athletics. Your gear has been reserved and is preparing for express fulfillment.
        </p>

        {order.is_recovered && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300 font-medium">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            <span>Successfully Recovered Order via AI Revenue Recovery Engine</span>
          </div>
        )}
      </div>

      {/* Order Details Card */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-revora-border gap-2">
          <div>
            <span className="text-[11px] text-slate-400 block font-mono">ORDER REFERENCE</span>
            <span className="text-base font-bold text-white font-mono">{order.order_number}</span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block">ESTIMATED DELIVERY</span>
            <span className="text-xs font-semibold text-slate-200 flex items-center sm:justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5 text-revora-cyan" />
              2–3 Business Days
            </span>
          </div>
        </div>

        {/* Purchased Items */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300">Purchased Items</h3>
          <div className="space-y-2">
            {order.items.map((it: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 bg-slate-950/60 p-3 rounded-xl border border-revora-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-[11px]">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{it.product_name}</div>
                    <div className="text-[10px] text-slate-400">SKU: {it.sku} &bull; Qty: {it.quantity}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">₹{it.paid_price}</div>
                  {it.origin === "AI_CROSS_SELL" && (
                    <span className="text-[10px] text-revora-cyan font-mono">+AI Growth Add-on</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-revora-border pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Baseline Products:</span>
            <span className="text-slate-200">₹{order.baseline_revenue}</span>
          </div>
          {Number(order.ai_incremental_revenue) > 0 && (
            <div className="flex justify-between text-revora-cyan font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                AI Recommended Add-ons:
              </span>
              <span>+₹{order.ai_incremental_revenue}</span>
            </div>
          )}
          <div className="border-t border-revora-border pt-2 flex justify-between text-base font-extrabold text-white">
            <span>Total Paid Amount:</span>
            <span className="text-emerald-400 font-mono">₹{order.total_amount}</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/catalog" className="flex-1">
            <Button variant="primary" size="md" className="w-full text-xs font-bold gap-2 bg-cyan-600 hover:bg-cyan-500 text-white">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" size="md" className="w-full text-xs font-semibold text-slate-300 border-revora-border hover:bg-slate-800 hover:text-white">
              Back to Store Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-emerald border-t-transparent" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
