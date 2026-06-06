import type { Request, Response, NextFunction } from "express";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const ipCache = new Map<string, RateLimitInfo>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  ipCache.forEach((info, ip) => {
    if (now > info.resetTime) {
      ipCache.delete(ip);
    }
  });
}, 5 * 60 * 1000).unref();

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = "Too many requests from this IP, please try again later." } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Basic IP resolution
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown-ip";
    const now = Date.now();

    let info = ipCache.get(ip);

    if (!info || now > info.resetTime) {
      info = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipCache.set(ip, info);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil(info.resetTime / 1000));
      return next();
    }

    info.count++;
    const remaining = Math.max(0, max - info.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(info.resetTime / 1000));

    if (info.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}
