"use client";

import { Sparkles, ArrowRight, CheckCircle2, User, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/ProductImage";
import { useState } from "react";
import { addToCart } from "@/lib/cartService";

interface ShopWithRevoraPreviewProps {
  onOpenAssistant: (prompt?: string) => void;
}

export function ShopWithRevoraPreview({ onOpenAssistant }: ShopWithRevoraPreviewProps) {
  const [added, setAdded] = useState(false);

  const handleQuickAddShoe = async () => {
    try {
      // Add Velocity Nitro running shoes
      await addToCart("prod-1", 1, true);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // Fallback
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-bold text-revora-mint">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span>Conversational Discovery</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Shopping that starts with what you actually need.
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Skip generic keyword searches. Tell REVORA your training goal, budget, and preferences for tailored athletic recommendations.
        </p>
      </div>

      {/* Realistic Interaction Dialogue Showcase */}
      <div className="max-w-3xl mx-auto rounded-3xl border border-revora-border bg-revora-surface p-6 sm:p-8 shadow-2xl space-y-5">

        {/* Customer Prompt Message */}
        <div className="flex items-start gap-3 justify-end">
          <div className="max-w-md rounded-2xl bg-emerald-950/80 border border-emerald-800/80 p-4 text-xs text-slate-100 shadow-md space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Rahul Sharma (Shopper)</span>
              </span>
              <span className="text-slate-400 font-normal">Customer Query</span>
            </div>
            <p className="font-medium text-white text-xs sm:text-[13px] leading-relaxed">
              &ldquo;I need running shoes for daily training under ₹3,000.&rdquo;
            </p>
          </div>
        </div>

        {/* REVORA Assistant Response */}
        <div className="flex items-start gap-3 justify-start">
          <div className="max-w-lg w-full rounded-2xl bg-revora-bg/90 border border-revora-border p-5 text-xs text-slate-200 shadow-lg space-y-4">
            {/* Assistant Header */}
            <div className="flex items-center justify-between border-b border-revora-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-white text-xs">REVORA Commerce Assistant</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                Catalog Match: 100%
              </span>
            </div>

            {/* Structured Recommendation Card */}
            <div className="rounded-xl border border-emerald-900/60 bg-revora-surface p-3.5 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-revora-bg shrink-0 border border-revora-border relative">
                <ProductImage
                  src="/images/products/footwear/velocity-nitro-running-shoes.jpg"
                  alt="Velocity Nitro Running Shoes"
                  category="Footwear & Running"
                  priority={true}
                  className="h-full w-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="space-y-1 flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">
                    Velocity Nitro Running Shoes
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ₹2,499
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Matches your budget (₹2,499 &lt; ₹3,000)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-slate-500" />
                    <span>Engineered for daily mileage &amp; tempo workouts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-slate-500" />
                    <span>Pairs well with Breathable Cushion Socks (+₹299)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                onClick={handleQuickAddShoe}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                {added ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-revora-mint" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Velocity Nitro to Cart</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => onOpenAssistant("I need running shoes for daily training under ₹3,000")}
                variant="outline"
                size="sm"
                className="text-xs font-semibold border-revora-border text-slate-300 hover:text-white gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Open Full Assistant Modal</span>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
