/**
 * Client DB pour le module Stocks
 * Gère les interactions avec la base de données pour les stocks
 */

import MysqlConnector from "../../connector/mysqlconnector.js";

export interface StockData {
  id?: number;
  article_id: number;
  quantite: number;
  article_nom?: string;
  article_prix?: number;
  article_description?: string;
}

export interface StockUpdateData {
  article_id: number;
  quantite: number;
  operation?: "set" | "add" | "subtract";
}

export class Stocks {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  /**
   * Récupérer tous les stocks avec les informations des articles
   */
  obtenirTousLesStocks(): Promise<StockData[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          s.*,
          a.nom as article_nom,
          a.prix as article_prix,
          a.description as article_description
        FROM stocks s
        LEFT JOIN articles a ON s.article_id = a.id
        ORDER BY s.article_id
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error("Erreur lors de la récupération des stocks:", error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Récupérer les stocks d'un article spécifique
   */
  obtenirStockParArticle(articleId: number): Promise<StockData[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          s.*,
          a.nom as article_nom,
          a.prix as article_prix,
          a.description as article_description
        FROM stocks s
        LEFT JOIN articles a ON s.article_id = a.id
        WHERE s.article_id = ?
      `;

      this.mysqlConnector.query(sql, [articleId], (error, results) => {
        if (error) {
          console.error(
            `Erreur lors de la récupération du stock pour l'article ${articleId}:`,
            error
          );
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Mettre à jour un stock (opération SET)
   */
  mettreAJourStock(
    articleId: number,
    quantite: number
  ): Promise<{ affectedRows: number }> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE stocks SET quantite = ? WHERE article_id = ?`;

      this.mysqlConnector.query(
        sql,
        [quantite, articleId],
        (error, results: any) => {
          if (error) {
            console.error(
              `Erreur lors de la mise à jour du stock pour l'article ${articleId}:`,
              error
            );
            reject(error);
          } else {
            resolve({ affectedRows: results.affectedRows || 0 });
          }
        }
      );
    });
  }

  /**
   * Ajouter au stock (opération ADD)
   */
  ajouterAuStock(
    articleId: number,
    quantite: number
  ): Promise<{ affectedRows: number }> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE stocks SET quantite = quantite + ? WHERE article_id = ?`;

      this.mysqlConnector.query(
        sql,
        [quantite, articleId],
        (error, results: any) => {
          if (error) {
            console.error(
              `Erreur lors de l'ajout au stock pour l'article ${articleId}:`,
              error
            );
            reject(error);
          } else {
            resolve({ affectedRows: results.affectedRows || 0 });
          }
        }
      );
    });
  }

  /**
   * Soustraire du stock (opération SUBTRACT)
   */
  soustraireStock(
    articleId: number,
    quantite: number
  ): Promise<{ affectedRows: number }> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE stocks SET quantite = GREATEST(0, quantite - ?) WHERE article_id = ?`;

      this.mysqlConnector.query(
        sql,
        [quantite, articleId],
        (error, results: any) => {
          if (error) {
            console.error(
              `Erreur lors de la soustraction du stock pour l'article ${articleId}:`,
              error
            );
            reject(error);
          } else {
            resolve({ affectedRows: results.affectedRows || 0 });
          }
        }
      );
    });
  }

  /**
   * Récupérer les alertes de stock (stocks bas)
   */
  obtenirAlertesStock(seuil: number = 5): Promise<StockData[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          s.*,
          a.nom as article_nom,
          a.prix as article_prix,
          a.description as article_description
        FROM stocks s
        LEFT JOIN articles a ON s.article_id = a.id
        WHERE s.quantite <= ? AND s.quantite >= 0
        ORDER BY s.quantite ASC, s.article_id
      `;

      this.mysqlConnector.query(sql, [seuil], (error, results) => {
        if (error) {
          console.error("Erreur lors de la récupération des alertes:", error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Vérifier la structure de la table stocks (utile pour debug)
   */
  obtenirStructureTable(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `DESCRIBE stocks`;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération de la structure:",
            error
          );
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
}
