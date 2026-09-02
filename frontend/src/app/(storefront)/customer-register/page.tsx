"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerRegister } from "@/lib/customerAuth";

export default function CustomerRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await customerRegister({
        full_name: fullName,
        email,
        phone: phone || undefined,
        password,
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("revora_gateway_entered", "true");
        localStorage.setItem("revora_gateway_entered", "true");
      }
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-revora-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-revora-mint shadow-lg shadow-emerald-950/40 mb-4">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
          Create Customer Account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Join Revora Store to track orders, save your active shopping cart, and receive tailored athletic recommendations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-revora-border bg-revora-surface/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full rounded-xl border border-revora-border bg-revora-bg/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="runner@example.com"
                className="w-full rounded-xl border border-revora-border bg-revora-bg/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-revora-border bg-revora-bg/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-revora-border bg-revora-bg/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors"
            >
              {isLoading ? "Creating Account..." : "Create Account &amp; Continue"}
            </Button>
          </form>

          <div className="mt-5 text-center pt-4 border-t border-revora-border/60">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/customer-login"
                className="font-bold text-revora-mint hover:text-emerald-300 underline underline-offset-2 ml-1"
              >
                Sign In &rarr;
              </Link>
            </p>
          </div>
        </div>

        {/* Separation Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-revora-border bg-revora-surface/50 px-4 py-2 text-xs text-slate-400">
            <Store className="h-3.5 w-3.5 text-slate-400" />
            <span>Are you a store owner?</span>
            <Link
              href="/merchant-login"
              className="font-semibold text-slate-200 hover:text-white underline underline-offset-2 ml-1"
            >
              Shop Owner Login &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
