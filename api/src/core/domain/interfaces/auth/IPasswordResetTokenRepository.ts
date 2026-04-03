import { Token } from '../../value-objects/auth/Token.js';
import { PasswordResetToken } from '@clubmanager/types';

/**
 * Interface du Repository PasswordResetToken
 *
 * Cette interface définit le contrat pour la persistence des tokens de réinitialisation de mot de passe.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface IPasswordResetTokenRepository {
  /**
   * Crée un nouveau token de réinitialisation de mot de passe
   * @param userId - ID de l'utilisateur
   * @param token - Token de réinitialisation (Value Object)
   * @returns Le token créé avec son ID
   */
  create(userId: number, token: Token): Promise<PasswordResetToken>;

  /**
   * Trouve un token de réinitialisation par sa valeur
   * @param token - Valeur du token à rechercher
   * @returns Le token trouvé ou null
   */
  findByToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Marque un token comme utilisé
   * @param tokenId - ID du token à marquer comme utilisé
   * @returns Promesse vide une fois l'opération terminée
   */
  markAsUsed(tokenId: number): Promise<void>;

  /**
   * Supprime tous les tokens de réinitialisation d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Promesse vide une fois l'opération terminée
   */
  deleteAllForUser(userId: number): Promise<void>;

  /**
   * Supprime tous les tokens expirés
   * @returns Le nombre de tokens supprimés
   */
  deleteExpired(): Promise<number>;

  /**
   * Enregistre une tentative de réinitialisation de mot de passe pour l'audit
   * @param email - Email de l'utilisateur
   * @param success - Indique si la tentative a réussi
   * @returns Promesse vide une fois l'opération terminée
   */
  recordResetAttempt(email: string, success: boolean): Promise<void>;
}
