/**
 * Repository pour les opérations de validation du Magasin
 * Responsabilité: Vérification de l'existence et de la validité des données
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de validation
 */
export class ValidationRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION
  // ==========================================================================

  /**
   * Vérifier si un article existe
   */
  async articleExists(articleId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ARTICLE_EXISTS,
        [articleId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si une catégorie existe
   */
  async categorieExists(categorieId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_CATEGORIE_EXISTS,
        [categorieId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si la quantité en stock est suffisante
   */
  async checkStockSufficient(
    articleId: number,
    tailleId: number,
    quantiteDemandee: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_STOCK_SUFFICIENT,
        [articleId, tailleId],
        (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(false);
          } else {
            const quantiteDisponible = results[0]?.quantite || 0;
            resolve(quantiteDisponible >= quantiteDemandee);
          }
        }
      );
    });
  }
}
