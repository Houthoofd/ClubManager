/**
 * ====================================================================
 * SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Centralized exports for all core services.
 * Services provide reusable business logic and data operations.
 *
 * Usage:
 * ```tsx
 * import { authService, userService } from '@/core/services';
 * ```
 */

// ====================================================================
// AUTHENTICATION SERVICE
// ====================================================================

export { default as authService } from "./auth.service";
export * from "./auth.service";

// ====================================================================
// USER SERVICE
// ====================================================================

export { default as userService } from "./user.service";
export * from "./user.service";
