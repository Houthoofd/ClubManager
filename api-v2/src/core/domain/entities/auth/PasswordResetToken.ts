/**
 * Entité PasswordResetToken - Représente un token de réinitialisation de mot de passe
 *
 * Cette classe contient:
 * - Les propriétés du token de réinitialisation
 * - La logique métier (validation, expiration, utilisation)
 * - Les méthodes de manipulation
 *
 * Règles métier:
 * - Un token doit avoir une date d'expiration
 * - Un token utilisé ne peut plus être réutilisé
 * - Un token expiré ne peut plus être utilisé
 * - Un token doit être associé à un utilisateur
 * - Un token ne peut être utilisé qu'une seule fois
 */

import { Token } from '../../value-objects/auth/Token.js';
import { ValidationError } from '../../errors/DomainError.js';

export interface PasswordResetTokenProps {
  id?: number;
  userId: number;
  tokenValue: Token;
  expiresAt: Date;
  createdAt?: Date;
  usedAt?: Date;
}

export class PasswordResetToken {
  private readonly _id?: number;
  private readonly _userId: number;
  private readonly _tokenValue: Token;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _usedAt?: Date;

  private constructor(props: PasswordResetTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenValue = props.tokenValue;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt || new Date();
    this._usedAt = props.usedAt;
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un nouveau token de réinitialisation de mot de passe
   */
  public static create(
    props: Omit<PasswordResetTokenProps, 'id' | 'createdAt' | 'usedAt'>
  ): PasswordResetToken {
    // Validation des données obligatoires
    PasswordResetToken.validateUserId(props.userId);
    PasswordResetToken.validateExpiresAt(props.expiresAt);
    PasswordResetToken.validateTokenValue(props.tokenValue);

    return new PasswordResetToken({
      ...props,
      usedAt: undefined,
    });
  }

  /**
   * Reconstruit un token depuis la base de données
   */
  public static fromPersistence(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateUserId(userId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError(
        'userId',
        'L\'identifiant utilisateur est invalide'
      );
    }
  }

  private static validateExpiresAt(expiresAt: Date): void {
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new ValidationError(
        'expiresAt',
        'La date d\'expiration est invalide'
      );
    }

    // La date d'expiration doit être dans le futur (pour les nouveaux tokens)
    if (expiresAt <= new Date()) {
      throw new ValidationError(
        'expiresAt',
        'La date d\'expiration doit être dans le futur'
      );
    }
  }

  private static validateTokenValue(tokenValue: Token): void {
    if (!(tokenValue instanceof Token)) {
      throw new ValidationError(
        'tokenValue',
        'La valeur du token est invalide'
      );
    }

    // Vérifier que le type de token est correct
    const tokenType = tokenValue.getType();
    if (tokenType !== 'password-reset') {
      throw new ValidationError(
        'tokenValue',
        `Type de token invalide: attendu "password-reset", reçu "${tokenType}"`
      );
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Vérifie si le token est expiré
   */
  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /**
   * Vérifie si le token a été utilisé
   */
  public isUsed(): boolean {
    return this._usedAt !== undefined;
  }

  /**
   * Vérifie si le token est valide (ni expiré ni utilisé)
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  /**
   * Marque le token comme utilisé
   * Un token utilisé ne peut plus être réutilisé
   * @throws {ValidationError} Si le token est déjà utilisé ou expiré
   */
  public markAsUsed(): void {
    if (this._usedAt) {
      throw new ValidationError(
        'usedAt',
        'Le token a déjà été utilisé'
      );
    }

    if (this.isExpired()) {
      throw new ValidationError(
        'expiresAt',
        'Le token a expiré et ne peut plus être utilisé'
      );
    }

    this._usedAt = new Date();
  }

  /**
   * Vérifie si le token expire bientôt (dans les X minutes)
   */
  public expiresSoon(minutes: number = 5): boolean {
    if (this.isExpired() || this.isUsed()) {
      return false;
    }

    const timeUntilExpiration = this._expiresAt.getTime() - Date.now();
    return timeUntilExpiration > 0 && timeUntilExpiration < minutes * 60 * 1000;
  }

  /**
   * Retourne le temps restant avant expiration en millisecondes
   */
  public getTimeUntilExpiration(): number {
    if (this.isExpired()) {
      return 0;
    }
    return Math.max(0, this._expiresAt.getTime() - Date.now());
  }

  /**
   * Vérifie si le token appartient à l'utilisateur spécifié
   */
  public belongsToUser(userId: number): boolean {
    return this._userId === userId;
  }

  /**
   * Retourne l'âge du token en minutes
   */
  public getAgeInMinutes(): number {
    return Math.floor((Date.now() - this._createdAt.getTime()) / (1000 * 60));
  }

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get tokenValue(): Token {
    return this._tokenValue;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get usedAt(): Date | undefined {
    return this._usedAt;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Convertit l'entité en objet simple (pour la persistence)
   */
  public toObject(): Record<string, any> {
    return {
      id: this._id,
      user_id: this._userId,
      token_value: this._tokenValue.getValue(),
      expires_at: this._expiresAt,
      created_at: this._createdAt,
      used_at: this._usedAt,
    };
  }

  /**
   * Convertit l'entité en objet public (pour les APIs - sans le token value)
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      user_id: this._userId,
      expires_at: this._expiresAt,
      created_at: this._createdAt,
      used_at: this._usedAt,
      is_valid: this.isValid(),
      is_expired: this.isExpired(),
      is_used: this.isUsed(),
      expires_soon: this.expiresSoon(),
      age_in_minutes: this.getAgeInMinutes(),
    };
  }
}
