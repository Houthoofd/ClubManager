/**
 * Shared Layer - Public API
 *
 * This layer contains reusable infrastructure code, UI components,
 * utilities, and configurations that can be used across the entire application.
 *
 * Import Restrictions (Feature-Sliced Design):
 * ✅ Can be imported by: app, pages, widgets, features, entities
 * ❌ Cannot import from: app, pages, widgets, features, entities
 *
 * @module shared
 */

// ============================================================================
// API Client
// ============================================================================

export {
  apiClient,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  NetworkError,
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
} from './api/client';

export type {
  ApiErrorData,
  HttpMethod,
  RequestConfig,
  ApiClientConfig,
} from './api/client';

// ============================================================================
// Configuration
// ============================================================================

export {
  env,
  isDevelopment,
  isProduction,
  isTest,
  apiConfig,
  stripeConfig,
  authConfig,
  featureFlags,
  loggingConfig,
  monitoringConfig,
} from './config/env';

export type { Env } from './config/env';

// ============================================================================
// UI Components
// ============================================================================

export { Button } from './ui/Button';
export type { ButtonProps } from './ui/Button';

export { ErrorBoundary, useErrorHandler } from './ui/ErrorBoundary';

// ============================================================================
// Library / Utilities
// ============================================================================

// Add utility exports here as they are created
// export { formatDate, parseDate } from './lib/date';
// export { cn, clsx } from './lib/classnames';
// export { debounce, throttle } from './lib/performance';
