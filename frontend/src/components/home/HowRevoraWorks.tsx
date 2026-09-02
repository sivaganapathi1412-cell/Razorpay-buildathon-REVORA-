"use client";

import { Activity, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function HowRevoraWorks() {
  const stages = [
    {
      state: "Understand",
      agent: "Orchestrator Agent",
      desc: "Parses shopper intent, natural budget constraints, and domain activity goals.",
      num: "01"
    },
    {
      state: "Discover",
      agent: "Catalog Agent",
      desc: "Searches the active 100-product athletic inventory with real-time stock filters.",
      num: "02"
    },
    {
      state: "Recommend",
      agent: "Growth & Offer Agent",
      desc: "Synthesizes relevant gear combinations and verified bundle pairs.",
      num: "03"
    },
    {
      state: "Validate",
      agent: "Safety Policy Engine",
      desc: "Enforces merchant discount caps and requires approval for out-of-bound actions.",
      num: "04"
    },
    {
      state: "Checkout",
      agent: "Payment Agent",
      desc: "Processes customer transactions via secure Razorpay Test Mode integration.",
      num: "05"
    },
    {
      state: "Recover",
      agent: "Recovery Agent",
      desc: "Restores interrupted checkout sessions safely with customer confirmation.",
      num: "06"
    },
    {
      state: "Measure",
      agent: "Analytics Engine",
      desc: "Records exact incremental revenue and audit events without double counting.",
      num: "07"
    }
  ];

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
          <Activity className="h-3 w-3 text-emerald-400" />
          <span>System Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          How REVORA Operates
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Seven functional stages coordinate seamlessly to power autonomous growth while keeping merchants in total control.
        </p>
      </div>

      {/* 7 Functional Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {stages.map((s, idx) => (
          <div
            key={s.state}
            className={`p-4 rounded-2xl border border-revora-border bg-revora-surface hover:border-emerald-800/80 transition-all duration-200 flex flex-col justify-between space-y-3 ${
              idx === 6 ? "sm:col-span-2 md:col-span-3 lg:col-span-1" : ""
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-revora-bg px-2 py-0.5 rounded border border-revora-border">
                  STAGE {s.num}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-900/60 uppercase">
                  {s.state}
                </span>
              </div>

              <h3 className="text-xs font-bold text-white pt-1">
                {s.agent}
              </h3>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>

            <div className="text-[10px] font-mono text-slate-400 border-t border-revora-border/60 pt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Verified Functional Stage</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
