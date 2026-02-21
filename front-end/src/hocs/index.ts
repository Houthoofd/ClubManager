/**
 * Higher-Order Components (HOCs)
 *
 * Collection de HOCs réutilisables pour améliorer les composants avec
 * des fonctionnalités communes comme l'authentification, les permissions,
 * le chargement de données, le tracking, etc.
 */

// Authentication & Authorization
export {
  withAuth,
  withAuthRole,
  useRequireAuth,
  useRequireRole,
  type WithAuthOptions,
} from "./withAuth";

export {
  withPermissions,
  usePermissions,
  RequirePermissions,
  type WithPermissionsOptions,
  type UserRole,
} from "./withPermissions";

// Data Management
export { QueryWrapper, SimpleErrorState, SimpleLoadingState } from "./withData";

// Loading States
export {
  withLoading,
  useLoadingWrapper,
  type WithLoadingOptions,
  type WithLoadingProps,
} from "./withLoading";

// Error Handling
export { withErrorBoundary, ErrorBoundary } from "./withErrorBoundary";

// Analytics & Tracking
export {
  withTracking,
  useTracking,
  type TrackingOptions,
  type TrackingProps,
} from "./withTracking";
