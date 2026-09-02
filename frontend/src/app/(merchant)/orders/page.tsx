"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingCart, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/merchant/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load merchant orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const totalPaidRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const totalAIIncremental = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + Number(o.ai_incremental_revenue), 0);

  const totalRecovered = orders
    .filter((o) => o.status === "PAID" && o.is_recovered)
    .reduce((sum, o) => sum + Number(o.recovered_revenue), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="h-6 w-6 text-revora-razor" />
            Merchant Orders &amp; Revenue Ledger
          </h1>
          <p className="text-xs text-revora-muted mt-1">
            Real-time transaction tracking with multi-dimensional attribution (Baseline, AI Incremental, and Recovered Revenue).
          </p>
        </div>
        <Button onClick={loadOrders} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Orders
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium">TOTAL PAID REVENUE</span>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            ₹{totalPaidRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Authoritative collected merchant funds</span>
        </Card>

        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 text-revora-cyan">
            <Sparkles className="h-3 w-3" />
            AI INCREMENTAL REVENUE
          </span>
          <div className="text-2xl font-extrabold text-revora-cyan mt-1 font-mono">
            +₹{totalAIIncremental.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Cross-sells, upsells, &amp; smart bundles</span>
        </Card>

        <Card className="p-5 border-revora-border bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 text-emerald-400">
            <RefreshCw className="h-3 w-3" />
            AI RECOVERED REVENUE
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            ₹{totalRecovered.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Orders rescued from payment failure</span>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Merchant Orders</h3>
          <span className="text-xs text-slate-400">{orders.length} orders recorded</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p>No orders processed yet.</p>
            <p className="text-[11px] text-slate-500">
              Complete a checkout on the Storefront to see live orders appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-revora-border text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="pb-2">Order Reference</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Baseline</th>
                  <th className="pb-2">AI Incremental</th>
                  <th className="pb-2">Attribution Dimension</th>
                  <th className="pb-2 text-right">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-revora-border/40">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-semibold text-white">
                      {o.order_number}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-200">{o.customer_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{o.customer_email}</div>
                    </td>
                    <td className="py-3">
                      {o.status === "PAID" ? (
                        <Badge variant="emerald" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          PAID
                        </Badge>
                      ) : o.status === "PAYMENT_FAILED" ? (
                        <Badge variant="amber" className="text-[10px]">FAILED</Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px]">{o.status}</Badge>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      ₹{o.baseline_revenue}
                    </td>
                    <td className="py-3 font-mono">
                      {Number(o.ai_incremental_revenue) > 0 ? (
                        <span className="text-revora-cyan font-semibold">+₹{o.ai_incremental_revenue}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      {o.is_recovered ? (
                        <Badge variant="purple" className="text-[10px] gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Recovered (₹{o.recovered_revenue})
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-slate-500">Standard Conversion</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white">
                      ₹{o.total_amount}
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
