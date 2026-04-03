/**
 * Environment Configuration
 *
 * Centralizes all environment variables for the application.
 */

/**
 * API Base URL
 * Points to the backend API endpoint
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Application environment
 */
export const APP_ENV = import.meta.env.MODE || 'development';

/**
 * Is production environment
 */
export const IS_PRODUCTION = APP_ENV === 'production';

/**
 * Is development environment
 */
export const IS_DEVELOPMENT = APP_ENV === 'development';

/**
 * API timeout in milliseconds
 */
export const API_TIMEOUT = 30000;

/**
 * API retry attempts
 */
export const API_RETRY_ATTEMPTS = 3;
