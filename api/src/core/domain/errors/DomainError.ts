/**
 * Classe de base pour toutes les erreurs du domaine
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true; // Les erreurs métier sont opérationnelles

    // Capture la stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs spécifiques au domaine User
 */

export class UserNotFoundError extends DomainError {
  constructor(identifier: string | number) {
    super(
      `L'utilisateur avec l'identifiant "${identifier}" n'existe pas`,
      'USER_NOT_FOUND',
      404
    );
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(
      `Un utilisateur avec l'email "${email}" existe déjà`,
      'EMAIL_ALREADY_EXISTS',
      409
    );
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(
      `L'email "${email}" n'est pas valide`,
      'INVALID_EMAIL',
      400
    );
  }
}

export class MinorNotAllowedError extends DomainError {
  constructor() {
    super(
      'Les mineurs de moins de 18 ans ne peuvent pas s\'inscrire sans autorisation',
      'MINOR_NOT_ALLOWED',
      403
    );
  }
}

export class InvalidPasswordError extends DomainError {
  constructor(reason: string) {
    super(
      `Le mot de passe est invalide: ${reason}`,
      'INVALID_PASSWORD',
      400
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Accès non autorisé') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, reason: string) {
    super(
      `Validation échouée pour le champ "${field}": ${reason}`,
      'VALIDATION_ERROR',
      400
    );
  }
}

export class InsufficientPermissionsError extends DomainError {
  constructor(action: string) {
    super(
      `Permissions insuffisantes pour effectuer l'action: ${action}`,
      'INSUFFICIENT_PERMISSIONS',
      403
    );
  }
}

export class UserAlreadyActivatedError extends DomainError {
  constructor(userId: number) {
    super(
      `L'utilisateur ${userId} est déjà activé`,
      'USER_ALREADY_ACTIVATED',
      400
    );
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super(
      'Le token fourni est invalide ou a expiré',
      'INVALID_TOKEN',
      401
    );
  }
}
