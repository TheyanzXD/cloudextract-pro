"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";

interface CountdownBadgeProps {
  expiresAt: string | Date;
  className?: string;
}

export function CountdownBadge({ expiresAt, className }: CountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expired (Purged)
      </Badge>
    );
  }

  const isLowTime = timeLeft.days === 0 && timeLeft.hours < 2;

  return (
    <Badge
      variant={isLowTime ? "warning" : "default"}
      className={`font-mono text-[11px] gap-1.5 ${className}`}
      title={`Auto-purges on: ${new Date(expiresAt).toLocaleString()}`}
    >
      <Clock className={`h-3 w-3 ${isLowTime ? "animate-pulse text-amber-400" : "text-neon-cyan"}`} />
      <span>
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")} left
      </span>
    </Badge>
  );
}
