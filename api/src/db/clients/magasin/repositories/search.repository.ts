/**
 * Repository pour les opérations de recherche du Magasin
 * Responsabilité: Recherche et statistiques
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  ArticleAvecCategorie,
  ArticleAvecRelationsRow,
  MagasinStats,
} from '../types.js';
import * as queries from '../queries/index.js';
import {
  parseArticlesWithRelations,
} from '../utils/index.js';

/**
 * Repository pour les opérations de recherche
 */
export class SearchRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE RECHERCHE
  // ==========================================================================

  /**
   * Rechercher des articles par nom
   */
  async searchArticlesByName(searchTerm: string): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${searchTerm}%`;
      this.mysqlConnector.query(
        queries.SEARCH_ARTICLES_BY_NAME,
        [searchPattern],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des articles par plage de prix
   */
  async searchArticlesByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_ARTICLES_BY_PRICE_RANGE,
        [minPrice, maxPrice],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques du magasin
   */
  async getStats(): Promise<MagasinStats> {
    return new Promise(async (resolve, reject) => {
      try {
        // Total articles
        const totalArticles = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(queries.COUNT_TOTAL_ARTICLES, [], (err, results) => {
            if (err) rej(err);
            else res(results[0]?.total || 0);
          });
        });

        // Total commandes
        const totalCommandes = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(queries.COUNT_TOTAL_COMMANDES, [], (err, results) => {
            if (err) rej(err);
            else res(results[0]?.total || 0);
          });
        });

        // Total revenu
        const totalRevenu = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(queries.SUM_TOTAL_REVENUE, [], (err, results) => {
            if (err) rej(err);
            else res(results[0]?.total_revenue || 0);
          });
        });

        // Articles en rupture
        const articlesEnRupture = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(
            queries.COUNT_OUT_OF_STOCK_ARTICLES,
            [],
            (err, results) => {
              if (err) rej(err);
              else res(results[0]?.total || 0);
            }
          );
        });

        // Commandes en attente
        const commandesEnAttente = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(
            queries.COUNT_PENDING_COMMANDES,
            [],
            (err, results) => {
              if (err) rej(err);
              else res(results[0]?.total || 0);
            }
          );
        });

        resolve({
          totalArticles,
          totalCommandes,
          totalRevenu,
          articlesEnRupture,
          commandesEnAttente,
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
