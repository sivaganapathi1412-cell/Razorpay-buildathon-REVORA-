"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b09] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-emerald-900/40 bg-[#0d1410] p-8 text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-red-950/50 border border-red-800/50 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Application Error</h2>
          <p className="text-xs text-slate-400">
            {error?.message || "A critical error occurred."}
          </p>
          <Button
            onClick={() => reset()}
            className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Application</span>
          </Button>
        </div>
      </body>
    </html>
  );
}
