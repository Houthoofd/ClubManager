/**
 * Error Handler Tests
 *
 * Comprehensive test suite for error handling utilities.
 * Tests cover all functions with realistic error scenarios.
 *
 * @see src/shared/utils/errorHandler.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isApolloError,
  isGraphQLError,
  isNetworkError,
  getErrorType,
  getErrorMessage,
  getErrorSeverity,
  normalizeError,
  handleError,
  handleGraphQLError,
  safeErrorHandler,
  formatErrorForUser,
  shouldLogout,
  shouldRetry,
  getRetryDelay,
  ErrorType,
  ErrorSeverity,
} from "../errorHandler";
import { GraphQLError } from "graphql";

describe("errorHandler", () => {
  // ============================================================================
  // Error Type Detection
  // ============================================================================

  describe("isApolloError", () => {
    it("should detect Apollo error with networkError", () => {
      const error = { networkError: new Error("Network failed") };
      expect(isApolloError(error)).toBe(true);
    });

    it("should detect Apollo error with graphQLErrors", () => {
      const error = { graphQLErrors: [new GraphQLError("GraphQL error")] };
      expect(isApolloError(error)).toBe(true);
    });

    it("should return false for regular error", () => {
      const error = new Error("Regular error");
      expect(isApolloError(error)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isApolloError(null)).toBe(false);
      expect(isApolloError(undefined)).toBe(false);
    });
  });

  describe("isGraphQLError", () => {
    it("should detect GraphQLError instance", () => {
      const error = new GraphQLError("Test error");
      expect(isGraphQLError(error)).toBe(true);
    });

    it("should detect error with extensions", () => {
      const error = { extensions: { code: "UNAUTHENTICATED" } };
      expect(isGraphQLError(error)).toBe(true);
    });

    it("should return false for regular error", () => {
      const error = new Error("Regular error");
      expect(isGraphQLError(error)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isGraphQLError(null)).toBe(false);
      expect(isGraphQLError(undefined)).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("should detect network error from networkError property", () => {
      const error = { networkError: new Error("Failed to fetch") };
      expect(isNetworkError(error)).toBe(true);
    });

    it("should detect network error from message", () => {
      const error = new Error("Network request failed");
      expect(isNetworkError(error)).toBe(true);
    });

    it("should detect fetch error from message", () => {
      const error = new Error("fetch failed");
      expect(isNetworkError(error)).toBe(true);
    });

    it("should return false for non-network error", () => {
      const error = new Error("Validation error");
      expect(isNetworkError(error)).toBe(false);
    });
  });

  // ============================================================================
  // Error Type Classification
  // ============================================================================

  describe("getErrorType", () => {
    it("should classify network error", () => {
      const error = { networkError: new Error("Network failed") };
      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it("should classify authentication error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Unauthenticated", {
            extensions: { code: "UNAUTHENTICATED" },
          }),
        ],
      };
      expect(getErrorType(error)).toBe(ErrorType.AUTHENTICATION);
    });

    it("should classify authorization error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Forbidden", {
            extensions: { code: "FORBIDDEN" },
          }),
        ],
      };
      expect(getErrorType(error)).toBe(ErrorType.AUTHORIZATION);
    });

    it("should classify not found error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Not found", {
            extensions: { code: "NOT_FOUND" },
          }),
        ],
      };
      expect(getErrorType(error)).toBe(ErrorType.NOT_FOUND);
    });

    it("should classify validation error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Invalid input", {
            extensions: { code: "VALIDATION_ERROR" },
          }),
        ],
      };
      expect(getErrorType(error)).toBe(ErrorType.VALIDATION);
    });

    it("should classify server error from HTTP status", () => {
      const error = { response: { status: 500 } };
      expect(getErrorType(error)).toBe(ErrorType.SERVER);
    });

    it("should default to UNKNOWN for unrecognized error", () => {
      const error = new Error("Unknown error");
      expect(getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  // ============================================================================
  // Error Message Extraction
  // ============================================================================

  describe("getErrorMessage", () => {
    it("should extract message from Error object", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("should extract message from GraphQL error", () => {
      const error = {
        graphQLErrors: [new GraphQLError("GraphQL error message")],
      };
      expect(getErrorMessage(error)).toBe("GraphQL error message");
    });

    it("should extract message from network error", () => {
      const error = {
        networkError: { message: "Network error message" },
      };
      expect(getErrorMessage(error)).toBe("Network error message");
    });

    it("should extract message from HTTP response", () => {
      const error = {
        response: { data: { message: "HTTP error message" } },
      };
      expect(getErrorMessage(error)).toBe("HTTP error message");
    });

    it("should use default message when no message found", () => {
      const error = {};
      const result = getErrorMessage(error);
      expect(result).toBe("errors.unknown");
    });

    it("should use provided default message", () => {
      const error = {};
      const result = getErrorMessage(error, "Custom default");
      expect(result).toBe("Custom default");
    });
  });

  // ============================================================================
  // Error Severity
  // ============================================================================

  describe("getErrorSeverity", () => {
    it("should return HIGH for authentication error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Auth error", {
            extensions: { code: "UNAUTHENTICATED" },
          }),
        ],
      };
      expect(getErrorSeverity(error)).toBe(ErrorSeverity.HIGH);
    });

    it("should return HIGH for server error", () => {
      const error = { response: { status: 500 } };
      expect(getErrorSeverity(error)).toBe(ErrorSeverity.HIGH);
    });

    it("should return MEDIUM for network error", () => {
      const error = { networkError: new Error("Network failed") };
      expect(getErrorSeverity(error)).toBe(ErrorSeverity.MEDIUM);
    });

    it("should return LOW for validation error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Validation failed", {
            extensions: { code: "VALIDATION_ERROR" },
          }),
        ],
      };
      expect(getErrorSeverity(error)).toBe(ErrorSeverity.LOW);
    });

    it("should return MEDIUM for unknown error", () => {
      const error = new Error("Unknown");
      expect(getErrorSeverity(error)).toBe(ErrorSeverity.MEDIUM);
    });
  });

  // ============================================================================
  // Error Normalization
  // ============================================================================

  describe("normalizeError", () => {
    it("should normalize error with all properties", () => {
      const error = new Error("Test error");
      const result = normalizeError(error);

      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("severity");
      expect(result).toHaveProperty("originalError");
      expect(result).toHaveProperty("timestamp");
      expect(result.originalError).toBe(error);
    });

    it("should include context when provided", () => {
      const error = new Error("Test error");
      const context = { userId: "123", action: "login" };
      const result = normalizeError(error, context);

      expect(result.context).toEqual(context);
    });

    it("should extract error code from GraphQL error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Auth error", {
            extensions: { code: "UNAUTHENTICATED" },
          }),
        ],
      };
      const result = normalizeError(error);

      expect(result.code).toBe("UNAUTHENTICATED");
    });

    it("should set timestamp as Date object", () => {
      const error = new Error("Test error");
      const result = normalizeError(error);

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // Main Error Handler
  // ============================================================================

  describe("handleError", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should handle error and return normalized result", () => {
      const error = new Error("Test error");
      const result = handleError(error, { showToast: false, reportToSentry: false });

      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("message");
      expect(result.message).toBe("Test error");
    });

    it("should use custom message when provided", () => {
      const error = new Error("Original message");
      const result = handleError(error, {
        customMessage: "Custom message",
        showToast: false,
        reportToSentry: false,
      });

      expect(result.message).toBe("Custom message");
    });

    it("should override severity when provided", () => {
      const error = new Error("Test error");
      const result = handleError(error, {
        severity: ErrorSeverity.CRITICAL,
        showToast: false,
        reportToSentry: false,
      });

      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it("should attach context to error", () => {
      const error = new Error("Test error");
      const context = { page: "login", attempt: 3 };
      const result = handleError(error, {
        context,
        showToast: false,
        reportToSentry: false,
      });

      expect(result.context).toEqual(context);
    });
  });

  // ============================================================================
  // GraphQL Error Handler
  // ============================================================================

  describe("handleGraphQLError", () => {
    it("should handle GraphQL error", () => {
      const error = {
        graphQLErrors: [new GraphQLError("GraphQL error")],
      };
      const result = handleGraphQLError(error, {
        showToast: false,
        reportToSentry: false,
      });

      expect(result.type).toBe(ErrorType.GRAPHQL);
      expect(result.context).toHaveProperty("graphQLErrors");
    });

    it("should include GraphQL errors in context", () => {
      const graphQLErrors = [new GraphQLError("Error 1"), new GraphQLError("Error 2")];
      const error = { graphQLErrors };
      const result = handleGraphQLError(error, {
        showToast: false,
        reportToSentry: false,
      });

      expect(result.context?.graphQLErrors).toEqual(graphQLErrors);
    });
  });

  // ============================================================================
  // Safe Error Handler
  // ============================================================================

  describe("safeErrorHandler", () => {
    it("should not throw even with invalid error", () => {
      expect(() => safeErrorHandler(null)).not.toThrow();
      expect(() => safeErrorHandler(undefined)).not.toThrow();
    });

    it("should handle error without throwing", () => {
      const error = new Error("Test error");
      expect(() =>
        safeErrorHandler(error, { showToast: false, reportToSentry: false }),
      ).not.toThrow();
    });
  });

  // ============================================================================
  // Format Error for User
  // ============================================================================

  describe("formatErrorForUser", () => {
    it("should format error with translation function", () => {
      const error = new Error("Test error");
      const t = (key: string) => `Translated: ${key}`;
      const result = formatErrorForUser(error, t);

      expect(result).toContain("Translated:");
    });

    it("should fallback to message without translation", () => {
      const error = new Error("Test error message");
      const result = formatErrorForUser(error);

      expect(result).toBe("Test error message");
    });
  });

  // ============================================================================
  // Error Decision Helpers
  // ============================================================================

  describe("shouldLogout", () => {
    it("should return true for authentication error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Unauthenticated", {
            extensions: { code: "UNAUTHENTICATED" },
          }),
        ],
      };
      expect(shouldLogout(error)).toBe(true);
    });

    it("should return false for other errors", () => {
      const error = new Error("Regular error");
      expect(shouldLogout(error)).toBe(false);
    });
  });

  describe("shouldRetry", () => {
    it("should return true for network error", () => {
      const error = { networkError: new Error("Network failed") };
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return true for server error", () => {
      const error = { response: { status: 500 } };
      expect(shouldRetry(error)).toBe(true);
    });

    it("should return false for validation error", () => {
      const error = {
        graphQLErrors: [
          new GraphQLError("Validation failed", {
            extensions: { code: "VALIDATION_ERROR" },
          }),
        ],
      };
      expect(shouldRetry(error)).toBe(false);
    });
  });

  describe("getRetryDelay", () => {
    it("should return base delay for first attempt", () => {
      expect(getRetryDelay(0, 1000)).toBe(1000);
    });

    it("should return exponentially increasing delay", () => {
      expect(getRetryDelay(1, 1000)).toBe(2000);
      expect(getRetryDelay(2, 1000)).toBe(4000);
      expect(getRetryDelay(3, 1000)).toBe(8000);
    });

    it("should cap at maximum delay", () => {
      expect(getRetryDelay(10, 1000)).toBe(10000);
      expect(getRetryDelay(20, 1000)).toBe(10000);
    });

    it("should use default base delay", () => {
      expect(getRetryDelay(0)).toBe(1000);
    });
  });
});
