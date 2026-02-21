/**
 * ====================================================================
 * MONITORING MODULE - CENTRAL EXPORT
 * ====================================================================
 *
 * Point d'entrée central pour toutes les fonctionnalités de monitoring.
 *
 * Features:
 * - 🐛 Error tracking (Sentry)
 * - 📊 Performance monitoring
 * - 👤 User context tracking
 * - 🎨 Error Boundary component
 *
 * Usage:
 *   import { captureError, setSentryUser } from '@/core/monitoring';
 */

// ============================================================================
// SENTRY INITIALIZATION & CONFIG
// ============================================================================

export { initSentry, isSentryEnabled, getSentryClient } from "./sentry";

// ============================================================================
// ERROR TRACKING
// ============================================================================

export { captureError, captureMessage } from "./sentry";

// ============================================================================
// USER CONTEXT
// ============================================================================

export { setSentryUser, clearSentryUser } from "./sentry";
export type { SentryUser } from "./sentry";

// ============================================================================
// CONTEXT & TAGS
// ============================================================================

export { setSentryContext, setSentryTag } from "./sentry";

// ============================================================================
// BREADCRUMBS (user actions tracking)
// ============================================================================

export { addBreadcrumb } from "./sentry";

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export { startTransaction, measurePerformance } from "./sentry";

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export { default as SentryErrorBoundary, withErrorBoundary } from "./SentryErrorBoundary";

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import SentryModule from "./sentry";
export default SentryModule;
