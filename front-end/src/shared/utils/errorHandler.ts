/**
 * ====================================================================
 * Error Handler Utility
 * ====================================================================
 *
 * Centralized error handling for the application.
 * Integrates with Sentry, i18n, and provides consistent error messaging.
 *
 * Usage:
 * ```tsx
 * import { handleError, getErrorMessage, isGraphQLError } from '@/shared/utils/errorHandler';
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error);
 *   const message = getErrorMessage(error);
 * }
 * ```
 */

import * as Sentry from "@sentry/react";
import { GraphQLError } from "graphql";

/**
 * Error types
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  GRAPHQL = "GRAPHQL",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Normalized error interface
 */
export interface NormalizedError {
  type: ErrorType;
  message: string;
  code?: string;
  severity: ErrorSeverity;
  originalError: any;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  /**
   * Show toast notification
   * @default true
   */
  showToast?: boolean;

  /**
   * Send to Sentry
   * @default true
   */
  reportToSentry?: boolean;

  /**
   * Log to console
   * @default true in development
   */
  logToConsole?: boolean;

  /**
   * Custom error message (overrides default)
   */
  customMessage?: string;

  /**
   * Additional context to attach to error
   */
  context?: Record<string, any>;

  /**
   * Severity level (auto-detected if not provided)
   */
  severity?: ErrorSeverity;
}

/**
 * GraphQL error codes mapping to error types
 */
const GRAPHQL_ERROR_CODES: Record<string, ErrorType> = {
  UNAUTHENTICATED: ErrorType.AUTHENTICATION,
  FORBIDDEN: ErrorType.AUTHORIZATION,
  NOT_FOUND: ErrorType.NOT_FOUND,
  VALIDATION_ERROR: ErrorType.VALIDATION,
  BAD_USER_INPUT: ErrorType.VALIDATION,
  INTERNAL_SERVER_ERROR: ErrorType.SERVER,
};

/**
 * HTTP status codes mapping to error types
 */
const HTTP_STATUS_CODES: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.AUTHENTICATION,
  403: ErrorType.AUTHORIZATION,
  404: ErrorType.NOT_FOUND,
  500: ErrorType.SERVER,
  502: ErrorType.SERVER,
  503: ErrorType.SERVER,
  504: ErrorType.SERVER,
};

/**
 * Default error messages for each error type (i18n keys)
 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: "errors.network",
  [ErrorType.GRAPHQL]: "errors.graphql",
  [ErrorType.VALIDATION]: "errors.validation",
  [ErrorType.AUTHENTICATION]: "errors.authentication",
  [ErrorType.AUTHORIZATION]: "errors.authorization",
  [ErrorType.NOT_FOUND]: "errors.notFound",
  [ErrorType.SERVER]: "errors.server",
  [ErrorType.UNKNOWN]: "errors.unknown",
};

/**
 * Check if error is an ApolloError
 */
export function isApolloError(error: any): boolean {
  return error?.networkError !== undefined || error?.graphQLErrors !== undefined;
}

/**
 * Check if error is a GraphQL error
 */
export function isGraphQLError(error: any): error is GraphQLError {
  return error instanceof GraphQLError || error?.extensions !== undefined;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.networkError !== undefined ||
    error?.message?.includes("Network") ||
    error?.message?.includes("fetch")
  );
}

/**
 * Extract error type from error object
 */
export function getErrorType(error: any): ErrorType {
  // Network errors
  if (isNetworkError(error)) {
    return ErrorType.NETWORK;
  }

  // Apollo/GraphQL errors
  if (isApolloError(error)) {
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const firstError = error.graphQLErrors[0];
      const code = firstError.extensions?.code as string;

      if (code && GRAPHQL_ERROR_CODES[code]) {
        return GRAPHQL_ERROR_CODES[code];
      }
    }

    if (error.networkError) {
      const statusCode = (error.networkError as any)?.statusCode;
      if (statusCode && HTTP_STATUS_CODES[statusCode]) {
        return HTTP_STATUS_CODES[statusCode];
      }
    }

    return ErrorType.GRAPHQL;
  }

  // HTTP errors
  if (error?.response?.status) {
    const statusCode = error.response.status;
    if (HTTP_STATUS_CODES[statusCode]) {
      return HTTP_STATUS_CODES[statusCode];
    }
  }

  // Custom error types
  if (error?.type && Object.values(ErrorType).includes(error.type)) {
    return error.type;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Extract error message from error object
 */
export function getErrorMessage(error: any, defaultMessage?: string): string {
  // Custom message
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  // Apollo GraphQL errors
  if (isApolloError(error) && error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].message;
  }

  // Network error
  if (error?.networkError?.message) {
    return error.networkError.message;
  }

  // HTTP response error
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Default message based on error type
  const errorType = getErrorType(error);
  if (defaultMessage) {
    return defaultMessage;
  }

  return DEFAULT_ERROR_MESSAGES[errorType];
}

/**
 * Determine error severity
 */
export function getErrorSeverity(error: any): ErrorSeverity {
  const errorType = getErrorType(error);

  switch (errorType) {
    case ErrorType.AUTHENTICATION:
    case ErrorType.SERVER:
      return ErrorSeverity.HIGH;

    case ErrorType.NETWORK:
    case ErrorType.AUTHORIZATION:
      return ErrorSeverity.MEDIUM;

    case ErrorType.VALIDATION:
    case ErrorType.NOT_FOUND:
      return ErrorSeverity.LOW;

    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Normalize error to standard format
 */
export function normalizeError(error: any, context?: Record<string, any>): NormalizedError {
  const type = getErrorType(error);
  const message = getErrorMessage(error);
  const severity = getErrorSeverity(error);

  // Extract error code
  let code: string | undefined;
  if (isApolloError(error) && error.graphQLErrors?.length > 0) {
    code = error.graphQLErrors[0].extensions?.code as string;
  } else if (error?.code) {
    code = error.code;
  }

  return {
    type,
    message,
    code,
    severity,
    originalError: error,
    timestamp: new Date(),
    context,
  };
}

/**
 * Main error handler
 */
export function handleError(error: any, options: ErrorHandlerOptions = {}): NormalizedError {
  const {
    showToast = true,
    reportToSentry = true,
    logToConsole = import.meta.env.DEV,
    customMessage,
    context,
    severity,
  } = options;

  // Normalize the error
  const normalizedError = normalizeError(error, context);

  // Override message if custom message provided
  if (customMessage) {
    normalizedError.message = customMessage;
  }

  // Override severity if provided
  if (severity) {
    normalizedError.severity = severity;
  }

  // Log to console in development
  if (logToConsole) {
    console.group(`🚨 Error [${normalizedError.type}]`);
    console.error("Message:", normalizedError.message);
    console.error("Severity:", normalizedError.severity);
    if (normalizedError.code) {
      console.error("Code:", normalizedError.code);
    }
    if (normalizedError.context) {
      console.error("Context:", normalizedError.context);
    }
    console.error("Original Error:", normalizedError.originalError);
    console.groupEnd();
  }

  // Report to Sentry (only in production or if explicitly enabled)
  if (reportToSentry && (import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED)) {
    Sentry.captureException(error, {
      level: normalizedError.severity === ErrorSeverity.CRITICAL ? "fatal" : "error",
      tags: {
        errorType: normalizedError.type,
        errorCode: normalizedError.code,
      },
      contexts: {
        error: {
          type: normalizedError.type,
          code: normalizedError.code,
          severity: normalizedError.severity,
        },
      },
      extra: {
        ...normalizedError.context,
        normalizedError,
      },
    });
  }

  // Show toast notification (handled by caller or global error handler)
  // This is just a flag - actual toast display should be handled by the UI layer
  if (showToast) {
    // Dispatch custom event that can be caught by toast provider
    window.dispatchEvent(
      new CustomEvent("app-error", {
        detail: {
          message: normalizedError.message,
          type: normalizedError.type,
          severity: normalizedError.severity,
        },
      }),
    );
  }

  return normalizedError;
}

/**
 * Handle GraphQL errors specifically
 */
export function handleGraphQLError(error: any, options: ErrorHandlerOptions = {}): NormalizedError {
  return handleError(error, {
    ...options,
    context: {
      ...options.context,
      graphQLErrors: error.graphQLErrors,
      networkError: error.networkError,
    },
  });
}

/**
 * Create a safe error handler (doesn't throw)
 */
export function safeErrorHandler(error: any, options: ErrorHandlerOptions = {}): void {
  try {
    handleError(error, options);
  } catch (handlerError) {
    // Fallback: just log to console if error handler itself fails
    console.error("Error handler failed:", handlerError);
    console.error("Original error:", error);
  }
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: any, t?: (key: string) => string): string {
  const normalized = normalizeError(error);
  const messageKey = DEFAULT_ERROR_MESSAGES[normalized.type];

  // Use translation function if provided
  if (t) {
    return t(messageKey);
  }

  // Fallback to raw message
  return normalized.message;
}

/**
 * Check if error should trigger logout
 */
export function shouldLogout(error: any): boolean {
  const type = getErrorType(error);
  return type === ErrorType.AUTHENTICATION;
}

/**
 * Check if error should be retried
 */
export function shouldRetry(error: any): boolean {
  const type = getErrorType(error);
  return type === ErrorType.NETWORK || type === ErrorType.SERVER;
}

/**
 * Get retry delay based on attempt count (exponential backoff)
 */
export function getRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attemptCount), 10000);
}

// Export default error handler
export default handleError;
