/**
 * Custom GraphQL Error Classes pour Auth
 * Codes d'erreur standardisés et messages cohérents
 */

import { GraphQLError, GraphQLErrorExtensions } from "graphql";

/**
 * Codes d'erreur standardisés pour Auth
 */
export enum AuthErrorCode {
  // Authentification
  UNAUTHENTICATED = "UNAUTHENTICATED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_DISABLED = "ACCOUNT_DISABLED",

  // Tokens
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  TOKEN_ALREADY_USED = "TOKEN_ALREADY_USED",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  PASSWORD_MISMATCH = "PASSWORD_MISMATCH",

  // Autres
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Classe de base pour toutes les erreurs Auth
 */
export class AuthError extends GraphQLError {
  constructor(
    message: string,
    code: AuthErrorCode,
    extensions?: GraphQLErrorExtensions,
  ) {
    super(message, {
      extensions: {
        code,
        timestamp: new Date().toISOString(),
        ...extensions,
      },
    });
    this.name = "AuthError";
  }
}

/**
 * Erreur: Utilisateur non authentifié
 */
export class UnauthenticatedError extends AuthError {
  constructor(
    message = "Vous devez être authentifié pour accéder à cette ressource",
  ) {
    super(message, AuthErrorCode.UNAUTHENTICATED);
    this.name = "UnauthenticatedError";
  }
}

/**
 * Erreur: Identifiants invalides
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message = "Email ou mot de passe incorrect") {
    super(message, AuthErrorCode.INVALID_CREDENTIALS);
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Erreur: Email non vérifié
 */
export class EmailNotVerifiedError extends AuthError {
  constructor(
    message = "Veuillez vérifier votre email avant de vous connecter",
  ) {
    super(message, AuthErrorCode.EMAIL_NOT_VERIFIED, {
      action: "RESEND_VERIFICATION_EMAIL",
    });
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Erreur: Compte verrouillé
 */
export class AccountLockedError extends AuthError {
  constructor(
    message = "Votre compte a été temporairement verrouillé",
    unlockAt?: Date,
  ) {
    super(message, AuthErrorCode.ACCOUNT_LOCKED, {
      unlockAt: unlockAt?.toISOString(),
    });
    this.name = "AccountLockedError";
  }
}

/**
 * Erreur: Compte désactivé
 */
export class AccountDisabledError extends AuthError {
  constructor(message = "Votre compte a été désactivé") {
    super(message, AuthErrorCode.ACCOUNT_DISABLED);
    this.name = "AccountDisabledError";
  }
}

/**
 * Erreur: Token expiré
 */
export class TokenExpiredError extends AuthError {
  constructor(message = "Le token a expiré", tokenType?: string) {
    super(message, AuthErrorCode.TOKEN_EXPIRED, {
      tokenType,
    });
    this.name = "TokenExpiredError";
  }
}

/**
 * Erreur: Token invalide
 */
export class TokenInvalidError extends AuthError {
  constructor(message = "Le token est invalide ou malformé") {
    super(message, AuthErrorCode.TOKEN_INVALID);
    this.name = "TokenInvalidError";
  }
}

/**
 * Erreur: Token non trouvé
 */
export class TokenNotFoundError extends AuthError {
  constructor(message = "Le token est introuvable ou a déjà été utilisé") {
    super(message, AuthErrorCode.TOKEN_NOT_FOUND);
    this.name = "TokenNotFoundError";
  }
}

/**
 * Erreur: Token déjà utilisé
 */
export class TokenAlreadyUsedError extends AuthError {
  constructor(message = "Ce token a déjà été utilisé") {
    super(message, AuthErrorCode.TOKEN_ALREADY_USED);
    this.name = "TokenAlreadyUsedError";
  }
}

/**
 * Erreur: Rate limit dépassé
 */
export class RateLimitError extends AuthError {
  constructor(
    message = "Trop de tentatives. Veuillez réessayer plus tard",
    extensions?: {
      identifier?: string;
      action?: string;
      resetAt?: Date;
      blockedUntil?: Date;
      remaining?: number;
      retryAfter?: number;
    },
  ) {
    super(message, AuthErrorCode.RATE_LIMIT_EXCEEDED, {
      ...extensions,
      retryAfter:
        extensions?.retryAfter ||
        (extensions?.resetAt
          ? Math.ceil((extensions.resetAt.getTime() - Date.now()) / 1000)
          : undefined),
    });
    this.name = "RateLimitError";
  }
}

/**
 * Erreur: Trop de tentatives
 */
export class TooManyAttemptsError extends AuthError {
  constructor(message = "Trop de tentatives échouées", lockDuration?: number) {
    super(message, AuthErrorCode.TOO_MANY_ATTEMPTS, {
      lockDuration,
      action: "ACCOUNT_LOCKED",
    });
    this.name = "TooManyAttemptsError";
  }
}

/**
 * Erreur: Validation
 */
export class ValidationError extends AuthError {
  constructor(
    message: string,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message, AuthErrorCode.VALIDATION_ERROR, {
      validationErrors: errors,
    });
    this.name = "ValidationError";
  }
}

/**
 * Erreur: Mot de passe trop faible
 */
export class WeakPasswordError extends AuthError {
  constructor(
    message = "Le mot de passe ne respecte pas les critères de sécurité",
    requirements?: string[],
  ) {
    super(message, AuthErrorCode.WEAK_PASSWORD, {
      requirements,
    });
    this.name = "WeakPasswordError";
  }
}

/**
 * Erreur: Mots de passe ne correspondent pas
 */
export class PasswordMismatchError extends AuthError {
  constructor(message = "Les mots de passe ne correspondent pas") {
    super(message, AuthErrorCode.PASSWORD_MISMATCH);
    this.name = "PasswordMismatchError";
  }
}

/**
 * Erreur: Utilisateur non trouvé
 */
export class UserNotFoundError extends AuthError {
  constructor(message = "Utilisateur introuvable") {
    super(message, AuthErrorCode.USER_NOT_FOUND);
    this.name = "UserNotFoundError";
  }
}

/**
 * Erreur: Email déjà existant
 */
export class EmailAlreadyExistsError extends AuthError {
  constructor(message = "Cet email est déjà utilisé") {
    super(message, AuthErrorCode.EMAIL_ALREADY_EXISTS);
    this.name = "EmailAlreadyExistsError";
  }
}

/**
 * Erreur: Forbidden (permissions insuffisantes)
 */
export class ForbiddenError extends AuthError {
  constructor(message = "Vous n'avez pas les permissions nécessaires") {
    super(message, AuthErrorCode.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

/**
 * Erreur: Erreur interne
 */
export class InternalError extends AuthError {
  constructor(message = "Une erreur interne est survenue") {
    super(message, AuthErrorCode.INTERNAL_ERROR);
    this.name = "InternalError";
  }
}

/**
 * Helper pour convertir les erreurs génériques en AuthError
 */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message);
  }

  return new InternalError("Une erreur inconnue est survenue");
}
