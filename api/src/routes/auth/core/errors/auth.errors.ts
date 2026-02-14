/**
 * Authentication Errors
 *
 * Définitions des erreurs d'authentification personnalisées
 */

import { GraphQLError } from 'graphql';

/**
 * Erreur de base pour l'authentification
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
      },
    });
  }
}

/**
 * Erreur d'identifiants invalides
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Identifiants invalides') {
    super(message, 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/**
 * Erreur d'utilisateur non authentifié
 */
export class UnauthenticatedError extends AuthError {
  constructor(message: string = 'Non authentifié') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'UnauthenticatedError';
    Object.setPrototypeOf(this, UnauthenticatedError.prototype);
  }
}

/**
 * Erreur de token invalide
 */
export class TokenInvalidError extends AuthError {
  constructor(message: string = 'Token invalide') {
    super(message, 'TOKEN_INVALID', 401);
    this.name = 'TokenInvalidError';
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}

/**
 * Erreur de token expiré
 */
export class TokenExpiredError extends AuthError {
  constructor(message: string = 'Token expiré') {
    super(message, 'TOKEN_EXPIRED', 401);
    this.name = 'TokenExpiredError';
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * Erreur d'accès refusé (permissions insuffisantes)
 */
export class ForbiddenError extends AuthError {
  constructor(message: string = 'Accès refusé') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Erreur de compte désactivé
 */
export class AccountDisabledError extends AuthError {
  constructor(message: string = 'Compte désactivé') {
    super(message, 'ACCOUNT_DISABLED', 403);
    this.name = 'AccountDisabledError';
    Object.setPrototypeOf(this, AccountDisabledError.prototype);
  }
}

/**
 * Erreur de rate limit dépassé
 */
export class RateLimitError extends AuthError {
  constructor(
    message: string = 'Trop de tentatives. Réessayez plus tard.',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
        retryAfter: this.retryAfter,
      },
    });
  }
}

/**
 * Erreur de session invalide
 */
export class InvalidSessionError extends AuthError {
  constructor(message: string = 'Session invalide') {
    super(message, 'INVALID_SESSION', 401);
    this.name = 'InvalidSessionError';
    Object.setPrototypeOf(this, InvalidSessionError.prototype);
  }
}

/**
 * Erreur de refresh token invalide
 */
export class InvalidRefreshTokenError extends AuthError {
  constructor(message: string = 'Refresh token invalide') {
    super(message, 'INVALID_REFRESH_TOKEN', 401);
    this.name = 'InvalidRefreshTokenError';
    Object.setPrototypeOf(this, InvalidRefreshTokenError.prototype);
  }
}

/**
 * Erreur de validation des données
 */
export class ValidationError extends AuthError {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
        fields: this.fields,
      },
    });
  }
}

/**
 * Erreur de mot de passe faible
 */
export class WeakPasswordError extends ValidationError {
  constructor(message: string = 'Mot de passe trop faible') {
    super(message);
    this.code = 'WEAK_PASSWORD';
    this.name = 'WeakPasswordError';
    Object.setPrototypeOf(this, WeakPasswordError.prototype);
  }
}

/**
 * Erreur d'email déjà utilisé
 */
export class EmailAlreadyExistsError extends ValidationError {
  constructor(message: string = 'Cet email est déjà utilisé') {
    super(message);
    this.code = 'EMAIL_ALREADY_EXISTS';
    this.statusCode = 409;
    this.name = 'EmailAlreadyExistsError';
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

/**
 * Convertit une erreur générique en AuthError
 */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof Error) {
    // Détection des erreurs JWT
    if (error.name === 'JsonWebTokenError') {
      return new TokenInvalidError(error.message);
    }
    if (error.name === 'TokenExpiredError') {
      return new TokenExpiredError(error.message);
    }

    // Erreur générique
    return new AuthError(error.message, 'INTERNAL_ERROR', 500);
  }

  // Erreur inconnue
  return new AuthError('Une erreur inconnue est survenue', 'UNKNOWN_ERROR', 500);
}

/**
 * Vérifie si une erreur est une AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Crée une GraphQLError à partir d'une erreur d'authentification
 */
export function toGraphQLAuthError(error: unknown): GraphQLError {
  const authError = toAuthError(error);
  return authError.toGraphQLError();
}
