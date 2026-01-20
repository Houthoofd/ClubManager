/**
 * Custom Error Classes
 * Standardized error types for the application
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'APP_ERROR',
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 'INTERNAL_ERROR', 500, details);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, details);
  }
}

/**
 * Payment error
 */
export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_ERROR', 400, details);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Token error
 */
export class TokenError extends AppError {
  constructor(message: string = 'Invalid or expired token', details?: any) {
    super(message, 'TOKEN_ERROR', 401, details);
  }
}

/**
 * Tenant error
 */
export class TenantError extends AppError {
  constructor(message: string = 'Invalid tenant', details?: any) {
    super(message, 'TENANT_ERROR', 403, details);
  }
}

/**
 * Resource limit error
 */
export class ResourceLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'RESOURCE_LIMIT_ERROR', 403, details);
  }
}

/**
 * File error
 */
export class FileError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'FILE_ERROR', 400, details);
  }
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return true;
  }
  return false;
}

/**
 * Extract error details for logging
 */
export function extractErrorDetails(error: unknown): {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  details?: any;
} {
  if (isAppError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      details: error.details
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    name: 'UnknownError',
    message: String(error)
  };
}

/**
 * Format error for client response
 */
export function formatErrorForClient(error: unknown, includeStack = false): {
  code: string;
  message: string;
  details?: any;
  stack?: string;
} {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      ...(includeStack && { stack: error.stack })
    };
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      ...(includeStack && { stack: error.stack })
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred'
  };
}

/**
 * Wrap async function with error handling
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}
