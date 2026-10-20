import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "neon" | "gradient" | "emerald";
}

export function Progress({
  className,
  value = 0,
  max = 100,
  variant = "gradient",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantBarStyles = {
    gradient: "bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple shadow-neon-cyan",
    neon: "bg-neon-cyan shadow-neon-cyan",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-neon-emerald",
  };

  return (
    <div
      className={twMerge(
        clsx("relative h-2 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm", className)
      )}
      {...props}
    >
      <div
        className={twMerge(
          clsx(
            "h-full w-full flex-1 transition-all duration-300 ease-out rounded-full",
            variantBarStyles[variant]
          )
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}
