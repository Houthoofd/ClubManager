/**
 * Environment Configuration
 *
 * Centralized environment variable management with validation using Zod.
 * This ensures type safety and validates all required environment variables at startup.
 *
 * @module shared/config/env
 */

import { z } from 'zod';

/**
 * Environment variable schema
 * Defines all required and optional environment variables with validation rules
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z
    .string()
    .url('API base URL must be a valid URL')
    .default('http://localhost:3000'),

  VITE_API_TIMEOUT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('30000'),

  // Stripe Configuration
  VITE_STRIPE_PUBLIC_KEY: z
    .string()
    .min(1, 'Stripe public key is required')
    .startsWith('pk_', 'Stripe public key must start with pk_'),

  // Application Configuration
  VITE_APP_NAME: z.string().default('ClubManager'),
  VITE_APP_VERSION: z.string().default('2.0.0'),
  VITE_APP_ENVIRONMENT: z
    .enum(['development', 'staging', 'production'])
    .default('development'),

  // Feature Flags
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  VITE_ENABLE_QUERY_DEVTOOLS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  VITE_ENABLE_REDUX_DEVTOOLS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Authentication
  VITE_AUTH_TOKEN_KEY: z.string().default('clubmanager_auth_token'),
  VITE_AUTH_REFRESH_TOKEN_KEY: z.string().default('clubmanager_refresh_token'),
  VITE_SESSION_TIMEOUT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('3600000'), // 1 hour

  // Logging
  VITE_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('debug'),

  VITE_ENABLE_CONSOLE_LOGS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Optional: Error Tracking (Sentry)
  VITE_SENTRY_DSN: z.string().url().optional(),

  // Optional: Analytics
  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_MIXPANEL_TOKEN: z.string().optional(),

  // Development
  VITE_USE_MOCK_API: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  VITE_DEBUG_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Node environment (auto-set by Vite)
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
  SSR: z.boolean().default(false),
});

/**
 * Validated environment variables type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @throws {ZodError} If validation fails
 */
function parseEnv(): Env {
  try {
    const parsed = envSchema.parse({
      ...import.meta.env,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      SSR: import.meta.env.SSR,
      MODE: import.meta.env.MODE,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(error.flatten().fieldErrors);

      throw new Error(
        'Invalid environment variables. Please check your .env file.\n' +
        'See .env.example for required variables.'
      );
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 * Available throughout the application
 */
export const env = parseEnv();

/**
 * Helper to check if running in development mode
 */
export const isDevelopment = env.MODE === 'development';

/**
 * Helper to check if running in production mode
 */
export const isProduction = env.MODE === 'production';

/**
 * Helper to check if running in test mode
 */
export const isTest = env.MODE === 'test';

/**
 * API configuration object
 */
export const apiConfig = {
  baseUrl: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT,
} as const;

/**
 * Stripe configuration object
 */
export const stripeConfig = {
  publicKey: env.VITE_STRIPE_PUBLIC_KEY,
} as const;

/**
 * Authentication configuration object
 */
export const authConfig = {
  tokenKey: env.VITE_AUTH_TOKEN_KEY,
  refreshTokenKey: env.VITE_AUTH_REFRESH_TOKEN_KEY,
  sessionTimeout: env.VITE_SESSION_TIMEOUT,
} as const;

/**
 * Feature flags
 */
export const featureFlags = {
  devtools: env.VITE_ENABLE_DEVTOOLS,
  queryDevtools: env.VITE_ENABLE_QUERY_DEVTOOLS,
  reduxDevtools: env.VITE_ENABLE_REDUX_DEVTOOLS,
  mockApi: env.VITE_USE_MOCK_API,
  debugMode: env.VITE_DEBUG_MODE,
} as const;

/**
 * Logging configuration
 */
export const loggingConfig = {
  level: env.VITE_LOG_LEVEL,
  enableConsoleLogs: env.VITE_ENABLE_CONSOLE_LOGS,
} as const;

/**
 * Monitoring configuration
 */
export const monitoringConfig = {
  sentryDsn: env.VITE_SENTRY_DSN,
  gaTrackingId: env.VITE_GA_TRACKING_ID,
  mixpanelToken: env.VITE_MIXPANEL_TOKEN,
} as const;

// Log configuration in development
if (isDevelopment && env.VITE_DEBUG_MODE) {
  console.log('🔧 Environment Configuration:', {
    mode: env.MODE,
    apiBaseUrl: env.VITE_API_BASE_URL,
    stripeKey: env.VITE_STRIPE_PUBLIC_KEY.substring(0, 20) + '...',
    features: featureFlags,
  });
}
