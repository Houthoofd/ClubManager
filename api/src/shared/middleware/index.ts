/**
 * Shared Middleware Index
 *
 * Centralized exports for all middleware functions.
 * Import middleware like: import { requireAuth, withRateLimit } from '@/shared/middleware'
 */

export * from "./auth.middleware.js";
export * from "./audit-log.middleware.js";
export * from "./validation.middleware.js";
export * from "./sentry.middleware.js";

// Export rate-limit middleware explicitly to avoid conflicts
export {
  withRateLimit,
  withApiRateLimit,
  withLoginRateLimit,
  withPasswordResetRateLimit,
  RateLimitPresets,
  resetRateLimit,
  type RateLimitConfig,
  type RateLimitStore,
  type RateLimitEntry,
} from "./rate-limit.middleware.js";
