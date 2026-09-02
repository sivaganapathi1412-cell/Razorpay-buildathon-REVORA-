"use client";

import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight, Store, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";

export default function OnboardingPage() {
  const { merchant, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-revora-bg via-[#0c1220] to-revora-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Store Successfully Provisioned!
          </h1>
          <p className="text-xs text-revora-muted">
            Welcome, <strong>{user?.full_name || "Merchant"}</strong>. Your Revora AI store is ready with deterministic safety policies.
          </p>
        </div>

        {/* Store Profile Card */}
        <Card className="p-6 border-revora-border bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between border-b border-revora-border pb-3">
            <div className="flex items-center gap-2.5">
              <Store className="h-5 w-5 text-revora-cyan" />
              <div>
                <h3 className="text-sm font-semibold text-white">{merchant?.name || "Revora Store"}</h3>
                <span className="text-[11px] text-slate-400 font-mono">slug: {merchant?.slug || "store-slug"}</span>
              </div>
            </div>
            <Badge variant="emerald">Live Tenant Active</Badge>
          </div>

          {/* Default Safety Rules Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Automated Safety Policy Bounds (Pre-Configured)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-revora-border/60">
              <div>
                <span className="text-slate-400">Max Auto Discount:</span>
                <div className="font-semibold text-slate-200">10% per item / bundle</div>
              </div>
              <div>
                <span className="text-slate-400">Max Monetary Cap:</span>
                <div className="font-semibold text-slate-200">₹300.00 max discount waiver</div>
              </div>
              <div>
                <span className="text-slate-400">Max Bundle Discount:</span>
                <div className="font-semibold text-slate-200">15% bundle discount ceiling</div>
              </div>
              <div>
                <span className="text-slate-400">High-Impact Approval:</span>
                <div className="font-semibold text-slate-200">Orders &gt; ₹5,000 require gating</div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="w-full gap-2 text-xs font-semibold">
                Launch Merchant Command Center
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
