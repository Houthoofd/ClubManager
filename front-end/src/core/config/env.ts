/**
 * ============================================================================
 * CENTRALIZED ENVIRONMENT CONFIGURATION
 * ============================================================================
 *
 * Validates and provides type-safe access to environment variables.
 * Ensures all required variables are present at startup.
 *
 * Usage:
 * ```tsx
 * import { env } from '@/core/config/env';
 *
 * logger.info('Stripe key:', env.stripe.publicKey);
 * logger.info('API URL:', env.api.baseUrl);
 * ```
 */

import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Stripe configuration schema
 */
const stripeConfigSchema = z.object({
  publicKey: z
    .string()
    .min(1, "VITE_STRIPE_PUBLIC_KEY is required")
    .startsWith("pk_", "Stripe public key must start with pk_"),
  isTestMode: z.boolean(),
  account: z.string().optional(),
});

/**
 * API configuration schema
 */
const apiConfigSchema = z.object({
  baseUrl: z
    .string()
    .min(1, "VITE_API_BASE_URL is required")
    .url("VITE_API_BASE_URL must be a valid URL"),
  graphqlEndpoint: z.string().url().optional(),
  graphqlUrl: z.string().url().optional(),
  wsUrl: z.string().optional(),
  timeout: z.number().positive().default(30000),
});

/**
 * Sentry configuration schema
 */
const sentryConfigSchema = z.object({
  dsn: z.string().optional(),
  environment: z.string().optional(),
  release: z.string().optional(),
  enabled: z.boolean().default(false),
});

/**
 * App configuration schema
 */
const appConfigSchema = z.object({
  name: z.string().default("ClubManager"),
  version: z.string().default("1.0.0"),
  environment: z.enum(["development", "production", "test"]),
  isDevelopment: z.boolean(),
  isProduction: z.boolean(),
  isTest: z.boolean(),
});

/**
 * Feature flags schema
 */
const featureFlagsSchema = z.object({
  enableMocking: z.boolean().default(false),
  enableDevTools: z.boolean().default(false),
  enableAnalytics: z.boolean().default(false),
  enableErrorTracking: z.boolean().default(false),
  enableQueryBatching: z.boolean().default(true),
  enableAPQ: z.boolean().default(true),
  enableCachePersistence: z.boolean().default(true),
});

/**
 * Complete environment schema
 */
const envSchema = z.object({
  stripe: stripeConfigSchema,
  api: apiConfigSchema,
  app: appConfigSchema,
  features: featureFlagsSchema,
  sentry: sentryConfigSchema,
});

// ============================================================================
// ENVIRONMENT PARSING
// ============================================================================

/**
 * Parse and validate environment variables
 */
function parseEnv() {
  // Get raw environment variables
  const raw = import.meta.env;

  // Determine environment
  const mode = raw.MODE || "development";
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";
  const isTest = mode === "test";

  // Stripe configuration
  const stripePublicKey = raw.VITE_STRIPE_PUBLIC_KEY || raw.VITE_STRIPE_PUBLISHABLE_KEY;

  // Validate Stripe key is present
  if (!stripePublicKey) {
    const errorMsg = "VITE_STRIPE_PUBLIC_KEY is required but not set. Please check your .env file.";
    console.error(`❌ [Config] ${errorMsg}`);
    if (isProduction) {
      throw new Error(errorMsg);
    }
    console.warn(
      "⚠️ [Config] Using development mode without Stripe key - some features will not work",
    );
  }

  const isStripeTestMode = stripePublicKey ? stripePublicKey.includes("test") : false;
  const stripeAccount = stripePublicKey ? stripePublicKey.substring(8, 23) : "";

  // API configuration
  const apiBaseUrl = raw.VITE_API_BASE_URL || raw.VITE_API_URL || "https://clubmanagment.com/";
  const graphqlEndpoint = `${apiBaseUrl.replace(/\/$/, "")}/graphql`;

  // Feature flags
  const enableMocking = raw.VITE_USE_MOCKS === "true" || isDevelopment;
  const enableDevTools = raw.VITE_ENABLE_DEVTOOLS === "true" || isDevelopment;
  const enableAnalytics = raw.VITE_ENABLE_ANALYTICS === "true" || isProduction;
  const enableErrorTracking = raw.VITE_ENABLE_ERROR_TRACKING === "true" || isProduction;
  const enableQueryBatching = raw.VITE_ENABLE_QUERY_BATCHING !== "false";
  const enableAPQ = raw.VITE_ENABLE_APQ !== "false";
  const enableCachePersistence = raw.VITE_ENABLE_CACHE_PERSISTENCE !== "false";

  // Sentry configuration
  const sentryDsn = raw.VITE_SENTRY_DSN || "";
  const sentryEnabled = isProduction && !!sentryDsn;

  // Construct configuration object
  const config = {
    stripe: {
      publicKey: stripePublicKey,
      isTestMode: isStripeTestMode,
      account: stripeAccount,
    },
    api: {
      baseUrl: apiBaseUrl,
      graphqlEndpoint,
      graphqlUrl: raw.VITE_GRAPHQL_ENDPOINT || raw.VITE_GRAPHQL_URL || graphqlEndpoint,
      wsUrl: raw.VITE_WS_URL || `ws://localhost:4000/graphql`,
      timeout: Number(raw.VITE_API_TIMEOUT) || 30000,
    },
    app: {
      name: raw.VITE_APP_NAME || "ClubManager",
      version: raw.VITE_APP_VERSION || "1.0.0",
      environment: mode as "development" | "production" | "test",
      isDevelopment,
      isProduction,
      isTest,
    },
    features: {
      enableMocking,
      enableDevTools,
      enableAnalytics,
      enableErrorTracking,
      enableQueryBatching,
      enableAPQ,
      enableCachePersistence,
    },
    sentry: {
      dsn: sentryDsn,
      environment: mode,
      release: raw.VITE_APP_VERSION || "1.0.0",
      enabled: sentryEnabled,
    },
  };

  // Validate configuration
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ [Config] Environment validation failed:");
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Invalid environment configuration. Check console for details.");
    }
    throw error;
  }
}

// ============================================================================
// EXPORTED CONFIGURATION
// ============================================================================

/**
 * Validated environment configuration
 * Safe to use throughout the application
 */
export const env = parseEnv();

/**
 * Type of environment configuration
 */
export type Env = z.infer<typeof envSchema>;

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Check if running in development mode
 */
export const isDev = env.app.isDevelopment;

/**
 * Check if running in production mode
 */
export const isProd = env.app.isProduction;

/**
 * Check if running in test mode
 */
export const isTest = env.app.isTest;

/**
 * Get current environment name
 */
export const getEnvironment = () => env.app.environment;

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof env.features): boolean => {
  return env.features[feature];
};

/**
 * Get API endpoint URL
 */
export const getApiUrl = (path: string = ""): string => {
  const base = env.api.baseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return cleanPath ? `${base}/${cleanPath}` : base;
};

/**
 * Get GraphQL endpoint URL
 */
export const getGraphQLUrl = (): string => {
  return env.api.graphqlEndpoint || env.api.graphqlUrl || `${env.api.baseUrl}/graphql`;
};

/**
 * Log configuration on startup (development only)
 */
if (isDev) {
  console.log("🔧 [Config] Environment configuration loaded");
}

// ============================================================================
// RUNTIME VALIDATION WARNING
// ============================================================================

if (isProd && env.stripe.isTestMode) {
  console.warn(
    "⚠️ [Config] WARNING: Using Stripe TEST key in PRODUCTION mode! This should not happen in production.",
  );
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default env;
