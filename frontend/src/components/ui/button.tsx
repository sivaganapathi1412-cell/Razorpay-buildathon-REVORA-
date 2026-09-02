import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "emerald" | "mint";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
      primary: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500 border border-emerald-500/30 shadow-md shadow-emerald-950/40",
      secondary: "bg-revora-surface text-slate-100 hover:bg-emerald-950/40 hover:text-white border border-revora-border",
      outline: "bg-transparent text-slate-200 hover:bg-revora-surface hover:text-white border border-revora-border focus:ring-emerald-500",
      ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-revora-surface/60",
      danger: "bg-revora-red text-white hover:bg-red-600 focus:ring-red-500",
      emerald: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500 shadow-md shadow-emerald-950/40",
      mint: "bg-revora-mint text-slate-950 hover:bg-emerald-400 focus:ring-emerald-400 font-bold",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-xs sm:text-sm",
      lg: "px-6 py-3 text-sm sm:text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
