import Link from "next/link";
import { StorefrontNav } from "@/components/layout/StorefrontNav";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-revora-bg text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <StorefrontNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-revora-border bg-revora-surface/80 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
            {/* Column 1: Brand */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">REVORA</span>
                <span className="text-[10px] font-bold text-revora-mint uppercase tracking-widest">STORE</span>
              </div>
              <p className="text-revora-muted leading-relaxed text-[11px]">
                Autonomous Agentic Commerce platform engineered for modern merchants. Delivering real-time conversational discovery, personalized revenue growth, and intelligent cart recovery.
              </p>
            </div>

            {/* Column 2: Shop */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Performance Gear</h4>
              <ul className="space-y-1.5 text-revora-muted">
                <li><Link href="/catalog?category=Footwear%20%26%20Running" className="hover:text-revora-mint transition-colors">Footwear &amp; Running</Link></li>
                <li><Link href="/catalog?category=Apparel%20%26%20Activewear" className="hover:text-revora-mint transition-colors">Apparel &amp; Activewear</Link></li>
                <li><Link href="/catalog?category=Accessories%20%26%20Gear" className="hover:text-revora-mint transition-colors">Accessories &amp; Gear</Link></li>
                <li><Link href="/catalog?category=Electronics%20%26%20Wearables" className="hover:text-revora-mint transition-colors">Electronics &amp; Wearables</Link></li>
                <li><Link href="/catalog?category=Nutrition%20%26%20Recovery" className="hover:text-revora-mint transition-colors">Nutrition &amp; Recovery</Link></li>
              </ul>
            </div>

            {/* Column 3: Intelligence & Stories */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Commerce Intelligence</h4>
              <ul className="space-y-1.5 text-revora-muted">
                <li><Link href="/blog" className="hover:text-revora-mint transition-colors">Engineering &amp; Growth Blog</Link></li>
                <li><Link href="/magazine" className="hover:text-revora-mint transition-colors">Revora Magazine Issue 01</Link></li>
                <li><Link href="/cart" className="hover:text-revora-mint transition-colors">Shopping Cart</Link></li>
                <li><Link href="/checkout" className="hover:text-revora-mint transition-colors">Secure Checkout</Link></li>
              </ul>
            </div>

            {/* Column 4: Merchant Portal */}
            <div className="space-y-2.5 p-4 rounded-xl border border-revora-border bg-revora-bg/60">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Merchant Command Center</h4>
              <p className="text-[11px] text-revora-muted leading-relaxed">
                Access store analytics, approve AI growth opportunities, and manage payment recovery.
              </p>
              <Link
                href="/login"
                className="inline-block pt-1 text-xs font-bold text-emerald-400 hover:text-revora-mint transition-colors"
              >
                Merchant Login &rarr;
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-revora-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; 2026 REVORA AI &bull; Track 01: Razorpay AI Buildathon &bull; All Rights Reserved
            </div>
            <div className="flex items-center gap-4">
              <span>Razorpay Test Mode Verified</span>
              <span>&bull;</span>
              <span>Gemini 2.5 Intelligence</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
