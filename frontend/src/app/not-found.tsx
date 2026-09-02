import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-revora-bg flex flex-col items-center justify-center p-6 text-center text-slate-100 selection:bg-emerald-600 selection:text-white">
      <div className="max-w-md w-full rounded-3xl border border-revora-border bg-revora-surface/90 p-8 shadow-2xl space-y-5">
        <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-revora-mint mx-auto">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">404</h1>
        <h2 className="text-base font-bold text-slate-200">Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested page could not be found or has moved.
        </p>
        <Link href="/" className="inline-block">
          <Button
            variant="primary"
            size="sm"
            className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Revora Store</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
