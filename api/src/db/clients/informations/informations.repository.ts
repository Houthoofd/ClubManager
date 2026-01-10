/**
 * Repository pour le module Informations
 * Pattern Repository avec singleton
 */

import MysqlConnector from '../../connector/mysqlconnector.js';
import type {
  Information,
  InformationAvecRelations,
  CreateInformationData,
  UpdateInformationData,
  InformationSearchFilters,
  InformationConfirmationResult,
  PaginatedInformationResult,
  InformationStatistiques,
  Status,
  Genre,
  Grade,
  PlanTarifaire,
  CategorieInformation,
} from './types.js';

import {
  parseInformationRow,
  parseInformationRows,
  parseInformationAvecRelationsRow,
  parseInformationAvecRelationsRows,
  parseStatusRows,
  parseGenreRows,
  parseGradeRows,
  parsePlanTarifaireRows,
  parseCategorieInformationRows,
} from './utils/parsing.utils.js';

import * as queries from './queries/index.js';

/**
 * Repository pour la gestion des informations
 */
export class InformationsRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // MÉTHODES DE LECTURE - INFORMATIONS
  // ============================================================================

  /**
   * Récupérer toutes les informations actives
   */
  async findAll(): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_INFORMATIONS, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseInformationRows(results));
        }
      });
    });
  }

  /**
   * Récupérer toutes les informations (incluant inactives)
   */
  async findAllWithInactive(): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_INFORMATIONS_WITH_INACTIVE,
        [],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer une information par son ID
   */
  async findById(id: number): Promise<Information | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_INFORMATION_BY_ID, [id], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(parseInformationRow(results[0]));
        }
      });
    });
  }

  /**
   * Récupérer une information active par son ID
   */
  async findActiveById(id: number): Promise<Information | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ACTIVE_INFORMATION_BY_ID,
        [id],
        (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseInformationRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer toutes les informations avec relations
   */
  async findAllWithRelations(): Promise<InformationAvecRelations[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_WITH_RELATIONS,
        [],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationAvecRelationsRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer une information avec relations par son ID
   */
  async findByIdWithRelations(id: number): Promise<InformationAvecRelations | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATION_WITH_RELATIONS_BY_ID,
        [id],
        (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseInformationAvecRelationsRow(results[0]));
          }
        }
      );
    });
  }

  // ============================================================================
  // MÉTHODES DE RECHERCHE ET FILTRAGE
  // ============================================================================

  /**
   * Rechercher des informations par titre
   */
  async searchByTitre(
    titre: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${titre}%`;
      this.mysqlConnector.query(
        queries.SEARCH_INFORMATIONS_BY_TITRE,
        [searchPattern, limit, offset],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des informations avec filtres
   */
  async search(filters: InformationSearchFilters): Promise<PaginatedInformationResult> {
    return new Promise((resolve, reject) => {
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const page = Math.floor(offset / limit) + 1;

      let sql = queries.SEARCH_INFORMATIONS_BASE;
      let countSql = queries.COUNT_SEARCH_RESULTS;
      const params: any[] = [];
      const countParams: any[] = [];

      // Filtres dynamiques
      if (filters.titre) {
        sql += ' AND i.titre LIKE ?';
        countSql += ' AND titre LIKE ?';
        const searchPattern = `%${filters.titre}%`;
        params.push(searchPattern);
        countParams.push(searchPattern);
      }

      if (filters.contenu) {
        sql += ' AND i.contenu LIKE ?';
        countSql += ' AND contenu LIKE ?';
        const searchPattern = `%${filters.contenu}%`;
        params.push(searchPattern);
        countParams.push(searchPattern);
      }

      if (filters.categorie_id) {
        sql += ' AND i.categorie_id = ?';
        countSql += ' AND categorie_id = ?';
        params.push(filters.categorie_id);
        countParams.push(filters.categorie_id);
      }

      if (filters.status_id !== undefined) {
        sql += ' AND i.status_id = ?';
        countSql += ' AND status_id = ?';
        params.push(filters.status_id);
        countParams.push(filters.status_id);
      } else {
        sql += ' AND i.status_id = 1';
        countSql += ' AND status_id = 1';
      }

      if (filters.auteur_id) {
        sql += ' AND i.auteur_id = ?';
        countSql += ' AND auteur_id = ?';
        params.push(filters.auteur_id);
        countParams.push(filters.auteur_id);
      }

      if (filters.visible !== undefined) {
        sql += ' AND i.visible = ?';
        countSql += ' AND visible = ?';
        params.push(filters.visible ? 1 : 0);
        countParams.push(filters.visible ? 1 : 0);
      }

      if (filters.date_debut) {
        sql += ' AND i.date_creation >= ?';
        countSql += ' AND date_creation >= ?';
        params.push(filters.date_debut);
        countParams.push(filters.date_debut);
      }

      if (filters.date_fin) {
        sql += ' AND i.date_creation <= ?';
        countSql += ' AND date_creation <= ?';
        params.push(filters.date_fin);
        countParams.push(filters.date_fin);
      }

      if (filters.priorite_min) {
        sql += ' AND i.priorite >= ?';
        countSql += ' AND priorite >= ?';
        params.push(filters.priorite_min);
        countParams.push(filters.priorite_min);
      }

      if (filters.priorite_max) {
        sql += ' AND i.priorite <= ?';
        countSql += ' AND priorite <= ?';
        params.push(filters.priorite_max);
        countParams.push(filters.priorite_max);
      }

      sql += ' ORDER BY i.date_creation DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // Exécuter les deux requêtes
      this.mysqlConnector.query(countSql, countParams, (countError, countResults) => {
        if (countError) {
          reject(countError);
          return;
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / limit);

        this.mysqlConnector.query(sql, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              informations: parseInformationRows(results),
              total,
              page,
              totalPages,
              limit,
            });
          }
        });
      });
    });
  }

  /**
   * Récupérer les informations par catégorie
   */
  async findByCategorie(categorieId: number): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_BY_CATEGORIE,
        [categorieId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les informations par auteur
   */
  async findByAuteur(auteurId: number): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_BY_AUTEUR,
        [auteurId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les informations récentes
   */
  async findRecent(days: number = 7, limit: number = 10): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_RECENT_INFORMATIONS,
        [days, limit],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les informations prioritaires
   */
  async findHighPriority(limit: number = 10): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HIGH_PRIORITY_INFORMATIONS,
        [limit],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInformationRows(results));
          }
        }
      );
    });
  }

  // ============================================================================
  // MÉTHODES D'ÉCRITURE - INFORMATIONS
  // ============================================================================

  /**
   * Créer une nouvelle information
   */
  async create(data: CreateInformationData): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      const params = [
        data.titre,
        data.contenu,
        data.auteur_id || null,
        data.categorie_id || null,
        data.priorite || 2,
        data.visible !== undefined ? (data.visible ? 1 : 0) : 1,
      ];

      this.mysqlConnector.query(queries.INSERT_INFORMATION, params, (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            isConfirm: true,
            message: 'Information créée avec succès',
            data: { id: results.insertId },
          });
        }
      });
    });
  }

  /**
   * Mettre à jour une information
   */
  async update(id: number, data: UpdateInformationData): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const params: any[] = [];

      if (data.titre !== undefined) {
        fields.push('titre = ?');
        params.push(data.titre);
      }

      if (data.contenu !== undefined) {
        fields.push('contenu = ?');
        params.push(data.contenu);
      }

      if (data.categorie_id !== undefined) {
        fields.push('categorie_id = ?');
        params.push(data.categorie_id);
      }

      if (data.priorite !== undefined) {
        fields.push('priorite = ?');
        params.push(data.priorite);
      }

      if (data.visible !== undefined) {
        fields.push('visible = ?');
        params.push(data.visible ? 1 : 0);
      }

      if (data.status_id !== undefined) {
        fields.push('status_id = ?');
        params.push(data.status_id);
      }

      if (fields.length === 0) {
        resolve({
          isConfirm: false,
          message: 'Aucun champ à mettre à jour',
        });
        return;
      }

      fields.push('date_modification = NOW()');
      fields.push('updated_at = NOW()');

      const sql = `UPDATE informations SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);

      this.mysqlConnector.query(sql, params, (error, results: any) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Information non trouvée',
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Information mise à jour avec succès',
          });
        }
      });
    });
  }

  /**
   * Supprimer une information (soft delete)
   */
  async softDelete(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SOFT_DELETE_INFORMATION,
        [id],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else if (results.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Information non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Information supprimée avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Supprimer définitivement une information
   */
  async delete(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.DELETE_INFORMATION, [id], (error, results: any) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Information non trouvée',
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Information supprimée définitivement',
          });
        }
      });
    });
  }

  /**
   * Archiver une information
   */
  async archive(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.ARCHIVE_INFORMATION, [id], (error, results: any) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Information non trouvée',
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Information archivée avec succès',
          });
        }
      });
    });
  }

  /**
   * Restaurer une information
   */
  async restore(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.RESTORE_INFORMATION, [id], (error, results: any) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Information non trouvée',
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Information restaurée avec succès',
          });
        }
      });
    });
  }

  /**
   * Publier une information
   */
  async publish(id: number): Promise<InformationConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.PUBLISH_INFORMATION, [id], (error, results: any) => {
        if (error) {
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Information non trouvée',
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Information publiée avec succès',
          });
        }
      });
    });
  }

  // ============================================================================
  // MÉTHODES DE VALIDATION
  // ============================================================================

  /**
   * Vérifier si une information existe
   */
  async exists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_INFORMATION_EXISTS,
        [id],
        (error, results) => {
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
   * Vérifier si une information active existe
   */
  async activeExists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ACTIVE_INFORMATION_EXISTS,
        [id],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // MÉTHODES POUR LES RÉFÉRENTIELS
  // ============================================================================

  /**
   * Récupérer tous les status
   */
  async getAllStatus(): Promise<Status[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_STATUS, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseStatusRows(results));
        }
      });
    });
  }

  /**
   * Récupérer tous les genres
   */
  async getAllGenres(): Promise<Genre[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_GENRES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseGenreRows(results));
        }
      });
    });
  }

  /**
   * Récupérer tous les grades
   */
  async getAllGrades(): Promise<Grade[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_GRADES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseGradeRows(results));
        }
      });
    });
  }

  /**
   * Récupérer tous les plans tarifaires
   */
  async getAllPlansTarifaires(): Promise<PlanTarifaire[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_PLANS_TARIFAIRES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parsePlanTarifaireRows(results));
        }
      });
    });
  }

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<CategorieInformation[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_CATEGORIES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseCategorieInformationRows(results));
        }
      });
    });
  }

  // ============================================================================
  // MÉTHODES DE STATISTIQUES
  // ============================================================================

  /**
   * Compter toutes les informations
   */
  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.COUNT_ALL_INFORMATIONS, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  /**
   * Obtenir les statistiques des informations
   */
  async getStatistiques(): Promise<InformationStatistiques> {
    return new Promise((resolve, reject) => {
      // Récupérer toutes les statistiques en parallèle
      Promise.all([
        this.count(),
        this.countByStatus(),
        this.countByCategorie(),
        this.countRecent(7),
      ])
        .then(([total, parStatus, parCategorie, recentes]) => {
          const actives = parStatus.find((s) => s.status === 'Publié')?.count || 0;
          const archivees = parStatus.find((s) => s.status === 'Archivé')?.count || 0;

          resolve({
            total_informations: total,
            informations_actives: actives,
            informations_archivees: archivees,
            par_status: parStatus,
            par_categorie: parCategorie,
            informations_recentes: recentes,
          });
        })
        .catch((error) => reject(error));
    });
  }

  /**
   * Compter par status
   */
  private async countByStatus(): Promise<{ status: string; count: number }[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_INFORMATIONS_BY_STATUS,
        [],
        (error, results) => {
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
   * Compter par catégorie
   */
  private async countByCategorie(): Promise<{ categorie: string; count: number }[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_INFORMATIONS_BY_CATEGORIE,
        [],
        (error, results) => {
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
   * Compter les informations récentes
   */
  private async countRecent(days: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.COUNT_RECENT_INFORMATIONS, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let repositoryInstance: InformationsRepository | null = null;

/**
 * Obtenir l'instance singleton du repository
 */
export function getInformationsRepository(): InformationsRepository {
  if (!repositoryInstance) {
    repositoryInstance = new InformationsRepository();
  }
  return repositoryInstance;
}
