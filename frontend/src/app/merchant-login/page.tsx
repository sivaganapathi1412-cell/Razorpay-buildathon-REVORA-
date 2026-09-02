"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Lock, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Store, 
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/authContext";

export default function MerchantLoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("owner@revora.demo");
  const [password, setPassword] = useState("demo_password_123");
  const [secretCode, setSecretCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const secretTrimmed = secretCode.trim();
    if (secretTrimmed !== "sivaji") {
      setError("Invalid owner access code.");
      return;
    }

    try {
      await login(email.trim() || "owner@revora.demo", password || "demo_password_123");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("revora_gateway_entered", "true");
        localStorage.setItem("revora_gateway_entered", "true");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your merchant credentials.");
    }
  };

  const handleUseDemoAccount = () => {
    setEmail("owner@revora.demo");
    setPassword("demo_password_123");
    setSecretCode("sivaji");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-revora-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-emerald-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group justify-center mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 group-hover:bg-emerald-500 transition-colors">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex items-baseline">
            <span className="font-extrabold text-2xl tracking-tight text-white font-sans">REVORA</span>
            <span className="text-xs font-bold text-revora-mint ml-1.5 uppercase tracking-widest">STORE</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Store Owner Login
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Manage your store, growth opportunities, orders, and revenue.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8 border-revora-border bg-revora-surface/90 shadow-2xl backdrop-blur-xl rounded-2xl">
          {error && (
            <div className="mb-4 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Owner Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@revora.demo"
                  className="w-full rounded-xl border border-revora-border bg-revora-bg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-revora-border bg-revora-bg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secret Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showSecretCode ? "text" : "password"}
                  required
                  value={secretCode}
                  onChange={(e) => {
                    setSecretCode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter owner access code"
                  className="w-full rounded-xl border border-revora-border bg-revora-bg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretCode(!showSecretCode)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showSecretCode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl shadow-md transition-colors mt-2"
            >
              {isLoading ? "Authenticating..." : "Enter Owner Dashboard"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Subtle Demo Option */}
          <div className="mt-4 pt-3 border-t border-revora-border/60 text-center">
            <button
              type="button"
              onClick={handleUseDemoAccount}
              className="text-[11px] text-slate-400 hover:text-revora-mint transition-colors underline underline-offset-2"
            >
              Use Demo Account
            </button>
          </div>
        </Card>

        {/* Separation Link to Customer Login */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-revora-border bg-revora-surface/50 px-4 py-2 text-xs text-slate-400">
            <User className="h-3.5 w-3.5 text-emerald-400" />
            <span>Looking for customer login?</span>
            <Link
              href="/customer-login"
              className="font-semibold text-revora-mint hover:text-emerald-300 underline underline-offset-2 ml-1"
            >
              Sign in as a Shopper &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
