"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  TrendingUp, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  Package, 
  ShoppingCart, 
  Store,
  Sparkles,
  LogOut,
  User,
  Sliders,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

export function MerchantNav() {
  const pathname = usePathname();
  const { user, merchant, logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "Overview", icon: TrendingUp },
    { href: "/growth", label: "Growth Opportunities", icon: Sparkles },
    { href: "/recovery-center", label: "Revenue Recovery", icon: RefreshCw },
    { href: "/audit", label: "AI Decisions & Audit", icon: FileText },
    { href: "/safety", label: "Safety & Approvals", icon: ShieldCheck },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/products", label: "Catalog", icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-revora-border bg-revora-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-950/60 group-hover:bg-emerald-500 transition-colors">
              <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold tracking-tight text-white text-base font-sans">REVORA AI</span>
                <Badge variant="mint" className="hidden sm:inline-flex text-[9px] py-0 px-1.5 font-mono">
                  Merchant Control Center
                </Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-emerald-950/60 text-revora-mint font-bold border border-emerald-800/60 shadow-sm"
                    : "text-slate-400 hover:bg-revora-surface hover:text-slate-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user.full_name}</span>
              <span className="text-[10px] text-revora-muted font-mono">{user.email}</span>
            </div>
          )}

          <Link
            href="/?view=storefront"
            className="flex items-center gap-1.5 rounded-lg border border-revora-border bg-revora-surface px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-700/60 hover:text-white transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Storefront</span>
          </Link>

          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/20 px-2.5 gap-1.5"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
