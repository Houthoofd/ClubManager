/**
 * @fileoverview Shared Utilities Index
 * @module @clubmanager/types/shared
 *
 * Exports all shared utilities, types, and helpers.
 */

// Result monad for functional error handling
export * from "./Result.js";
export type { Result, Success, Failure, ResultValue, ResultError } from "./Result.js";

// Domain errors
export * from "./errors/DomainError.js";
export type {
  DomainError,
  ValidationError,
  MultipleValidationErrors,
  BusinessRuleViolation,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  ConnectionError,
  RateLimitError,
  QuotaExceededError,
  ExternalServiceError,
  InternalError,
  NotImplementedError,
  BaseError,
  ValidationErrorCode,
  ErrorResponse,
} from "./errors/DomainError.js";

export {
  DomainError as DomainErrorFactory,
  isDomainError,
  getHttpStatusCode,
  toErrorResponse,
} from "./errors/DomainError.js";
