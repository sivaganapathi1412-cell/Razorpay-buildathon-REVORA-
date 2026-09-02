"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Sliders, 
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function SafetyCenterPage() {
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [maxDiscountPct, setMaxDiscountPct] = useState("10.00");
  const [maxDiscountAmt, setMaxDiscountAmt] = useState("300.00");
  const [maxBundlePct, setMaxBundlePct] = useState("15.00");
  const [highValueThreshold, setHighValueThreshold] = useState("5000.00");
  const [autoRecoveryMax, setAutoRecoveryMax] = useState("100.00");

  // Feature Toggles
  const [upsellEnabled, setUpsellEnabled] = useState(true);
  const [crossSellEnabled, setCrossSellEnabled] = useState(true);
  const [bundleEnabled, setBundleEnabled] = useState(true);
  const [recoveryEnabled, setRecoveryEnabled] = useState(true);

  // Interactive Policy Simulator State
  const [simActionType, setSimActionType] = useState("CROSS_SELL");
  const [simDiscountPct, setSimDiscountPct] = useState("12.00");
  const [simDiscountAmt, setSimDiscountAmt] = useState("250.00");
  const [simOrderAmt, setSimOrderAmt] = useState("2000.00");
  const [simulating, setSimulating] = useState(false);
  const [simDecision, setSimDecision] = useState<any>(null);

  const loadRules = async () => {
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/safety/rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data);
        setMaxDiscountPct(String(data.max_discount_percentage));
        setMaxDiscountAmt(String(data.max_discount_amount));
        setMaxBundlePct(String(data.max_bundle_discount_pct));
        setHighValueThreshold(String(data.require_approval_above_amount));
        setAutoRecoveryMax(String(data.auto_recovery_incentive_max));

        const custom = data.custom_rules || {};
        setUpsellEnabled(custom.upsell_enabled ?? true);
        setCrossSellEnabled(custom.cross_sell_enabled ?? true);
        setBundleEnabled(custom.bundle_enabled ?? true);
        setRecoveryEnabled(custom.recovery_enabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load safety rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/safety/rules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          max_discount_percentage: Number(maxDiscountPct),
          max_discount_amount: Number(maxDiscountAmt),
          max_bundle_discount_pct: Number(maxBundlePct),
          auto_recovery_incentive_max: Number(autoRecoveryMax),
          require_approval_above_amount: Number(highValueThreshold),
          custom_rules: {
            upsell_enabled: upsellEnabled,
            cross_sell_enabled: crossSellEnabled,
            bundle_enabled: bundleEnabled,
            recovery_enabled: recoveryEnabled,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update rules.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadRules();
    } catch (err: any) {
      setError(err.message || "Failed to update safety guardrails.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimDecision(null);
    try {
      const token = localStorage.getItem("revora_access_token");
      const res = await fetch(`${API_BASE}/safety/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: simActionType,
          discount_pct: Number(simDiscountPct),
          discount_amount: Number(simDiscountAmt),
          order_amount: Number(simOrderAmt),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimDecision(data);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-revora-cyan border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Loading deterministic safety policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-revora-emerald" />
            Merchant Safety Center &amp; Guardrails
          </h1>
          <p className="text-xs text-revora-muted mt-1">
            Deterministic governance bounds, maximum discount thresholds, and human-in-the-loop gating controls.
          </p>
        </div>
        <Badge variant="emerald" className="gap-1 text-xs py-1 px-3">
          <Lock className="h-3.5 w-3.5" />
          Deterministic Backend Guardrails Active
        </Badge>
      </div>

      {/* Policy Plain-English Summary */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-200 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
        <div>
          <strong>Active Merchant Policy:</strong> Revora AI can automatically offer discounts up to{" "}
          <strong>{maxDiscountPct}%</strong>, capped at <strong>₹{maxDiscountAmt}</strong> per item. Bundle discounts are allowed up to{" "}
          <strong>{maxBundlePct}%</strong>. Any transaction above <strong>₹{highValueThreshold}</strong> requires manual human approval.
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Merchant safety guardrails saved and applied to all active AI agents.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Guardrail Controls */}
        <form onSubmit={handleSaveRules} className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-revora-border bg-slate-900/80 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-revora-border pb-3">
              <Sliders className="h-4 w-4 text-revora-cyan" />
              Autonomous Discount Limits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Auto Discount % (0%–25%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="25"
                  value={maxDiscountPct}
                  onChange={(e) => setMaxDiscountPct(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-revora-cyan text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Proposals above this are gated for approval.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Auto Discount Amount (₹)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  max="2000"
                  value={maxDiscountAmt}
                  onChange={(e) => setMaxDiscountAmt(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-revora-cyan text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Absolute financial cap per single item.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Bundle Discount % (0%–30%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="30"
                  value={maxBundlePct}
                  onChange={(e) => setMaxBundlePct(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-revora-cyan text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Smart bundle packages limit.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  High-Value Approval Threshold (₹)
                </label>
                <input
                  type="number"
                  step="100"
                  min="500"
                  max="50000"
                  value={highValueThreshold}
                  onChange={(e) => setHighValueThreshold(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-revora-cyan text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Orders above this always require approval.</span>
              </div>
            </div>
          </Card>

          {/* Feature Toggles */}
          <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-revora-border pb-3">
              AI Action Capability Toggles
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-revora-border/50 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">AI Upsell Recommendations</span>
                  <span className="text-[11px] text-slate-400">Suggest premium upgrades on product detail views.</span>
                </div>
                <input
                  type="checkbox"
                  checked={upsellEnabled}
                  onChange={(e) => setUpsellEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-revora-cyan focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-revora-border/50 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">AI Cross-Sell Add-ons</span>
                  <span className="text-[11px] text-slate-400">Offer complementary items (e.g. running socks with shoes).</span>
                </div>
                <input
                  type="checkbox"
                  checked={crossSellEnabled}
                  onChange={(e) => setCrossSellEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-revora-cyan focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-revora-border/50 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">Smart Multi-Item Bundles</span>
                  <span className="text-[11px] text-slate-400">Allow autonomous generation of multi-product package deals.</span>
                </div>
                <input
                  type="checkbox"
                  checked={bundleEnabled}
                  onChange={(e) => setBundleEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-revora-cyan focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-revora-border/50 cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">Autonomous Revenue Recovery</span>
                  <span className="text-[11px] text-slate-400">Intercept checkout interruptions and hold carts safely.</span>
                </div>
                <input
                  type="checkbox"
                  checked={recoveryEnabled}
                  onChange={(e) => setRecoveryEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-revora-cyan focus:ring-0"
                />
              </label>
            </div>
          </Card>

          <Button type="submit" disabled={saving} variant="primary" size="md" className="gap-2 text-xs font-semibold px-6">
            <Save className="h-4 w-4" />
            {saving ? "Saving Guardrails..." : "Save Safety Policies"}
          </Button>
        </form>

        {/* Right Column: Interactive Safety Policy Evaluator */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border-revora-border bg-slate-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-revora-border pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Live Policy Evaluator Tool
              </h3>
              <Badge variant="purple" className="text-[10px]">Test Harness</Badge>
            </div>

            <p className="text-[11px] text-slate-400">
              Test any hypothetical AI commerce proposal against your active safety rules to observe deterministic decisions in real time.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Action Type</label>
                <select
                  value={simActionType}
                  onChange={(e) => setSimActionType(e.target.value)}
                  className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="CROSS_SELL">Cross-Sell Add-on</option>
                  <option value="UPSELL">Upsell Recommendation</option>
                  <option value="BUNDLE">Smart Bundle</option>
                  <option value="PROMOTIONAL_DISCOUNT">Direct Promo Discount</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Proposed Discount %</label>
                  <input
                    type="number"
                    value={simDiscountPct}
                    onChange={(e) => setSimDiscountPct(e.target.value)}
                    className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Order Amount (₹)</label>
                  <input
                    type="number"
                    value={simOrderAmt}
                    onChange={(e) => setSimOrderAmt(e.target.value)}
                    className="w-full rounded-lg border border-revora-border bg-slate-950 px-3 py-2 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulating}
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-revora-cyan text-revora-cyan hover:bg-revora-cyan/10"
              >
                <Zap className="h-3.5 w-3.5" />
                {simulating ? "Evaluating..." : "Evaluate Proposal Against Safety Engine"}
              </Button>
            </div>

            {/* Decision Output Card */}
            {simDecision && (
              <div className={`mt-4 rounded-xl border p-4 text-xs space-y-2.5 transition-all ${
                simDecision.policy_result === "PASSED"
                  ? "border-emerald-500/50 bg-emerald-950/30"
                  : simDecision.policy_result === "GATED"
                  ? "border-purple-500/50 bg-purple-950/30"
                  : "border-red-500/50 bg-red-950/30"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px]">Safety Engine Decision</span>
                  {simDecision.policy_result === "PASSED" ? (
                    <Badge variant="emerald" className="gap-1 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" />
                      PASSED (Auto Allowed)
                    </Badge>
                  ) : simDecision.policy_result === "GATED" ? (
                    <Badge variant="purple" className="gap-1 text-[10px]">
                      <AlertTriangle className="h-3 w-3" />
                      GATED (Approval Required)
                    </Badge>
                  ) : (
                    <Badge variant="red" className="gap-1 text-[10px]">
                      <XCircle className="h-3 w-3" />
                      REJECTED
                    </Badge>
                  )}
                </div>

                <p className="text-slate-200 leading-relaxed font-medium">
                  {simDecision.reason}
                </p>

                <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-400 space-y-1">
                  <div>Policy Name: <span className="text-slate-200 font-mono">{simDecision.policy_name}</span></div>
                  <div>Proposed: <span className="text-slate-200 font-mono">{simDecision.proposed_value}%</span> | Rule Threshold: <span className="text-slate-200 font-mono">{simDecision.rule_threshold}%</span></div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
