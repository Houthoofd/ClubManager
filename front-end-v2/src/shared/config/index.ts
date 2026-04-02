/**
 * Configuration Module - Public API
 *
 * Centralized configuration exports for the application.
 * All environment variables and configuration objects are exported here.
 *
 * @module shared/config
 *
 * @example
 * ```typescript
 * import { env, apiConfig, featureFlags } from '@shared/config';
 *
 * console.log(env.VITE_API_BASE_URL);
 * console.log(apiConfig.baseUrl);
 * console.log(featureFlags.devtools);
 * ```
 */

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
  type Env,
} from './env';
