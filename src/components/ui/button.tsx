import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "neon";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4 py-2.5 h-10 gap-2",
      lg: "text-base px-6 py-3 h-12 gap-2.5",
      icon: "h-10 w-10 p-0 items-center justify-center",
    };

    const variantStyles = {
      primary:
        "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-lg shadow-black/20 hover:shadow-white/10",
      neon:
        "bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold shadow-neon-cyan hover:brightness-110",
      secondary:
        "bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 backdrop-blur-md",
      outline:
        "border border-white/20 hover:border-neon-cyan/50 text-white/90 hover:text-white bg-transparent",
      ghost:
        "hover:bg-white/10 text-white/80 hover:text-white",
      destructive:
        "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 backdrop-blur-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
