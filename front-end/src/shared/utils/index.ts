/**
 * Shared Utils - Barrel Export
 *
 * Re-exports all shared utility functions used across features.
 * These are generic, reusable utilities that are not tied to any specific feature.
 */

// ============================================================================
// API Utilities
// ============================================================================

export { default as apiUrl } from "./apiUrl";

// ============================================================================
// Storage Utilities
// ============================================================================

export * from "./storage";

// ============================================================================
// Authentication Utilities
// ============================================================================

export * from "./authCleaner";
export * from "./fetchInformationsUtilisateur";

// ============================================================================
// Validation Utilities
// ============================================================================

export * from "./inscriptionValidation";

// ============================================================================
// String Utilities
// ============================================================================

export { safeSubstring } from "./safeSubstring";

// ============================================================================
// Logger Utilities
// ============================================================================

export * from "./logger";

// ============================================================================
// Error Handler Utilities
// ============================================================================

export * from "./errorHandler";
export type {
  NormalizedError,
  ErrorHandlerOptions,
  ErrorType,
  ErrorSeverity,
} from "./errorHandler";
