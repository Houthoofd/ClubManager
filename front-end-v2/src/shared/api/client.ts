/**
 * @fileoverview HTTP API Client with Result Pattern
 * @module shared/api/client
 *
 * Centralized HTTP client for all API calls using the Result pattern
 * for error handling. This provides type-safe error handling and
 * consistent API across the application.
 *
 * Features:
 * - Result pattern for error handling
 * - Automatic token management
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Type-safe error types
 *
 * @example
 * ```typescript
 * import { apiClient } from '@shared/api/client';
 *
 * const result = await apiClient.get<User>('/users/me');
 *
 * if (result.isOk()) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

import { Result } from '@clubmanager/types';
import { env } from '@shared/config/env';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base API error type
 */
export interface ApiErrorData {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Network error (connection issues, timeouts)
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * HTTP error (4xx, 5xx responses)
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validation error (400 with validation details)
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly validationErrors: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR', validationErrors);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = 'Internal server error',
    status: number = 500
  ) {
    super(message, status, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

// ============================================================================
// Types
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retry?: {
    count: number;
    delay: number;
    exponentialBackoff?: boolean;
  };
  signal?: AbortSignal;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// ============================================================================
// Token Management
// ============================================================================

let authToken: string | null = null;

/**
 * Set authentication token for subsequent requests
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Get current authentication token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  authToken = null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build URL with query parameters
 */
function buildURL(path: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(path, env.apiBaseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

/**
 * Build request headers
 */
function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Parse error response
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  const status = response.status;

  try {
    const data = await response.json();
    const message = data.message || data.error || response.statusText;
    const code = data.code;
    const details = data.details;

    // Specific error types based on status
    switch (status) {
      case 400:
        if (data.validationErrors) {
          return new ValidationError(message, data.validationErrors);
        }
        return new ApiError(message, status, code, details);

      case 401:
        return new AuthenticationError(message);

      case 403:
        return new AuthorizationError(message);

      case 404:
        return new NotFoundError(message);

      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message, status);

      default:
        return new ApiError(message, status, code, details);
    }
  } catch {
    // Failed to parse error response
    return new ApiError(
      response.statusText || 'Request failed',
      status,
      'PARSE_ERROR'
    );
  }
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  exponentialBackoff: boolean
): number {
  if (!exponentialBackoff) {
    return baseDelay;
  }
  return baseDelay * Math.pow(2, attempt);
}

// ============================================================================
// Core Request Function
// ============================================================================

/**
 * Execute HTTP request with retry logic
 */
async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<Result<T, ApiError | NetworkError>> {
  const url = buildURL(path, config?.params);
  const headers = buildHeaders(config?.headers);
  const timeout = config?.timeout ?? env.apiTimeout;
  const retryConfig = config?.retry ?? { count: 0, delay: 1000, exponentialBackoff: true };

  let lastError: ApiError | NetworkError;

  for (let attempt = 0; attempt <= retryConfig.count; attempt++) {
    try {
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine abort signals
      const signal = config?.signal
        ? combineAbortSignals(config.signal, controller.signal)
        : controller.signal;

      // Make request
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        const error = await parseErrorResponse(response);

        // Don't retry client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return Result.err(error);
        }

        lastError = error;

        // Retry if not last attempt
        if (attempt < retryConfig.count) {
          const delay = calculateRetryDelay(
            attempt,
            retryConfig.delay,
            retryConfig.exponentialBackoff ?? true
          );
          await sleep(delay);
          continue;
        }

        return Result.err(error);
      }

      // Parse success response
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return Result.ok(data as T);
      }

      // Return empty object for non-JSON responses (e.g., 204 No Content)
      return Result.ok({} as T);

    } catch (error) {
      // Network error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = new NetworkError('Request timeout', error);
        } else {
          lastError = new NetworkError(
            error.message || 'Network request failed',
            error
          );
        }
      } else {
        lastError = new NetworkError('Unknown network error', error);
      }

      // Retry if not last attempt
      if (attempt < retryConfig.count) {
        const delay = calculateRetryDelay(
          attempt,
          retryConfig.delay,
          retryConfig.exponentialBackoff ?? true
        );
        await sleep(delay);
        continue;
      }
    }
  }

  return Result.err(lastError!);
}

/**
 * Combine multiple abort signals
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}

// ============================================================================
// API Client
// ============================================================================

/**
 * HTTP API Client with Result pattern
 */
export const apiClient = {
  /**
   * GET request
   */
  get<T>(path: string, config?: RequestConfig): Promise<Result<T, ApiError | NetworkError>> {
    return request<T>('GET', path, undefined, config);
  },

  /**
   * POST request
   */
  post<T>(
    path: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<Result<T, ApiError | NetworkError>> {
    return request<T>('POST', path, body, config);
  },

  /**
   * PUT request
   */
  put<T>(
    path: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<Result<T, ApiError | NetworkError>> {
    return request<T>('PUT', path, body, config);
  },

  /**
   * PATCH request
   */
  patch<T>(
    path: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<Result<T, ApiError | NetworkError>> {
    return request<T>('PATCH', path, body, config);
  },

  /**
   * DELETE request
   */
  delete<T>(path: string, config?: RequestConfig): Promise<Result<T, ApiError | NetworkError>> {
    return request<T>('DELETE', path, undefined, config);
  },
};

// ============================================================================
// Exports
// ============================================================================

export default apiClient;
