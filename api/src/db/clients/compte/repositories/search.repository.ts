/**
 * Repository de RECHERCHE pour le module Compte
 * Responsabilité: Opérations de recherche avec filtres uniquement
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de recherche sur les comptes utilisateurs
 */
export class CompteSearchRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Rechercher des utilisateurs avec filtres et pagination
   */
  async search(filters: queries.SearchUsersParams): Promise<{ users: any[]; total: number }> {
    return new Promise((resolve, reject) => {
      // Construire la requête de comptage
      const { query: countQuery, params: countParams } = queries.buildSearchCountQuery(filters);

      this.mysqlConnector.query(countQuery, countParams, (error, countResults: any[]) => {
        if (error) {
          reject(error);
          return;
        }

        const total = countResults[0].total;

        // Construire la requête de données
        const { query: dataQuery, params: dataParams } = queries.buildSearchQuery(filters);

        this.mysqlConnector.query(dataQuery, dataParams, (error2, results: any[]) => {
          if (error2) {
            reject(error2);
          } else {
            resolve({
              users: results,
              total,
            });
          }
        });
      });
    });
  }

  /**
   * Rechercher par nom partiel (autocomplete)
   */
  async searchByNamePattern(pattern: string, limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${pattern}%`;
      this.mysqlConnector.query(
        queries.SEARCH_USERS_BY_NAME_PATTERN,
        [searchPattern, searchPattern, searchPattern, limit],
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
   * Rechercher par email partiel
   */
  async searchByEmailPattern(pattern: string, limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_USERS_BY_EMAIL_PATTERN,
        [`%${pattern}%`, limit],
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
   * Rechercher par téléphone
   */
  async searchByPhone(phone: string, limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_USERS_BY_PHONE,
        [`%${phone}%`, limit],
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
   * Rechercher par plage d'âge
   */
  async searchByAgeRange(minAge: number, maxAge: number, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_USERS_BY_AGE_RANGE,
        [minAge, maxAge, limit],
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
   * Rechercher les utilisateurs récents
   */
  async searchRecentUsers(days: number = 7, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_RECENT_USERS,
        [days, limit],
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
   * Rechercher par mois d'anniversaire
   */
  async searchByBirthdayMonth(month: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_USERS_BY_BIRTHDAY_MONTH,
        [month],
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
   * Rechercher les abonnements expirant bientôt
   */
  async searchExpiringSubscriptions(days: number = 30, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_USERS_EXPIRING_SUBSCRIPTION,
        [days, limit],
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
