"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Layers,
  Zap,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroCarouselProps {
  onOpenAssistant: (prompt?: string) => void;
  onOpenDemoFlow?: () => void;
}

export function HeroCarousel({ onOpenAssistant, onOpenDemoFlow }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const slides = [
    {
      id: "slide-1",
      badge: "Conversational Commerce",
      badgeIcon: Sparkles,
      headline: "Tell us what you need.\nWe'll help you find it.",
      supporting: "Discover products, compare options and build the right cart with REVORA's shopping assistant.",
      primaryCta: "Shop with Revora",
      primaryAction: () => onOpenAssistant("I need running shoes for daily training under ₹3,000"),
      secondaryCta: "Explore Products",
      secondaryHref: "/catalog",
      visuals: [
        {
          src: "/images/hero/slide-1-shoe.jpg",
          alt: "Velocity Nitro Running Shoe",
          className: "w-48 sm:w-64 md:w-72 lg:w-80 -translate-x-4 translate-y-2 z-20 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]",
          label: "Velocity Nitro",
          price: "₹2,499",
        },
        {
          src: "/images/hero/slide-1-headphones.jpg",
          alt: "AeroBeats Wireless Pods",
          className: "w-32 sm:w-40 md:w-48 translate-x-16 -translate-y-12 z-10 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]",
          label: "AeroBeats Pods",
          price: "₹1,899",
        },
        {
          src: "/images/hero/slide-1-bag.jpg",
          alt: "Revora Smart Cart",
          className: "w-28 sm:w-36 md:w-44 -translate-x-14 -translate-y-10 z-30 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)]",
          label: "Smart Cart",
          price: "Curated",
        }
      ],
      tag: "Autonomous Shopping Assistant"
    },
    {
      id: "slide-2",
      badge: "Smart Cross-Sell & Bundles",
      badgeIcon: Layers,
      headline: "Better together.",
      supporting: "Discover combinations that make sense for your needs — without irrelevant recommendations.",
      primaryCta: "Discover Smart Bundles",
      primaryHref: "/catalog?category=Footwear%20%26%20Running",
      secondaryCta: "Explore All Gear",
      secondaryHref: "/catalog",
      visuals: [
        {
          src: "/images/hero/slide-2-shoe.jpg",
          alt: "Velocity Nitro Running Shoes",
          className: "w-44 sm:w-60 md:w-68 lg:w-76 -translate-x-6 translate-y-4 z-20 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]",
          label: "Velocity Nitro",
          price: "₹2,499",
        },
        {
          src: "/images/hero/slide-2-socks.jpg",
          alt: "Sports Cushion Socks",
          className: "w-32 sm:w-44 md:w-52 translate-x-14 -translate-y-8 z-30 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]",
          label: "Cushion Socks",
          price: "+ ₹299",
        },
        {
          src: "/images/hero/slide-2-gear.jpg",
          alt: "Insulated Sports Bottle",
          className: "w-24 sm:w-32 md:w-40 -translate-x-12 -translate-y-12 z-10 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]",
          label: "Hydration Flask",
          price: "Bundle Add",
        }
      ],
      tag: "Canonical Demo: Shoe + Socks = ₹2,798"
    },
    {
      id: "slide-3",
      badge: "Autonomous Payment Recovery",
      badgeIcon: RefreshCw,
      headline: "Your cart shouldn't disappear\nbecause checkout didn't go as planned.",
      supporting: "REVORA helps preserve shopping intent and provides a safe path back to checkout when something goes wrong.",
      primaryCta: "See How Recovery Works",
      primaryAction: () => {
        const el = document.getElementById("recovery-story-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
      secondaryCta: "Continue Shopping",
      secondaryHref: "/catalog",
      visuals: [
        {
          src: "/images/hero/slide-3-cart.jpg",
          alt: "Preserved Cart Order Box",
          className: "w-36 sm:w-48 md:w-56 -translate-x-10 translate-y-2 z-20 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]",
          label: "Cart Preserved",
          price: "100% Intact",
        },
        {
          src: "/images/hero/slide-3-card.jpg",
          alt: "Razorpay Test Mode Card",
          className: "w-40 sm:w-56 md:w-64 translate-x-10 -translate-y-10 z-10 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)]",
          label: "Razorpay Test",
          price: "Secure",
        },
        {
          src: "/images/hero/slide-3-recovery.jpg",
          alt: "Recovery Shield & Verified Status",
          className: "w-28 sm:w-36 md:w-44 translate-x-6 translate-y-12 z-30 hover:scale-105 transition-transform duration-500 filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]",
          label: "Verified Recovery",
          price: "Policy Safe",
        }
      ],
      tag: "Razorpay Test Mode & Policy-Gated Recovery"
    }
  ];

  // Auto-advance timer (6 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      // swipe left -> next
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (diff < -50) {
      // swipe right -> prev
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
    touchStartX.current = null;
  };

  const cur = slides[currentSlide];
  const BadgeIcon = cur.badgeIcon;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-revora-border bg-gradient-to-br from-revora-forest-deep/90 via-revora-surface to-revora-forest-deep/60 shadow-2xl transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Revora Highlights Carousel"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Slide Content Grid */}
      <div className="relative z-10 min-h-[500px] sm:min-h-[520px] lg:min-h-[540px] px-6 sm:px-10 lg:px-14 py-10 sm:py-14 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1">

          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Category / Pillar Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-revora-mint text-xs font-semibold shadow-sm">
              <BadgeIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>{cur.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.15] whitespace-pre-line font-sans">
              {cur.headline}
            </h1>

            {/* Supporting Copy */}
            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-xl">
              {cur.supporting}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {cur.primaryAction ? (
                <Button
                  onClick={cur.primaryAction}
                  variant="primary"
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/60 gap-2 border border-emerald-500/40"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{cur.primaryCta}</span>
                </Button>
              ) : (
                <Link href={cur.primaryHref || "/catalog"}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/60 gap-2 border border-emerald-500/40"
                  >
                    <span>{cur.primaryCta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {cur.secondaryHref && (
                <Link href={cur.secondaryHref}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-revora-border bg-revora-bg/60 text-slate-200 hover:text-white hover:bg-revora-surface font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl"
                  >
                    {cur.secondaryCta}
                  </Button>
                </Link>
              )}

              {onOpenDemoFlow && (
                <button
                  type="button"
                  onClick={onOpenDemoFlow}
                  className="text-xs font-semibold text-slate-400 hover:text-revora-mint transition-colors underline underline-offset-4 ml-2"
                >
                  View Demo Flow &rarr;
                </button>
              )}
            </div>

            {/* Subtle Slide Tag */}
            <div className="pt-2">
              <span className="text-[11px] font-mono font-medium text-emerald-400/90 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-900/60">
                {cur.tag}
              </span>
            </div>
          </div>

          {/* Right Column: 3 Coordinated 3D Visual Elements */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[300px] sm:min-h-[340px] lg:min-h-[380px]">
            {/* Visual Framing Ring */}
            <div className="absolute inset-0 rounded-3xl border border-emerald-900/30 bg-revora-bg/40 backdrop-blur-xs flex items-center justify-center overflow-hidden">
              <div className="absolute w-72 h-72 rounded-full border border-emerald-500/10 animate-pulse pointer-events-none" />
            </div>

            {/* 3 Coordinated Objects Layered in 3D Space */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
              {cur.visuals.map((v, vIdx) => (
                <div
                  key={v.src}
                  className={`absolute flex flex-col items-center group cursor-pointer ${v.className}`}
                  style={{
                    animation: isPaused ? "none" : `float ${3.5 + vIdx * 0.7}s ease-in-out infinite alternate`
                  }}
                >
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-800/60 bg-revora-surface shadow-2xl group-hover:border-emerald-500/60 transition-all duration-300">
                    <img
                      src={v.src}
                      alt={v.alt}
                      width={320}
                      height={320}
                      loading={currentSlide === 0 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={currentSlide === 0 ? "high" : "auto"}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  {/* Floating Micro-Badge */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-revora-bg/95 border border-emerald-900/80 text-[10px] font-mono font-bold text-white shadow-lg flex items-center gap-1.5 backdrop-blur-md opacity-90 group-hover:opacity-100">
                    <span>{v.label}</span>
                    <span className="text-emerald-400">{v.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Carousel Bottom Controls: Previous / Next & 3 Pagination Dots */}
        <div className="pt-6 border-t border-revora-border/50 flex items-center justify-between mt-6">
          {/* 3 Slide Indicators */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Hero Slide Switcher">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={idx === currentSlide}
                aria-label={`Go to slide ${idx + 1}: ${s.badge}`}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide
                    ? "w-8 bg-emerald-500 shadow-md shadow-emerald-900/60"
                    : "w-2.5 bg-slate-700 hover:bg-slate-500"
                  }`}
              />
            ))}
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              0{currentSlide + 1} / 0{slides.length}
            </span>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous Hero Slide"
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
              className="h-8 w-8 rounded-full border border-revora-border bg-revora-surface hover:bg-revora-bg flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next Hero Slide"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="h-8 w-8 rounded-full border border-revora-border bg-revora-surface hover:bg-revora-bg flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
