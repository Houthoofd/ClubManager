/**
 * Repository de VALIDATION pour le module Compte
 * Responsabilité: Opérations de validation et vérification uniquement
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de validation sur les comptes utilisateurs
 */
export class CompteValidationRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ==========================================================================
  // MÉTHODES DE VÉRIFICATION D'EXISTENCE
  // ==========================================================================

  /**
   * Vérifier si un utilisateur existe
   */
  async exists(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXISTS,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un email existe déjà
   */
  async emailExists(email: string, excludeUserId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (excludeUserId) {
        this.mysqlConnector.query(
          queries.CHECK_EMAIL_EXISTS,
          [email, excludeUserId],
          (error, results: any[]) => {
            if (error) {
              reject(error);
            } else {
              resolve(results[0].count > 0);
            }
          }
        );
      } else {
        this.mysqlConnector.query(
          queries.CHECK_EMAIL_EXISTS_SIMPLE,
          [email],
          (error, results: any[]) => {
            if (error) {
              reject(error);
            } else {
              resolve(results[0].count > 0);
            }
          }
        );
      }
    });
  }

  /**
   * Vérifier si un nom d'utilisateur existe déjà
   */
  async usernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (excludeUserId) {
        this.mysqlConnector.query(
          queries.CHECK_USERNAME_EXISTS,
          [username, excludeUserId],
          (error, results: any[]) => {
            if (error) {
              reject(error);
            } else {
              resolve(results[0].count > 0);
            }
          }
        );
      } else {
        this.mysqlConnector.query(
          queries.CHECK_USERNAME_EXISTS_SIMPLE,
          [username],
          (error, results: any[]) => {
            if (error) {
              reject(error);
            } else {
              resolve(results[0].count > 0);
            }
          }
        );
      }
    });
  }

  /**
   * Vérifier si un utilisateur est actif
   */
  async isActive(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_IS_ACTIVE,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur a un mot de passe défini
   */
  async hasPassword(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_HAS_PASSWORD,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DE SÉCURITÉ
  // ==========================================================================

  /**
   * Vérifier si un compte est verrouillé
   */
  async isAccountLocked(userId: number): Promise<{ locked: boolean; info?: any }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ACCOUNT_LOCKED,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve({ locked: false });
          } else {
            const info = results[0];
            resolve({
              locked: info.account_locked === 1,
              info,
            });
          }
        }
      );
    });
  }

  /**
   * Vérifier si un compte doit être déverrouillé automatiquement
   */
  async shouldAutoUnlock(userId: number, minutes: number = 30): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_AUTO_UNLOCK_ELIGIBLE,
        [userId, minutes],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION MÉTIER
  // ==========================================================================

  /**
   * Vérifier si un utilisateur peut être supprimé
   */
  async canBeDeleted(userId: number): Promise<{ canDelete: boolean; reasons?: string[] }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_CAN_BE_DELETED,
        [userId, userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const data = results[0];
            const reasons: string[] = [];

            if (data.commandes_count > 0) {
              reasons.push(`${data.commandes_count} commandes associées`);
            }
            if (data.alertes_count > 0) {
              reasons.push(`${data.alertes_count} alertes associées`);
            }

            resolve({
              canDelete: reasons.length === 0,
              reasons: reasons.length > 0 ? reasons : undefined,
            });
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur a des commandes en cours
   */
  async hasPendingOrders(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_HAS_PENDING_ORDERS,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DE FORMAT
  // ==========================================================================

  /**
   * Vérifier si un email est valide
   */
  checkEmailFormat(email: string): boolean {
    return queries.CHECK_EMAIL_FORMAT(email);
  }

  /**
   * Vérifier si un nom d'utilisateur est valide
   */
  checkUsernameFormat(username: string): boolean {
    return queries.CHECK_USERNAME_FORMAT(username);
  }

  /**
   * Vérifier si un téléphone est valide
   */
  checkPhoneFormat(phone: string): boolean {
    return queries.CHECK_PHONE_FORMAT(phone);
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION D'ABONNEMENT
  // ==========================================================================

  /**
   * Vérifier si un abonnement est actif
   */
  async isSubscriptionActive(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_SUBSCRIPTION_ACTIVE,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un abonnement a expiré
   */
  async isSubscriptionExpired(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_SUBSCRIPTION_EXPIRED,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  /**
   * Obtenir les jours restants d'abonnement
   */
  async getSubscriptionDaysRemaining(userId: number): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_SUBSCRIPTION_DAYS_REMAINING,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0 || !results[0].subscription_end_date) {
            resolve(null);
          } else {
            resolve(results[0].days_remaining);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION D'INTÉGRITÉ
  // ==========================================================================

  /**
   * Détecter les doublons d'email
   */
  async detectDuplicateEmails(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DETECT_DUPLICATE_EMAILS,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * Détecter les doublons de nom d'utilisateur
   */
  async detectDuplicateUsernames(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DETECT_DUPLICATE_USERNAMES,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * Détecter les utilisateurs avec des relations invalides
   */
  async detectInvalidRelations(limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DETECT_INVALID_RELATIONS,
        [limit],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * Vérifier la complétude du profil
   */
  async checkProfileCompleteness(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PROFILE_COMPLETENESS,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        }
      );
    });
  }

  /**
   * Obtenir les profils incomplets
   */
  async getIncompleteProfiles(limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_INCOMPLETE_PROFILES,
        [limit],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }
}
