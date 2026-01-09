/**
 * Repository de LECTURE pour le module Compte
 * Responsabilité: Opérations de lecture uniquement (SELECT)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type { User, UserRow } from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de lecture sur les comptes utilisateurs
 */
export class CompteReadRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Récupérer un utilisateur par son nom et prénom
   */
  async findByName(firstName: string, lastName: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_NAME,
        [firstName, lastName],
        (error, results: UserRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as User);
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur avec ses relations par nom et prénom
   */
  async findByNameWithRelations(firstName: string, lastName: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_WITH_RELATIONS,
        [firstName, lastName],
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
   * Récupérer un utilisateur par son ID
   */
  async findById(userId: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_ID,
        [userId],
        (error, results: UserRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as User);
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur par son ID avec ses relations
   */
  async findByIdWithRelations(userId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_ID_WITH_RELATIONS,
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
   * Récupérer les informations basiques du compte
   */
  async getCompteInfo(userId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMPTE_INFO,
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
   * Récupérer un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_EMAIL,
        [email],
        (error, results: UserRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as User);
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur par nom d'utilisateur
   */
  async findByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_USERNAME,
        [username],
        (error, results: UserRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as User);
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les utilisateurs actifs
   */
  async findAllActive(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_ACTIVE_USERS,
        [],
        (error, results: UserRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results as User[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les utilisateurs avec leurs relations
   */
  async findAllWithRelations(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_USERS_WITH_RELATIONS,
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
   * Récupérer le mot de passe d'un utilisateur
   */
  async getUserPassword(userId: number): Promise<{ id: number; password: string | null } | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_PASSWORD,
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
   * Récupérer les utilisateurs par statut
   */
  async findByStatus(statusId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USERS_BY_STATUS,
        [statusId],
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
   * Récupérer les utilisateurs par grade
   */
  async findByGrade(gradeId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USERS_BY_GRADE,
        [gradeId],
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
   * Récupérer les utilisateurs par abonnement
   */
  async findByAbonnement(abonnementId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USERS_BY_ABONNEMENT,
        [abonnementId],
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
