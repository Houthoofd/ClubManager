/**
 * Repository de RELATIONS pour le module Compte
 * Responsabilité: Gestion des relations (genres, grades, status, abonnements)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations sur les relations des comptes utilisateurs
 */
export class CompteRelationsRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ==========================================================================
  // MÉTHODES POUR OBTENIR LES IDS DES RELATIONS
  // ==========================================================================

  /**
   * Obtenir l'ID d'un genre par son nom
   */
  async getGenreIdByName(genreName: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_GENRE_ID_BY_NAME,
        [genreName],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        }
      );
    });
  }

  /**
   * Obtenir l'ID d'un grade par son nom
   */
  async getGradeIdByName(gradeName: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_GRADE_ID_BY_NAME,
        [gradeName],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        }
      );
    });
  }

  /**
   * Obtenir l'ID d'un statut par son nom
   */
  async getStatusIdByName(statusName: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATUS_ID_BY_NAME,
        [statusName],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        }
      );
    });
  }

  /**
   * Obtenir l'ID d'un abonnement par son nom
   */
  async getAbonnementIdByName(abonnementName: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ABONNEMENT_ID_BY_NAME,
        [abonnementName],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES POUR LISTER LES GENRES
  // ==========================================================================

  /**
   * Obtenir tous les genres
   */
  async getAllGenres(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_GENRES, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir tous les genres avec le nombre d'utilisateurs
   */
  async getAllGenresWithCount(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_GENRES_WITH_COUNT,
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
   * Obtenir un genre par ID
   */
  async getGenreById(genreId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_GENRE_BY_ID,
        [genreId],
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

  // ==========================================================================
  // MÉTHODES POUR LISTER LES GRADES
  // ==========================================================================

  /**
   * Obtenir tous les grades
   */
  async getAllGrades(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_GRADES, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir tous les grades avec le nombre d'utilisateurs
   */
  async getAllGradesWithCount(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_GRADES_WITH_COUNT,
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
   * Obtenir un grade par ID
   */
  async getGradeById(gradeId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_GRADE_BY_ID,
        [gradeId],
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

  // ==========================================================================
  // MÉTHODES POUR LISTER LES STATUS
  // ==========================================================================

  /**
   * Obtenir tous les status
   */
  async getAllStatus(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_STATUS, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir tous les status avec le nombre d'utilisateurs
   */
  async getAllStatusWithCount(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_STATUS_WITH_COUNT,
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
   * Obtenir un status par ID
   */
  async getStatusById(statusId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATUS_BY_ID,
        [statusId],
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

  // ==========================================================================
  // MÉTHODES POUR LISTER LES PLANS TARIFAIRES
  // ==========================================================================

  /**
   * Obtenir tous les plans tarifaires
   */
  async getAllPlans(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_PLANS, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir tous les plans tarifaires avec le nombre d'abonnés
   */
  async getAllPlansWithCount(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_PLANS_WITH_COUNT,
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
   * Obtenir un plan tarifaire par ID
   */
  async getPlanById(planId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PLAN_BY_ID,
        [planId],
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
   * Obtenir les plans tarifaires actifs
   */
  async getActivePlans(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ACTIVE_PLANS, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  // ==========================================================================
  // MÉTHODES POUR LES STATISTIQUES DES RELATIONS
  // ==========================================================================

  /**
   * Compter les utilisateurs par genre
   */
  async countUsersByGenre(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_USERS_BY_GENRE,
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
   * Compter les utilisateurs par grade
   */
  async countUsersByGrade(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_USERS_BY_GRADE,
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
   * Compter les utilisateurs par status
   */
  async countUsersByStatus(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_USERS_BY_STATUS,
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
   * Compter les utilisateurs par abonnement
   */
  async countUsersByAbonnement(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_USERS_BY_ABONNEMENT,
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

  // ==========================================================================
  // MÉTHODES DE VALIDATION DES RELATIONS
  // ==========================================================================

  /**
   * Vérifier si un genre existe
   */
  async genreExists(genreId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_GENRE_EXISTS,
        [genreId],
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
   * Vérifier si un grade existe
   */
  async gradeExists(gradeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_GRADE_EXISTS,
        [gradeId],
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
   * Vérifier si un status existe
   */
  async statusExists(statusId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_STATUS_EXISTS,
        [statusId],
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
   * Vérifier si un plan tarifaire existe
   */
  async planExists(planId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PLAN_EXISTS,
        [planId],
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
}
