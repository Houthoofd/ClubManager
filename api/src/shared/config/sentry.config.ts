/**
 * Sentry Configuration
 *
 * Centralized error tracking and performance monitoring with Sentry.
 * Integrates seamlessly with the shared architecture.
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { appConfig } from "./app.config.js";

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  debug: boolean;
  integrations: {
    http: boolean;
    express: boolean;
    graphql: boolean;
    prisma: boolean;
    console: boolean;
  };
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
  beforeSendTransaction?: (event: Sentry.Event) => Sentry.Event | null;
}

/**
 * Sentry configuration from environment variables
 */
export const sentryConfig: SentryConfig = {
  dsn: process.env.SENTRY_DSN || "",
  environment: appConfig.env,
  enabled: process.env.SENTRY_ENABLED === "true" && !!process.env.SENTRY_DSN,
  sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || "1.0"),
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  profilesSampleRate: parseFloat(
    process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1",
  ),
  debug: process.env.SENTRY_DEBUG === "true",

  integrations: {
    http: process.env.SENTRY_INTEGRATION_HTTP !== "false",
    express: process.env.SENTRY_INTEGRATION_EXPRESS !== "false",
    graphql: process.env.SENTRY_INTEGRATION_GRAPHQL !== "false",
    prisma: process.env.SENTRY_INTEGRATION_PRISMA !== "false",
    console: process.env.SENTRY_INTEGRATION_CONSOLE !== "false",
  },
};

/**
 * Initialize Sentry
 */
export function initializeSentry(): void {
  if (!sentryConfig.enabled) {
    console.log("⚠️  Sentry disabled (SENTRY_ENABLED=false or no DSN)");
    return;
  }

  try {
    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      sampleRate: sentryConfig.sampleRate,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      profilesSampleRate: sentryConfig.profilesSampleRate,
      debug: sentryConfig.debug,

      integrations: [
        // HTTP requests tracking
        ...(sentryConfig.integrations.http ? [Sentry.httpIntegration()] : []),

        // Console breadcrumbs
        ...(sentryConfig.integrations.console
          ? [Sentry.consoleIntegration()]
          : []),

        // Profiling
        nodeProfilingIntegration(),
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from request
        if (event.request?.data) {
          event.request.data = sanitizeSentryData(event.request.data);
        }

        // Remove sensitive data from extra
        if (event.extra) {
          event.extra = sanitizeSentryData(event.extra);
        }

        // Remove passwords from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
            ...breadcrumb,
            data: breadcrumb.data
              ? sanitizeSentryData(breadcrumb.data)
              : undefined,
          }));
        }

        return event;
      },

      // Filter transactions
      beforeSendTransaction(event) {
        // Don't send healthcheck transactions
        if (
          event.transaction === "GET /health" ||
          event.transaction === "GET /ping"
        ) {
          return null;
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Network errors
        "NetworkError",
        "Network request failed",
        "Failed to fetch",

        // Browser extensions
        "Extension context invalidated",
        "chrome-extension://",
        "moz-extension://",

        // Development
        "ResizeObserver loop limit exceeded",

        // Common non-critical errors
        "Non-Error promise rejection captured",
      ],
    });

    console.log("✅ Sentry initialized successfully");
    console.log(`   Environment: ${sentryConfig.environment}`);
    console.log(`   Sample Rate: ${sentryConfig.sampleRate * 100}%`);
    console.log(
      `   Traces Sample Rate: ${sentryConfig.tracesSampleRate * 100}%`,
    );
  } catch (error) {
    console.error("❌ Failed to initialize Sentry:", error);
  }
}

/**
 * Sanitize sensitive data before sending to Sentry
 */
function sanitizeSentryData(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "apiKey",
    "secret",
    "secretKey",
    "authorization",
    "cookie",
    "creditCard",
    "cvv",
    "ssn",
    "socialSecurity",
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  Object.keys(sanitized).forEach((key) => {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive data
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    }
    // Recursively sanitize nested objects
    else if (sanitized[key] && typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeSentryData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  role?: string;
}): void {
  if (!sentryConfig.enabled) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearSentryUser(): void {
  if (!sentryConfig.enabled) return;
  Sentry.setUser(null);
}

/**
 * Set custom context for Sentry
 */
export function setSentryContext(key: string, value: any): void {
  if (!sentryConfig.enabled) return;
  Sentry.setContext(key, sanitizeSentryData(value));
}

/**
 * Add breadcrumb to Sentry
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = "custom",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, any>,
): void {
  if (!sentryConfig.enabled) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: data ? sanitizeSentryData(data) : undefined,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception in Sentry
 */
export function captureException(
  error: Error,
  context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id: string; email?: string };
  },
): string | undefined {
  if (!sentryConfig.enabled) return;

  return Sentry.captureException(error, {
    level: context?.level || "error",
    tags: context?.tags,
    extra: context?.extra ? sanitizeSentryData(context.extra) : undefined,
    user: context?.user,
  });
}

/**
 * Capture message in Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  },
): string | undefined {
  if (!sentryConfig.enabled) return;

  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra ? sanitizeSentryData(context.extra) : undefined,
  });
}

/**
 * Start a Sentry transaction (for performance monitoring)
 */
export function startTransaction(
  name: string,
  op: string = "custom",
): any | undefined {
  if (!sentryConfig.enabled) return;

  // Sentry v10 uses startSpan instead of startTransaction
  // startSpan requires a callback, so we return undefined for now
  return undefined;
}

/**
 * Flush Sentry (ensure all events are sent)
 * Call this before application shutdown
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!sentryConfig.enabled) return true;

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    console.error("Failed to flush Sentry:", error);
    return false;
  }
}

/**
 * Close Sentry
 * Call this on application shutdown
 */
export async function closeSentry(timeout: number = 2000): Promise<boolean> {
  if (!sentryConfig.enabled) return true;

  try {
    return await Sentry.close(timeout);
  } catch (error) {
    console.error("Failed to close Sentry:", error);
    return false;
  }
}

/**
 * Sentry error wrapper for GraphQL errors
 */
export function captureGraphQLError(
  error: Error,
  operation: string,
  variables?: any,
  user?: { id: string; email?: string },
): void {
  if (!sentryConfig.enabled) return;

  captureException(error, {
    level: "error",
    tags: {
      type: "graphql",
      operation,
    },
    extra: {
      operation,
      variables: variables ? sanitizeSentryData(variables) : undefined,
    },
    user,
  });
}

/**
 * Sentry transaction wrapper for GraphQL resolvers
 */
export async function withSentryTransaction<T>(
  name: string,
  op: string,
  callback: (transaction: any) => Promise<T>,
): Promise<T> {
  if (!sentryConfig.enabled) {
    return callback({} as any);
  }

  // Sentry v10 uses startSpan instead of startTransaction
  return Sentry.startSpan({ name, op }, async (span) => {
    try {
      const result = await callback(span);
      span.setStatus({ code: 1 }); // 1 = OK status
      return result;
    } catch (error) {
      span.setStatus({ code: 2 }); // 2 = ERROR status
      throw error;
    }
  });
}

export default Sentry;
