"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Sparkles, 
  RefreshCw,
  Zap,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedProvenance, setSelectedProvenance] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  // Trace Timeline Modal
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem("revora_access_token");
      let url = `${API_BASE}/audit?limit=100`;
      if (selectedCategory !== "ALL") url += `&category=${selectedCategory}`;
      if (selectedProvenance !== "ALL") url += `&provenance=${selectedProvenance}`;
      if (selectedSeverity !== "ALL") url += `&severity=${selectedSeverity}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedCategory, selectedProvenance, selectedSeverity]);

  const handleOpenTrace = async (traceId: string) => {
    setActiveTraceId(traceId);
    setLoadingTrace(true);
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/audit/trace/${traceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTraceData(data);
      }
    } catch (err) {
      console.error("Failed to load trace timeline:", err);
    } finally {
      setLoadingTrace(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "GROWTH_ACTION":
      case "GROWTH":
        return <Badge variant="cyan" className="text-[10px]">GROWTH</Badge>;
      case "POLICY_CHECK":
      case "SAFETY":
        return <Badge variant="emerald" className="text-[10px]">SAFETY</Badge>;
      case "PAYMENT_EVENT":
      case "PAYMENT":
        return <Badge variant="purple" className="text-[10px]">PAYMENT</Badge>;
      case "RECOVERY_ACTION":
      case "RECOVERY":
        return <Badge variant="amber" className="text-[10px]">RECOVERY</Badge>;
      case "MERCHANT_APPROVAL":
      case "MERCHANT_ACTION":
        return <Badge variant="default" className="text-[10px]">MERCHANT</Badge>;
      default:
        return <Badge variant="default" className="text-[10px]">{cat}</Badge>;
    }
  };

  const getProvenanceBadge = (prov: string) => {
    if (prov === "DEMO_SIMULATION") {
      return <Badge variant="amber" className="text-[10px]">⚡ Demo Simulation</Badge>;
    }
    if (prov === "REAL_RAZORPAY_TEST") {
      return <Badge variant="cyan" className="text-[10px]">Razorpay Test Mode</Badge>;
    }
    if (prov === "AI") {
      return <Badge variant="purple" className="text-[10px]">Autonomous AI</Badge>;
    }
    if (prov === "MERCHANT") {
      return <Badge variant="default" className="text-[10px]">Merchant Action</Badge>;
    }
    return <Badge variant="default" className="text-[10px]">{prov}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-revora-razor" />
            Immutable Audit Trail &amp; Journey Traces
          </h1>
          <p className="text-xs text-revora-muted mt-1">
            Append-only cryptographic ledger of all autonomous AI proposals, Safety Engine evaluations, and payment actions.
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Ledger
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-revora-border bg-slate-900/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Filter className="h-4 w-4 text-revora-cyan" />
          Filter Audit Records
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Event Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-1.5 text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="GROWTH_ACTION">Growth Actions</option>
              <option value="POLICY_CHECK">Safety &amp; Policies</option>
              <option value="PAYMENT_EVENT">Payments &amp; Checkout</option>
              <option value="RECOVERY_ACTION">Revenue Recovery</option>
              <option value="MERCHANT_APPROVAL">Merchant Decisions</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Provenance / Source</label>
            <select
              value={selectedProvenance}
              onChange={(e) => setSelectedProvenance(e.target.value)}
              className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-1.5 text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="REAL_RAZORPAY_TEST">Razorpay Test Mode</option>
              <option value="DEMO_SIMULATION">Demo Simulation</option>
              <option value="AI">AI Autonomous</option>
              <option value="MERCHANT">Merchant User</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-1.5 text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning (Gated)</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Audit Table */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-revora-border pb-3">
          <h3 className="text-sm font-semibold text-white">Cryptographic Event Stream</h3>
          <span className="text-xs text-slate-400 font-mono">{logs.length} events retrieved</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No events matching filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-revora-border">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Agent / Actor</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Event Summary &amp; Context</th>
                  <th className="pb-2">Provenance</th>
                  <th className="pb-2">Trace ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-revora-border/40">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 font-semibold text-slate-200">
                      {log.agent_source}
                    </td>
                    <td className="py-3">
                      {getCategoryBadge(log.event_category)}
                    </td>
                    <td className="py-3 max-w-md">
                      <div className="font-medium text-white">{log.summary}</div>
                      {Number(log.financial_delta) > 0 && (
                        <span className="text-[10px] text-revora-cyan font-mono">
                          Financial Delta: ₹{log.financial_delta}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {getProvenanceBadge(log.provenance)}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleOpenTrace(log.trace_id)}
                        className="font-mono text-[11px] text-revora-cyan hover:underline flex items-center gap-1"
                        title="Click to view full commerce journey trace timeline"
                      >
                        {log.trace_id.substring(0, 8)}...
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Commerce Journey Trace Modal */}
      {activeTraceId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[85vh] bg-slate-900 border-revora-border p-6 shadow-2xl overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-revora-border pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-revora-cyan" />
                  Commerce Journey Trace Viewer
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Trace ID: {activeTraceId}</span>
              </div>
              <Button
                onClick={() => setActiveTraceId(null)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {loadingTrace ? (
              <div className="py-12 text-center text-xs text-slate-400">Tracing journey sequence...</div>
            ) : traceData ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Step-by-step chronological audit trail across all autonomous AI agents and deterministic safety evaluators:
                </p>

                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {traceData.events?.map((ev: any, idx: number) => (
                    <div key={ev.id} className="relative flex items-start gap-3 pl-8">
                      <div className="absolute left-2 top-1.5 h-3.5 w-3.5 rounded-full bg-slate-700 border-2 border-slate-900" />
                      <div className="w-full rounded-lg bg-slate-950/70 p-3 border border-revora-border/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{ev.agent_source} &bull; {ev.event_type}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300">{ev.summary}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                          <span>Provenance: <strong>{ev.provenance}</strong></span>
                          {Number(ev.financial_delta) > 0 && (
                            <span className="text-revora-cyan">Delta: <strong>₹{ev.financial_delta}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">Trace data not found.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
