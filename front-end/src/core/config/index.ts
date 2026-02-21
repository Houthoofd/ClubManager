/**
 * ============================================================================
 * CONFIG MODULE - BARREL EXPORT
 * ============================================================================
 *
 * Centralized configuration management for the application.
 *
 * Usage:
 * ```tsx
 * import { env, isDev, isProd } from '@/core/config';
 *
 * console.log(env.stripe.publicKey);
 * console.log(env.api.baseUrl);
 *
 * if (isDev) {
 *   console.log('Running in development mode');
 * }
 * ```
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

export {
  env,
  isDev,
  isProd,
  isTest,
  getEnvironment,
  isFeatureEnabled,
  getApiUrl,
  getGraphQLUrl,
  type Env,
} from './env';

// ============================================================================
// RE-EXPORTS (Convenience)
// ============================================================================

export { env as default } from './env';
