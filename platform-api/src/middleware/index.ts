/**
 * Centralized middleware exports
 * Point d'entrée unique pour tous les middlewares de l'application
 */

// Authentication & Authorization
export {
  generateToken,
  verifyToken,
  optionalAuth,
  requireRole,
  type JWTPayload,
} from "./auth/auth.js";

// Auth Middleware (class-based)
export { authMiddleware } from "./auth/auth.middleware.js";

// Tenant Management
export {
  tenantResolver,
  validateUserTenant,
  checkTenantLimits,
  getTenantPrisma,
} from "./auth/tenant.js";

// Rate Limiting
export { tenantRateLimiter, apiRateLimiter } from "./security/rateLimiter.js";

// Validation
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  validateFile,
  validateFiles,
  sanitizeInput,
} from "./validation/validation.js";

// Error Handling
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  errorLogger,
} from "./validation/errorHandler.js";

// Audit Logging
export { auditLogger, auditUpdate, auditDelete } from "./logging/auditLogger.js";

// CORS
export {
  corsMiddleware,
  devCors,
  prodCors,
  adaptiveCors,
  apiCors,
  webhookCors,
} from "./security/cors.js";

// Security
export {
  securityMiddleware,
  cspNonce,
  timingSafeCompare,
  csrfProtection,
  bodyLimit,
  suspiciousRequestDetector,
  defaultSecurity,
  devSecurity,
  adaptiveSecurity,
} from "./security/security.js";

// Request Logging
export {
  requestLogger,
  performanceLogger,
  sensitiveResourceLogger,
  dataChangeLogger,
  minimalLogger,
  standardLogger,
  verboseLogger,
  adaptiveLogger,
} from "./logging/logger.js";

/**
 * Common middleware chains pour réutilisation
 */
import {
  verifyToken,
  optionalAuth,
  requireRole,
  generateToken,
} from "./auth/auth.js";
import {
  tenantResolver,
  validateUserTenant,
  checkTenantLimits,
  getTenantPrisma,
} from "./auth/tenant.js";
import { tenantRateLimiter, apiRateLimiter } from "./security/rateLimiter.js";
import {
  validate,
  sanitizeInput,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  validateFile,
  validateFiles,
} from "./validation/validation.js";
import {
  adaptiveCors,
  corsMiddleware,
  devCors,
  prodCors,
  apiCors,
  webhookCors,
} from "./security/cors.js";
import {
  adaptiveSecurity,
  securityMiddleware,
  cspNonce,
  timingSafeCompare,
  csrfProtection,
  bodyLimit,
  suspiciousRequestDetector,
  defaultSecurity,
  devSecurity,
} from "./security/security.js";
import {
  adaptiveLogger,
  requestLogger,
  performanceLogger,
  sensitiveResourceLogger,
  dataChangeLogger,
  minimalLogger,
  standardLogger,
  verboseLogger,
} from "./logging/logger.js";
import {
  errorHandler as errorHandlerFn,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  errorLogger as errorLoggerFn,
} from "./validation/errorHandler.js";
import {
  auditLogger as auditLoggerFn,
  auditUpdate,
  auditDelete,
} from "./logging/auditLogger.js";

/**
 * Chain complète d'authentification + tenant
 * Usage: router.use(requireAuthAndTenant)
 */
export const requireAuthAndTenant = [
  verifyToken,
  tenantResolver,
  validateUserTenant,
  sanitizeInput,
];

/**
 * Chain pour routes publiques avec tenant
 * Usage: router.use(requireTenant)
 */
export const requireTenant = [tenantResolver, sanitizeInput];

/**
 * Chain pour routes protégées avec rate limiting
 * Usage: router.use(requireAuthTenantRateLimit)
 */
export const requireAuthTenantRateLimit = [
  verifyToken,
  tenantResolver,
  validateUserTenant,
  tenantRateLimiter,
  sanitizeInput,
];

/**
 * Chain pour API publique avec rate limiting strict
 * Usage: router.use(publicApiChain)
 */
export const publicApiChain = [
  adaptiveCors,
  tenantResolver,
  apiRateLimiter,
  sanitizeInput,
];

/**
 * Chain complète pour app Express (à utiliser au démarrage)
 * Usage: app.use(fullAppChain)
 */
export const fullAppChain = [
  adaptiveLogger,
  adaptiveCors,
  adaptiveSecurity,
  sanitizeInput,
];

export default {
  // Auth
  verifyToken,
  optionalAuth,
  requireRole,
  generateToken,

  // Tenant
  tenantResolver,
  validateUserTenant,
  checkTenantLimits,
  getTenantPrisma,

  // Rate Limiting
  tenantRateLimiter,
  apiRateLimiter,

  // Validation
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  validateFile,
  validateFiles,
  sanitizeInput,

  // Error Handling
  errorHandler: errorHandlerFn,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  errorLogger: errorLoggerFn,

  // Audit
  auditLogger: auditLoggerFn,
  auditUpdate,
  auditDelete,

  // CORS
  corsMiddleware,
  devCors,
  prodCors,
  adaptiveCors,
  apiCors,
  webhookCors,

  // Security
  securityMiddleware,
  cspNonce,
  timingSafeCompare,
  csrfProtection,
  bodyLimit,
  suspiciousRequestDetector,
  defaultSecurity,
  devSecurity,
  adaptiveSecurity,

  // Logging
  requestLogger,
  performanceLogger,
  sensitiveResourceLogger,
  dataChangeLogger,
  minimalLogger,
  standardLogger,
  verboseLogger,
  adaptiveLogger,

  // Chains
  requireAuthAndTenant,
  requireTenant,
  requireAuthTenantRateLimit,
  publicApiChain,
  fullAppChain,
};
