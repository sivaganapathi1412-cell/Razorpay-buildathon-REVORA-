"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Package,
  LogOut,
  Sparkles,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CustomerUser,
  CustomerOrderSummary,
  getCustomerUser,
  getCustomerProfile,
  getCustomerOrders,
  customerLogout,
} from "@/lib/customerAuth";

export default function CustomerAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccountData() {
      setIsLoading(true);
      const cached = getCustomerUser();
      if (cached) {
        setCustomer(cached);
      }

      const profile = await getCustomerProfile();
      if (profile) {
        setCustomer(profile);
        const orderList = await getCustomerOrders();
        setOrders(orderList);
      } else if (!cached) {
        setCustomer(null);
      }
      setIsLoading(false);
    }

    loadAccountData();
  }, []);

  const handleLogout = async () => {
    await customerLogout();
    setCustomer(null);
    setOrders([]);
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-revora-bg flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-[75vh] bg-revora-bg flex flex-col items-center justify-center px-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 p-3 text-revora-mint flex items-center justify-center mb-4">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Sign In to View Your Account</h1>
        <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-400">
          Access your order history, track live shipments, and experience personalized AI shopping recommendations.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/customer-login">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md">
              Sign In
            </Button>
          </Link>
          <Link href="/customer-register">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-revora-border text-slate-200 hover:text-white font-bold text-xs px-6 py-2.5 rounded-xl"
            >
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-revora-bg py-10 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Customer Header Banner */}
        <div className="rounded-2xl border border-revora-border bg-revora-surface/90 p-6 sm:p-8 backdrop-blur-xl mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-xl shadow-lg shadow-emerald-950/50">
              {customer.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white font-sans">
                  {customer.full_name}
                </h1>
                <Badge variant="mint" className="text-[10px] py-0.5">
                  Verified Shopper
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{customer.email}</p>
              {customer.phone && (
                <p className="text-[11px] text-slate-500">{customer.phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/catalog">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-revora-border text-slate-200 hover:border-emerald-700 hover:text-white text-xs font-semibold rounded-xl"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                <span>Shop Store</span>
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-300 hover:bg-red-950/40 hover:text-red-200 text-xs font-semibold rounded-xl"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Orders Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-revora-mint" />
              <h2 className="text-lg font-bold text-white">My Orders</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {orders.length} {orders.length === 1 ? "order" : "orders"} found
            </span>
          </div>

          {orders.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-revora-border bg-revora-surface/60 p-12 text-center backdrop-blur-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 mb-4">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Orders Placed Yet</h3>
              <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
                Explore our authoritative 60-product catalog across 5 athletic categories or shop with Revora AI.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/catalog">
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-revora-mint" />
                    <span>Explore Products</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-revora-border bg-revora-surface/80 p-5 sm:p-6 backdrop-blur-md transition-all hover:border-emerald-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-revora-border/60 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">
                          {ord.order_number}
                        </span>
                        <Badge
                          variant={
                            ord.status === "PAID"
                              ? "mint"
                              : ord.status === "RECOVERED"
                              ? "mint"
                              : "default"
                          }
                          className="text-[11px] font-bold"
                        >
                          {ord.status === "PAID" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              PAID
                            </span>
                          ) : (
                            ord.status
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(ord.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{ord.items_count} items</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                        Total Paid
                      </span>
                      <span className="text-lg font-bold text-revora-mint font-mono">
                        ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="mt-4 divide-y divide-revora-border/40">
                    {ord.items.map((it) => (
                      <div
                        key={it.id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <div>
                            <span className="font-semibold text-slate-200">
                              {it.product_name}
                            </span>
                            <span className="text-slate-500 font-mono ml-2">
                              Qty: {it.quantity}
                            </span>
                            {it.origin === "AI_CROSS_SELL" && (
                              <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.2 text-[10px] font-bold text-revora-mint">
                                <Sparkles className="h-2.5 w-2.5" />
                                AI Cross-Sell
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-slate-300">
                          ₹{Number(it.paid_price).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
