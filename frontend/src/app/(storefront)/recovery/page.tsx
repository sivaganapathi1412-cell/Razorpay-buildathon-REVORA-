"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Zap,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function RecoveryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  const [recoveryEvent, setRecoveryEvent] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch Recovery Event
        const recRes = await fetch(`${API_BASE}/recovery/order/${orderId}`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecoveryEvent(recData);
        }

        // 2. Fetch Order Details
        const ordRes = await fetch(`${API_BASE}/checkout/orders/${orderId}`);
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrder(ordData);
        }
      } catch (err) {
        console.error("Failed to load recovery details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  const handleAuthorizeRetry = async () => {
    if (!recoveryEvent) return;
    setRetrying(true);
    setError(null);
    try {
      // 1. Customer-authorized retry
      const retryRes = await fetch(`${API_BASE}/recovery/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recovery_event_id: recoveryEvent.id }),
      });

      if (!retryRes.ok) {
        const errData = await retryRes.json();
        throw new Error(errData.detail || "Retry authorization failed.");
      }

      const retryData = await retryRes.json();

      // 2. Complete payment verification in test mode
      const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: retryData.order_id,
          razorpay_order_id: retryData.razorpay_order_id,
          razorpay_payment_id: `pay_recovered_${Math.random().toString(36).substring(2, 10)}`,
          razorpay_signature: "demo_test_sig_valid_hash",
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.detail || "Payment verification failed.");
      }

      // Success -> redirect to order success page
      router.push(`/order-success?order_id=${retryData.order_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to complete recovery retry.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-emerald border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Diagnosing checkout interruption &amp; loading preserved cart...</p>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-400 mx-auto border border-revora-border">
          <AlertTriangle className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Recovery Session Found</h2>
        <p className="text-xs text-revora-muted">
          Your orders are secure. If you experienced a payment interruption, please check your cart.
        </p>
        <Link href="/catalog">
          <Button variant="primary" size="md" className="gap-2 text-xs">
            Return to Storefront
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  const isDemoSimulation = recoveryEvent?.provenance === "DEMO_SIMULATION";

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Recovery Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-900/40 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400 shrink-0">
              <RefreshCw className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Payment Interrupted — Cart &amp; Items Preserved
                </h1>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Order #{order.order_number} &bull; Total: <strong>₹{order.total_amount}</strong>
              </p>
            </div>
          </div>

          {/* Provenance Badge */}
          <div>
            {isDemoSimulation ? (
              <Badge variant="amber" className="text-xs py-1 px-2.5">
                ⚡ Demo Simulation
              </Badge>
            ) : (
              <Badge variant="cyan" className="text-xs py-1 px-2.5">
                Razorpay Test Mode Interruption
              </Badge>
            )}
          </div>
        </div>

        {/* Diagnostic Explanation */}
        <div className="rounded-xl border border-revora-border/60 bg-slate-950/70 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Diagnostic Diagnosis &amp; Inventory Status</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {recoveryEvent?.diagnostic_summary || "Bank authorization timed out. Your order inventory has been held safely."}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
            <span>&bull; Status: <strong className="text-revora-cyan font-mono">{recoveryEvent?.status || "ACTIVE"}</strong></span>
            <span>&bull; Strategy: <strong className="text-slate-200">PRESERVE_CART_AND_RETRY</strong></span>
            <span>&bull; Risk Level: <strong className="text-emerald-400">LOW (Safe)</strong></span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Order Preserved Items */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-revora-border pb-3 flex items-center justify-between">
          <span>Preserved Items in Order #{order.order_number}</span>
          <span className="text-xs font-normal text-slate-400">{order.items.length} items locked</span>
        </h3>

        <div className="space-y-3">
          {order.items.map((it: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-revora-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-[11px]">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-white">{it.product_name}</div>
                  <div className="text-[11px] text-slate-400">SKU: {it.sku} &bull; Qty: {it.quantity}</div>
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

        {/* Pricing Summary */}
        <div className="border-t border-revora-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs space-y-1">
            <div className="text-slate-400">
              Baseline: <span className="text-slate-200">₹{order.baseline_revenue}</span>
              {Number(order.ai_incremental_revenue) > 0 && (
                <span className="ml-2 text-revora-cyan">AI Add-on: +₹{order.ai_incremental_revenue}</span>
              )}
            </div>
            <div className="text-sm font-extrabold text-white">
              Total Payable: <span className="text-emerald-400 font-mono">₹{order.total_amount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart">
              <Button variant="ghost" size="md" className="text-xs text-slate-400 hover:text-white">
                Return to Cart
              </Button>
            </Link>

            <Button
              onClick={handleAuthorizeRetry}
              disabled={retrying}
              variant="emerald"
              size="md"
              className="gap-2 text-xs font-semibold px-6 shadow-lg shadow-emerald-950/50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {retrying ? "Authorizing Safe Retry..." : `1-Click Safe Retry (₹${order.total_amount})`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CustomerRecoveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-emerald border-t-transparent" />
      </div>
    }>
      <RecoveryContent />
    </Suspense>
  );
}
