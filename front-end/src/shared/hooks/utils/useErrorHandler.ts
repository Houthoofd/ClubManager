/**
 * ====================================================================
 * useErrorHandler Hook
 * ====================================================================
 *
 * React hook for centralized error handling in components.
 * Integrates with error handler utility, toast notifications, and Sentry.
 *
 * Usage:
 * ```tsx
 * const { handleError, clearError, error } = useErrorHandler();
 *
 * const handleSubmit = async () => {
 *   try {
 *     await submitData();
 *   } catch (error) {
 *     handleError(error);
 *   }
 * };
 * ```
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  handleError as utilHandleError,
  handleGraphQLError,
  normalizeError,
  formatErrorForUser,
  shouldLogout,
  shouldRetry,
  getRetryDelay,
  type NormalizedError,
  type ErrorHandlerOptions,
} from "@/shared/utils/errorHandler";
import { useToast } from "./useToast";

/**
 * useErrorHandler hook options
 */
export interface UseErrorHandlerOptions {
  /**
   * Show toast notification automatically
   * @default true
   */
  showToast?: boolean;

  /**
   * Report to Sentry
   * @default true
   */
  reportToSentry?: boolean;

  /**
   * Log to console
   * @default true in development
   */
  logToConsole?: boolean;

  /**
   * Auto-logout on authentication errors
   * @default true
   */
  autoLogout?: boolean;

  /**
   * Auto-retry on network/server errors
   * @default false
   */
  autoRetry?: boolean;

  /**
   * Maximum retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base retry delay in ms
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Callback when error is handled
   */
  onError?: (error: NormalizedError) => void;

  /**
   * Callback when error is cleared
   */
  onErrorClear?: () => void;
}

/**
 * useErrorHandler return type
 */
export interface UseErrorHandlerReturn {
  /**
   * Current error (if any)
   */
  error: NormalizedError | null;

  /**
   * Handle an error
   */
  handleError: (error: any, options?: ErrorHandlerOptions) => NormalizedError;

  /**
   * Clear current error
   */
  clearError: () => void;

  /**
   * Whether there's an active error
   */
  hasError: boolean;

  /**
   * Retry the last failed operation
   */
  retry: () => void;

  /**
   * Number of retry attempts
   */
  retryCount: number;
}

/**
 * Hook for centralized error handling
 *
 * @param options - Error handler options
 * @returns Error handler functions and state
 *
 * @example
 * ```tsx
 * function UserForm() {
 *   const { handleError, error, clearError } = useErrorHandler();
 *   const [loading, setLoading] = useState(false);
 *
 *   const handleSubmit = async (data) => {
 *     setLoading(true);
 *     clearError();
 *
 *     try {
 *       await saveUser(data);
 *     } catch (err) {
 *       handleError(err);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <Alert variant="danger">{error.message}</Alert>}
 *       // form fields here
 *     </form>
 *   );
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showToast = true,
    reportToSentry = true,
    logToConsole = import.meta.env.DEV,
    autoLogout = true,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onErrorClear,
  } = options;

  const { t } = useTranslation();
  const toast = useToast();

  const [error, setError] = useState<NormalizedError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setRetryCallback(null);
    onErrorClear?.();
  }, [onErrorClear]);

  /**
   * Handle error
   */
  const handleError = useCallback(
    (err: any, handlerOptions: ErrorHandlerOptions = {}): NormalizedError => {
      // Merge options
      const mergedOptions: ErrorHandlerOptions = {
        showToast: false, // We'll handle toast manually
        reportToSentry,
        logToConsole,
        ...handlerOptions,
      };

      // Normalize and handle error
      const normalized = utilHandleError(err, mergedOptions);

      // Update state
      setError(normalized);

      // Show toast notification
      if (showToast) {
        const message = formatErrorForUser(err, t);
        const variant =
          normalized.severity === "critical" || normalized.severity === "high"
            ? "danger"
            : normalized.severity === "medium"
              ? "warning"
              : "info";

        toast.addAlert({
          variant,
          title: t("errors.title"),
          message,
        });
      }

      // Auto-logout on authentication errors
      if (autoLogout && shouldLogout(err)) {
        // Dispatch logout event (to be caught by auth provider)
        window.dispatchEvent(new CustomEvent("auth-error"));
      }

      // Callback
      onError?.(normalized);

      return normalized;
    },
    [showToast, reportToSentry, logToConsole, autoLogout, onError, t, toast],
  );

  /**
   * Retry last failed operation
   */
  const retry = useCallback(() => {
    if (retryCallback) {
      retryCallback();
    }
  }, [retryCallback]);

  /**
   * Auto-retry logic
   */
  useEffect(() => {
    if (autoRetry && error && retryCount < maxRetries) {
      if (shouldRetry(error.originalError)) {
        const delay = getRetryDelay(retryCount, retryDelay);

        const timer = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          retry();
        }, delay);

        return () => clearTimeout(timer);
      }
    }
  }, [autoRetry, error, retryCount, maxRetries, retryDelay, retry]);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null,
    retry,
    retryCount,
  };
}

/**
 * Hook specifically for GraphQL errors
 *
 * @example
 * ```tsx
 * const { handleError } = useGraphQLErrorHandler();
 *
 * const [createUser] = useCreateUserMutation({
 *   onError: handleError,
 * });
 * ```
 */
export function useGraphQLErrorHandler(options: UseErrorHandlerOptions = {}) {
  const baseHandler = useErrorHandler(options);

  const handleError = useCallback((err: any, handlerOptions?: ErrorHandlerOptions) => {
    return handleGraphQLError(err, {
      ...handlerOptions,
      showToast: false, // Handled by base handler
    });
  }, []);

  return {
    ...baseHandler,
    handleError,
  };
}

/**
 * Hook for async operations with built-in error handling
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useAsyncWithErrorHandler(
 *   async () => {
 *     const result = await fetchData();
 *     return result;
 *   }
 * );
 *
 * return (
 *   <button onClick={execute} disabled={loading}>
 *     {loading ? 'Loading...' : 'Fetch Data'}
 *   </button>
 * );
 * ```
 */
export function useAsyncWithErrorHandler<T = any>(
  asyncFn: () => Promise<T>,
  options: UseErrorHandlerOptions = {},
) {
  const { handleError, error, clearError } = useErrorHandler(options);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, handleError, clearError]);

  return {
    execute,
    loading,
    error,
    data,
    clearError,
  };
}

/**
 * Hook for form submission with error handling
 *
 * @example
 * ```tsx
 * const { handleSubmit, submitting, error } = useFormWithErrorHandler(
 *   async (formData) => {
 *     await saveUser(formData);
 *   }
 * );
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     {error && <Alert variant="danger">{error.message}</Alert>}
 *     // form fields here
 *   </form>
 * );
 * ```
 */
export function useFormWithErrorHandler<T = any>(
  onSubmit: (data: T) => Promise<void>,
  options: UseErrorHandlerOptions = {},
) {
  const { handleError, error, clearError } = useErrorHandler(options);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: T) => {
      setSubmitting(true);
      clearError();

      try {
        await onSubmit(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, handleError, clearError],
  );

  return {
    handleSubmit,
    submitting,
    error,
    clearError,
  };
}

export default useErrorHandler;
