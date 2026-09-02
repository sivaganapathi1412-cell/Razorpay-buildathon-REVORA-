"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Router caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-revora-bg flex flex-col items-center justify-center p-6 text-center text-slate-100">
      <div className="max-w-md w-full rounded-2xl border border-revora-border bg-revora-surface p-8 shadow-2xl space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-red-950/50 border border-red-800/50 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-xs text-slate-400">
          {error?.message || "An unexpected error occurred while rendering the page."}
        </p>
        <Button
          onClick={() => reset()}
          variant="primary"
          size="sm"
          className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  );
}
