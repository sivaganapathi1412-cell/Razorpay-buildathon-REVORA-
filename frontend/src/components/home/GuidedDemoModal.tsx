"use client";

import { X, CheckCircle2, ArrowRight, User, Sparkles, ShoppingBag, CreditCard, RefreshCw, Store, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCustomerDemo?: () => void;
}

export function GuidedDemoModal({ isOpen, onClose, onStartCustomerDemo }: GuidedDemoModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      num: "01",
      title: "Enter as Customer",
      desc: "Use demo customer (Rahul Sharma) to access personal cart, orders & curated inventory.",
      badge: "Customer Gateway",
      icon: User
    },
    {
      num: "02",
      title: "Ask REVORA Assistant",
      desc: "Prompt: 'I need running shoes for daily training under ₹3,000'. Observe natural intent understanding.",
      badge: "Shop with Revora",
      icon: Sparkles
    },
    {
      num: "03",
      title: "Review Smart Bundle",
      desc: "Examine recommended Velocity Nitro (₹2,499) + Sports Cushion Socks (+₹299) pairing.",
      badge: "Growth Engine",
      icon: ShoppingBag
    },
    {
      num: "04",
      title: "Add to Cart",
      desc: "Items enter cart with zero double counting. Attribution tags record AI-assisted items accurately.",
      badge: "Cart Engine",
      icon: ShoppingBag
    },
    {
      num: "05",
      title: "Checkout via Razorpay Test",
      desc: "Proceed through standard Razorpay Test Mode checkout with verified order line items.",
      badge: "Razorpay Test Mode",
      icon: CreditCard
    },
    {
      num: "06",
      title: "Test Recovery Scenario",
      desc: "Trigger a bank OTP failure simulation and test the policy-controlled recovery link restoration.",
      badge: "Recovery Engine",
      icon: RefreshCw
    },
    {
      num: "07",
      title: "Open Store Owner Dashboard",
      desc: "Sign in with owner credentials (owner@revora.demo) to review live merchant command center.",
      badge: "Merchant Portal",
      icon: Store
    },
    {
      num: "08",
      title: "Audit & Safety Policies",
      desc: "Inspect immutable audit trails, safety discount caps, and revenue attribution breakdowns.",
      badge: "Safety & Audit",
      icon: ShieldCheck
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-revora-border bg-revora-surface p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-revora-border pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Razorpay AI Buildathon Evaluation Guide</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              End-to-End Guided Demo Flow
            </h2>
            <p className="text-xs text-slate-400">
              Follow these 8 steps to evaluate REVORA&apos;s full customer and merchant lifecycle.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-revora-border bg-revora-bg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 8-Step Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="p-3.5 rounded-2xl border border-revora-border bg-revora-bg/70 hover:border-emerald-900/60 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40">
                    STEP {s.num}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    {s.badge}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <h3 className="text-xs font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Action Footnotes */}
        <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-left">
            <div className="text-xs font-bold text-white">Ready to begin evaluation?</div>
            <div className="text-[11px] text-slate-400">
              Start as Customer or open the Store Owner portal.
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                onClose();
                if (onStartCustomerDemo) onStartCustomerDemo();
              }}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <span>Start as Customer</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Link href="/login" onClick={onClose} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-xs font-semibold border-revora-border text-slate-300 hover:text-white"
              >
                Owner Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
