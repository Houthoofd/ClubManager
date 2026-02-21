/**
 * Rate Limiting Service
 *
 * Provides rate limiting functionality to protect API endpoints from abuse.
 * Supports multiple strategies:
 * - IP-based rate limiting
 * - User-based rate limiting
 * - Endpoint-specific rate limiting
 * - Sliding window algorithm for accurate rate limiting
 */

import { Request } from "express";

// ====================================================================
// TYPES
// ====================================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  timestamps: number[]; // For sliding window
}

// ====================================================================
// DEFAULT CONFIGURATIONS
// ====================================================================

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Preset configurations for common use cases
export const RATE_LIMIT_PRESETS = {
  // Strict limits for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  },
  // Standard API rate limit
  STANDARD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Generous limits for public endpoints
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute
  },
  // Very strict limits for expensive operations
  EXPENSIVE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
  },
  // Webhook limits
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 webhooks per minute
  },
} as const;

// ====================================================================
// RATE LIMIT SERVICE CLASS
// ====================================================================

export class RateLimitService {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired entries
    this.startCleanup();
  }

  /**
   * Check if request should be rate limited
   */
  check(key: string, config: Partial<RateLimitConfig> = {}): RateLimitInfo {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();

    // Get or create entry
    let entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      // Create new entry
      entry = {
        count: 0,
        resetTime: now + cfg.windowMs,
        timestamps: [],
      };
      this.store.set(key, entry);
    }

    // Sliding window: remove old timestamps
    entry.timestamps = entry.timestamps.filter(
      (timestamp) => timestamp > now - cfg.windowMs,
    );

    // Update count based on timestamps
    entry.count = entry.timestamps.length;

    // Check if rate limit exceeded
    const isLimited = entry.count >= cfg.maxRequests;
    const remaining = Math.max(0, cfg.maxRequests - entry.count);

    return {
      limit: cfg.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      isLimited,
    };
  }

  /**
   * Record a request
   */
  record(key: string, config: Partial<RateLimitConfig> = {}): RateLimitInfo {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();

    let entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + cfg.windowMs,
        timestamps: [now],
      };
      this.store.set(key, entry);
    } else {
      // Add timestamp
      entry.timestamps.push(now);
      entry.count = entry.timestamps.length;
    }

    const isLimited = entry.count > cfg.maxRequests;
    const remaining = Math.max(0, cfg.maxRequests - entry.count);

    return {
      limit: cfg.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      isLimited,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Get current stats for a key
   */
  getStats(key: string): RateLimitInfo | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now >= entry.resetTime) {
      this.store.delete(key);
      return null;
    }

    return {
      limit: 0, // Not known without config
      remaining: 0,
      resetTime: entry.resetTime,
      isLimited: false,
    };
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(
        `🧹 [RateLimitService] Cleaned up ${removed} expired entries`,
      );
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get total number of tracked keys
   */
  getTotalKeys(): number {
    return this.store.size;
  }
}

// ====================================================================
// KEY GENERATORS
// ====================================================================

/**
 * Generate key based on IP address
 */
export function getIpKey(req: Request, prefix = "ip"): string {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown";

  return `${prefix}:${ip}`;
}

/**
 * Generate key based on user ID
 */
export function getUserKey(userId: number | string, prefix = "user"): string {
  return `${prefix}:${userId}`;
}

/**
 * Generate key based on IP and endpoint
 */
export function getEndpointKey(req: Request, prefix = "endpoint"): string {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";
  const endpoint = req.path;

  return `${prefix}:${ip}:${endpoint}`;
}

/**
 * Generate key based on user and endpoint
 */
export function getUserEndpointKey(
  userId: number | string,
  endpoint: string,
  prefix = "user-endpoint",
): string {
  return `${prefix}:${userId}:${endpoint}`;
}

/**
 * Generate key based on custom identifier
 */
export function getCustomKey(identifier: string, prefix = "custom"): string {
  return `${prefix}:${identifier}`;
}

// ====================================================================
// MIDDLEWARE HELPERS
// ====================================================================

/**
 * Create Express middleware for rate limiting
 */
export function createRateLimitMiddleware(
  config: Partial<RateLimitConfig> = {},
  keyGenerator: (req: Request) => string = getIpKey,
) {
  const rateLimitService = new RateLimitService();

  return (req: Request, res: any, next: any) => {
    const key = keyGenerator(req);
    const result = rateLimitService.record(key, config);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", result.limit.toString());
    res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(result.resetTime).toISOString(),
    );

    if (result.isLimited) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
    }

    next();
  };
}

// ====================================================================
// SINGLETON INSTANCE
// ====================================================================

const rateLimitService = new RateLimitService();

export default rateLimitService;

// ====================================================================
// EXPORTS
// ====================================================================

export {
  rateLimitService,
  RateLimitService as RateLimitServiceClass,
};
