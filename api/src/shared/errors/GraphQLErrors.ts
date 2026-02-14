/**
 * GraphQL Error Classes
 *
 * Standardized error classes for GraphQL operations.
 * These errors integrate with Apollo Server and provide consistent error handling.
 */

import { GraphQLError } from "graphql";
import { ErrorCode, getErrorMessage, getHttpStatus } from "./error-codes.js";
import { z } from "zod";

/**
 * Helper function to format Zod errors into ValidationError format
 */
export function formatZodErrors(
  errors: z.ZodIssue[],
): Array<{ field: string; message: string }> {
  return errors.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
}

/**
 * Base Application Error
 */
export class ApplicationError extends GraphQLError {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode?: number,
    extensions?: Record<string, any>,
  ) {
    super(message, {
      extensions: {
        code,
        statusCode: statusCode || getHttpStatus(code),
        timestamp: new Date().toISOString(),
        ...extensions,
      },
    });
    this.name = "ApplicationError";
  }
}

/**
 * Authentication Error
 * Used when user authentication fails
 */
export class AuthenticationError extends ApplicationError {
  constructor(
    message: string = "Non authentifié",
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 401, extensions);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization Error
 * Used when user lacks permissions
 */
export class AuthorizationError extends ApplicationError {
  constructor(
    message: string = "Accès interdit",
    code: ErrorCode = ErrorCode.FORBIDDEN,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 403, extensions);
    this.name = "AuthorizationError";
  }
}

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends ApplicationError {
  constructor(
    message: string = "Erreur de validation",
    validationErrors?:
      | Record<string, string>
      | Array<{ field: string; message: string }>,
    extensions?: Record<string, any>,
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, {
      validationErrors,
      ...extensions,
    });
    this.name = "ValidationError";
  }
}

/**
 * Not Found Error
 * Used when a resource is not found
 */
export class NotFoundError extends ApplicationError {
  constructor(
    message: string = "Ressource non trouvée",
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 404, extensions);
    this.name = "NotFoundError";
  }
}

/**
 * Conflict Error
 * Used when there's a conflict (e.g., duplicate entry)
 */
export class ConflictError extends ApplicationError {
  constructor(
    message: string = "Conflit détecté",
    code: ErrorCode = ErrorCode.CONFLICT,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 409, extensions);
    this.name = "ConflictError";
  }
}

/**
 * Rate Limit Error
 * Used when rate limit is exceeded
 */
export class RateLimitError extends ApplicationError {
  constructor(
    message: string = "Limite de taux dépassée",
    retryAfter?: number,
    extensions?: Record<string, any>,
  ) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, {
      retryAfter,
      ...extensions,
    });
    this.name = "RateLimitError";
  }
}

/**
 * Database Error
 * Used when database operations fail
 */
export class DatabaseError extends ApplicationError {
  constructor(
    message: string = "Erreur de base de données",
    code: ErrorCode = ErrorCode.DATABASE_ERROR,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 500, extensions);
    this.name = "DatabaseError";
  }
}

/**
 * Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends ApplicationError {
  constructor(
    message: string = "Erreur interne du serveur",
    extensions?: Record<string, any>,
  ) {
    super(message, ErrorCode.INTERNAL_SERVER_ERROR, 500, extensions);
    this.name = "InternalServerError";
  }
}

/**
 * Service Unavailable Error
 * Used when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends ApplicationError {
  constructor(
    message: string = "Service indisponible",
    retryAfter?: number,
    extensions?: Record<string, any>,
  ) {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503, {
      retryAfter,
      ...extensions,
    });
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Business Rule Violation Error
 * Used when business rules are violated
 */
export class BusinessRuleError extends ApplicationError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 400, extensions);
    this.name = "BusinessRuleError";
  }
}

/**
 * Payment Error
 * Used when payment operations fail
 */
export class PaymentError extends ApplicationError {
  constructor(
    message: string = "Erreur de paiement",
    code: ErrorCode = ErrorCode.PAYMENT_ERROR,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 402, extensions);
    this.name = "PaymentError";
  }
}

/**
 * File Upload Error
 * Used when file upload operations fail
 */
export class FileUploadError extends ApplicationError {
  constructor(
    message: string = "Erreur de téléchargement",
    code: ErrorCode = ErrorCode.FILE_UPLOAD_ERROR,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 400, extensions);
    this.name = "FileUploadError";
  }
}

/**
 * Email Error
 * Used when email operations fail
 */
export class EmailError extends ApplicationError {
  constructor(
    message: string = "Erreur d'envoi d'email",
    code: ErrorCode = ErrorCode.EMAIL_SEND_ERROR,
    extensions?: Record<string, any>,
  ) {
    super(message, code, 500, extensions);
    this.name = "EmailError";
  }
}

/**
 * Specific Authentication Errors
 */

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = "Email ou mot de passe invalide") {
    super(message, ErrorCode.INVALID_CREDENTIALS);
    this.name = "InvalidCredentialsError";
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = "Token expiré") {
    super(message, ErrorCode.TOKEN_EXPIRED);
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(message: string = "Token invalide") {
    super(message, ErrorCode.INVALID_TOKEN);
    this.name = "InvalidTokenError";
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor(message: string = "Compte verrouillé", unlockAt?: Date) {
    super(message, ErrorCode.ACCOUNT_LOCKED, {
      unlockAt: unlockAt?.toISOString(),
    });
    this.name = "AccountLockedError";
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor(message: string = "Email non vérifié") {
    super(message, ErrorCode.EMAIL_NOT_VERIFIED);
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Specific Resource Errors
 */

export class UserNotFoundError extends NotFoundError {
  constructor(message: string = "Utilisateur non trouvé") {
    super(message, ErrorCode.USER_NOT_FOUND);
    this.name = "UserNotFoundError";
  }
}

export class CourseNotFoundError extends NotFoundError {
  constructor(message: string = "Cours non trouvé") {
    super(message, ErrorCode.COURSE_NOT_FOUND);
    this.name = "CourseNotFoundError";
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(message: string = "Utilisateur existe déjà") {
    super(message, ErrorCode.USER_ALREADY_EXISTS);
    this.name = "UserAlreadyExistsError";
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor(message: string = "Email déjà utilisé") {
    super(message, ErrorCode.EMAIL_ALREADY_EXISTS);
    this.name = "EmailAlreadyExistsError";
  }
}

/**
 * Specific Validation Errors
 */

export class InvalidEmailError extends ValidationError {
  constructor(message: string = "Email invalide") {
    super(message, { email: message });
    this.name = "InvalidEmailError";
  }
}

export class InvalidPasswordError extends ValidationError {
  constructor(
    message: string = "Mot de passe invalide",
    requirements?: string[],
  ) {
    super(message, { password: message }, { requirements });
    this.name = "InvalidPasswordError";
  }
}

export class PasswordTooWeakError extends ValidationError {
  constructor(
    message: string = "Mot de passe trop faible",
    requirements?: string[],
  ) {
    super(message, { password: message }, { requirements });
    this.name = "PasswordTooWeakError";
  }
}

export class PasswordMismatchError extends ValidationError {
  constructor(message: string = "Les mots de passe ne correspondent pas") {
    super(message, { passwordConfirmation: message });
    this.name = "PasswordMismatchError";
  }
}

/**
 * Specific Business Rule Errors
 */

export class MembershipExpiredError extends BusinessRuleError {
  constructor(message: string = "Adhésion expirée", expiryDate?: Date) {
    super(message, ErrorCode.MEMBERSHIP_EXPIRED, {
      expiryDate: expiryDate?.toISOString(),
    });
    this.name = "MembershipExpiredError";
  }
}

export class CourseFullError extends BusinessRuleError {
  constructor(message: string = "Cours complet", maxCapacity?: number) {
    super(message, ErrorCode.COURSE_FULL, { maxCapacity });
    this.name = "CourseFullError";
  }
}

export class CourseAlreadyEnrolledError extends BusinessRuleError {
  constructor(message: string = "Déjà inscrit à ce cours") {
    super(message, ErrorCode.COURSE_ALREADY_ENROLLED);
    this.name = "CourseAlreadyEnrolledError";
  }
}

/**
 * Error Helper Functions
 */

/**
 * Check if error is an ApplicationError
 */
export function isApplicationError(error: any): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Extract error details for logging
 */
export function extractErrorDetails(error: any): {
  name: string;
  message: string;
  code?: ErrorCode;
  statusCode?: number;
  stack?: string;
  extensions?: Record<string, any>;
} {
  if (isApplicationError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      extensions: error.extensions,
    };
  }

  return {
    name: error.name || "Error",
    message: error.message || "An error occurred",
    stack: error.stack,
  };
}

/**
 * Format error for client response
 */
export function formatErrorForClient(error: any): {
  message: string;
  code?: string;
  statusCode?: number;
  extensions?: Record<string, any>;
} {
  if (isApplicationError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      extensions: error.extensions,
    };
  }

  // Don't expose internal error details to clients
  return {
    message: "An error occurred",
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: 500,
  };
}

/**
 * Create error from code
 */
export function createErrorFromCode(
  code: ErrorCode,
  message?: string,
  extensions?: Record<string, any>,
): ApplicationError {
  const defaultMessage = getErrorMessage(code);
  const errorMessage = message || defaultMessage;

  // Map error codes to specific error classes
  switch (code) {
    // Authentication
    case ErrorCode.INVALID_CREDENTIALS:
      return new InvalidCredentialsError(errorMessage);
    case ErrorCode.TOKEN_EXPIRED:
      return new TokenExpiredError(errorMessage);
    case ErrorCode.INVALID_TOKEN:
      return new InvalidTokenError(errorMessage);
    case ErrorCode.ACCOUNT_LOCKED:
      return new AccountLockedError(errorMessage);
    case ErrorCode.EMAIL_NOT_VERIFIED:
      return new EmailNotVerifiedError(errorMessage);
    case ErrorCode.UNAUTHORIZED:
      return new AuthenticationError(errorMessage, code, extensions);

    // Authorization
    case ErrorCode.FORBIDDEN:
    case ErrorCode.INSUFFICIENT_PERMISSIONS:
    case ErrorCode.ADMIN_REQUIRED:
    case ErrorCode.OWNER_REQUIRED:
      return new AuthorizationError(errorMessage, code, extensions);

    // Validation
    case ErrorCode.INVALID_EMAIL:
      return new InvalidEmailError(errorMessage);
    case ErrorCode.INVALID_PASSWORD:
      return new InvalidPasswordError(errorMessage);
    case ErrorCode.PASSWORD_TOO_WEAK:
      return new PasswordTooWeakError(errorMessage);
    case ErrorCode.PASSWORD_MISMATCH:
      return new PasswordMismatchError(errorMessage);
    case ErrorCode.VALIDATION_ERROR:
      return new ValidationError(errorMessage);

    // Resources
    case ErrorCode.USER_NOT_FOUND:
      return new UserNotFoundError(errorMessage);
    case ErrorCode.COURSE_NOT_FOUND:
      return new CourseNotFoundError(errorMessage);
    case ErrorCode.RESOURCE_NOT_FOUND:
      return new NotFoundError(errorMessage, code, extensions);

    case ErrorCode.USER_ALREADY_EXISTS:
      return new UserAlreadyExistsError(errorMessage);
    case ErrorCode.EMAIL_ALREADY_EXISTS:
      return new EmailAlreadyExistsError(errorMessage);
    case ErrorCode.CONFLICT:
      return new ConflictError(errorMessage, code, extensions);

    // Rate Limiting
    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.TOO_MANY_LOGIN_ATTEMPTS:
    case ErrorCode.TOO_MANY_REQUESTS:
      return new RateLimitError(errorMessage);

    // Database
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.DATABASE_CONNECTION_ERROR:
    case ErrorCode.DATABASE_QUERY_ERROR:
      return new DatabaseError(errorMessage, code, extensions);

    // Business Logic
    case ErrorCode.MEMBERSHIP_EXPIRED:
      return new MembershipExpiredError(errorMessage);
    case ErrorCode.COURSE_FULL:
      return new CourseFullError(errorMessage);
    case ErrorCode.COURSE_ALREADY_ENROLLED:
      return new CourseAlreadyEnrolledError(errorMessage);
    case ErrorCode.BUSINESS_RULE_VIOLATION:
      return new BusinessRuleError(errorMessage, code, extensions);

    // Payment
    case ErrorCode.PAYMENT_ERROR:
    case ErrorCode.PAYMENT_FAILED:
      return new PaymentError(errorMessage, code, extensions);

    // Email
    case ErrorCode.EMAIL_SEND_ERROR:
      return new EmailError(errorMessage, code, extensions);

    // File Upload
    case ErrorCode.FILE_UPLOAD_ERROR:
    case ErrorCode.FILE_TOO_LARGE:
    case ErrorCode.INVALID_FILE_TYPE:
      return new FileUploadError(errorMessage, code, extensions);

    // System
    case ErrorCode.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableError(errorMessage);

    default:
      return new InternalServerError(errorMessage, extensions);
  }
}
