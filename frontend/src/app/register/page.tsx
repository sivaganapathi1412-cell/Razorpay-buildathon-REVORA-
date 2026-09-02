"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Lock, Mail, Store, User, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Athletics & Lifestyle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        store_name: storeName,
        business_category: businessCategory,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-revora-bg via-[#0c1220] to-revora-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-revora-emerald to-revora-cyan text-white shadow-lg shadow-emerald-900/40">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">REVORA AI</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Provision Merchant Store</h2>
        <p className="text-xs text-revora-muted">
          Instant tenant onboarding with automated safety boundaries.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 border-revora-border bg-slate-900/80 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Owner Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Vance"
                  className="w-full rounded-lg border border-revora-border bg-slate-950/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-revora-razor"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Apex Athletics"
                  className="w-full rounded-lg border border-revora-border bg-slate-950/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-revora-razor"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Business Category</label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full rounded-lg border border-revora-border bg-slate-950/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-revora-razor"
              >
                <option value="Athletics & Lifestyle">Athletics &amp; Lifestyle</option>
                <option value="Footwear & Fashion">Footwear &amp; Fashion</option>
                <option value="Electronics & Wearables">Electronics &amp; Wearables</option>
                <option value="Health & Nutrition">Health &amp; Nutrition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@store.com"
                  className="w-full rounded-lg border border-revora-border bg-slate-950/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-revora-razor"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 8 chars)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-revora-border bg-slate-950/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-revora-razor"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isLoading} variant="emerald" size="md" className="w-full text-xs font-semibold gap-2">
                {isLoading ? "Provisioning..." : "Create Merchant Account"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-revora-border text-center text-xs text-slate-400">
            Already have a store?{" "}
            <Link href="/login" className="text-revora-cyan hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
