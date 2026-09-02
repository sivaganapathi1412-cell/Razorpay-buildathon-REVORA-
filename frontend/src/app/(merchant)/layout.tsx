"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MerchantNav } from "@/components/layout/MerchantNav";
import { useAuth } from "@/lib/authContext";
import { Brain } from "lucide-react";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/merchant-login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-revora-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 animate-pulse">
            <Brain className="h-6 w-6" />
          </div>
          <span className="text-xs text-revora-muted font-medium">Validating merchant session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-revora-bg flex flex-col justify-between">
      <MerchantNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-revora-border py-6 text-center text-xs text-slate-500 bg-slate-950/60">
        Revora AI &bull; Autonomous Agentic Commerce Growth &amp; Revenue Recovery &bull; Razorpay AI Buildathon
      </footer>
    </div>
  );
}
