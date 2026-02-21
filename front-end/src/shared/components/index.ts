/**
 * Shared Components - Barrel Export
 *
 * Re-exports all shared/common UI components used across features.
 * These are generic, reusable components that are not tied to any specific feature.
 */

// ============================================================================
// Common Components
// ============================================================================

// Note: Some common-legacy components may not have default exports
// Import them directly from their files if needed
export { default as AppBreadcrumb } from "./common-legacy/AppBreadcrumb";

// ============================================================================
// Layout Components
// ============================================================================

export { default as MainLayout } from "./layout/MainLayout";
// Note: Sidebar and Header have casing issues - import from layout/index.ts or directly
// Note: Footer component not yet created
// export { default as Footer } from "./layout/Footer";

// ============================================================================
// Form Components
// ============================================================================

export * from "./common-legacy/form";

// ============================================================================
// Modal Components
// ============================================================================

export * from "./common-legacy/modal";

// ============================================================================
// UI Components
// ============================================================================

export * from "./ui";

// ============================================================================
// Debug Components
// ============================================================================

export * from "./debug";

// ============================================================================
// Gestion Components
// ============================================================================

export { default as AlertesBadge } from "./gestion/AlertesBadge";
