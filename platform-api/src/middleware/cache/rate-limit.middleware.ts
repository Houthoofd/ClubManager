/**
 * Rate Limiting Middleware
 * Express middleware for rate limiting using Redis
 */

import { Request, Response, NextFunction } from "express";
import { rateLimiterService } from "../../cache/rate-limiter.service.js";
import type { RateLimitOptions } from "../../cache/rate-limiter.service.js";

/**
 * Rate limit middleware options
 */
export interface RateLimitMiddlewareOptions extends Partial<RateLimitOptions> {
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response) => void;
  onLimitReached?: (req: Request, identifier: string) => void;
  headers?: boolean; // Include rate limit headers in response
}

/**
 * Default rate limit exceeded handler
 */
function defaultRateLimitHandler(req: Request, res: Response): void {
  res.status(429).json({
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  });
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetAt: Date,
): void {
  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader(
    "X-RateLimit-Reset",
    Math.floor(resetAt.getTime() / 1000).toString(),
  );
  res.setHeader("X-RateLimit-Reset-Date", resetAt.toISOString());
}

/**
 * Create rate limiting middleware for IP addresses
 */
export function rateLimitByIp(
  options: RateLimitMiddlewareOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const {
    max = 100,
    windowSeconds = 60,
    skip,
    handler = defaultRateLimitHandler,
    onLimitReached,
    headers = true,
    keyGenerator,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Skip rate limiting if condition is met
      if (skip && skip(req)) {
        return next();
      }

      // Get identifier (IP address)
      const identifier = keyGenerator ? keyGenerator(req) : getIpAddress(req);

      // Check if blacklisted
      const isBlacklisted = await rateLimiterService.isBlacklisted(
        "ip",
        identifier,
      );
      if (isBlacklisted) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied",
          code: "IP_BLACKLISTED",
        });
        return;
      }

      // Check if whitelisted
      const isWhitelisted = await rateLimiterService.isWhitelisted(
        "ip",
        identifier,
      );
      if (isWhitelisted) {
        return next();
      }

      // Check rate limit
      const result = await rateLimiterService.checkIpRateLimit(
        identifier,
        req.path,
        { max, windowSeconds },
      );

      // Add headers if enabled
      if (headers) {
        addRateLimitHeaders(
          res,
          result.limit,
          result.remaining,
          result.resetAt,
        );
      }

      // Check if limit exceeded
      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader("Retry-After", result.retryAfter.toString());
        }

        if (onLimitReached) {
          onLimitReached(req, identifier);
        }

        return handler(req, res);
      }

      next();
    } catch (error) {
      console.error("Rate limit middleware error:", error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Create rate limiting middleware for tenants
 */
export function rateLimitByTenant(
  options: RateLimitMiddlewareOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const {
    max = 1000,
    windowSeconds = 60,
    skip,
    handler = defaultRateLimitHandler,
    onLimitReached,
    headers = true,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Skip rate limiting if condition is met
      if (skip && skip(req)) {
        return next();
      }

      // Get tenant ID from request
      const tenantId = (req as any).tenantId || (req as any).tenant?.id;
      if (!tenantId) {
        // No tenant ID found, skip rate limiting
        return next();
      }

      // Check if blacklisted
      const isBlacklisted = await rateLimiterService.isBlacklisted(
        "tenant",
        tenantId,
      );
      if (isBlacklisted) {
        res.status(403).json({
          error: "Forbidden",
          message: "Tenant access denied",
          code: "TENANT_BLACKLISTED",
        });
        return;
      }

      // Check if whitelisted
      const isWhitelisted = await rateLimiterService.isWhitelisted(
        "tenant",
        tenantId,
      );
      if (isWhitelisted) {
        return next();
      }

      // Check rate limit
      const result = await rateLimiterService.checkTenantRateLimit(
        tenantId,
        req.path,
        { max, windowSeconds },
      );

      // Add headers if enabled
      if (headers) {
        addRateLimitHeaders(
          res,
          result.limit,
          result.remaining,
          result.resetAt,
        );
      }

      // Check if limit exceeded
      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader("Retry-After", result.retryAfter.toString());
        }

        if (onLimitReached) {
          onLimitReached(req, tenantId);
        }

        return handler(req, res);
      }

      next();
    } catch (error) {
      console.error("Tenant rate limit middleware error:", error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Create rate limiting middleware for users
 */
export function rateLimitByUser(
  options: RateLimitMiddlewareOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const {
    max = 1000,
    windowSeconds = 60,
    skip,
    handler = defaultRateLimitHandler,
    onLimitReached,
    headers = true,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Skip rate limiting if condition is met
      if (skip && skip(req)) {
        return next();
      }

      // Get user ID from request
      const userId = (req as any).userId || (req as any).user?.id;
      if (!userId) {
        // No user ID found, skip rate limiting
        return next();
      }

      // Check if blacklisted
      const isBlacklisted = await rateLimiterService.isBlacklisted(
        "user",
        userId,
      );
      if (isBlacklisted) {
        res.status(403).json({
          error: "Forbidden",
          message: "User access denied",
          code: "USER_BLACKLISTED",
        });
        return;
      }

      // Check if whitelisted
      const isWhitelisted = await rateLimiterService.isWhitelisted(
        "user",
        userId,
      );
      if (isWhitelisted) {
        return next();
      }

      // Check rate limit
      const result = await rateLimiterService.checkUserRateLimit(
        userId,
        req.path,
        { max, windowSeconds },
      );

      // Add headers if enabled
      if (headers) {
        addRateLimitHeaders(
          res,
          result.limit,
          result.remaining,
          result.resetAt,
        );
      }

      // Check if limit exceeded
      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader("Retry-After", result.retryAfter.toString());
        }

        if (onLimitReached) {
          onLimitReached(req, userId);
        }

        return handler(req, res);
      }

      next();
    } catch (error) {
      console.error("User rate limit middleware error:", error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Create strict rate limiting for authentication endpoints
 */
export function authRateLimit(
  options: Partial<RateLimitMiddlewareOptions> = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const {
    skip,
    handler = defaultRateLimitHandler,
    onLimitReached,
    headers = true,
  } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Skip rate limiting if condition is met
      if (skip && skip(req)) {
        return next();
      }

      const ip = getIpAddress(req);

      // Check rate limit (stricter limits for auth)
      const result = await rateLimiterService.checkAuthRateLimit(ip);

      // Add headers if enabled
      if (headers) {
        addRateLimitHeaders(
          res,
          result.limit,
          result.remaining,
          result.resetAt,
        );
      }

      // Check if limit exceeded
      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader("Retry-After", result.retryAfter.toString());
        }

        if (onLimitReached) {
          onLimitReached(req, ip);
        }

        // Log suspicious activity
        console.warn(
          `⚠️  Auth rate limit exceeded for IP: ${ip} on ${req.path}`,
        );

        return handler(req, res);
      }

      next();
    } catch (error) {
      console.error("Auth rate limit middleware error:", error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Create combined rate limiting (IP + Tenant + User)
 */
export function combinedRateLimit(
  options: {
    ip?: RateLimitMiddlewareOptions | false;
    tenant?: RateLimitMiddlewareOptions | false;
    user?: RateLimitMiddlewareOptions | false;
  } = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const checks: Array<{ type: string; passed: boolean; result?: any }> = [];

      // Check IP rate limit
      if (options.ip !== false) {
        const ip = getIpAddress(req);
        const ipResult = await rateLimiterService.checkIpRateLimit(
          ip,
          req.path,
          options.ip,
        );
        checks.push({ type: "ip", passed: ipResult.allowed, result: ipResult });

        if (!ipResult.allowed) {
          res.setHeader("X-RateLimit-Type", "ip");
          addRateLimitHeaders(
            res,
            ipResult.limit,
            ipResult.remaining,
            ipResult.resetAt,
          );
          return defaultRateLimitHandler(req, res);
        }
      }

      // Check Tenant rate limit
      const tenantId = (req as any).tenantId || (req as any).tenant?.id;
      if (tenantId && options.tenant !== false) {
        const tenantResult = await rateLimiterService.checkTenantRateLimit(
          tenantId,
          req.path,
          options.tenant,
        );
        checks.push({
          type: "tenant",
          passed: tenantResult.allowed,
          result: tenantResult,
        });

        if (!tenantResult.allowed) {
          res.setHeader("X-RateLimit-Type", "tenant");
          addRateLimitHeaders(
            res,
            tenantResult.limit,
            tenantResult.remaining,
            tenantResult.resetAt,
          );
          return defaultRateLimitHandler(req, res);
        }
      }

      // Check User rate limit
      const userId = (req as any).userId || (req as any).user?.id;
      if (userId && options.user !== false) {
        const userResult = await rateLimiterService.checkUserRateLimit(
          userId,
          req.path,
          options.user,
        );
        checks.push({
          type: "user",
          passed: userResult.allowed,
          result: userResult,
        });

        if (!userResult.allowed) {
          res.setHeader("X-RateLimit-Type", "user");
          addRateLimitHeaders(
            res,
            userResult.limit,
            userResult.remaining,
            userResult.resetAt,
          );
          return defaultRateLimitHandler(req, res);
        }
      }

      next();
    } catch (error) {
      console.error("Combined rate limit middleware error:", error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * Export default rate limiters for common use cases
 */
export const rateLimiters = {
  // Global rate limiter (100 requests per minute per IP)
  global: rateLimitByIp({ max: 100, windowSeconds: 60 }),

  // Strict rate limiter for auth endpoints (5 requests per 5 minutes per IP)
  auth: authRateLimit(),

  // API rate limiter (1000 requests per minute per tenant)
  api: rateLimitByTenant({ max: 1000, windowSeconds: 60 }),

  // User rate limiter (500 requests per minute per user)
  user: rateLimitByUser({ max: 500, windowSeconds: 60 }),

  // Combined rate limiter
  combined: combinedRateLimit({
    ip: { max: 100, windowSeconds: 60 },
    tenant: { max: 1000, windowSeconds: 60 },
    user: { max: 500, windowSeconds: 60 },
  }),
};
