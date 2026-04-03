import { Email } from '../../value-objects/auth/Email.js';
import { SecurityInfo, AuthStats } from '@clubmanager/types';

/**
 * Interface du Repository Security
 *
 * Cette interface définit le contrat pour les opérations de sécurité et d'audit.
 * Elle est implémentée dans la couche infrastructure et utilisée dans les use cases.
 *
 * Avantages:
 * - Découplage entre la logique métier et la persistence
 * - Permet de changer facilement d'implémentation (MySQL, PostgreSQL, MongoDB, etc.)
 * - Facilite les tests (mock/stub de l'interface)
 * - Respect du principe d'inversion de dépendance (SOLID)
 */
export interface ISecurityRepository {
  /**
   * Récupère les informations de sécurité d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Les informations de sécurité ou null si l'utilisateur n'existe pas
   */
  getSecurityInfo(userId: number): Promise<SecurityInfo | null>;

  /**
   * Récupère les statistiques d'authentification globales
   * @returns Statistiques d'authentification du système
   */
  getAuthStats(): Promise<AuthStats>;

  /**
   * Compte le nombre de tentatives d'authentification récentes pour un email
   * @param email - Email de l'utilisateur (Value Object)
   * @param minutes - Nombre de minutes dans le passé à considérer
   * @returns Le nombre de tentatives d'authentification
   */
  getRecentAuthAttempts(email: Email, minutes: number): Promise<number>;

  /**
   * Compte le nombre de tentatives de réinitialisation de mot de passe récentes pour un email
   * @param email - Email de l'utilisateur (chaîne de caractères)
   * @param minutes - Nombre de minutes dans le passé à considérer
   * @returns Le nombre de tentatives de réinitialisation
   */
  getRecentResetAttempts(email: string, minutes: number): Promise<number>;
}
