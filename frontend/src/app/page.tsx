"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Plus,
  Check,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { addToCart } from "@/lib/cartService";
import { StorefrontNav } from "@/components/layout/StorefrontNav";
import { ShoppingAssistantModal } from "@/components/ai/ShoppingAssistantModal";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { ProductImage } from "@/components/ui/ProductImage";

// Modular Home Components
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { GuidedDemoModal } from "@/components/home/GuidedDemoModal";
import { ShopWithRevoraPreview } from "@/components/home/ShopWithRevoraPreview";
import { SmartBundleStory } from "@/components/home/SmartBundleStory";
import { RecoveryTimeline } from "@/components/home/RecoveryTimeline";
import { WhyRevoraSection } from "@/components/home/WhyRevoraSection";
import { HowRevoraWorks } from "@/components/home/HowRevoraWorks";
import { SafetyTrustSection } from "@/components/home/SafetyTrustSection";
import { MerchantAttributionPreview } from "@/components/home/MerchantAttributionPreview";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function HomeContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");

  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const categories = [
    {
      name: "Footwear & Running",
      slug: "footwear-running",
      desc: "Road racing shoes, trail runners & tempo flats",
      image: "/images/categories/footwear-running.jpg",
      itemCount: "20 Models",
    },
    {
      name: "Apparel & Activewear",
      slug: "apparel-activewear",
      desc: "Sweat-wicking singlets, compression tights & shorts",
      image: "/images/categories/apparel-activewear.jpg",
      itemCount: "20 Styles",
    },
    {
      name: "Accessories & Gear",
      slug: "accessories-gear",
      desc: "Hydration vests, anti-blister socks & running belts",
      image: "/images/categories/accessories-gear.jpg",
      itemCount: "20 Essentials",
    },
    {
      name: "Electronics & Wearables",
      slug: "electronics-wearables",
      desc: "GPS sports watches, optical heart rate sensors & audio",
      image: "/images/categories/electronics-wearables.jpg",
      itemCount: "20 Devices",
    },
    {
      name: "Nutrition & Recovery",
      slug: "nutrition-recovery",
      desc: "Electrolytes, deep tissue massage guns & foam rollers",
      image: "/images/categories/nutrition-recovery.jpg",
      itemCount: "20 Products",
    },
  ];

  const editorialStories = [
    {
      slug: "ai-shopping-assistants-new-interface",
      title: "AI Shopping Assistants: The New Interface for Commerce",
      category: "Commerce AI",
      readTime: "4 min read",
      image: "/images/blog/ai-shopping-assistants-new-interface.jpg",
    },
    {
      slug: "zero-double-counting-revenue-attribution",
      title: "Zero Double-Counting: The Mathematics of Revenue Attribution",
      category: "Fintech",
      readTime: "5 min read",
      image: "/images/blog/zero-double-counting-revenue-attribution.jpg",
    },
    {
      slug: "safety-engines-why-merchants-need-guardrails",
      title: "Safety Engines in Commerce: Why Merchants Need Guardrails",
      category: "Governance",
      readTime: "3 min read",
      image: "/images/blog/safety-engines-why-merchants-need-guardrails.jpg",
    },
  ];

  useEffect(() => {
    // Check if user has entered before in this session or if explicitly requesting storefront view
    if (viewParam === "storefront") {
      setHasEntered(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("revora_gateway_entered", "true");
      }
    } else if (typeof window !== "undefined") {
      const entered = sessionStorage.getItem("revora_gateway_entered");
      setHasEntered(entered === "true");
    } else {
      setHasEntered(false);
    }
  }, [viewParam]);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products?limit=8`);
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data);
        }
      } catch (err) {
        console.error("Failed to load featured products from database:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleQuickAdd = async (product: any) => {
    try {
      await addToCart(product.id, 1, false);
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
    }
  };

  const openAssistantWithPrompt = (prompt?: string) => {
    setInitialPrompt(prompt);
    setIsAiOpen(true);
  };

  // If not entered yet in this session, render the Login Gateway
  if (!hasEntered) {
    return <LoginGateway onContinueCustomer={() => setHasEntered(true)} />;
  }

  return (
    <div className="min-h-screen bg-revora-bg text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <StorefrontNav />

      <main className="space-y-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6">

        {/* =========================================================================
            01 — PREMIUM 3-SLIDE HERO (with 9 coordinated 3D visual elements)
           ========================================================================= */}
        <HeroCarousel
          onOpenAssistant={openAssistantWithPrompt}
          onOpenDemoFlow={() => setIsDemoOpen(true)}
        />

        {/* =========================================================================
            02 — SHOP WITH REVORA (Interactive Commerce Assistant Preview)
           ========================================================================= */}
        <ShopWithRevoraPreview onOpenAssistant={openAssistantWithPrompt} />

        {/* =========================================================================
            03 — SHOP BY CATEGORY (5 Athletic Categories)
           ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-revora-border pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-revora-mint">
                Explore The Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Shop by Athletic Category
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-emerald-400 hover:text-revora-mint inline-flex items-center gap-1 transition-colors"
            >
              <span>View All 100 Products</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                className="group relative rounded-2xl border border-revora-border bg-revora-surface overflow-hidden hover:border-emerald-700/60 transition-all duration-300 flex flex-col justify-between p-3.5 space-y-3 shadow-lg"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-revora-bg relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width={240}
                    height={240}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-2 right-2 z-10">
                    <span className="text-[10px] font-mono font-bold bg-revora-bg/90 text-revora-mint px-2 py-0.5 rounded-full border border-emerald-900/60">
                      {cat.itemCount}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white group-hover:text-revora-mint transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="text-[11px] font-bold text-emerald-400 group-hover:text-revora-mint inline-flex items-center gap-1 pt-1 border-t border-revora-border/60">
                  <span>Explore 20 Items</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            04 — FEATURED PRODUCTS (Curated ~8 Items from Live Database API)
           ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-revora-border pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-revora-mint">
                Curated Selection
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Featured Running &amp; Performance Gear
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-emerald-400 hover:text-revora-mint inline-flex items-center gap-1 transition-colors"
            >
              <span>Browse Full 100 Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-revora-border bg-revora-surface p-4 space-y-4 animate-pulse"
                >
                  <div className="aspect-square bg-revora-bg rounded-xl" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((prod, idx) => (
                <Card
                  key={prod.id || prod.sku}
                  className="rounded-2xl border-revora-border bg-revora-surface hover:border-emerald-800/80 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-lg"
                >
                  <div>
                    <div className="aspect-square w-full bg-revora-bg relative overflow-hidden border-b border-revora-border">
                      <ProductImage
                        src={prod.image_url}
                        alt={prod.name}
                        category={prod.category}
                        priority={idx < 4}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        containerClassName="w-full h-full"
                      />
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="text-[11px] font-mono font-bold bg-revora-bg/95 border border-emerald-900/80 px-2 py-0.5 rounded-md text-emerald-400 shadow-sm">
                          {formatCurrency(Number(prod.price))}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-revora-surface/90 text-revora-mint px-2 py-0.5 rounded border border-emerald-900/60">
                          {prod.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="text-xs font-bold text-white group-hover:text-revora-mint transition-colors line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    <Button
                      onClick={() => handleQuickAdd(prod)}
                      variant="primary"
                      size="sm"
                      className="w-full text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {addedIds[prod.id] ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-revora-mint" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </Button>
                    <Link href={`/product/${prod.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-slate-300 hover:text-white border-revora-border"
                        title="View details"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            05 — SMART BUNDLE STORY (Canonical Shoe ₹2,499 + Socks ₹299 = ₹2,798)
           ========================================================================= */}
        <SmartBundleStory />

        {/* =========================================================================
            06 — WHY REVORA (3 Value Cards)
           ========================================================================= */}
        <WhyRevoraSection />

        {/* =========================================================================
            07 — CHECKOUT RECOVERY STORY ("When checkout goes wrong")
           ========================================================================= */}
        <RecoveryTimeline />

        {/* =========================================================================
            08 — HOW REVORA WORKS (7 Functional Stages)
           ========================================================================= */}
        <HowRevoraWorks />

        {/* =========================================================================
            09 — SAFETY & TRUST (4 Principles + Policy Guardrail Card)
           ========================================================================= */}
        <SafetyTrustSection />

        {/* =========================================================================
            10 — MERCHANT VALUE / ATTRIBUTION PREVIEW
           ========================================================================= */}
        <MerchantAttributionPreview />

        {/* =========================================================================
            11 — BLOG / MAGAZINE HIGHLIGHTS (Editorial Stories)
           ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-revora-border pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-revora-mint">
                Editorial &amp; Insights
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                From The Revora Dispatch
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/blog"
                className="text-xs font-bold text-emerald-400 hover:text-revora-mint inline-flex items-center gap-1 transition-colors"
              >
                <span>Read Blog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/magazine"
                className="text-xs font-bold text-emerald-400 hover:text-revora-mint inline-flex items-center gap-1 transition-colors"
              >
                <span>Issue 01 Magazine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editorialStories.map((story) => (
              <Link
                key={story.slug}
                href={`/blog/${story.slug}`}
                className="group rounded-3xl border border-revora-border bg-revora-surface overflow-hidden hover:border-emerald-800/80 transition-all duration-300 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="aspect-[16/10] w-full overflow-hidden bg-revora-bg relative">
                    <img
                      src={story.image}
                      alt={story.title}
                      width={400}
                      height={250}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-revora-surface/90 text-revora-mint px-2.5 py-1 rounded-md border border-emerald-900/60">
                        {story.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-revora-mint transition-colors line-clamp-2 leading-snug">
                      {story.title}
                    </h3>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 flex items-center justify-between text-xs text-slate-400 border-t border-revora-border/60 pt-3">
                  <span>{story.readTime}</span>
                  <span className="font-bold text-emerald-400 group-hover:text-revora-mint inline-flex items-center gap-1">
                    Read Article &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            12 — FINAL HIGH-IMPACT CTA SECTION
           ========================================================================= */}
        <section className="rounded-3xl border border-emerald-800/60 bg-gradient-to-br from-revora-forest-deep/90 via-revora-surface to-emerald-950/60 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Find better. Buy with confidence. Recover what matters.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore 100 precision performance products, conversational cart building, and intelligent checkout protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
            <Link href="/catalog">
              <Button
                variant="primary"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-950/60 gap-2 border border-emerald-500/40"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Start Shopping</span>
              </Button>
            </Link>
            <Button
              onClick={() => openAssistantWithPrompt()}
              variant="outline"
              size="lg"
              className="border-revora-border bg-revora-bg/80 text-white hover:bg-revora-surface font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl gap-2"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Shop with Revora</span>
            </Button>
          </div>
        </section>

      </main>

      {/* =========================================================================
          13 — FOOTER (Clean Professional Navigation + Buildathon Note)
         ========================================================================= */}
      <footer className="border-t border-revora-border bg-revora-surface/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-10">

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                R
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">REVORA</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Autonomous D2C commerce platform featuring conversational cart creation, smart bundling, and policy-governed payment recovery.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Shop</div>
            <ul className="space-y-1.5">
              <li><Link href="/catalog" className="hover:text-revora-mint transition-colors">100 Products Catalog</Link></li>
              <li><Link href="/categories" className="hover:text-revora-mint transition-colors">Athletic Categories</Link></li>
              <li><Link href="/cart" className="hover:text-revora-mint transition-colors">Your Cart</Link></li>
              <li><Link href="/checkout" className="hover:text-revora-mint transition-colors">Razorpay Checkout</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Discover</div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => openAssistantWithPrompt()}
                  className="hover:text-revora-mint transition-colors text-left"
                >
                  Shop with Revora
                </button>
              </li>
              <li><Link href="/blog" className="hover:text-revora-mint transition-colors">Commerce AI Blog</Link></li>
              <li><Link href="/magazine" className="hover:text-revora-mint transition-colors">Issue 01 Magazine</Link></li>
              <li><Link href="/account" className="hover:text-revora-mint transition-colors">Customer Account</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Platform &amp; Governance</div>
            <ul className="space-y-1.5">
              <li><Link href="/login" className="hover:text-revora-mint transition-colors">Merchant Portal</Link></li>
              <li><Link href="/dashboard" className="hover:text-revora-mint transition-colors">Merchant Dashboard</Link></li>
              <li><Link href="/recovery-center" className="hover:text-revora-mint transition-colors">Recovery Center</Link></li>
              <li><Link href="/safety" className="hover:text-revora-mint transition-colors">Safety Policies</Link></li>
              <li><Link href="/audit" className="hover:text-revora-mint transition-colors">Immutable Audit Log</Link></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-revora-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            &copy; 2026 REVORA AI. Built for the Razorpay AI Buildathon — Autonomous Commerce Track.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Razorpay Test Mode Integration</span>
            <span>&bull;</span>
            <span>Policy Enforced</span>
            <span>&bull;</span>
            <span>Zero Double-Counting</span>
          </div>
        </div>
      </footer>

      {/* Guided Demo Flow Modal */}
      <GuidedDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onStartCustomerDemo={() => openAssistantWithPrompt("I need running shoes for daily training under ₹3,000")}
      />

      {/* Interactive AI Shopping Assistant Modal */}
      <ShoppingAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        initialPrompt={initialPrompt}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-revora-bg flex items-center justify-center text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
