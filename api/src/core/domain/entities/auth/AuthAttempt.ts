/**
 * Entité AuthAttempt - Représente une tentative d'authentification pour audit/sécurité
 *
 * Cette classe contient:
 * - Les propriétés de la tentative d'authentification
 * - La logique métier (validation, analyse)
 * - Les méthodes de consultation
 *
 * Règles métier:
 * - Chaque tentative doit avoir un email (valide ou non)
 * - La date de tentative est automatiquement définie
 * - Les tentatives échouées peuvent avoir une raison
 * - Les métadonnées de contexte (IP, user agent) sont optionnelles mais recommandées
 * - Une tentative est soit réussie soit échouée (success = true/false)
 */

import { Email } from '../../value-objects/auth/Email.js';
import { ValidationError } from '../../errors/DomainError.js';

export interface AuthAttemptProps {
  id?: number;
  email: Email;
  success: boolean;
  attemptedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export class AuthAttempt {
  private readonly _id?: number;
  private readonly _email: Email;
  private readonly _success: boolean;
  private readonly _attemptedAt: Date;
  private readonly _ipAddress?: string;
  private readonly _userAgent?: string;
  private readonly _reason?: string;

  private constructor(props: AuthAttemptProps) {
    this._id = props.id;
    this._email = props.email;
    this._success = props.success;
    this._attemptedAt = props.attemptedAt || new Date();
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
    this._reason = props.reason;
  }

  // ============== FACTORY METHODS ==============

  /**
   * Crée une nouvelle tentative d'authentification
   */
  public static create(
    props: Omit<AuthAttemptProps, 'id' | 'attemptedAt'>
  ): AuthAttempt {
    // Validation des données obligatoires
    AuthAttempt.validateEmail(props.email);
    AuthAttempt.validateSuccess(props.success);

    // Si c'est un échec et qu'il y a une raison, la valider
    if (!props.success && props.reason) {
      AuthAttempt.validateReason(props.reason);
    }

    return new AuthAttempt(props);
  }

  /**
   * Crée une tentative d'authentification réussie
   */
  public static createSuccessful(
    email: Email,
    ipAddress?: string,
    userAgent?: string
  ): AuthAttempt {
    return AuthAttempt.create({
      email,
      success: true,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Crée une tentative d'authentification échouée
   */
  public static createFailed(
    email: Email,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): AuthAttempt {
    return AuthAttempt.create({
      email,
      success: false,
      reason,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Reconstruit une tentative depuis la base de données
   */
  public static fromPersistence(props: AuthAttemptProps): AuthAttempt {
    return new AuthAttempt(props);
  }

  // ============== VALIDATIONS MÉTIER ==============

  private static validateEmail(email: Email): void {
    if (!(email instanceof Email)) {
      throw new ValidationError(
        'email',
        'L\'email est invalide'
      );
    }
  }

  private static validateSuccess(success: boolean): void {
    if (typeof success !== 'boolean') {
      throw new ValidationError(
        'success',
        'Le statut de succès doit être un booléen'
      );
    }
  }

  private static validateReason(reason: string): void {
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw new ValidationError(
        'reason',
        'La raison d\'échec ne peut pas être vide'
      );
    }

    if (reason.length > 500) {
      throw new ValidationError(
        'reason',
        'La raison d\'échec ne peut pas dépasser 500 caractères'
      );
    }
  }

  // ============== MÉTHODES MÉTIER ==============

  /**
   * Vérifie si la tentative est réussie
   */
  public isSuccessful(): boolean {
    return this._success;
  }

  /**
   * Vérifie si la tentative a échoué
   */
  public isFailed(): boolean {
    return !this._success;
  }

  /**
   * Vérifie si la tentative est récente (moins de X minutes)
   */
  public isRecent(minutes: number = 15): boolean {
    const timeElapsed = Date.now() - this._attemptedAt.getTime();
    return timeElapsed < minutes * 60 * 1000;
  }

  /**
   * Retourne l'âge de la tentative en minutes
   */
  public getAgeInMinutes(): number {
    return Math.floor((Date.now() - this._attemptedAt.getTime()) / (1000 * 60));
  }

  /**
   * Retourne l'âge de la tentative en secondes
   */
  public getAgeInSeconds(): number {
    return Math.floor((Date.now() - this._attemptedAt.getTime()) / 1000);
  }

  /**
   * Vérifie si la tentative provient de la même IP
   */
  public matchesIpAddress(ipAddress: string): boolean {
    if (!this._ipAddress || !ipAddress) {
      return false;
    }
    return this._ipAddress === ipAddress;
  }

  /**
   * Vérifie si la tentative provient du même user agent
   */
  public matchesUserAgent(userAgent: string): boolean {
    if (!this._userAgent || !userAgent) {
      return false;
    }
    return this._userAgent === userAgent;
  }

  /**
   * Vérifie si la tentative correspond au contexte fourni
   */
  public matchesContext(ipAddress?: string, userAgent?: string): boolean {
    if (ipAddress && !this.matchesIpAddress(ipAddress)) {
      return false;
    }

    if (userAgent && !this.matchesUserAgent(userAgent)) {
      return false;
    }

    return true;
  }

  /**
   * Vérifie si c'est une tentative pour le même email
   */
  public isForEmail(email: Email | string): boolean {
    const emailToCompare = typeof email === 'string'
      ? Email.create(email)
      : email;

    return this._email.equals(emailToCompare);
  }

  // ============== GETTERS ==============

  get id(): number | undefined {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get success(): boolean {
    return this._success;
  }

  get attemptedAt(): Date {
    return this._attemptedAt;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Convertit l'entité en objet simple (pour la persistence)
   */
  public toObject(): Record<string, any> {
    return {
      id: this._id,
      email: this._email.getValue(),
      success: this._success,
      attempted_at: this._attemptedAt,
      ip_address: this._ipAddress,
      user_agent: this._userAgent,
      reason: this._reason,
    };
  }

  /**
   * Convertit l'entité en objet public (pour les APIs)
   */
  public toPublicObject(): Record<string, any> {
    return {
      id: this._id,
      email: this._email.toMasked(), // Email masqué pour la sécurité
      success: this._success,
      attempted_at: this._attemptedAt,
      ip_address: this._ipAddress,
      reason: this._reason,
      is_recent: this.isRecent(),
      age_in_minutes: this.getAgeInMinutes(),
    };
  }

  /**
   * Convertit l'entité en objet pour les logs de sécurité
   */
  public toSecurityLog(): Record<string, any> {
    return {
      id: this._id,
      email: this._email.getValue(),
      success: this._success,
      attempted_at: this._attemptedAt.toISOString(),
      ip_address: this._ipAddress,
      user_agent: this._userAgent,
      reason: this._reason,
      age_seconds: this.getAgeInSeconds(),
    };
  }
}
