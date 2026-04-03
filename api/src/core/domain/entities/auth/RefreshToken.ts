/**
 * Entité RefreshToken - Représente un refresh token pour maintenir les sessions utilisateur
 *
 * Cette classe contient:
 * - Les propriétés du refresh token
 * - La logique métier (validation, révocation, expiration)
 * - Les méthodes de manipulation
 *
 * Règles métier:
 * - Un token doit avoir une date d'expiration
 * - Un token révoqué ne peut plus être utilisé
 * - Un token expiré ne peut plus être utilisé
 * - Un token doit être associé à un utilisateur
 */

import { Token } from '../../value-objects/auth/Token.js';
import { ValidationError } from '../../errors/DomainError.js';

export interface RefreshTokenProps {
  id?: number;
  userId: number;
  tokenValue: Token;
  expiresAt: Date;
  createdAt?: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class RefreshToken {
  private readonly _id?: number;
  private readonly _userId: number;
  private readonly _tokenValue: Token;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _revokedAt?: Date;
  private readonly _ipAddress?: string;
  private readonly _userAgent?: string;

  private constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenValue = props.tokenValue;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt || new Date();
    this._revokedAt = props.revokedAt;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée un nouveau refresh token
   */
  public static create(
    props: Omit<RefreshTokenProps, 'id' | 'createdAt' | 'revokedAt'>
  ): RefreshToken {
    // Validation des données obligatoires
    RefreshToken.validateUserId(props.userId);
    RefreshToken.validateExpiresAt(props.expiresAt);
    RefreshToken.validateTokenValue(props.tokenValue);

    return new RefreshToken({
      ...props,
      revokedAt: undefined,
    });
  }

  /**
   * Reconstruit un refresh token depuis la base de données
   */
  public static fromPersistence(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
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
    if (tokenType !== 'refresh') {
      throw new ValidationError(
        'tokenValue',
        `Type de token invalide: attendu "refresh", reçu "${tokenType}"`
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
   * Vérifie si le token est révoqué
   */
  public isRevoked(): boolean {
    return this._revokedAt !== undefined;
  }

  /**
   * Vérifie si le token est valide (ni expiré ni révoqué)
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  /**
   * Révoque le token
   * Un token révoqué ne peut plus être utilisé
   */
  public revoke(): void {
    if (this._revokedAt) {
      // Déjà révoqué, ne rien faire
      return;
    }

    this._revokedAt = new Date();
  }

  /**
   * Vérifie si le token expire bientôt (dans les X minutes)
   */
  public expiresSoon(minutes: number = 60): boolean {
    if (this.isExpired() || this.isRevoked()) {
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
   * Vérifie si le token correspond à l'IP et user agent fournis
   * Utile pour détecter les utilisations suspectes
   */
  public matchesContext(ipAddress?: string, userAgent?: string): boolean {
    if (this._ipAddress && ipAddress && this._ipAddress !== ipAddress) {
      return false;
    }

    if (this._userAgent && userAgent && this._userAgent !== userAgent) {
      return false;
    }

    return true;
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

  get revokedAt(): Date | undefined {
    return this._revokedAt;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
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
      revoked_at: this._revokedAt,
      ip_address: this._ipAddress,
      user_agent: this._userAgent,
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
      revoked_at: this._revokedAt,
      is_valid: this.isValid(),
      is_expired: this.isExpired(),
      is_revoked: this.isRevoked(),
      expires_soon: this.expiresSoon(),
    };
  }
}
