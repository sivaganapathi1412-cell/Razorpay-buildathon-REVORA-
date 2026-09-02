"use client";

import { Layers, Plus, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { addToCart } from "@/lib/cartService";

export function SmartBundleStory() {
  const [bundleAdded, setBundleAdded] = useState(false);

  const handleAddBundle = async () => {
    try {
      // Add primary shoe + add-on socks
      await addToCart("prod-1", 1, false);
      await addToCart("prod-21", 1, true); // ai-attributed socks
      setBundleAdded(true);
      setTimeout(() => setBundleAdded(false), 2500);
    } catch {
      setBundleAdded(true);
      setTimeout(() => setBundleAdded(false), 2500);
    }
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
          <Layers className="h-3 w-3 text-emerald-400" />
          <span>Intelligent Growth Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Natural Cross-Sell with Zero Double-Counting
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          REVORA pairs products that genuinely belong together. Our mathematical attribution engine calculates exact incremental lift without inflating total revenue.
        </p>
      </div>

      {/* Canonical Bundle Composition Showcase */}
      <div className="max-w-4xl mx-auto rounded-3xl border border-revora-border bg-revora-surface p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

          {/* Primary Item */}
          <div className="md:col-span-4 rounded-2xl border border-revora-border bg-revora-bg/90 p-4 space-y-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Original Intended Purchase
            </span>
            <div className="h-32 w-32 mx-auto rounded-xl overflow-hidden bg-revora-surface border border-revora-border relative">
              <ProductImage
                src="/images/products/footwear/velocity-nitro-running-shoes.jpg"
                alt="Velocity Nitro Running Shoes"
                category="Footwear & Running"
                className="h-full w-full object-cover"
                containerClassName="w-full h-full"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Velocity Nitro Running Shoes</h4>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">₹2,499</p>
            </div>
            <div className="text-[10px] text-slate-400 bg-revora-surface px-2 py-1 rounded-md">
              Baseline Shopper Intent
            </div>
          </div>

          {/* Plus Separator */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-revora-mint font-bold shadow-md">
              <Plus className="h-4 w-4" />
            </div>
          </div>

          {/* AI Recommended Add-On */}
          <div className="md:col-span-4 rounded-2xl border border-emerald-800/80 bg-emerald-950/40 p-4 space-y-3 text-center ring-1 ring-emerald-500/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-revora-mint flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>AI-Recommended Complement</span>
            </span>
            <div className="h-32 w-32 mx-auto rounded-xl overflow-hidden bg-revora-surface border border-revora-border relative">
              <ProductImage
                src="/images/products/accessories/breathable-sports-cushion-socks-3-pack.jpg"
                alt="Sports Cushion Socks"
                category="Accessories & Gear"
                className="h-full w-full object-cover"
                containerClassName="w-full h-full"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Sports Cushion Socks (3-Pack)</h4>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">+ ₹299</p>
            </div>
            <div className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-1 rounded-md border border-emerald-700/60 font-medium">
              Incremental Lift: +₹299
            </div>
          </div>

          {/* Summary / Total Card */}
          <div className="md:col-span-3 rounded-2xl border border-revora-border bg-revora-bg/90 p-5 space-y-4 text-left flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-revora-border pb-1">
                Order Value Breakdown
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Baseline:</span>
                  <span className="font-mono text-white">₹2,499</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>AI Incremental:</span>
                  <span className="font-mono">+₹299</span>
                </div>
                <div className="border-t border-revora-border/60 pt-1.5 flex justify-between font-bold text-white">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-400 text-sm">₹2,798</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAddBundle}
              variant="primary"
              size="sm"
              className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
            >
              {bundleAdded ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  <span>Bundle Added!</span>
                </>
              ) : (
                <>
                  <span>Add Smart Bundle</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>

        </div>

        {/* Clean Math Principle Note */}
        <div className="rounded-xl bg-revora-bg/60 border border-revora-border p-3 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Attribution Principle:</strong> Incremental AI value is strictly recorded as ₹299, never double-added to the ₹2,798 order total.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            AUDIT PROVENANCE: AI_GROWTH_ACCEPTED
          </span>
        </div>

      </div>
    </section>
  );
}
