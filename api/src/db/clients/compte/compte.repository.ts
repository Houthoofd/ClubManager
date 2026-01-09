/**
 * Repository pour les opérations de base de données sur les Comptes/Utilisateurs
 * Responsabilité: Accès à la base de données uniquement (pas de logique métier)
 */

import MysqlConnector from '../../connector/mysqlconnector.js';
import type {
  Utilisateur,
  UtilisateurRow,
  UtilisateurAvecRelations,
  UtilisateurAvecRelationsRow,
  CompteInfo,
  CompteInfoRow,
  UpdateCompteData,
  UpdateUtilisateurData,
  Genre,
  GenreRow,
  Grade,
  GradeRow,
  Status,
  StatusRow,
  PlanTarifaire,
  PlanTarifaireRow,
} from './types.js';
import * as queries from './queries.js';
import {
  parseUtilisateurRow,
  parseUtilisateurRows,
  parseUtilisateurAvecRelationsRow,
  parseCompteInfoRow,
  parseGenreRow,
  parseGradeRow,
  parseStatusRow,
  parsePlanTarifaireRow,
  toInt,
} from './utils/index.js';

/**
 * Repository pour la gestion des comptes utilisateurs
 */
export class CompteRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT)
  // ==========================================================================

  /**
   * Récupérer un utilisateur par son nom et prénom
   */
  async findByName(firstName: string, lastName: string): Promise<Utilisateur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_NAME,
        [firstName, lastName],
        (error, results: UtilisateurRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseUtilisateurRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur avec ses relations par nom et prénom
   */
  async findByNameWithRelations(
    firstName: string,
    lastName: string
  ): Promise<UtilisateurAvecRelations | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_WITH_RELATIONS,
        [firstName, lastName],
        (error, results: UtilisateurAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseUtilisateurAvecRelationsRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async findById(userId: number): Promise<Utilisateur | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_ID,
        [userId],
        (error, results: UtilisateurRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseUtilisateurRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur par son ID avec relations
   */
  async findByIdWithRelations(userId: number): Promise<UtilisateurAvecRelations | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_ID_WITH_RELATIONS,
        [userId],
        (error, results: UtilisateurAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseUtilisateurAvecRelationsRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer les informations basiques d'un compte
   */
  async getCompteInfo(userId: number): Promise<CompteInfo | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMPTE_INFO,
        [userId],
        (error, results: CompteInfoRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseCompteInfoRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur par email
   */
  async findByEmail(email: string): Promise<Utilisateur | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_EMAIL,
        [email],
        (error, results: UtilisateurRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseUtilisateurRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un utilisateur par nom d'utilisateur
   */
  async findByUsername(username: string): Promise<Utilisateur | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_USERNAME,
        [username],
        (error, results: UtilisateurRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseUtilisateurRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les utilisateurs actifs
   */
  async findAllActive(): Promise<Utilisateur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_ACTIVE_USERS,
        [],
        (error, results: UtilisateurRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseUtilisateurRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les utilisateurs avec relations
   */
  async findAllWithRelations(): Promise<UtilisateurAvecRelations[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_USERS_WITH_RELATIONS,
        [],
        (error, results: UtilisateurAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map(parseUtilisateurAvecRelationsRow));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (INSERT, UPDATE, DELETE)
  // ==========================================================================

  /**
   * Mettre à jour le mot de passe d'un utilisateur
   */
  async updatePassword(
    userId: number,
    hash: string,
    isCreation: boolean
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = isCreation
        ? queries.UPDATE_PASSWORD_IF_EMPTY
        : queries.UPDATE_PASSWORD;

      this.mysqlConnector.query(sql, [hash, userId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Mettre à jour les informations du compte
   */
  async updateCompteInfo(userId: number, data: UpdateCompteData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COMPTE_INFO,
        [
          data.first_name,
          data.last_name,
          data.email,
          data.date_of_birth,
          data.phone,
          userId,
        ],
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
   * Mettre à jour un utilisateur (dynamique)
   */
  async updateUtilisateur(userId: number, data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      // Construire dynamiquement les champs à mettre à jour
      if (data.email !== undefined) {
        fields.push('email');
        values.push(data.email);
      }

      if (data.date_of_birth !== undefined) {
        fields.push('date_of_birth');
        values.push(data.date_of_birth);
      }

      if (data.genre_id !== undefined) {
        fields.push('genre_id');
        values.push(data.genre_id);
      }

      if (data.grade_id !== undefined) {
        fields.push('grade_id');
        values.push(data.grade_id);
      }

      if (data.abonnement_id !== undefined) {
        fields.push('abonnement_id');
        values.push(data.abonnement_id);
      }

      if (data.status_id !== undefined) {
        fields.push('status_id');
        values.push(data.status_id);
      }

      if (data.password !== undefined) {
        fields.push('password');
        values.push(data.password);
      }

      if (data.phone !== undefined) {
        fields.push('phone');
        values.push(data.phone);
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
  // MÉTHODES POUR LES RELATIONS
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

  /**
   * Obtenir tous les genres
   */
  async getAllGenres(): Promise<Genre[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_GENRES,
        [],
        (error, results: GenreRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map(parseGenreRow));
          }
        }
      );
    });
  }

  /**
   * Obtenir tous les grades
   */
  async getAllGrades(): Promise<Grade[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_GRADES,
        [],
        (error, results: GradeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map(parseGradeRow));
          }
        }
      );
    });
  }

  /**
   * Obtenir tous les status
   */
  async getAllStatus(): Promise<Status[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_STATUS,
        [],
        (error, results: StatusRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map(parseStatusRow));
          }
        }
      );
    });
  }

  /**
   * Obtenir tous les plans tarifaires
   */
  async getAllPlans(): Promise<PlanTarifaire[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_PLANS,
        [],
        (error, results: PlanTarifaireRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map(parsePlanTarifaireRow));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION
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
            resolve(toInt(results[0].count) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un email existe déjà (pour un autre utilisateur)
   */
  async emailExists(email: string, excludeUserId: number = 0): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_EXISTS,
        [email, excludeUserId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(toInt(results[0].count) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un nom d'utilisateur existe déjà (pour un autre utilisateur)
   */
  async usernameExists(username: string, excludeUserId: number = 0): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USERNAME_EXISTS,
        [username, excludeUserId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(toInt(results[0].count) > 0);
          }
        }
      );
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
            resolve(toInt(results[0].count) > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE RECHERCHE
  // ==========================================================================

  /**
   * Rechercher des utilisateurs avec filtres
   */
  async search(filters: {
    name?: string;
    email?: string;
    status?: number;
    genre?: number;
    grade?: number;
    abonnement?: number;
  }): Promise<UtilisateurAvecRelations[]> {
    return new Promise((resolve, reject) => {
      const whereClause = queries.buildSearchWhereClause(
        !!filters.name,
        !!filters.email,
        !!filters.status,
        !!filters.genre,
        !!filters.grade,
        !!filters.abonnement
      );

      const params: any[] = [];
      if (filters.name) {
        const searchPattern = `%${filters.name}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      if (filters.email) {
        params.push(`%${filters.email}%`);
      }
      if (filters.status !== undefined) params.push(filters.status);
      if (filters.genre !== undefined) params.push(filters.genre);
      if (filters.grade !== undefined) params.push(filters.grade);
      if (filters.abonnement !== undefined) params.push(filters.abonnement);

      const sql = queries.SEARCH_USERS_BASE + whereClause + ' ORDER BY u.last_name, u.first_name';

      this.mysqlConnector.query(
        sql,
        params,
        (error, results: UtilisateurAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map(parseUtilisateurAvecRelationsRow));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE STATISTIQUES
  // ==========================================================================

  /**
   * Compter les utilisateurs par statut
   */
  async countByStatus(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.COUNT_USERS_BY_STATUS, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          const counts: Record<string, number> = {};
          results.forEach((row) => {
            counts[row.nom_role] = toInt(row.count);
          });
          resolve(counts);
        }
      });
    });
  }

  /**
   * Compter les utilisateurs par genre
   */
  async countByGenre(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.COUNT_USERS_BY_GENRE, [], (error, results: any[]) => {
        if (error) {
          reject(error);
        } else {
          const counts: Record<string, number> = {};
          results.forEach((row) => {
            counts[row.genre_name || 'Non spécifié'] = toInt(row.count);
          });
          resolve(counts);
        }
      });
    });
  }

  /**
   * Compter les utilisateurs par abonnement
   */
  async countByAbonnement(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_USERS_BY_ABONNEMENT,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const counts: Record<string, number> = {};
            results.forEach((row) => {
              counts[row.nom_plan || 'Aucun abonnement'] = toInt(row.count);
            });
            resolve(counts);
          }
        }
      );
    });
  }
}

// Singleton instance
let repositoryInstance: CompteRepository | null = null;

/**
 * Obtenir l'instance singleton du repository
 */
export function getCompteRepository(): CompteRepository {
  if (!repositoryInstance) {
    repositoryInstance = new CompteRepository();
  }
  return repositoryInstance;
}
