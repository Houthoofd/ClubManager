/**
 * Value Object: Token
 * Représente un token d'authentification sécurisé
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthError } from '../../errors/auth/AuthError.js';

export type TokenType =
  | 'access'
  | 'refresh'
  | 'password-reset'
  | 'email-verification'
  | 'session';

export interface TokenPayload {
  id: number;
  email: string;
  type?: TokenType;
  [key: string]: any;
}

export interface TokenMetadata {
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
  issuedFor?: number; // User ID
  ipAddress?: string;
  userAgent?: string;
}

export class Token {
  private readonly value: string;
  private readonly metadata: TokenMetadata;

  private constructor(value: string, metadata: TokenMetadata) {
    this.value = value;
    this.metadata = metadata;
  }

  /**
   * Crée un token JWT (access ou refresh)
   */
  static createJWT(
    payload: TokenPayload,
    type: TokenType = 'access',
    expiresIn: string = '24h'
  ): Token {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw AuthError.internalError('JWT_SECRET non configuré');
    }

    const tokenPayload = {
      ...payload,
      type,
    };

    const value = jwt.sign(tokenPayload, secret, {
      expiresIn,
      issuer: 'clubmanager',
      audience: 'clubmanager-api',
    });

    // Calculer la date d'expiration
    const expiresAt = Token.calculateExpiration(expiresIn);

    const metadata: TokenMetadata = {
      type,
      expiresAt,
      createdAt: new Date(),
      issuedFor: payload.id,
    };

    return new Token(value, metadata);
  }

  /**
   * Crée un token aléatoire sécurisé (pour reset password, email verification)
   */
  static createSecure(
    type: TokenType,
    expiresInHours: number = 1,
    length: number = 32
  ): Token {
    const value = crypto.randomBytes(length).toString('hex');

    const metadata: TokenMetadata = {
      type,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    return new Token(value, metadata);
  }

  /**
   * Crée une instance Token à partir d'une valeur existante
   */
  static fromString(
    value: string,
    type: TokenType,
    expiresAt?: Date
  ): Token {
    if (!value || typeof value !== 'string') {
      throw AuthError.invalidToken('Token requis');
    }

    const metadata: TokenMetadata = {
      type,
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    return new Token(value, metadata);
  }

  /**
   * Vérifie et decode un token JWT
   */
  static verifyJWT(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw AuthError.internalError('JWT_SECRET non configuré');
    }

    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'clubmanager',
        audience: 'clubmanager-api',
      }) as TokenPayload;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw AuthError.expiredToken('Token JWT');
      }
      if (error.name === 'JsonWebTokenError') {
        throw AuthError.invalidToken('Token JWT invalide');
      }
      throw AuthError.invalidToken(error.message);
    }
  }

  /**
   * Decode un token JWT sans vérification (dangereux, à utiliser avec précaution)
   */
  static decodeJWT(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calcule la date d'expiration à partir d'une durée
   */
  private static calculateExpiration(expiresIn: string): Date {
    const now = Date.now();
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Format d'expiration invalide: ${expiresIn}`);
    }

    const [, amount, unit] = match;
    const milliseconds = parseInt(amount) * units[unit];

    return new Date(now + milliseconds);
  }

  /**
   * Retourne la valeur du token
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Retourne le type du token
   */
  getType(): TokenType {
    return this.metadata.type;
  }

  /**
   * Retourne la date d'expiration
   */
  getExpiresAt(): Date {
    return this.metadata.expiresAt;
  }

  /**
   * Retourne la date de création
   */
  getCreatedAt(): Date {
    return this.metadata.createdAt;
  }

  /**
   * Retourne l'ID utilisateur pour lequel le token a été émis
   */
  getIssuedFor(): number | undefined {
    return this.metadata.issuedFor;
  }

  /**
   * Retourne les métadonnées complètes
   */
  getMetadata(): TokenMetadata {
    return { ...this.metadata };
  }

  /**
   * Vérifie si le token est expiré
   */
  isExpired(): boolean {
    return new Date() > this.metadata.expiresAt;
  }

  /**
   * Vérifie si le token est valide (non expiré)
   */
  isValid(): boolean {
    return !this.isExpired();
  }

  /**
   * Retourne le temps restant avant expiration en millisecondes
   */
  getTimeUntilExpiration(): number {
    return Math.max(0, this.metadata.expiresAt.getTime() - Date.now());
  }

  /**
   * Vérifie si le token expire bientôt (dans les X minutes)
   */
  expiresSoon(minutes: number = 5): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration();
    return timeUntilExpiration > 0 && timeUntilExpiration < minutes * 60 * 1000;
  }

  /**
   * Vérifie si deux tokens sont identiques
   */
  equals(other: Token): boolean {
    if (!(other instanceof Token)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Représentation sous forme de chaîne
   */
  toString(): string {
    return this.value;
  }

  /**
   * Masque le token pour l'affichage (affiche seulement les premiers et derniers caractères)
   */
  toMasked(): string {
    if (this.value.length <= 8) {
      return '***';
    }
    return `${this.value.substring(0, 4)}...${this.value.substring(this.value.length - 4)}`;
  }

  /**
   * Retourne une représentation JSON du token (sans la valeur sensible)
   */
  toJSON() {
    return {
      type: this.metadata.type,
      expiresAt: this.metadata.expiresAt.toISOString(),
      createdAt: this.metadata.createdAt.toISOString(),
      isExpired: this.isExpired(),
      issuedFor: this.metadata.issuedFor,
    };
  }
}
