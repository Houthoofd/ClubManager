/**
 * Repository de lecture pour le module Informations
 * Contient toutes les méthodes de lecture/consultation
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Information,
  InformationAvecRelations,
  InformationSearchFilters,
  PaginatedInformationResult,
  Status,
  Genre,
  Grade,
  PlanTarifaire,
  CategorieInformation,
} from '../types.js';

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
} from '../utils/parsing.utils.js';

import * as queries from '../queries/index.js';

/**
 * Repository de lecture pour les informations
 */
export class InformationsReadRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // LECTURE DE BASE
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
   * Récupérer une information avec toutes ses relations
   */
  async findByIdWithRelations(id: number): Promise<InformationAvecRelations | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATION_WITH_RELATIONS,
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

  /**
   * Récupérer une information par son slug
   */
  async findBySlug(slug: string): Promise<Information | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_INFORMATION_BY_SLUG, [slug], (error, results) => {
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

  // ============================================================================
  // FILTRES ET RECHERCHE
  // ============================================================================

  /**
   * Rechercher des informations avec filtres et pagination
   */
  async search(filters: InformationSearchFilters): Promise<PaginatedInformationResult> {
    const { page = 1, limit = 20, ...otherFilters } = filters;
    const offset = (page - 1) * limit;

    // Construction dynamique de la requête
    let whereConditions: string[] = ['i.actif = 1'];
    let params: any[] = [];

    if (otherFilters.status_id) {
      whereConditions.push('i.status_id = ?');
      params.push(otherFilters.status_id);
    }

    if (otherFilters.categorie_id) {
      whereConditions.push('i.categorie_id = ?');
      params.push(otherFilters.categorie_id);
    }

    if (otherFilters.genre_id) {
      whereConditions.push('i.genre_id = ?');
      params.push(otherFilters.genre_id);
    }

    if (otherFilters.grade_id) {
      whereConditions.push('i.grade_id = ?');
      params.push(otherFilters.grade_id);
    }

    if (otherFilters.plan_tarifaire_id) {
      whereConditions.push('i.plan_tarifaire_id = ?');
      params.push(otherFilters.plan_tarifaire_id);
    }

    if (otherFilters.prioritaire !== undefined) {
      whereConditions.push('i.prioritaire = ?');
      params.push(otherFilters.prioritaire ? 1 : 0);
    }

    if (otherFilters.search) {
      whereConditions.push('(i.titre LIKE ? OR i.contenu LIKE ? OR i.slug LIKE ?)');
      const searchPattern = `%${otherFilters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (otherFilters.date_debut) {
      whereConditions.push('i.date_publication >= ?');
      params.push(otherFilters.date_debut);
    }

    if (otherFilters.date_fin) {
      whereConditions.push('i.date_publication <= ?');
      params.push(otherFilters.date_fin);
    }

    const whereClause = whereConditions.join(' AND ');

    // Requête de comptage
    const countQuery = `
      SELECT COUNT(*) as total
      FROM informations i
      WHERE ${whereClause}
    `;

    // Requête de données avec relations
    const dataQuery = `
      SELECT
        i.*,
        s.nom as status_nom,
        s.couleur as status_couleur,
        g.nom as genre_nom,
        gr.nom as grade_nom,
        pt.nom as plan_nom,
        pt.description as plan_description,
        ci.nom as categorie_nom,
        ci.icone as categorie_icone
      FROM informations i
      LEFT JOIN status s ON i.status_id = s.id
      LEFT JOIN genres g ON i.genre_id = g.id
      LEFT JOIN grades gr ON i.grade_id = gr.id
      LEFT JOIN plans_tarifaires pt ON i.plan_tarifaire_id = pt.id
      LEFT JOIN categories_informations ci ON i.categorie_id = ci.id
      WHERE ${whereClause}
      ORDER BY
        i.prioritaire DESC,
        i.date_publication DESC,
        i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      // Exécuter le comptage
      this.mysqlConnector.query(countQuery, params.slice(0, -2), (error, countResults) => {
        if (error) {
          reject(error);
          return;
        }

        const total = countResults[0]?.total || 0;

        // Exécuter la requête de données
        this.mysqlConnector.query(dataQuery, params, (error, dataResults) => {
          if (error) {
            reject(error);
          } else {
            const informations = parseInformationAvecRelationsRows(dataResults);
            resolve({
              informations,
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            });
          }
        });
      });
    });
  }

  /**
   * Récupérer les informations par statut
   */
  async findByStatus(statusId: number): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_BY_STATUS,
        [statusId],
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
   * Récupérer les informations par genre
   */
  async findByGenre(genreId: number): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_BY_GENRE,
        [genreId],
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
   * Récupérer les informations par grade
   */
  async findByGrade(gradeId: number): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_BY_GRADE,
        [gradeId],
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
   * Récupérer les informations par plan tarifaire
   */
  async findByPlanTarifaire(planId: number): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_BY_PLAN_TARIFAIRE,
        [planId],
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
  async findPrioritaires(): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_INFORMATIONS_PRIORITAIRES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseInformationRows(results));
        }
      });
    });
  }

  /**
   * Récupérer les informations récentes (dernières publiées)
   */
  async findRecent(limit: number = 10): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_RECENTES,
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

  /**
   * Récupérer les informations à venir (futures publications)
   */
  async findUpcoming(limit: number = 10): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INFORMATIONS_A_VENIR,
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

  /**
   * Recherche full-text dans les informations
   */
  async fullTextSearch(searchTerm: string, limit: number = 20): Promise<Information[]> {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${searchTerm}%`;
      this.mysqlConnector.query(
        queries.SEARCH_INFORMATIONS_FULL_TEXT,
        [searchPattern, searchPattern, searchPattern, limit],
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
  // RÉFÉRENTIELS
  // ============================================================================

  /**
   * Récupérer tous les statuts
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
   * Récupérer toutes les catégories d'informations
   */
  async getAllCategories(): Promise<CategorieInformation[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SELECT_ALL_CATEGORIES_INFORMATIONS, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(parseCategorieInformationRows(results));
        }
      });
    });
  }

  // ============================================================================
  // COMPTAGES
  // ============================================================================

  /**
   * Compter le nombre total d'informations actives
   */
  async countActive(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.COUNT_INFORMATIONS_ACTIVES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.total || 0);
        }
      });
    });
  }

  /**
   * Compter les informations par statut
   */
  async countByStatus(statusId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_INFORMATIONS_BY_STATUS,
        [statusId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les informations par catégorie
   */
  async countByCategorie(categorieId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_INFORMATIONS_BY_CATEGORIE,
        [categorieId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les informations prioritaires
   */
  async countPrioritaires(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.COUNT_INFORMATIONS_PRIORITAIRES, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]?.total || 0);
        }
      });
    });
  }
}

// Singleton
let readRepositoryInstance: InformationsReadRepository | null = null;

export function getInformationsReadRepository(): InformationsReadRepository {
  if (!readRepositoryInstance) {
    readRepositoryInstance = new InformationsReadRepository();
  }
  return readRepositoryInstance;
}
