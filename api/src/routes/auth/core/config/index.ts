/**
 * Export centralisé de la configuration Auth
 */

export {
  TOKEN_CONFIG,
  COOKIE_CONFIG,
  RATE_LIMIT_CONFIG,
  LOCKOUT_CONFIG,
  SESSION_CONFIG,
  SECURITY_CONFIG,
  STORAGE_CONFIG,
  EMAIL_CONFIG,
  FEATURE_FLAGS,
  getAuthConfig,
} from './auth.config.js';

export type { AuthConfig } from './auth.config.js';
