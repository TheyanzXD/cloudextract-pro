import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "neon" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-white/10 text-white/90 border border-white/15",
    success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
    neon: "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-sm shadow-neon-cyan/20",
    outline: "bg-transparent text-white/80 border border-white/20",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase",
          variantStyles[variant],
          className
        )
      )}
      {...props}
    />
  );
}
