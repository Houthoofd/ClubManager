/**
 * Shared Module - Main Barrel Export
 *
 * This is the main entry point for all shared/common code used across features.
 * It provides a centralized export for components, hooks, utils, types, and constants.
 *
 * Usage:
 *   import { PageHeader, useDebounce, apiUrl, VALIDATION_CONSTANTS } from '@/shared';
 */

// ============================================================================
// Components
// ============================================================================

export * from "./components";

// ============================================================================
// Hooks
// ============================================================================

export * from "./hooks";

// ============================================================================
// Utils
// ============================================================================

export * from "./utils";

// ============================================================================
// Types
// ============================================================================

// TypeScript declaration files are automatically included
// Individual type exports can be added here if needed
// export type * from "./types";

// ============================================================================
// Constants
// ============================================================================

export * from "./constants";
