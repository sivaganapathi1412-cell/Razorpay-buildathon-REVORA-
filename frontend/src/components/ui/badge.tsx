import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "emerald" | "mint" | "forest" | "cyan" | "purple" | "amber" | "red" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-emerald-950/40 text-emerald-300 border-emerald-900/50",
    emerald: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
    mint: "bg-emerald-900/30 text-revora-mint border-revora-mint/30",
    forest: "bg-revora-forest text-emerald-200 border-revora-forest-light",
    cyan: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
    purple: "bg-emerald-950/60 text-revora-mint border-emerald-800/50",
    amber: "bg-amber-950/70 text-amber-400 border-amber-800/60",
    red: "bg-red-950/70 text-red-400 border-red-800/60",
    outline: "text-slate-300 border-revora-border bg-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
