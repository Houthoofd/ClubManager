import { Request, Response, NextFunction } from "express";
import rateLimitService from "../services/rateLimitService.js";

/**
 * Middleware de rate limiting par tenant
 */
export const tenantRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.tenant?.tenantId;

    if (!tenantId || !req.tenant) {
      // Pas de tenant = limite très stricte
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const allowed = await rateLimitService.checkLimit(
        "anonymous",
        ip,
        "ANONYMOUS",
      );

      if (!allowed.allowed) {
        return res.status(429).json({
          error: "Too many requests",
          retryAfter: allowed.retryAfter,
          limit: allowed.limit,
        });
      }

      return next();
    }

    const tenant = req.tenant.tenant;
    const userId = req.user?.id?.toString() || req.ip || "anonymous";

    const allowed = await rateLimitService.checkLimit(
      tenantId,
      userId,
      tenant.plan,
    );

    // Ajouter les headers de rate limit
    res.set({
      "X-RateLimit-Limit": allowed.limit.toString(),
      "X-RateLimit-Remaining": allowed.remaining.toString(),
      "X-RateLimit-Reset": allowed.resetAt.toString(),
    });

    if (!allowed.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded for your plan",
        retryAfter: allowed.retryAfter,
        limit: allowed.limit,
        plan: tenant.plan,
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    // En cas d'erreur, laisser passer (fail open)
    next();
  }
};

/**
 * Middleware de rate limiting pour API publique (plus strict)
 */
export const apiRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const apiKey = req.get("X-API-Key");
    const identifier = apiKey || req.ip || "anonymous";

    const allowed = await rateLimitService.checkLimit("api", identifier, "API");

    res.set({
      "X-RateLimit-Limit": allowed.limit.toString(),
      "X-RateLimit-Remaining": allowed.remaining.toString(),
      "X-RateLimit-Reset": allowed.resetAt.toString(),
    });

    if (!allowed.allowed) {
      return res.status(429).json({
        error: "API rate limit exceeded",
        retryAfter: allowed.retryAfter,
      });
    }

    next();
  } catch (error) {
    console.error("API rate limiter error:", error);
    next();
  }
};

export default tenantRateLimiter;
