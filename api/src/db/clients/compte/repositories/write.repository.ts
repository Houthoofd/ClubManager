/**
 * Repository d'ÉCRITURE pour le module Compte
 * Responsabilité: Opérations d'écriture uniquement (INSERT, UPDATE, DELETE)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type { UpdateUtilisateurData } from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations d'écriture sur les comptes utilisateurs
 */
export class CompteWriteRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR DU MOT DE PASSE
  // ==========================================================================

  /**
   * Mettre à jour le mot de passe (création - uniquement si vide)
   */
  async updatePasswordIfEmpty(userId: number, hashedPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_PASSWORD_IF_EMPTY,
        [hashedPassword, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le mot de passe
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_PASSWORD,
        [hashedPassword, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR DES INFORMATIONS
  // ==========================================================================

  /**
   * Mettre à jour les informations du compte
   */
  async updateCompteInfo(
    userId: number,
    firstName: string,
    lastName: string,
    email: string,
    dateOfBirth: string | null,
    phone: string | null
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COMPTE_INFO,
        [firstName, lastName, email, dateOfBirth, phone, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le prénom
   */
  async updateFirstName(userId: number, firstName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_FIRST_NAME,
        [firstName, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le nom
   */
  async updateLastName(userId: number, lastName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_LAST_NAME,
        [lastName, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour l'email
   */
  async updateEmail(userId: number, email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_EMAIL,
        [email, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le téléphone
   */
  async updatePhone(userId: number, phone: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_PHONE,
        [phone, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour la date de naissance
   */
  async updateDateOfBirth(userId: number, dateOfBirth: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_DATE_OF_BIRTH,
        [dateOfBirth, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le nom d'utilisateur
   */
  async updateUsername(userId: number, username: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_USERNAME,
        [username, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR DES RELATIONS
  // ==========================================================================

  /**
   * Mettre à jour le genre
   */
  async updateGenre(userId: number, genreId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_GENRE,
        [genreId, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le statut
   */
  async updateStatus(userId: number, statusId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_STATUS,
        [statusId, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le grade
   */
  async updateGrade(userId: number, gradeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_GRADE,
        [gradeId, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour l'abonnement
   */
  async updateAbonnement(userId: number, abonnementId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_ABONNEMENT,
        [abonnementId, userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour un utilisateur (mise à jour dynamique)
   */
  async updateUtilisateur(userId: number, data: UpdateUtilisateurData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.first_name !== undefined) {
        fields.push('first_name');
        values.push(data.first_name);
      }

      if (data.last_name !== undefined) {
        fields.push('last_name');
        values.push(data.last_name);
      }

      if (data.email !== undefined) {
        fields.push('email');
        values.push(data.email);
      }

      if (data.phone !== undefined) {
        fields.push('phone');
        values.push(data.phone);
      }

      if (data.date_of_birth !== undefined) {
        fields.push('date_of_birth');
        values.push(data.date_of_birth);
      }

      if (data.nom_utilisateur !== undefined) {
        fields.push('nom_utilisateur');
        values.push(data.nom_utilisateur);
      }

      if (data.genre_id !== undefined) {
        fields.push('genre_id');
        values.push(data.genre_id);
      }

      if (data.status_id !== undefined) {
        fields.push('status_id');
        values.push(data.status_id);
      }

      if (data.grade_id !== undefined) {
        fields.push('grade_id');
        values.push(data.grade_id);
      }

      if (data.abonnement_id !== undefined) {
        fields.push('abonnement_id');
        values.push(data.abonnement_id);
      }

      if (fields.length === 0) {
        resolve(false);
        return;
      }

      values.push(userId);
      const sql = queries.buildUpdateUtilisateurQuery(fields);

      this.mysqlConnector.query(sql, values, (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  // ==========================================================================
  // MÉTHODES DE GESTION DU COMPTE
  // ==========================================================================

  /**
   * Désactiver un compte (soft delete)
   */
  async softDelete(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SOFT_DELETE_COMPTE,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Réactiver un compte
   */
  async reactivate(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.REACTIVATE_COMPTE,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE SÉCURITÉ
  // ==========================================================================

  /**
   * Mettre à jour la date de dernière connexion
   */
  async updateLastLogin(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_LAST_LOGIN,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Incrémenter le compteur de tentatives échouées
   */
  async incrementFailedLoginAttempts(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INCREMENT_FAILED_LOGIN_ATTEMPTS,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Réinitialiser le compteur de tentatives échouées
   */
  async resetFailedLoginAttempts(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.RESET_FAILED_LOGIN_ATTEMPTS,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Verrouiller un compte
   */
  async lockAccount(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.LOCK_ACCOUNT,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Déverrouiller un compte
   */
  async unlockAccount(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UNLOCK_ACCOUNT,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'INSERTION
  // ==========================================================================

  /**
   * Créer un nouveau compte utilisateur
   */
  async create(userData: {
    first_name: string;
    last_name: string;
    nom_utilisateur?: string;
    email: string;
    password?: string;
    phone?: string;
    date_of_birth?: string;
    genre_id?: number;
    status_id?: number;
    grade_id?: number;
    abonnement_id?: number;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      const values = [
        userData.first_name,
        userData.last_name,
        userData.nom_utilisateur || null,
        userData.email,
        userData.password || null,
        userData.phone || null,
        userData.date_of_birth || null,
        userData.genre_id || null,
        userData.status_id || 1,
        userData.grade_id || null,
        userData.abonnement_id || null,
      ];

      this.mysqlConnector.query(queries.INSERT_USER, values, (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.insertId);
        }
      });
    });
  }

  // ==========================================================================
  // MÉTHODES DE SUPPRESSION
  // ==========================================================================

  /**
   * Supprimer définitivement un compte (hard delete)
   */
  async deleteHard(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_USER_HARD,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Anonymiser les données d'un utilisateur (RGPD)
   */
  async anonymize(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.ANONYMIZE_USER_DATA,
        [userId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Supprimer les comptes inactifs depuis X jours
   */
  async deleteInactiveUsers(days: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INACTIVE_USERS,
        [days],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        }
      );
    });
  }
}
