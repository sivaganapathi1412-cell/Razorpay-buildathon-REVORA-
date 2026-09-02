"use client";

import { Compass, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export function WhyRevoraSection() {
  const cards = [
    {
      title: "Find the right product",
      subtitle: "Intent-Driven Discovery",
      desc: "Shoppers articulate what they need in conversational language. REVORA maps intent to exact technical catalog specifications in milliseconds.",
      icon: Compass,
      metric: "Zero Search Friction",
      href: "/catalog"
    },
    {
      title: "Grow the basket naturally",
      subtitle: "Autonomous Cross-Sell",
      desc: "Relevant complementary products and sports bundles increase order value organically without spammy, irrelevant popup upselling.",
      icon: TrendingUp,
      metric: "Zero Double Counting",
      href: "/catalog"
    },
    {
      title: "Recover lost intent",
      subtitle: "Policy-Gated Recovery",
      desc: "Interrupted checkouts and payment drop-offs are safely restored with full customer context, verified coupons, and zero friction.",
      icon: RefreshCw,
      metric: "Auditable Lifecycle",
      href: "/catalog"
    }
  ];

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Why Modern D2C Runs on REVORA
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Three core capabilities built directly into the shopping journey to increase conversion, basket size, and customer retention.
        </p>
      </div>

      {/* 3 Major Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="p-6 rounded-3xl border border-revora-border bg-revora-surface hover:border-emerald-800/80 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-revora-mint shadow-md group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-900/60">
                    {c.metric}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {c.subtitle}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-revora-mint transition-colors">
                    {c.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <Link
                href={c.href}
                className="text-xs font-bold text-emerald-400 hover:text-revora-mint inline-flex items-center gap-1.5 transition-colors pt-2 border-t border-revora-border/60"
              >
                <span>Experience capability</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
