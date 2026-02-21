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
 * console.log(env.stripe.publicKey);
 * console.log(env.api.baseUrl);
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
  graphqlEndpoint: z.string().url(),
  timeout: z.number().positive().default(30000),
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
});

/**
 * Complete environment schema
 */
const envSchema = z.object({
  stripe: stripeConfigSchema,
  api: apiConfigSchema,
  app: appConfigSchema,
  features: featureFlagsSchema,
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
  const stripePublicKey =
    raw.VITE_STRIPE_PUBLIC_KEY ||
    raw.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ"; // Fallback

  const isStripeTestMode = stripePublicKey.includes("test");
  const stripeAccount = stripePublicKey.substring(8, 23);

  // API configuration
  const apiBaseUrl = raw.VITE_API_BASE_URL || raw.VITE_API_URL || "https://clubmanagment.com/";
  const graphqlEndpoint = `${apiBaseUrl.replace(/\/$/, "")}/graphql`;

  // Feature flags
  const enableMocking = raw.VITE_USE_MOCKS === "true" || isDevelopment;
  const enableDevTools = raw.VITE_ENABLE_DEVTOOLS === "true" || isDevelopment;
  const enableAnalytics = raw.VITE_ENABLE_ANALYTICS === "true" || isProduction;
  const enableErrorTracking = raw.VITE_ENABLE_ERROR_TRACKING === "true" || isProduction;

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
    },
  };

  // Validate configuration
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ [Config] Environment validation failed:");
      error.errors.forEach((err) => {
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
  return env.api.graphqlEndpoint;
};

/**
 * Log configuration on startup (development only)
 */
if (isDev) {
  console.log("🔧 [Config] Environment configuration loaded:", {
    environment: env.app.environment,
    api: {
      baseUrl: env.api.baseUrl,
      graphql: env.api.graphqlEndpoint,
    },
    stripe: {
      mode: env.stripe.isTestMode ? "TEST" : "LIVE",
      account: env.stripe.account,
      key: env.stripe.publicKey.substring(0, 20) + "...",
    },
    features: env.features,
  });
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
