"use client";

import { ShieldCheck, Lock, CheckCircle2, FileText, AlertOctagon } from "lucide-react";

export function SafetyTrustSection() {
  const principles = [
    {
      title: "BOUNDED",
      desc: "All autonomous actions operate strictly within merchant-defined safety boundaries.",
      detail: "Discounts, bundle margins, and recovery incentives never exceed hard ceiling caps."
    },
    {
      title: "EXPLAINABLE",
      desc: "Every recommendation and recovery offer includes a clear business rationale.",
      detail: "No black-box decisions. Merchants inspect why specific items were bundled."
    },
    {
      title: "GATED",
      desc: "High-value discounts and sensitive actions require explicit merchant approval.",
      detail: "Actions exceeding threshold automatically enter the Merchant Approvals queue."
    },
    {
      title: "AUDITABLE",
      desc: "Every trigger, agent evaluation, and payment state is immutably logged.",
      detail: "Complete provenance tracking from customer query to settled transaction."
    }
  ];

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span>Governance &amp; Trust</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Built to Grow Revenue Without Losing Control
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          AI in commerce must respect hard business guardrails. REVORA enforces strict merchant policies across every single product interaction.
        </p>
      </div>

      {/* 4 Principles Grid + Live Policy Guardrail Example */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 4 Core Principles */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {principles.map((p) => (
            <div
              key={p.title}
              className="p-4 rounded-2xl border border-revora-border bg-revora-surface space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider">
                  {p.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-snug">
                {p.desc}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {p.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Right Column: Live Safety Policy Configuration Card */}
        <div className="lg:col-span-5 rounded-3xl border border-emerald-800/80 bg-revora-surface p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-revora-border pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Active Safety Policy Rule</span>
            </div>
            <span className="text-[10px] font-mono text-revora-mint bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/60">
              ENFORCED
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-revora-bg/80 border border-revora-border">
              <span className="text-slate-400">Auto Discount Limit:</span>
              <span className="font-mono font-bold text-white">10.00%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-revora-bg/80 border border-revora-border">
              <span className="text-slate-400">Maximum Discount:</span>
              <span className="font-mono font-bold text-white">₹300.00</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-revora-bg/80 border border-revora-border">
              <span className="text-slate-400">Bundle Discount Cap:</span>
              <span className="font-mono font-bold text-white">15.00%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-revora-bg/80 border border-revora-border">
              <span className="text-slate-400">Approval Threshold:</span>
              <span className="font-mono font-bold text-emerald-400">₹5,000.00</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900/60 text-[11px] text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Out-of-bound recommendations are automatically blocked or routed for review.</span>
          </div>
        </div>

      </div>
    </section>
  );
}
