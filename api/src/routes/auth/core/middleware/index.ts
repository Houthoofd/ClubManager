/**
 * Export centralisé des middleware Auth
 */

// Auth middleware
export {
  requireAuth,
  requireAdmin,
  requireOwner,
  requireVerifiedEmail,
  isAuthenticated,
  hasRole,
  isAdmin,
  isOwner,
  canAccess,
} from "./auth.middleware.js";

export type { AuthContext, RequireAuthOptions } from "./auth.middleware.js";

// Rate limit middleware
export {
  withRateLimit,
  withLoginRateLimit,
  withPasswordResetRateLimit,
  withEmailVerificationRateLimit,
  withRegistrationRateLimit,
  withRefreshTokenRateLimit,
  withGeneralRateLimit,
  resetRateLimitAfterSuccess,
  checkRateLimitStatus,
  RateLimitMiddleware,
} from "./rate-limit.middleware.js";

export type {
  RateLimitContext,
  RateLimitOptions,
} from "./rate-limit.middleware.js";
