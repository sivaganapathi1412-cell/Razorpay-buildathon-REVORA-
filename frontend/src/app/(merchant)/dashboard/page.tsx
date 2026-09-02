"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  ShoppingCart, 
  ArrowUpRight, 
  AlertCircle,
  Brain,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MerchantDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("revora_access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resOverview, resRev] = await Promise.all([
        fetch(`${API_BASE}/analytics/overview`, { headers }),
        fetch(`${API_BASE}/analytics/revenue`, { headers }),
      ]);

      if (resOverview.ok) {
        const dataO = await resOverview.json();
        setOverview(dataO);
      }
      if (resRev.ok) {
        const dataR = await resRev.json();
        setRevenueData(dataR);
      }
    } catch (err) {
      console.error("Failed to load dashboard analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-cyan border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Aggregating real-time merchant revenue analytics...</p>
        </div>
      </div>
    );
  }

  const totalPaid = Number(overview?.total_paid_revenue || 0);
  const baselineRev = Number(overview?.baseline_revenue || 0);
  const aiIncremental = Number(overview?.ai_incremental_revenue || 0);
  const recoveredVal = Number(overview?.recovered_order_value || 0);

  const baselinePct = totalPaid > 0 ? Math.round((baselineRev / totalPaid) * 100) : 100;
  const aiPct = totalPaid > 0 ? Math.round((aiIncremental / totalPaid) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Store Overview &amp; Analytics</h1>
            <Badge variant="mint" className="text-[10px] py-0.5">Live Database</Badge>
          </div>
          <p className="text-xs text-revora-muted mt-1">
            Real-time store revenue, order history, and customer growth analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/?view=storefront">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-revora-border">
              Customer Storefront
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <Button onClick={loadData} variant="primary" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="h-3 w-3" />
            Refresh Analytics
          </Button>
        </div>
      </div>

      {/* Gated Approvals Alert (if any) */}
      {overview?.pending_approvals_count > 0 && (
        <div className="rounded-xl border border-purple-500/40 bg-purple-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-900/60 text-purple-300 shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {overview.pending_approvals_count} AI Growth Opportunities Gated for Review
              </span>
              <span className="text-[11px] text-purple-200/80">
                Safety Engine intercepted proposals exceeding automatic discount thresholds.
              </span>
            </div>
          </div>
          <Link href="/growth">
            <Button variant="primary" size="sm" className="text-xs gap-1 py-1.5 shrink-0">
              Review Approval Queue
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Paid Revenue */}
        <Card className="p-5 border-revora-border bg-revora-surface space-y-2 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>TOTAL PAID REVENUE</span>
            <ShoppingCart className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ₹{totalPaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">
            Across {overview?.paid_orders_count || 0} successfully settled orders
          </div>
        </Card>

        {/* AI Incremental Revenue */}
        <Card className="p-5 border-emerald-800/60 bg-emerald-950/20 space-y-2 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI INCREMENTAL REVENUE
            </span>
            <Badge variant="mint" className="text-[10px]">+{overview?.ai_contribution_pct || 0}%</Badge>
          </div>
          <div className="text-2xl font-extrabold text-revora-mint font-mono">
            +₹{aiIncremental.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">
            Net revenue from accepted AI cross-sells &amp; bundles
          </div>
        </Card>

        {/* Recovered Order Value */}
        <Card className="p-5 border-revora-border bg-revora-surface space-y-2 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              RECOVERED ORDER VALUE
            </span>
            <Badge variant="emerald" className="text-[10px]">{overview?.recovery_success_rate || 0}% Success</Badge>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{recoveredVal.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">
            Rescued from checkout bank &amp; network drops
          </div>
        </Card>

        {/* AOV & Lift */}
        <Card className="p-5 border-revora-border bg-revora-surface space-y-2 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>AVERAGE ORDER VALUE</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ₹{Number(overview?.aov || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">
            AI AOV Lift: <strong className="text-revora-mint">+{overview?.ai_aov_lift_pct || 0}%</strong> vs baseline
          </div>
        </Card>
      </div>

      {/* Revenue Attribution Invariant Visual */}
      <Card className="p-6 border-revora-border bg-revora-surface space-y-5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-revora-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Multi-Dimensional Revenue Attribution Ledger
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strict Mathematical Invariant: Total Paid Revenue = Baseline Revenue + AI Incremental Revenue
            </p>
          </div>
          <Badge variant="mint" className="text-[10px]">Zero Double-Counting Guarantee</Badge>
        </div>

        {/* Visual Balance Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full bg-revora-bg overflow-hidden flex border border-revora-border">
            <div 
              style={{ width: `${baselinePct}%` }} 
              className="bg-slate-700 h-full transition-all duration-500" 
              title={`Baseline: ₹${baselineRev}`} 
            />
            <div 
              style={{ width: `${aiPct}%` }} 
              className="bg-gradient-to-r from-emerald-500 to-revora-mint h-full transition-all duration-500" 
              title={`AI Incremental: +₹${aiIncremental}`} 
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700 inline-block" />
              <span className="text-slate-300">Baseline Purchases: <strong>₹{baselineRev.toFixed(2)}</strong> ({baselinePct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-emerald-400">AI Incremental Add-ons: <strong>+₹{aiIncremental.toFixed(2)}</strong> ({aiPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-400 inline-block" />
              <span className="text-teal-400">Recovered Dimension: <strong>₹{recoveredVal.toFixed(2)}</strong> (Classification)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-revora-bg p-3 text-[11px] text-slate-400 leading-relaxed border border-revora-border/60">
          <strong className="text-slate-200">Financial Audit Principle:</strong> Recovered order value represents revenue rescued by the AI Recovery Engine that is already accounted for within Total Paid Revenue. It is tracked as an analytical recovery dimension and is <em>never added twice</em> to merchant funds.
        </div>
      </Card>

      {/* Recent Orders & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 p-6 border-revora-border bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between border-b border-revora-border pb-3">
            <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
            <Link href="/orders" className="text-xs text-revora-cyan hover:underline flex items-center gap-1">
              View all orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {revenueData?.recent_transactions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-slate-400 border-b border-revora-border">
                  <tr>
                    <th className="pb-2">Order Reference</th>
                    <th className="pb-2">Baseline</th>
                    <th className="pb-2">AI Incremental</th>
                    <th className="pb-2">Classification</th>
                    <th className="pb-2 text-right">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-revora-border/40">
                  {revenueData.recent_transactions.map((tx: any) => (
                    <tr key={tx.order_number} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-mono font-semibold text-white">
                        {tx.order_number}
                      </td>
                      <td className="py-2.5 text-slate-300 font-mono">₹{tx.baseline_revenue}</td>
                      <td className="py-2.5 font-mono">
                        {Number(tx.ai_incremental_revenue) > 0 ? (
                          <span className="text-revora-cyan font-bold">+₹{tx.ai_incremental_revenue}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {tx.is_recovered ? (
                          <Badge variant="purple" className="text-[10px]">Recovered Order</Badge>
                        ) : (
                          <span className="text-[11px] text-slate-500">Direct Conversion</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">
                        ₹{tx.total_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders settled yet. Run a checkout on the Storefront to see live transactions.
            </div>
          )}
        </Card>

        {/* Quick Safety & Controls Summary */}
        <Card className="lg:col-span-4 p-6 border-revora-border bg-slate-900/80 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-revora-border pb-3 flex items-center justify-between">
            <span>Safety &amp; Guardrails</span>
            <Link href="/safety" className="text-xs text-revora-cyan hover:underline">
              Edit Rules
            </Link>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-revora-border/40">
              <span className="text-slate-400">Auto Discount Cap:</span>
              <span className="font-semibold text-white font-mono">10.00% (₹300 max)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-revora-border/40">
              <span className="text-slate-400">Auto Bundle Limit:</span>
              <span className="font-semibold text-white font-mono">15.00%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-revora-border/40">
              <span className="text-slate-400">Approval Gating:</span>
              <span className="font-semibold text-amber-400 font-mono">Above ₹5,000</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Safety Engine:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active &amp; Deterministic
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/audit">
              <Button variant="outline" size="sm" className="w-full text-xs text-slate-300 border-revora-border hover:bg-slate-800">
                View Immutable Audit Trail
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
