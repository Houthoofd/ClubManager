/**
 * Repository de RECHERCHE pour le module Commandes
 * Responsabilité: Opérations de recherche avec filtres uniquement
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Commande,
  CommandeRow,
  CommandeSearchFilters,
} from '../types.js';
import * as queries from '../queries/index.js';
import {
  parseCommandeRow,
  parseCommandeRows,
  toInt,
} from '../utils/index.js';

/**
 * Repository pour les opérations de recherche sur les commandes
 */
export class CommandesSearchRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Rechercher des commandes avec filtres et pagination
   */
  async search(filters: CommandeSearchFilters): Promise<{ commandes: Commande[]; total: number }> {
    return new Promise((resolve, reject) => {
      // Construire la clause WHERE
      const whereClause = queries.buildSearchWhereClause(
        !!filters.statut,
        !!filters.utilisateur_id,
        !!filters.date_debut,
        !!filters.date_fin,
        !!filters.search,
        !!filters.montant_min,
        !!filters.montant_max
      );

      // Construire les paramètres
      const params: any[] = [];
      if (filters.statut) params.push(filters.statut);
      if (filters.utilisateur_id) params.push(filters.utilisateur_id);
      if (filters.date_debut) params.push(filters.date_debut);
      if (filters.date_fin) params.push(filters.date_fin);
      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      if (filters.montant_min !== undefined) params.push(filters.montant_min);
      if (filters.montant_max !== undefined) params.push(filters.montant_max);

      // Compter le total d'abord
      const countQuery = queries.SEARCH_COMMANDES_COUNT_BASE + whereClause;
      this.mysqlConnector.query(countQuery, params, (error, countResults: any[]) => {
        if (error) {
          reject(error);
          return;
        }

        const total = toInt(countResults[0].total);

        // Ensuite récupérer les données avec pagination
        let dataQuery = queries.SEARCH_COMMANDES_BASE + whereClause;
        dataQuery += ' ORDER BY c.date_commande DESC';

        const dataParams = [...params];
        if (filters.limit !== undefined) {
          dataQuery += ' LIMIT ?';
          dataParams.push(filters.limit);
        }
        if (filters.offset !== undefined) {
          dataQuery += ' OFFSET ?';
          dataParams.push(filters.offset);
        }

        this.mysqlConnector.query(dataQuery, dataParams, (error2, results: CommandeRow[]) => {
          if (error2) {
            reject(error2);
          } else {
            resolve({
              commandes: parseCommandeRows(results),
              total,
            });
          }
        });
      });
    });
  }

  /**
   * Rechercher des commandes par ID partiel (autocomplete)
   */
  async searchByIdPattern(pattern: string, limit: number = 10): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COMMANDES_BY_ID_PATTERN,
        [`%${pattern}%`, limit],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandeRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des commandes par email utilisateur
   */
  async searchByEmail(email: string, limit: number = 50): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COMMANDES_BY_EMAIL,
        [`%${email}%`, limit],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandeRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des commandes par nom d'utilisateur
   */
  async searchByUsername(username: string, limit: number = 50): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COMMANDES_BY_USERNAME,
        [`%${username}%`, limit],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandeRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des commandes par plage de montants
   */
  async searchByMontantRange(min: number, max: number, limit: number = 100): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COMMANDES_BY_MONTANT_RANGE,
        [min, max, limit],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandeRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des commandes par article
   */
  async searchByArticle(articleId: string, limit: number = 100): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COMMANDES_BY_ARTICLE,
        [articleId, limit],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandeRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des commandes par nom de produit
   */
  async searchByProductName(productName: string, limit: number = 100): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COMMANDES_BY_PRODUCT_NAME,
        [`%${productName}%`, limit],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandeRows(results));
          }
        }
      );
    });
  }

  /**
   * Recherche avancée avec construction dynamique
   */
  async advancedSearch(params: queries.SearchCommandesParams): Promise<{ commandes: Commande[]; total: number }> {
    return new Promise((resolve, reject) => {
      // Construire la requête de comptage
      const { query: countQuery, params: countParams } = queries.buildSearchCountQuery(params);

      this.mysqlConnector.query(countQuery, countParams, (error, countResults: any[]) => {
        if (error) {
          reject(error);
          return;
        }

        const total = toInt(countResults[0].total);

        // Construire la requête de données
        const { query: dataQuery, params: dataParams } = queries.buildSearchQuery(params);

        this.mysqlConnector.query(dataQuery, dataParams, (error2, results: CommandeRow[]) => {
          if (error2) {
            reject(error2);
          } else {
            resolve({
              commandes: parseCommandeRows(results),
              total,
            });
          }
        });
      });
    });
  }
}
