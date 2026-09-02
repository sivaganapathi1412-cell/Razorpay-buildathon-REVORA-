"use client";

import { useEffect, useState } from "react";
import { 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Clock, 
  ArrowUpRight,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MerchantRecoveryCenterPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecoveryEvents = async () => {
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/recovery/merchant/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to load recovery events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecoveryEvents();
  }, []);

  const totalRecoveredAmount = events
    .filter((e) => e.is_recovered)
    .reduce((sum, e) => sum + Number(e.recovered_amount), 0);

  const totalRecoveredCount = events.filter((e) => e.is_recovered).length;
  const recoveryRate = events.length > 0 ? Math.round((totalRecoveredCount / events.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <RefreshCw className="h-6 w-6 text-revora-emerald" />
            AI Revenue Recovery Center
          </h1>
          <p className="text-xs text-revora-muted mt-1">
            Real-time diagnostics, checkout interruption interception, and safe 1-click payment recovery feed.
          </p>
        </div>
        <Button onClick={loadRecoveryEvents} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Feed
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">TOTAL RECOVERED REVENUE</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            ₹{totalRecoveredAmount.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Saved from payment abandonment</span>
        </Card>

        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">RECOVERY SUCCESS RATE</span>
          <div className="text-2xl font-extrabold text-revora-cyan mt-1 font-mono">
            {recoveryRate}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">{totalRecoveredCount} of {events.length} events converted</span>
        </Card>

        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">ACTIVE AT-RISK ORDERS</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
            {events.filter((e) => !e.is_recovered).length}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Carts preserved for customer retry</span>
        </Card>
      </div>

      {/* Events Table */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Live Recovery Event Ledger</h3>
          <span className="text-xs text-slate-400">{events.length} records persisted</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading recovery records...</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p>No recovery events recorded yet.</p>
            <p className="text-[11px] text-slate-500">
              Run a checkout simulation or test failure to observe the Autonomous Recovery Engine in action.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-revora-border text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="pb-2">Order Reference</th>
                  <th className="pb-2">Failure Cause &amp; Diagnosis</th>
                  <th className="pb-2">Strategy</th>
                  <th className="pb-2">Provenance</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Recovered Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-revora-border/40">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-semibold text-white">
                      {ev.order_number || ev.order_id?.substring(0, 8)}
                    </td>
                    <td className="py-3 max-w-xs">
                      <div className="font-medium text-slate-200">{ev.failure_code || "PAYMENT_FAILED"}</div>
                      <div className="text-[11px] text-slate-400 truncate">{ev.diagnostic_summary}</div>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-300">
                      {ev.recovery_strategy?.strategy_type || "PRESERVE_CART"}
                    </td>
                    <td className="py-3">
                      {ev.provenance === "DEMO_SIMULATION" ? (
                        <Badge variant="amber" className="text-[10px]">⚡ Demo Simulation</Badge>
                      ) : (
                        <Badge variant="cyan" className="text-[10px]">Razorpay Test</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      {ev.is_recovered ? (
                        <Badge variant="emerald" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          RECOVERED
                        </Badge>
                      ) : ev.status === "RETRIED" ? (
                        <Badge variant="purple" className="text-[10px]">RETRIED</Badge>
                      ) : (
                        <Badge variant="amber" className="text-[10px]">ACTIVE AT-RISK</Badge>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white">
                      {ev.is_recovered ? `₹${ev.recovered_amount}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
