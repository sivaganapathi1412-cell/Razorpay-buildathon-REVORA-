"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Package, 
  Clock, 
  Lock,
  Zap,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/ProductImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [simulatingFailure, setSimulatingFailure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("alex.runner@revora.ai");
  const [fullName, setFullName] = useState("Alex Vance");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("Flat 402, High Street Towers, Bengaluru, Karnataka");

  const loadCart = async () => {
    try {
      const res = await fetch(`${API_BASE}/cart`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error("Failed to load cart for checkout:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleRazorpayTestPayment = async () => {
    setProcessingPayment(true);
    setError(null);
    try {
      // 1. Create Server-Side Order
      const createRes = await fetch(`${API_BASE}/checkout/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer_email: email,
          customer_name: fullName,
          customer_phone: phone,
          delivery_address: { street: address, city: "Bengaluru", state: "Karnataka" },
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.detail || "Failed to initialize checkout order.");
      }

      const orderData = await createRes.json();

      // 2. Complete Test Mode Payment Verification Server-Side
      const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.order_id,
          razorpay_order_id: orderData.razorpay_order_id,
          razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_signature: "demo_test_sig_valid_hash",
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.detail || "Payment verification failed.");
      }

      // Redirect to Order Success
      router.push(`/order-success?order_id=${orderData.order_id}`);
    } catch (err: any) {
      setError(err.message || "Payment processing failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSimulateFailure = async () => {
    setSimulatingFailure(true);
    setError(null);
    try {
      // 1. Create order
      const createRes = await fetch(`${API_BASE}/checkout/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer_email: email,
          customer_name: fullName,
          customer_phone: phone,
          delivery_address: { street: address, city: "Bengaluru", state: "Karnataka" },
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.detail || "Failed to create order.");
      }

      const orderData = await createRes.json();

      // 2. Trigger Controlled Demo Failure
      const failRes = await fetch(`${API_BASE}/checkout/simulate-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.order_id,
          failure_code: "BANK_AUTH_TIMEOUT",
          failure_reason: "Simulated 3D-Secure Bank OTP Timeout.",
          failure_source: "bank",
        }),
      });

      if (!failRes.ok) {
        const errData = await failRes.json();
        throw new Error(errData.detail || "Simulation failed.");
      }

      // 3. Redirect to Recovery Portal
      router.push(`/recovery?order_id=${orderData.order_id}`);
    } catch (err: any) {
      setError(err.message || "Simulation failed.");
      setSimulatingFailure(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-razor border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Preparing secure checkout review...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-400 mx-auto border border-revora-border">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-revora-muted">
          Add items from our athletic catalog to proceed with checkout.
        </p>
        <Link href="/catalog">
          <Button variant="primary" size="md" className="gap-2 text-xs">
            Browse Catalog
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-revora-border pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Secure Checkout Review</h1>
        <p className="text-xs text-revora-muted mt-1 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span>256-bit Encrypted &bull; Razorpay Test Mode &bull; Authoritative Pricing</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer & Delivery Details */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 border-revora-border bg-slate-900/80 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-revora-cyan">1</span>
              Customer &amp; Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-revora-razor text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email (for receipt)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-revora-razor text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-revora-razor text-xs"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-revora-border bg-slate-900/80 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-revora-cyan">2</span>
              Shipping Destination
            </h3>
            <div className="text-xs space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-revora-razor text-xs"
                />
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Clock className="h-3.5 w-3.5 text-revora-cyan" />
                <span>Estimated Express Delivery: <strong>2–3 Business Days</strong></span>
              </div>
            </div>
          </Card>

          {/* Payment Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleRazorpayTestPayment}
              disabled={processingPayment || simulatingFailure}
              variant="primary"
              size="lg"
              className="w-full text-xs font-semibold gap-2 py-3.5"
            >
              <CreditCard className="h-4 w-4" />
              {processingPayment ? "Verifying Payment..." : `Pay ₹${cart.total_amount} via Razorpay Test Mode`}
            </Button>

            {/* Hackathon Evaluation: Controlled Demo Failure */}
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-center space-y-2">
              <span className="text-[11px] font-medium text-amber-300 block">
                ⚡ Hackathon Demo Feature: Revenue Recovery Evaluation
              </span>
              <p className="text-[11px] text-slate-400">
                Simulate a real-time bank OTP timeout failure to test the Autonomous AI Recovery Engine.
              </p>
              <Button
                type="button"
                onClick={handleSimulateFailure}
                disabled={processingPayment || simulatingFailure}
                variant="outline"
                size="sm"
                className="w-full text-xs text-amber-400 border-amber-900/60 hover:bg-amber-950/40 gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                {simulatingFailure ? "Simulating Failure..." : "Trigger Bank Failure (Demo Simulation)"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Attribution */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 border-revora-border bg-slate-900/90 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-revora-border pb-3">
              Order Summary ({cart.item_count} items)
            </h3>

            {/* Line Items */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.items.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between text-xs py-1.5 border-b border-revora-border/40 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <ProductImage
                      src={it.image_url}
                      alt={it.name}
                      className="h-full w-full object-cover"
                      containerClassName="h-10 w-10 rounded-lg bg-slate-950 border border-revora-border shrink-0 overflow-hidden"
                    />
                    <div>
                      <div className="font-medium text-white line-clamp-1">{it.name}</div>
                      <div className="text-[11px] text-slate-400">Qty: {it.quantity} &times; ₹{it.price}</div>
                    </div>
                  </div>
                  <div className="text-right font-semibold text-white">
                    ₹{it.paid_price}
                    {it.added_via_ai && (
                      <span className="block text-[10px] text-revora-cyan font-mono">+AI Growth</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-revora-border pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Baseline Products:</span>
                <span className="text-slate-200">₹{cart.baseline_revenue}</span>
              </div>

              {Number(cart.ai_incremental_revenue) > 0 && (
                <div className="flex justify-between text-revora-cyan font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Recommended Add-ons:
                  </span>
                  <span>+₹{cart.ai_incremental_revenue}</span>
                </div>
              )}

              {Number(cart.discount_total) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Merchant Policy Discount:</span>
                  <span>-₹{cart.discount_total}</span>
                </div>
              )}

              <div className="border-t border-revora-border pt-2 flex justify-between text-sm font-bold text-white">
                <span>Total Payable:</span>
                <span className="text-revora-cyan">₹{cart.total_amount}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
