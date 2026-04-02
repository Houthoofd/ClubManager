/**
 * @fileoverview Domain Error Types
 * @module @clubmanager/types/shared/errors/DomainError
 *
 * Type-safe error handling with discriminated unions.
 * All domain errors are strongly typed for better error handling in the backend.
 *
 * @example
 * ```typescript
 * function handleError(error: DomainError): ErrorResponse {
 *   switch (error._tag) {
 *     case 'ValidationError':
 *       return { status: 400, message: error.message, field: error.field };
 *     case 'NotFoundError':
 *       return { status: 404, message: `${error.entity} not found` };
 *     // ... TypeScript ensures exhaustive checking
 *   }
 * }
 * ```
 */

// ============================================================================
// BASE ERROR INTERFACE
// ============================================================================

/**
 * Base interface for all domain errors
 */
export interface BaseError {
  readonly _tag: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly code?: string;
  readonly metadata?: Record<string, unknown>;
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | "REQUIRED_FIELD"
  | "INVALID_FORMAT"
  | "OUT_OF_RANGE"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_TYPE"
  | "INVALID_ENUM"
  | "PATTERN_MISMATCH"
  | "CUSTOM_VALIDATION";

/**
 * Validation error for invalid input data
 *
 * @example
 * ```typescript
 * const error: ValidationError = {
 *   _tag: 'ValidationError',
 *   field: 'email',
 *   message: 'Email format is invalid',
 *   code: 'INVALID_FORMAT',
 *   value: 'not-an-email',
 *   timestamp: new Date(),
 * };
 * ```
 */
export interface ValidationError extends BaseError {
  readonly _tag: "ValidationError";
  readonly field: string;
  readonly code: ValidationErrorCode;
  readonly value?: unknown;
  readonly constraints?: Record<string, any>;
}

/**
 * Multiple validation errors (when validating multiple fields)
 */
export interface MultipleValidationErrors extends BaseError {
  readonly _tag: "MultipleValidationErrors";
  readonly errors: ValidationError[];
  readonly errorCount: number;
}

// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

/**
 * Business rule violation error
 *
 * @example
 * ```typescript
 * const error: BusinessRuleViolation = {
 *   _tag: 'BusinessRuleViolation',
 *   rule: 'UserMustBeActiveToEnroll',
 *   message: 'Cannot enroll inactive user in course',
 *   entity: 'User',
 *   entityId: '123',
 *   timestamp: new Date(),
 * };
 * ```
 */
export interface BusinessRuleViolation extends BaseError {
  readonly _tag: "BusinessRuleViolation";
  readonly rule: string;
  readonly entity: string;
  readonly entityId?: string;
  readonly context?: Record<string, unknown>;
}

// ============================================================================
// NOT FOUND ERRORS
// ============================================================================

/**
 * Entity not found error
 *
 * @example
 * ```typescript
 * const error: NotFoundError = {
 *   _tag: 'NotFoundError',
 *   entity: 'User',
 *   id: 'U-2024-0001',
 *   message: 'User with ID U-2024-0001 not found',
 *   timestamp: new Date(),
 * };
 * ```
 */
export interface NotFoundError extends BaseError {
  readonly _tag: "NotFoundError";
  readonly entity: string;
  readonly id: string | number;
  readonly searchCriteria?: Record<string, unknown>;
}

// ============================================================================
// AUTHORIZATION & AUTHENTICATION ERRORS
// ============================================================================

/**
 * Unauthorized error (not authenticated)
 */
export interface UnauthorizedError extends BaseError {
  readonly _tag: "UnauthorizedError";
  readonly reason:
    | "MISSING_TOKEN"
    | "INVALID_TOKEN"
    | "EXPIRED_TOKEN"
    | "REVOKED_TOKEN";
}

/**
 * Forbidden error (authenticated but not authorized)
 */
export interface ForbiddenError extends BaseError {
  readonly _tag: "ForbiddenError";
  readonly resource: string;
  readonly action: string;
  readonly userId?: string;
  readonly requiredPermission?: string;
}

// ============================================================================
// CONFLICT ERRORS
// ============================================================================

/**
 * Conflict error (duplicate, already exists, etc.)
 *
 * @example
 * ```typescript
 * const error: ConflictError = {
 *   _tag: 'ConflictError',
 *   entity: 'User',
 *   field: 'email',
 *   value: 'john@example.com',
 *   message: 'User with email john@example.com already exists',
 *   timestamp: new Date(),
 * };
 * ```
 */
export interface ConflictError extends BaseError {
  readonly _tag: "ConflictError";
  readonly entity: string;
  readonly field: string;
  readonly value: unknown;
  readonly conflictingId?: string | number;
}

// ============================================================================
// DATABASE ERRORS
// ============================================================================

/**
 * Database operation error
 */
export interface DatabaseError extends BaseError {
  readonly _tag: "DatabaseError";
  readonly operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "TRANSACTION";
  readonly table?: string;
  readonly query?: string;
  readonly originalError?: Error;
}

/**
 * Connection error (database, external service, etc.)
 */
export interface ConnectionError extends BaseError {
  readonly _tag: "ConnectionError";
  readonly service: string;
  readonly host?: string;
  readonly port?: number;
  readonly retryable: boolean;
}

// ============================================================================
// RATE LIMITING & QUOTA ERRORS
// ============================================================================

/**
 * Rate limit exceeded error
 */
export interface RateLimitError extends BaseError {
  readonly _tag: "RateLimitError";
  readonly limit: number;
  readonly current: number;
  readonly resetAt: Date;
  readonly endpoint?: string;
}

/**
 * Quota exceeded error
 */
export interface QuotaExceededError extends BaseError {
  readonly _tag: "QuotaExceededError";
  readonly resource: string;
  readonly quota: number;
  readonly current: number;
  readonly period?: string;
}

// ============================================================================
// EXTERNAL SERVICE ERRORS
// ============================================================================

/**
 * External service error (Stripe, SendGrid, etc.)
 */
export interface ExternalServiceError extends BaseError {
  readonly _tag: "ExternalServiceError";
  readonly service: "Stripe" | "SendGrid" | "Storage" | "Other";
  readonly statusCode?: number;
  readonly originalError?: unknown;
  readonly retryable: boolean;
}

// ============================================================================
// INTERNAL ERRORS
// ============================================================================

/**
 * Internal server error (unexpected)
 */
export interface InternalError extends BaseError {
  readonly _tag: "InternalError";
  readonly originalError?: Error;
  readonly stack?: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Not implemented error
 */
export interface NotImplementedError extends BaseError {
  readonly _tag: "NotImplementedError";
  readonly feature: string;
}

// ============================================================================
// DOMAIN ERROR UNION
// ============================================================================

/**
 * Union of all possible domain errors
 * TypeScript ensures exhaustive checking in switch statements
 */
export type DomainError =
  | ValidationError
  | MultipleValidationErrors
  | BusinessRuleViolation
  | NotFoundError
  | UnauthorizedError
  | ForbiddenError
  | ConflictError
  | DatabaseError
  | ConnectionError
  | RateLimitError
  | QuotaExceededError
  | ExternalServiceError
  | InternalError
  | NotImplementedError;

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Factory functions for creating domain errors
 */
export const DomainError = {
  /**
   * Create a validation error
   */
  validation: (params: {
    field: string;
    message: string;
    code: ValidationErrorCode;
    value?: unknown;
    constraints?: Record<string, any>;
  }): ValidationError => ({
    _tag: "ValidationError",
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create multiple validation errors
   */
  multipleValidation: (errors: ValidationError[]): MultipleValidationErrors => ({
    _tag: "MultipleValidationErrors",
    message: `${errors.length} validation error(s) occurred`,
    timestamp: new Date(),
    errors,
    errorCount: errors.length,
  }),

  /**
   * Create a business rule violation error
   */
  businessRule: (params: {
    rule: string;
    message: string;
    entity: string;
    entityId?: string;
    context?: Record<string, unknown>;
  }): BusinessRuleViolation => ({
    _tag: "BusinessRuleViolation",
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create a not found error
   */
  notFound: (params: {
    entity: string;
    id: string | number;
    message?: string;
    searchCriteria?: Record<string, unknown>;
  }): NotFoundError => ({
    _tag: "NotFoundError",
    message: params.message || `${params.entity} with ID ${params.id} not found`,
    timestamp: new Date(),
    entity: params.entity,
    id: params.id,
    searchCriteria: params.searchCriteria,
  }),

  /**
   * Create an unauthorized error
   */
  unauthorized: (
    reason: UnauthorizedError["reason"],
    message?: string,
  ): UnauthorizedError => ({
    _tag: "UnauthorizedError",
    reason,
    message: message || "Unauthorized access",
    timestamp: new Date(),
  }),

  /**
   * Create a forbidden error
   */
  forbidden: (params: {
    resource: string;
    action: string;
    message?: string;
    userId?: string;
    requiredPermission?: string;
  }): ForbiddenError => ({
    _tag: "ForbiddenError",
    message:
      params.message || `Forbidden: Cannot ${params.action} ${params.resource}`,
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create a conflict error
   */
  conflict: (params: {
    entity: string;
    field: string;
    value: unknown;
    message?: string;
    conflictingId?: string | number;
  }): ConflictError => ({
    _tag: "ConflictError",
    message:
      params.message ||
      `${params.entity} with ${params.field} '${params.value}' already exists`,
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create a database error
   */
  database: (params: {
    operation: DatabaseError["operation"];
    message: string;
    table?: string;
    query?: string;
    originalError?: Error;
  }): DatabaseError => ({
    _tag: "DatabaseError",
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create a connection error
   */
  connection: (params: {
    service: string;
    message: string;
    host?: string;
    port?: number;
    retryable: boolean;
  }): ConnectionError => ({
    _tag: "ConnectionError",
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create a rate limit error
   */
  rateLimit: (params: {
    limit: number;
    current: number;
    resetAt: Date;
    message?: string;
    endpoint?: string;
  }): RateLimitError => ({
    _tag: "RateLimitError",
    message: params.message || `Rate limit exceeded: ${params.current}/${params.limit}`,
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create a quota exceeded error
   */
  quotaExceeded: (params: {
    resource: string;
    quota: number;
    current: number;
    message?: string;
    period?: string;
  }): QuotaExceededError => ({
    _tag: "QuotaExceededError",
    message:
      params.message ||
      `Quota exceeded for ${params.resource}: ${params.current}/${params.quota}`,
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create an external service error
   */
  externalService: (params: {
    service: ExternalServiceError["service"];
    message: string;
    statusCode?: number;
    originalError?: unknown;
    retryable: boolean;
  }): ExternalServiceError => ({
    _tag: "ExternalServiceError",
    timestamp: new Date(),
    ...params,
  }),

  /**
   * Create an internal error
   */
  internal: (params: {
    message: string;
    originalError?: Error;
    context?: Record<string, unknown>;
  }): InternalError => ({
    _tag: "InternalError",
    timestamp: new Date(),
    stack: params.originalError?.stack,
    ...params,
  }),

  /**
   * Create a not implemented error
   */
  notImplemented: (feature: string, message?: string): NotImplementedError => ({
    _tag: "NotImplementedError",
    feature,
    message: message || `Feature '${feature}' is not yet implemented`,
    timestamp: new Date(),
  }),
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guards for domain errors
 */
export const isDomainError = {
  validation: (error: DomainError): error is ValidationError =>
    error._tag === "ValidationError",

  multipleValidation: (error: DomainError): error is MultipleValidationErrors =>
    error._tag === "MultipleValidationErrors",

  businessRule: (error: DomainError): error is BusinessRuleViolation =>
    error._tag === "BusinessRuleViolation",

  notFound: (error: DomainError): error is NotFoundError =>
    error._tag === "NotFoundError",

  unauthorized: (error: DomainError): error is UnauthorizedError =>
    error._tag === "UnauthorizedError",

  forbidden: (error: DomainError): error is ForbiddenError =>
    error._tag === "ForbiddenError",

  conflict: (error: DomainError): error is ConflictError =>
    error._tag === "ConflictError",

  database: (error: DomainError): error is DatabaseError =>
    error._tag === "DatabaseError",

  connection: (error: DomainError): error is ConnectionError =>
    error._tag === "ConnectionError",

  rateLimit: (error: DomainError): error is RateLimitError =>
    error._tag === "RateLimitError",

  quotaExceeded: (error: DomainError): error is QuotaExceededError =>
    error._tag === "QuotaExceededError",

  externalService: (error: DomainError): error is ExternalServiceError =>
    error._tag === "ExternalServiceError",

  internal: (error: DomainError): error is InternalError =>
    error._tag === "InternalError",

  notImplemented: (error: DomainError): error is NotImplementedError =>
    error._tag === "NotImplementedError",
};

// ============================================================================
// HTTP STATUS CODE MAPPING
// ============================================================================

/**
 * Map domain errors to HTTP status codes
 */
export function getHttpStatusCode(error: DomainError): number {
  switch (error._tag) {
    case "ValidationError":
    case "MultipleValidationErrors":
      return 400;

    case "UnauthorizedError":
      return 401;

    case "ForbiddenError":
      return 403;

    case "NotFoundError":
      return 404;

    case "ConflictError":
      return 409;

    case "BusinessRuleViolation":
      return 422;

    case "RateLimitError":
      return 429;

    case "NotImplementedError":
      return 501;

    case "DatabaseError":
    case "ConnectionError":
    case "QuotaExceededError":
    case "ExternalServiceError":
    case "InternalError":
      return 500;

    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = error;
      return 500;
  }
}

/**
 * Convert domain error to API response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Convert domain error to API error response
 */
export function toErrorResponse(error: DomainError): ErrorResponse {
  return {
    success: false,
    error: {
      code: error._tag,
      message: error.message,
      details: getErrorDetails(error),
      timestamp: error.timestamp.toISOString(),
    },
  };
}

/**
 * Extract error details for API response
 */
function getErrorDetails(error: DomainError): unknown {
  switch (error._tag) {
    case "ValidationError":
      return {
        field: error.field,
        code: error.code,
        value: error.value,
        constraints: error.constraints,
      };

    case "MultipleValidationErrors":
      return {
        errors: error.errors.map((e) => ({
          field: e.field,
          code: e.code,
          message: e.message,
        })),
        errorCount: error.errorCount,
      };

    case "BusinessRuleViolation":
      return {
        rule: error.rule,
        entity: error.entity,
        entityId: error.entityId,
      };

    case "NotFoundError":
      return {
        entity: error.entity,
        id: error.id,
      };

    case "ConflictError":
      return {
        entity: error.entity,
        field: error.field,
        value: error.value,
      };

    case "RateLimitError":
      return {
        limit: error.limit,
        current: error.current,
        resetAt: error.resetAt.toISOString(),
      };

    default:
      return undefined;
  }
}
