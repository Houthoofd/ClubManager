/**
 * Shared Architecture - Main Index
 *
 * Centralized exports for the entire shared architecture.
 * This allows for convenient imports from a single entry point.
 *
 * @example
 * import { requireAuth, hashPassword, ErrorCode } from '@/shared';
 */

// ===== Configuration =====
export * from './config';

// ===== Services =====
export * from './services';

// ===== Middleware =====
export * from './middleware';

// ===== Errors =====
export * from './errors';

// ===== Utils =====
export * from './utils';

// ===== Types =====
export * from './types';

/**
 * Quick reference for commonly used exports:
 *
 * Configuration:
 * - appConfig, authConfig
 * - validateConfig(), logConfig()
 *
 * Services:
 * - createRateLimitService(), getRateLimitService()
 * - createAuditLogService(), getAuditLogService()
 * - createSessionService(), getSessionService()
 * - AuditEventType, AuditSeverity
 *
 * Middleware:
 * - requireAuth(), requireAdmin(), requireOwner()
 * - withValidation(), withAuditLog(), withApiRateLimit()
 * - withLoginRateLimit(), withPasswordResetRateLimit()
 *
 * Errors:
 * - AuthenticationError, AuthorizationError
 * - ValidationError, NotFoundError, ConflictError
 * - ErrorCode, getErrorMessage(), getHttpStatus()
 *
 * Utils:
 * - hashPassword(), verifyPassword(), calculatePasswordStrength()
 * - formatDate(), addDays(), getAge()
 * - isValidEmail(), isValidUUID(), toSlug()
 * - setCookie(), clearCookie(), getCookie()
 */
