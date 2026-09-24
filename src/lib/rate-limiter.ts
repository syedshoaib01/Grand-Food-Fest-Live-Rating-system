/**
 * Rate Limiter for Grand Food Fest Live Rating System
 * 
 * Provides in-memory sliding window rate limiting for public endpoints.
 * Architecture Note: In single-instance Node/Next.js deployments, this keeps track of
 * requests in-memory with automatic cleanup of expired records.
 * For horizontally scaled multi-region serverless deployments (e.g. Vercel Edge/AWS Lambda),
 * this acts as a node-local defense layer; an external store like Redis/Upstash can be dropped in
 * without changing the caller interface.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxWindowMs = 60 * 1000;
    Array.from(ipStore.entries()).forEach(([key, record]) => {
      record.timestamps = record.timestamps.filter((t: number) => now - t < maxWindowMs);
      if (record.timestamps.length === 0) {
        ipStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  limit: number; // Max requests allowed
  windowMs: number; // Window size in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Check if the request from the client identifier is within the rate limit.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 30, windowMs: 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = ipStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(identifier, record);
  }

  // Filter out timestamps outside the current window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  const remaining = Math.max(0, options.limit - record.timestamps.length);
  const oldestTimestamp = record.timestamps[0] || now;
  const resetSeconds = Math.ceil((oldestTimestamp + options.windowMs - now) / 1000);

  if (record.timestamps.length >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    success: true,
    limit: options.limit,
    remaining: remaining - 1,
    resetSeconds: Math.max(1, resetSeconds),
  };
}

/**
 * Extract client IP from Next.js request headers safely
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Reset store (useful for testing)
 */
export function resetRateLimitStore(): void {
  ipStore.clear();
}
