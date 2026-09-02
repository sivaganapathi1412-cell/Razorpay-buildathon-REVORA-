"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Sparkles, 
  User, 
  LayoutDashboard, 
  Menu, 
  X, 
  BookOpen, 
  Compass, 
  ChevronDown,
  Store,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";
import { fetchActiveCart, onCartUpdate, CartData } from "@/lib/cartService";
import { getCustomerUser, CustomerUser } from "@/lib/customerAuth";
import { ShoppingAssistantModal } from "@/components/ai/ShoppingAssistantModal";

export function StorefrontNav() {
  const { isAuthenticated: isMerchantAuthenticated } = useAuth();
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    const data = await fetchActiveCart();
    if (data) {
      setCartCount(data.item_count || data.items?.length || 0);
    }
  };

  useEffect(() => {
    refreshCart();
    setCustomerUser(getCustomerUser());

    // Subscribe to customer auth changes
    const handleCustomerAuth = (e: Event) => {
      const customEvent = e as CustomEvent<CustomerUser | null>;
      setCustomerUser(customEvent.detail || null);
    };
    window.addEventListener("revora-customer-auth-changed", handleCustomerAuth);

    // Subscribe to cart updates
    const unsubscribeCart = onCartUpdate((cart: CartData | null) => {
      if (cart) {
        setCartCount(cart.item_count || cart.items?.length || 0);
      } else {
        refreshCart();
      }
    });

    const interval = setInterval(refreshCart, 8000);
    return () => {
      window.removeEventListener("revora-customer-auth-changed", handleCustomerAuth);
      unsubscribeCart();
      clearInterval(interval);
    };
  }, []);

  const categories = [
    { name: "Footwear & Running", slug: "footwear-running" },
    { name: "Apparel & Activewear", slug: "apparel-activewear" },
    { name: "Accessories & Gear", slug: "accessories-gear" },
    { name: "Electronics & Wearables", slug: "electronics-wearables" },
    { name: "Nutrition & Recovery", slug: "nutrition-recovery" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-revora-border bg-revora-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Navigation Links */}
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-950/60 group-hover:bg-emerald-500 transition-colors">
                <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex items-baseline">
                <span className="font-extrabold tracking-tight text-white text-lg font-sans">REVORA</span>
                <span className="text-[11px] font-bold text-revora-mint ml-1.5 uppercase tracking-widest">STORE</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold tracking-wide text-slate-200">
              <Link href="/" className="hover:text-revora-mint transition-colors">
                Home
              </Link>
              <Link href="/catalog" className="hover:text-revora-mint transition-colors">
                Shop
              </Link>

              {/* Categories Mega Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 200)}
                  className="flex items-center gap-1 hover:text-revora-mint transition-colors py-2 focus:outline-none"
                >
                  <span>Categories</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-revora-border bg-revora-surface p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/catalog?category=${encodeURIComponent(c.name)}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-emerald-950/50 hover:text-revora-mint transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                    <div className="border-t border-revora-border/60 mt-1 pt-1">
                      <Link
                        href="/categories"
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="block rounded-lg px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        Browse All 5 Categories &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/blog" className="hover:text-revora-mint transition-colors flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                <span>Blog</span>
              </Link>

              <Link href="/magazine" className="hover:text-revora-mint transition-colors flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-revora-mint" />
                <span>Magazine</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Shop with AI */}
            <Button
              onClick={() => setIsAiOpen(true)}
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs font-bold shadow-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 px-3"
            >
              <Sparkles className="h-3.5 w-3.5 text-revora-mint" />
              <span>Shop with Revora AI</span>
            </Button>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="flex items-center gap-1.5 rounded-lg border border-revora-border bg-revora-surface px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-700/60 hover:text-white transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500/20 text-revora-mint px-1 text-[10px] font-mono font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Customer Space: My Account / Customer Login */}
            {customerUser ? (
              <Link
                href="/account"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-950/70 hover:text-white transition-colors"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                  {customerUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span>My Account</span>
              </Link>
            ) : (
              <Link
                href="/customer-login"
                className="flex items-center gap-1.5 rounded-lg border border-revora-border bg-revora-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-emerald-700/50 hover:text-white transition-colors"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Customer Login</span>
              </Link>
            )}

            {/* Distinct Shop Owner Entry */}
            {isMerchantAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-revora-mint hover:bg-slate-800 hover:text-emerald-300 transition-colors shadow-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/merchant-login"
                className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Store className="h-3.5 w-3.5 text-slate-400" />
                <span>Shop Owner Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/cart"
              className="p-2 rounded-lg border border-revora-border bg-revora-surface text-slate-200"
              aria-label="View cart"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-revora-border bg-revora-surface text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-revora-border bg-revora-bg px-4 py-4 space-y-3">
            <nav className="flex flex-col space-y-2 text-xs font-semibold text-slate-200">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-revora-mint transition-colors"
              >
                Home
              </Link>
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-revora-mint transition-colors"
              >
                Shop All 60 Products
              </Link>
              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-revora-mint transition-colors"
              >
                Categories (5 Departments)
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-revora-mint transition-colors flex items-center gap-2"
              >
                <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                <span>Blog &amp; Research</span>
              </Link>
              <Link
                href="/magazine"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-revora-mint transition-colors flex items-center gap-2"
              >
                <Compass className="h-3.5 w-3.5 text-revora-mint" />
                <span>Magazine Stories</span>
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-revora-mint transition-colors flex items-center justify-between"
              >
                <span>Shopping Cart</span>
                {cartCount > 0 && <Badge variant="mint">{cartCount} items</Badge>}
              </Link>
            </nav>

            <div className="pt-3 border-t border-revora-border space-y-2">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAiOpen(true);
                }}
                variant="primary"
                size="sm"
                className="w-full gap-2 text-xs font-bold justify-center bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Sparkles className="h-3.5 w-3.5 text-revora-mint" />
                <span>Shop with Revora AI</span>
              </Button>

              {customerUser ? (
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950/40 rounded-lg border border-emerald-700/50"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>My Account ({customerUser.full_name})</span>
                </Link>
              ) : (
                <Link
                  href="/customer-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-300 bg-revora-surface rounded-lg border border-revora-border hover:text-white"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Customer Login / Sign In</span>
                </Link>
              )}

              {isMerchantAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-revora-mint bg-slate-900 rounded-lg border border-emerald-600/50"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Merchant Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/merchant-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-300 bg-slate-900 rounded-lg border border-slate-700 hover:text-white"
                >
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  <span>Shop Owner Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive Shopping Assistant Modal */}
      <ShoppingAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onItemAdded={refreshCart}
      />
    </>
  );
}

