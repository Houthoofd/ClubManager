/**
 * Export centralisé des services Auth
 */

// Auth service
export * from "./auth.service.js";

// Rate limit service
export {
  createRateLimitService,
  getRateLimitService,
  destroyRateLimitService,
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
  checkEmailVerificationRateLimit,
  checkRegistrationRateLimit,
  checkRefreshTokenRateLimit,
  resetAuthRateLimit,
} from "./rate-limit.service.js";

export type {
  AuthRateLimitRule,
  RateLimitResult,
} from "./rate-limit.service.js";
