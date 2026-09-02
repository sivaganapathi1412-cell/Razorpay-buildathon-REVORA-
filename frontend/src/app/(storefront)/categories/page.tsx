"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  {
    name: "Footwear & Running",
    slug: "footwear-running",
    description: "Carbon-plated racers, trail blazers, high-cushion daily trainers, and marathon shoes engineered for peak speed.",
    count: 20,
    icon: "/images/categories/footwear-running.jpg",
    badge: "20 Products",
  },
  {
    name: "Apparel & Activewear",
    slug: "apparel-activewear",
    description: "Ultralight aerodynamic tees, compression shorts, thermal winter layers, and weather-shield jackets.",
    count: 20,
    icon: "/images/categories/apparel-activewear.jpg",
    badge: "20 Products",
  },
  {
    name: "Accessories & Gear",
    slug: "accessories-gear",
    description: "Anti-blister sports cushion socks, hydration vests, silicone bottles, gym duffels, and running caps.",
    count: 20,
    icon: "/images/categories/accessories-gear.jpg",
    badge: "20 Products",
  },
  {
    name: "Electronics & Wearables",
    slug: "electronics-wearables",
    description: "GPS multi-sport smartwatches, heart-rate chest straps, sweatproof earbuds, and clip-on safety LED lights.",
    count: 20,
    icon: "/images/categories/electronics-wearables.jpg",
    badge: "20 Products",
  },
  {
    name: "Nutrition & Recovery",
    slug: "nutrition-recovery",
    description: "Fast-absorption isotonic electrolyte drink mixes, plant protein powders, endurance energy gels, and recovery foam rollers.",
    count: 20,
    icon: "/images/categories/nutrition-recovery.jpg",
    badge: "20 Products",
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-revora-bg py-12 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md mb-4">
            <Layers className="h-3.5 w-3.5 text-revora-mint" />
            <span>Athletic Performance Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
            Explore by Category
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            Browse our complete 100-product catalog across 5 specialized athletic departments, powered by Revora AI real-time recommendation &amp; recovery intelligence.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalog?category=${encodeURIComponent(cat.name)}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-revora-border bg-revora-surface/80 p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-revora-bg border border-emerald-800/40 shrink-0 group-hover:scale-105 transition-transform shadow-md">
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Badge variant="mint" className="text-xs">
                    {cat.badge}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {cat.name}
                </h2>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-revora-border/60 pt-4 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                <span>View Products ({cat.count})</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}

          {/* Quick AI Shopping Card */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-slate-900/90 p-6 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-revora-mint" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-revora-mint uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                  AI ASSISTANT
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Need Personalized Advice?</h2>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Chat with Revora AI Shopping Assistant to get instant product matches, marathon gear recommendations, and bundle discounts.
              </p>
            </div>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-revora-mint" />
              <span>Explore Entire Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
