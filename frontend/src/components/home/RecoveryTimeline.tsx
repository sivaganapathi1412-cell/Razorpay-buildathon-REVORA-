"use client";

import { RefreshCw, ShoppingCart, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function RecoveryTimeline() {
  const steps = [
    {
      step: "1",
      title: "Cart Created",
      desc: "Shopper selects items and enters checkout. Intent is recorded in real-time.",
      icon: ShoppingCart,
      badge: "Intent Captured",
      color: "text-slate-300 border-slate-700 bg-slate-900/60"
    },
    {
      step: "2",
      title: "Checkout Interrupted",
      desc: "Payment drop-off, bank OTP timeout, or network disconnection occurs.",
      icon: AlertTriangle,
      badge: "Drop-off Detected",
      color: "text-amber-400 border-amber-800/80 bg-amber-950/40"
    },
    {
      step: "3",
      title: "Context Preserved",
      desc: "REVORA safely saves cart items, applied coupons, and generates secure token.",
      icon: ShieldCheck,
      badge: "Policy Gated",
      color: "text-emerald-400 border-emerald-800/80 bg-emerald-950/40"
    },
    {
      step: "4",
      title: "Safe Return & Complete",
      desc: "Customer opens 1-click recovery link and completes payment with explicit confirmation.",
      icon: CheckCircle2,
      badge: "Revenue Recovered",
      color: "text-revora-mint border-emerald-600 bg-emerald-950/60"
    }
  ];

  return (
    <section id="recovery-story-section" className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
          <RefreshCw className="h-3 w-3 text-emerald-400" />
          <span>Autonomous Revenue Protection</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          When Checkout Doesn&apos;t Go as Planned
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Over 70% of e-commerce carts are abandoned during checkout glitches. REVORA preserves cart context and provides a compliant, customer-confirmed path back to purchase.
        </p>
      </div>

      {/* 4-Step Recovery Timeline */}
      <div className="max-w-4xl mx-auto rounded-3xl border border-revora-border bg-revora-surface p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Timeline Grid: Horizontal on Desktop, Vertical on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className={`p-4 rounded-2xl border ${s.color} flex flex-col justify-between space-y-3 relative`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-7 w-7 rounded-lg bg-revora-bg flex items-center justify-center font-mono text-xs font-bold text-white border border-revora-border">
                      {s.step}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {s.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Icon className="h-4 w-4 shrink-0" />
                    <h3 className="text-xs font-bold text-white">{s.title}</h3>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  {idx === 3 ? "Recovery Attribution: RECOVERED" : "Safe Lifecycle Stage"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety & Compliance Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
          <div className="p-3 rounded-xl bg-revora-bg/70 border border-revora-border space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Customer Confirmed</span>
            </div>
            <p className="text-[11px] text-slate-400">
              REVORA never executes autonomous card charges. Explicit shopper OTP/UPI approval is always required.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-revora-bg/70 border border-revora-border space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Merchant Bound</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Recovery incentive discounts adhere strictly to merchant-configured maximum limits and rules.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-revora-bg/70 border border-revora-border space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Razorpay Test Verified</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Demonstration uses controlled simulation without claiming live bank failure events.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
