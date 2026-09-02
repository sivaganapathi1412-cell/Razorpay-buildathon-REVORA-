"use client";

import { useEffect, useState } from "react";
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Clock, 
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function GrowthCenterPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("revora_access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resApp, resGro] = await Promise.all([
        fetch(`${API_BASE}/approvals`, { headers }),
        fetch(`${API_BASE}/analytics/growth`, { headers }),
      ]);

      if (resApp.ok) {
        const appData = await resApp.json();
        setApprovals(appData);
      }
      if (resGro.ok) {
        const groData = await resGro.json();
        setGrowthData(groData);
      }
    } catch (err) {
      console.error("Failed to load growth data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    setActingId(id);
    setError(null);
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/approvals/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: "Approved by merchant in control center." }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Approval failed.");
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to approve opportunity.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    setError(null);
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/approvals/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: "Rejected by merchant." }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Rejection failed.");
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to reject opportunity.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-purple border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Loading growth opportunities and approval ledger...</p>
        </div>
      </div>
    );
  }

  const gatedOpps = approvals.filter((a) => a.status === "GATED");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Brain className="h-6 w-6 text-revora-purple" />
            AI Growth Center &amp; Human Approvals
          </h1>
          <p className="text-xs text-revora-muted mt-1">
            Review and approve AI-generated promotions, upsells, and bundle offers that exceed automatic discount limits.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Queue
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">TOTAL OPPORTUNITIES DETECTED</span>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            {growthData?.total_opportunities || approvals.length}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Cross-sells, upsells, &amp; bundles formulated</span>
        </Card>

        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">AVERAGE PROJECTED AOV LIFT</span>
          <div className="text-2xl font-extrabold text-revora-cyan mt-1 font-mono">
            +{growthData?.average_projected_aov_lift || 0}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Estimated basket size expansion</span>
        </Card>

        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">PENDING GATED REVIEWS</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
            {gatedOpps.length}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Require human-in-the-loop decision</span>
        </Card>
      </div>

      {/* Human-in-the-Loop Pending Approvals Queue */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-revora-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              Gated Opportunities Queue (Human-in-the-Loop)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              These promotions were formulated by the AI Growth Engine but exceed automatic discount guardrails.
            </p>
          </div>
          <Badge variant="purple" className="text-xs font-mono">{gatedOpps.length} Pending</Badge>
        </div>

        {gatedOpps.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="font-medium text-slate-300">Approval Queue is Clean</p>
            <p className="text-[11px] text-slate-500">
              All active AI commerce proposals are within automatic policy limits.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gatedOpps.map((opp) => (
              <div key={opp.id} className="rounded-xl border border-revora-border bg-slate-950/70 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{opp.bundle_name}</span>
                      <Badge variant="amber" className="text-[10px]">GATED</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opp.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => handleReject(opp.id)}
                      disabled={actingId === opp.id}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-400 hover:bg-red-950/30 gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(opp.id)}
                      disabled={actingId === opp.id}
                      variant="primary"
                      size="sm"
                      className="text-xs font-semibold gap-1 px-4"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve for Customers
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-revora-border/40 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROPOSED DISCOUNT</span>
                    <span className="text-amber-400 font-bold">{opp.proposed_discount_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROJECTED AOV LIFT</span>
                    <span className="text-revora-cyan font-bold">+{opp.projected_aov_lift_pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TARGET PRODUCT</span>
                    <span className="text-slate-200 truncate block">{opp.primary_product?.name || "Product"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">REASON FOR GATING</span>
                    <span className="text-slate-400 truncate block">{opp.metadata_json?.gating_reason || "Exceeds auto-limit"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Historical Opportunities Ledger */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-semibold text-white">All Growth Proposals Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 border-b border-revora-border">
              <tr>
                <th className="pb-2">Proposal Name</th>
                <th className="pb-2">Target Product</th>
                <th className="pb-2">Proposed Discount</th>
                <th className="pb-2">Projected Lift</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-revora-border/40">
              {approvals.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-semibold text-white">{opp.bundle_name}</td>
                  <td className="py-2.5 text-slate-300">{opp.primary_product?.name || "—"}</td>
                  <td className="py-2.5 font-mono text-slate-300">{opp.proposed_discount_pct}%</td>
                  <td className="py-2.5 font-mono text-revora-cyan">+{opp.projected_aov_lift_pct}%</td>
                  <td className="py-2.5">
                    {opp.status === "APPROVED" ? (
                      <Badge variant="emerald" className="text-[10px]">APPROVED</Badge>
                    ) : opp.status === "REJECTED" ? (
                      <Badge variant="red" className="text-[10px]">REJECTED</Badge>
                    ) : opp.status === "GATED" ? (
                      <Badge variant="amber" className="text-[10px]">GATED</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px]">{opp.status}</Badge>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-slate-500 text-[11px] font-mono">
                    {new Date(opp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
