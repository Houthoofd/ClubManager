/**
 * Domain Error: AuthError
 * Erreurs du domaine Authentification
 */

export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  private constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AuthError.prototype);
  }

  // ==================== Erreurs Email ====================

  static invalidEmail(message: string = 'Email invalide'): AuthError {
    return new AuthError(message, 'INVALID_EMAIL', 400);
  }

  static emailAlreadyExists(email: string): AuthError {
    return new AuthError(
      `L'email ${email} est déjà utilisé`,
      'EMAIL_ALREADY_EXISTS',
      409
    );
  }

  static emailNotFound(email: string): AuthError {
    return new AuthError(
      `Aucun utilisateur trouvé avec l'email ${email}`,
      'EMAIL_NOT_FOUND',
      404
    );
  }

  // ==================== Erreurs Mot de passe ====================

  static invalidPassword(message: string = 'Mot de passe invalide'): AuthError {
    return new AuthError(message, 'INVALID_PASSWORD', 400);
  }

  static passwordTooShort(minLength: number = 8): AuthError {
    return new AuthError(
      `Le mot de passe doit contenir au moins ${minLength} caractères`,
      'PASSWORD_TOO_SHORT',
      400
    );
  }

  static passwordMissingUppercase(): AuthError {
    return new AuthError(
      'Le mot de passe doit contenir au moins une majuscule',
      'PASSWORD_MISSING_UPPERCASE',
      400
    );
  }

  static passwordMissingLowercase(): AuthError {
    return new AuthError(
      'Le mot de passe doit contenir au moins une minuscule',
      'PASSWORD_MISSING_LOWERCASE',
      400
    );
  }

  static passwordMissingNumber(): AuthError {
    return new AuthError(
      'Le mot de passe doit contenir au moins un chiffre',
      'PASSWORD_MISSING_NUMBER',
      400
    );
  }

  static passwordMissingSpecialChar(): AuthError {
    return new AuthError(
      'Le mot de passe doit contenir au moins un caractère spécial',
      'PASSWORD_MISSING_SPECIAL_CHAR',
      400
    );
  }

  static passwordMismatch(): AuthError {
    return new AuthError(
      'Les mots de passe ne correspondent pas',
      'PASSWORD_MISMATCH',
      400
    );
  }

  static incorrectPassword(): AuthError {
    return new AuthError(
      'Mot de passe incorrect',
      'INCORRECT_PASSWORD',
      401
    );
  }

  static samePassword(): AuthError {
    return new AuthError(
      'Le nouveau mot de passe doit être différent de l\'ancien',
      'SAME_PASSWORD',
      400
    );
  }

  // ==================== Erreurs Authentification ====================

  static invalidCredentials(): AuthError {
    return new AuthError(
      'Email ou mot de passe incorrect',
      'INVALID_CREDENTIALS',
      401
    );
  }

  static userNotFound(identifier: string | number): AuthError {
    return new AuthError(
      `Utilisateur ${identifier} non trouvé`,
      'USER_NOT_FOUND',
      404
    );
  }

  static userInactive(userId: number): AuthError {
    return new AuthError(
      `Le compte utilisateur ${userId} est inactif`,
      'USER_INACTIVE',
      403
    );
  }

  static userDeleted(userId: number): AuthError {
    return new AuthError(
      `Le compte utilisateur ${userId} a été supprimé`,
      'USER_DELETED',
      403
    );
  }

  static accountLocked(reason?: string): AuthError {
    const message = reason
      ? `Compte verrouillé: ${reason}`
      : 'Compte verrouillé';
    return new AuthError(message, 'ACCOUNT_LOCKED', 403);
  }

  // ==================== Erreurs Token ====================

  static invalidToken(message: string = 'Token invalide'): AuthError {
    return new AuthError(message, 'INVALID_TOKEN', 401);
  }

  static expiredToken(tokenType: string = 'Token'): AuthError {
    return new AuthError(
      `${tokenType} expiré`,
      'EXPIRED_TOKEN',
      401
    );
  }

  static tokenNotFound(tokenType: string = 'Token'): AuthError {
    return new AuthError(
      `${tokenType} non trouvé`,
      'TOKEN_NOT_FOUND',
      404
    );
  }

  static refreshTokenRevoked(): AuthError {
    return new AuthError(
      'Refresh token révoqué',
      'REFRESH_TOKEN_REVOKED',
      401
    );
  }

  static missingToken(tokenType: string = 'Token'): AuthError {
    return new AuthError(
      `${tokenType} requis`,
      'MISSING_TOKEN',
      401
    );
  }

  // ==================== Erreurs Rate Limiting ====================

  static tooManyAttempts(retryAfter?: number): AuthError {
    const message = retryAfter
      ? `Trop de tentatives. Réessayez dans ${retryAfter} minutes`
      : 'Trop de tentatives. Veuillez réessayer plus tard';
    return new AuthError(message, 'TOO_MANY_ATTEMPTS', 429);
  }

  static rateLimitExceeded(resource: string): AuthError {
    return new AuthError(
      `Limite de taux dépassée pour ${resource}`,
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }

  // ==================== Erreurs Validation ====================

  static missingField(fieldName: string): AuthError {
    return new AuthError(
      `Le champ ${fieldName} est requis`,
      'MISSING_FIELD',
      400
    );
  }

  static invalidField(fieldName: string, reason?: string): AuthError {
    const message = reason
      ? `Champ ${fieldName} invalide: ${reason}`
      : `Champ ${fieldName} invalide`;
    return new AuthError(message, 'INVALID_FIELD', 400);
  }

  // ==================== Erreurs Session ====================

  static sessionExpired(): AuthError {
    return new AuthError(
      'Session expirée',
      'SESSION_EXPIRED',
      401
    );
  }

  static sessionNotFound(): AuthError {
    return new AuthError(
      'Session non trouvée',
      'SESSION_NOT_FOUND',
      404
    );
  }

  static invalidSession(): AuthError {
    return new AuthError(
      'Session invalide',
      'INVALID_SESSION',
      401
    );
  }

  // ==================== Erreurs Permission ====================

  static unauthorized(action?: string): AuthError {
    const message = action
      ? `Non autorisé à ${action}`
      : 'Non autorisé';
    return new AuthError(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(resource?: string): AuthError {
    const message = resource
      ? `Accès interdit à ${resource}`
      : 'Accès interdit';
    return new AuthError(message, 'FORBIDDEN', 403);
  }

  // ==================== Erreurs Vérification Email ====================

  static emailNotVerified(): AuthError {
    return new AuthError(
      'Email non vérifié',
      'EMAIL_NOT_VERIFIED',
      403
    );
  }

  static emailAlreadyVerified(): AuthError {
    return new AuthError(
      'Email déjà vérifié',
      'EMAIL_ALREADY_VERIFIED',
      400
    );
  }

  static verificationTokenExpired(): AuthError {
    return new AuthError(
      'Token de vérification expiré',
      'VERIFICATION_TOKEN_EXPIRED',
      401
    );
  }

  // ==================== Erreurs Générales ====================

  static internalError(message: string = 'Erreur interne du serveur'): AuthError {
    return new AuthError(message, 'INTERNAL_ERROR', 500);
  }

  static databaseError(operation?: string): AuthError {
    const message = operation
      ? `Erreur base de données lors de ${operation}`
      : 'Erreur base de données';
    return new AuthError(message, 'DATABASE_ERROR', 500);
  }

  static notImplemented(feature: string): AuthError {
    return new AuthError(
      `Fonctionnalité ${feature} non implémentée`,
      'NOT_IMPLEMENTED',
      501
    );
  }

  // ==================== Méthodes utilitaires ====================

  /**
   * Vérifie si l'erreur est de type AuthError
   */
  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }

  /**
   * Convertit une erreur en AuthError
   */
  static fromError(error: unknown): AuthError {
    if (AuthError.isAuthError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return new AuthError(error.message, 'UNKNOWN_ERROR', 500);
    }

    return new AuthError('Erreur inconnue', 'UNKNOWN_ERROR', 500);
  }

  /**
   * Retourne une représentation JSON de l'erreur
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}
