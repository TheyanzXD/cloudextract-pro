interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipCache = new Map<string, RateLimitRecord>();

// Clean up expired IP cache entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipCache.entries()) {
      if (now > record.resetTime) {
        ipCache.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function checkRateLimit(
  ip: string,
  maxRequests: number = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60", 10),
  windowSeconds: number = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || "60", 10)
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = ipCache.get(ip);

  if (!existing || now > existing.resetTime) {
    const record: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipCache.set(ip, record);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: record.resetTime,
    };
  }

  existing.count++;
  if (existing.count > maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: existing.resetTime,
    };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    reset: existing.resetTime,
  };
}
