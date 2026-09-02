"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, BarChart3, ArrowRight, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function MerchantAttributionPreview() {
  const [metrics, setMetrics] = useState<{
    totalRevenue: number;
    incrementalRevenue: number;
    recoveredRevenue: number;
    orderCount: number;
    recoveryCount: number;
  }>({
    totalRevenue: 0,
    incrementalRevenue: 0,
    recoveredRevenue: 0,
    orderCount: 0,
    recoveryCount: 0
  });

  useEffect(() => {
    const fetchLiveMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/analytics/summary`);
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            totalRevenue: Number(data.total_revenue || 0),
            incrementalRevenue: Number(data.ai_incremental_revenue || 0),
            recoveredRevenue: Number(data.recovered_revenue || 0),
            orderCount: Number(data.total_orders || 0),
            recoveryCount: Number(data.recovered_orders || 0),
          });
        }
      } catch {
        // Pristine demo state
      }
    };
    fetchLiveMetrics();
  }, []);

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span>Attribution Intelligence</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Know Exactly Where Growth Came From
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          REVORA separates baseline shopper demand from AI incremental lift and recovered revenue with rigorous mathematical accounting.
        </p>
      </div>

      {/* Attribution Math & Live Metric Cards */}
      <div className="max-w-5xl mx-auto rounded-3xl border border-revora-border bg-revora-surface p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* 4 Attribution Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-revora-bg/80 border border-revora-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-white">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-[10px] text-slate-400">Gross settled orders</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-revora-mint">
              AI Incremental
            </span>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-emerald-400">
              {formatCurrency(metrics.incrementalRevenue)}
            </div>
            <p className="text-[10px] text-emerald-300">Added via AI bundles</p>
          </div>

          <div className="p-4 rounded-2xl bg-revora-bg/80 border border-revora-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Recovered Revenue
            </span>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-cyan-400">
              {formatCurrency(metrics.recoveredRevenue)}
            </div>
            <p className="text-[10px] text-slate-400">Restored from drop-offs</p>
          </div>

          <div className="p-4 rounded-2xl bg-revora-bg/80 border border-revora-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-white">
              {metrics.orderCount}
            </div>
            <p className="text-[10px] text-slate-400">Recorded purchases</p>
          </div>
        </div>

        {/* Attribution Overlap Principle Education Box */}
        <div className="rounded-2xl border border-emerald-900/50 bg-revora-bg/60 p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span>Attribution Overlap Rule (No Double-Counting)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When an interrupted cart contains an AI-recommended cross-sell item and is subsequently recovered, the recovery classification accounts for the whole cart preservation, while the incremental lift tracks the specific added line items. Recovered amounts are categorized separately and never double-added to Total Revenue.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-1">
            Metrics update live from recorded commerce activity in PostgreSQL / SQLite.
          </div>
        </div>

        {/* Owner Dashboard Entry Teaser */}
        <div className="pt-2 flex items-center justify-between border-t border-revora-border/60 flex-wrap gap-3">
          <span className="text-xs text-slate-400">
            Store owners access detailed attribution trees, live audit streams, and safety controls in the Merchant Command Center.
          </span>
          <Link
            href="/login"
            className="text-xs font-bold text-emerald-400 hover:text-revora-mint inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Open Merchant Portal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
