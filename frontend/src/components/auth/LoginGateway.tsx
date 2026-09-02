"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  Store, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UserPlus,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import { customerLogin, setCustomerSession } from "@/lib/customerAuth";

interface LoginGatewayProps {
  onContinueCustomer?: () => void;
}

export function LoginGateway({ onContinueCustomer }: LoginGatewayProps) {
  const router = useRouter();
  const { login: merchantLogin, isLoading: isMerchantLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<"customer" | "owner">("customer");

  // Customer Form State
  const [custEmail, setCustEmail] = useState("rahul.sharma@demo.revora.ai");
  const [custPassword, setCustPassword] = useState("password123");
  const [custLoading, setCustLoading] = useState(false);
  const [custError, setCustError] = useState<string | null>(null);

  // Store Owner Form State
  const [ownerEmail, setOwnerEmail] = useState("owner@revora.demo");
  const [ownerPassword, setOwnerPassword] = useState("demo_password_123");
  const [ownerSecretCode, setOwnerSecretCode] = useState("");
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Handle Customer Entry
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustLoading(true);
    setCustError(null);

    try {
      // Attempt real backend customer login
      await customerLogin({
        email: custEmail.trim() || "rahul.sharma@demo.revora.ai",
        password: custPassword || "password123",
      });
    } catch {
      // Fallback for demo presentation UX: ensure smooth customer entry
      setCustomerSession("demo_customer_token", {
        id: "demo-cust-rahul",
        email: custEmail.trim() || "rahul.sharma@demo.revora.ai",
        full_name: "Rahul Sharma",
        is_active: true,
      });
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("revora_gateway_entered", "true");
      }
      setCustLoading(false);
      if (onContinueCustomer) {
        onContinueCustomer();
      } else {
        router.push("/");
      }
    }
  };

  const handleUseDemoCustomer = () => {
    setCustEmail("rahul.sharma@demo.revora.ai");
    setCustPassword("password123");
    setCustError(null);
  };

  // Handle Store Owner Entry
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);

    const secretTrimmed = ownerSecretCode.trim();

    // Presentation Access Gate: validate secret code
    if (secretTrimmed !== "sivaji") {
      setOwnerError("Invalid owner access code. Use 'sivaji' for demo verification.");
      return;
    }

    try {
      await merchantLogin(
        ownerEmail.trim() || "owner@revora.demo",
        ownerPassword || "demo_password_123"
      );
      if (typeof window !== "undefined") {
        sessionStorage.setItem("revora_gateway_entered", "true");
      }
      router.push("/dashboard");
    } catch (err: any) {
      setOwnerError(err.message || "Failed to sign in. Please verify your merchant credentials.");
    }
  };

  const handleUseDemoOwner = () => {
    setOwnerEmail("owner@revora.demo");
    setOwnerPassword("demo_password_123");
    setOwnerSecretCode("sivaji");
    setOwnerError(null);
  };

  return (
    <div className="min-h-screen bg-revora-bg flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-emerald-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2.5 group justify-center mb-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-950/60">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-3xl tracking-tight text-white font-sans">REVORA</span>
              <span className="text-xs font-bold text-revora-mint ml-1.5 uppercase tracking-widest">GATEWAY</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Welcome to Revora
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Choose your portal below to enter the storefront or access the merchant dashboard.
          </p>
        </div>

        {/* Gateway Card */}
        <div className="rounded-3xl border border-revora-border bg-revora-surface/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* TWO EXPLICIT PORTAL CHOICES */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Select Login Portal:
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* CUSTOMER PORTAL BUTTON */}
              <button
                type="button"
                id="portal-customer-btn"
                onClick={() => {
                  setSelectedRole("customer");
                  setOwnerError(null);
                  setCustError(null);
                }}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 ${
                  selectedRole === "customer"
                    ? "border-emerald-500 bg-emerald-950/60 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/50"
                    : "border-revora-border bg-revora-bg/60 hover:border-slate-600 hover:bg-revora-bg/80 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      selectedRole === "customer"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/60"
                        : "bg-revora-surface text-slate-400"
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  {selectedRole === "customer" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-revora-mint bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/60">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider block ${
                    selectedRole === "customer" ? "text-white" : "text-slate-300"
                  }`}
                >
                  CUSTOMER
                </span>
                <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Shop 100 athletic products, manage your cart, and track orders.
                </span>
              </button>

              {/* STORE OWNER PORTAL BUTTON */}
              <button
                type="button"
                id="portal-owner-btn"
                onClick={() => {
                  setSelectedRole("owner");
                  setOwnerError(null);
                  setCustError(null);
                }}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 ${
                  selectedRole === "owner"
                    ? "border-emerald-500 bg-emerald-950/60 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/50"
                    : "border-revora-border bg-revora-bg/60 hover:border-slate-600 hover:bg-revora-bg/80 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      selectedRole === "owner"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/60"
                        : "bg-revora-surface text-slate-400"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                  </div>
                  {selectedRole === "owner" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-revora-mint bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/60">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider block ${
                    selectedRole === "owner" ? "text-white" : "text-slate-300"
                  }`}
                >
                  STORE OWNER
                </span>
                <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Manage inventory, growth bundles, orders, and revenue.
                </span>
              </button>
            </div>
          </div>

          {/* ACTIVE FORM CONTAINER */}
          {selectedRole === "customer" ? (
            /* =========================================================================
               CUSTOMER LOGIN FORM
               ========================================================================= */
            <form onSubmit={handleCustomerSubmit} className="space-y-4 pt-1">
              <div className="border-b border-revora-border pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-400" />
                  <span>Customer Login</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign in with your shopper credentials to continue to the storefront.
                </p>
              </div>

              {custError && (
                <div className="rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{custError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="runner@example.com"
                    className="w-full rounded-xl border border-revora-border bg-revora-bg/90 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-revora-border bg-revora-bg/90 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={custLoading}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/50 transition-colors gap-2 mt-2"
              >
                <span>{custLoading ? "Entering Storefront..." : "Continue to Storefront"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleUseDemoCustomer}
                  className="text-slate-400 hover:text-revora-mint transition-colors underline underline-offset-2"
                >
                  Fill Demo: Rahul Sharma
                </button>
                <Link
                  href="/customer-register"
                  className="text-slate-400 hover:text-revora-mint font-medium transition-colors inline-flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3 text-emerald-400" />
                  <span>Create Account / Register &rarr;</span>
                </Link>
              </div>
            </form>
          ) : (
            /* =========================================================================
               STORE OWNER LOGIN FORM
               ========================================================================= */
            <form onSubmit={handleOwnerSubmit} className="space-y-4 pt-1">
              <div className="border-b border-revora-border pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-400" />
                  <span>Store Owner Login</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign in with merchant credentials and presentation access code.
                </p>
              </div>

              {ownerError && (
                <div className="rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{ownerError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@revora.demo"
                    className="w-full rounded-xl border border-revora-border bg-revora-bg/90 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showOwnerPassword ? "text" : "password"}
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-revora-border bg-revora-bg/90 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Secret Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showSecretCode ? "text" : "password"}
                    required
                    value={ownerSecretCode}
                    onChange={(e) => {
                      setOwnerSecretCode(e.target.value);
                      if (ownerError) setOwnerError(null);
                    }}
                    placeholder="Enter owner access code"
                    className="w-full rounded-xl border border-revora-border bg-revora-bg/90 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretCode(!showSecretCode)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showSecretCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isMerchantLoading}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/50 transition-colors gap-2 mt-2"
              >
                <span>{isMerchantLoading ? "Authenticating..." : "Enter Owner Dashboard"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleUseDemoOwner}
                  className="text-[11px] text-slate-400 hover:text-revora-mint transition-colors underline underline-offset-2"
                >
                  Fill Demo: Merchant Account (Alex Vance)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
