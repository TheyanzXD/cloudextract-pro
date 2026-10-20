import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx("animate-pulse rounded-lg bg-white/5 border border-white/5", className)
      )}
      {...props}
    />
  );
}
