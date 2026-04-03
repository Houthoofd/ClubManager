import { Token } from '../../value-objects/auth/Token.js';

/**
 * Métadonnées optionnelles pour la création d'un refresh token
 */
export interface RefreshTokenMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Entité RefreshToken
 * Représente un token de rafraîchissement stocké en base de données
 */
export interface RefreshToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface du Repository RefreshToken
 *
 * Cette interface définit le contrat pour la persistence des tokens de rafraîchissement.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface IRefreshTokenRepository {
  /**
   * Crée un nouveau refresh token
   * @param userId - ID de l'utilisateur
   * @param token - Token de rafraîchissement (Value Object)
   * @param metadata - Métadonnées optionnelles (IP, User-Agent)
   * @returns Le refresh token créé avec son ID
   */
  create(
    userId: number,
    token: Token,
    metadata?: RefreshTokenMetadata
  ): Promise<RefreshToken>;

  /**
   * Trouve un refresh token par sa valeur
   * @param token - Valeur du token à rechercher
   * @returns Le refresh token trouvé ou null
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Révoque un refresh token spécifique
   * @param tokenId - ID du token à révoquer
   * @returns Promesse vide une fois l'opération terminée
   */
  revoke(tokenId: number): Promise<void>;

  /**
   * Révoque tous les refresh tokens d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Le nombre de tokens révoqués
   */
  revokeAllForUser(userId: number): Promise<number>;

  /**
   * Trouve tous les refresh tokens actifs (non révoqués, non expirés) d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Liste des refresh tokens actifs
   */
  findActiveByUser(userId: number): Promise<RefreshToken[]>;

  /**
   * Supprime les refresh tokens expirés
   * @param daysRetention - Nombre de jours de rétention après expiration (optionnel, défaut: 0)
   * @returns Le nombre de tokens supprimés
   */
  deleteExpired(daysRetention?: number): Promise<number>;
}
