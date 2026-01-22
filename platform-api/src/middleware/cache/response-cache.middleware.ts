/**
 * Response Cache Middleware
 * Express middleware for caching API responses using Redis
 */

import { Request, Response, NextFunction } from "express";
import { cacheService } from "../../cache/cache.service.js";
import { ApiCacheKeys } from "../../cache/cache-keys.js";
import { CacheTTL } from "../../cache/cache.config.js";

/**
 * Response cache options
 */
export interface ResponseCacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  appendKey?: (req: Request) => string; // Additional key suffix
  varyByHeaders?: string[]; // Vary cache by specific headers
  varyByQuery?: boolean; // Vary cache by query parameters
  varyByTenant?: boolean; // Vary cache by tenant ID
  varyByUser?: boolean; // Vary cache by user ID
  onCacheHit?: (req: Request, key: string) => void;
  onCacheMiss?: (req: Request, key: string) => void;
  methods?: string[]; // HTTP methods to cache (default: ['GET', 'HEAD'])
}

/**
 * Default cache options
 */
const defaultOptions: ResponseCacheOptions = {
  ttl: CacheTTL.API_RESPONSE,
  varyByQuery: true,
  varyByTenant: true,
  varyByUser: false,
  methods: ["GET", "HEAD"],
};

/**
 * Generate cache key from request
 */
function generateCacheKeyFromRequest(
  req: Request,
  options: ResponseCacheOptions,
): string {
  // Use custom key generator if provided
  if (options.keyGenerator) {
    return options.keyGenerator(req);
  }

  const parts: string[] = [];

  // Add method and path
  parts.push(req.method.toLowerCase());
  parts.push(req.path);

  // Vary by tenant
  if (options.varyByTenant) {
    const tenantId = (req as any).tenantId || (req as any).tenant?.id;
    if (tenantId) {
      parts.push(`tenant:${tenantId}`);
    }
  }

  // Vary by user
  if (options.varyByUser) {
    const userId = (req as any).userId || (req as any).user?.id;
    if (userId) {
      parts.push(`user:${userId}`);
    }
  }

  // Vary by query parameters
  if (options.varyByQuery && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map((key) => `${key}=${req.query[key]}`)
      .join("&");
    parts.push(`query:${sortedQuery}`);
  }

  // Vary by headers
  if (options.varyByHeaders && options.varyByHeaders.length > 0) {
    for (const header of options.varyByHeaders) {
      const value = req.get(header);
      if (value) {
        parts.push(`header:${header}:${value}`);
      }
    }
  }

  // Add custom append key
  if (options.appendKey) {
    parts.push(options.appendKey(req));
  }

  return ApiCacheKeys.response(req.method, req.path, req.query);
}

/**
 * Check if request should be cached
 */
function shouldCache(req: Request, options: ResponseCacheOptions): boolean {
  // Skip if custom skip function returns true
  if (options.skip && options.skip(req)) {
    return false;
  }

  // Only cache specific HTTP methods
  const methods = options.methods || defaultOptions.methods || [];
  if (!methods.includes(req.method)) {
    return false;
  }

  // Don't cache if no-cache header is present
  const cacheControl = req.get("cache-control");
  if (
    cacheControl &&
    (cacheControl.includes("no-cache") || cacheControl.includes("no-store"))
  ) {
    return false;
  }

  return true;
}

/**
 * Check if response should be cached
 */
function shouldCacheResponse(res: Response): boolean {
  // Only cache successful responses
  if (res.statusCode < 200 || res.statusCode >= 300) {
    return false;
  }

  // Don't cache if no-cache header is set in response
  const cacheControl = res.get("cache-control");
  if (
    cacheControl &&
    (cacheControl.includes("no-cache") || cacheControl.includes("no-store"))
  ) {
    return false;
  }

  return true;
}

/**
 * Create response cache middleware
 */
export function responseCache(
  options: ResponseCacheOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const opts = { ...defaultOptions, ...options };

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Check if request should be cached
      if (!shouldCache(req, opts)) {
        return next();
      }

      // Generate cache key
      const cacheKey = generateCacheKeyFromRequest(req, opts);

      // Try to get from cache
      const cached = await cacheService.get<{
        statusCode: number;
        headers: Record<string, string>;
        body: any;
      }>(cacheKey);

      // Cache hit
      if (cached) {
        if (opts.onCacheHit) {
          opts.onCacheHit(req, cacheKey);
        }

        // Set cache headers
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);

        // Restore headers
        if (cached.headers) {
          Object.entries(cached.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }

        // Send cached response
        res.status(cached.statusCode).json(cached.body);
        return;
      }

      // Cache miss
      if (opts.onCacheMiss) {
        opts.onCacheMiss(req, cacheKey);
      }

      res.setHeader("X-Cache", "MISS");
      res.setHeader("X-Cache-Key", cacheKey);

      // Store original response methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      // Override json method to cache response
      res.json = function (body: any): Response {
        if (shouldCacheResponse(res)) {
          // Cache the response
          const cacheData = {
            statusCode: res.statusCode,
            headers: {
              "content-type": res.get("content-type") || "application/json",
            },
            body,
          };

          cacheService
            .set(cacheKey, cacheData, {
              ttl: opts.ttl || CacheTTL.API_RESPONSE,
            })
            .catch((error) => {
              console.error("Error caching response:", error);
            });
        }

        return originalJson(body);
      };

      // Override send method to cache response
      res.send = function (body: any): Response {
        if (shouldCacheResponse(res)) {
          // Try to parse body if JSON
          let parsedBody = body;
          try {
            if (typeof body === "string") {
              parsedBody = JSON.parse(body);
            }
          } catch {
            // Not JSON, keep as is
          }

          // Cache the response
          const cacheData = {
            statusCode: res.statusCode,
            headers: {
              "content-type": res.get("content-type") || "text/html",
            },
            body: parsedBody,
          };

          cacheService
            .set(cacheKey, cacheData, {
              ttl: opts.ttl || CacheTTL.API_RESPONSE,
            })
            .catch((error) => {
              console.error("Error caching response:", error);
            });
        }

        return originalSend(body);
      };

      next();
    } catch (error) {
      console.error("Response cache middleware error:", error);
      // On error, proceed without caching
      next();
    }
  };
}

/**
 * Invalidate cache for specific path or pattern
 */
export async function invalidateCache(
  pathOrPattern: string,
  method?: string,
): Promise<number> {
  const pattern = method
    ? ApiCacheKeys.response(method, pathOrPattern, {})
    : ApiCacheKeys.pattern(pathOrPattern);

  return await cacheService.deletePattern(pattern);
}

/**
 * Invalidate all API cache
 */
export async function invalidateAllApiCache(): Promise<number> {
  const pattern = ApiCacheKeys.pattern();
  return await cacheService.deletePattern(pattern);
}

/**
 * Invalidate cache for tenant
 */
export async function invalidateTenantCache(tenantId: string): Promise<number> {
  const pattern = `*:tenant:${tenantId}*`;
  return await cacheService.deletePattern(pattern);
}

/**
 * Invalidate cache for user
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  const pattern = `*:user:${userId}*`;
  return await cacheService.deletePattern(pattern);
}

/**
 * Export pre-configured cache middleware
 */
export const cachedResponse = {
  // Short cache (5 minutes)
  short: responseCache({ ttl: CacheTTL.API_RESPONSE }),

  // Medium cache (30 minutes)
  medium: responseCache({ ttl: CacheTTL.USER_SESSION }),

  // Long cache (1 hour)
  long: responseCache({ ttl: CacheTTL.USER_PROFILE }),

  // Static data cache (2 hours)
  static: responseCache({ ttl: CacheTTL.STATIC_DATA }),

  // Reference data cache (24 hours)
  reference: responseCache({ ttl: CacheTTL.REFERENCE_DATA }),

  // Vary by tenant only
  tenant: responseCache({
    ttl: CacheTTL.API_RESPONSE,
    varyByTenant: true,
    varyByUser: false,
    varyByQuery: false,
  }),

  // Vary by user
  user: responseCache({
    ttl: CacheTTL.API_RESPONSE,
    varyByTenant: true,
    varyByUser: true,
    varyByQuery: false,
  }),

  // Don't vary by anything (global cache)
  global: responseCache({
    ttl: CacheTTL.STATIC_DATA,
    varyByTenant: false,
    varyByUser: false,
    varyByQuery: false,
  }),
};
