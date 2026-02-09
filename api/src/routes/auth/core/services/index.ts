/**
 * Export centralisé des services Auth
 */

// Auth service
export * from './auth.service.js';

// Rate limit service
export {
  RateLimitService,
  getRateLimitService,
  resetRateLimitService,
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
  checkEmailVerificationRateLimit,
  checkRegistrationRateLimit,
  checkRefreshTokenRateLimit,
  resetRateLimit,
} from './rate-limit.service.js';

export type {
  RateLimitRule,
  RateLimitResult,
} from './rate-limit.service.js';
