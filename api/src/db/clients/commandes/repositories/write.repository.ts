/**
 * Repository d'ÉCRITURE pour le module Commandes
 * Responsabilité: Opérations d'écriture uniquement (INSERT, UPDATE, DELETE)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  CreateCommandeData,
  UpdateCommandeData,
} from '../types.js';
import * as queries from '../queries/index.js';
import { stringifyArticles } from '../utils/index.js';

/**
 * Repository pour les opérations d'écriture sur les commandes
 */
export class CommandesWriteRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Créer une nouvelle commande
   */
  async create(data: CreateCommandeData): Promise<string> {
    return new Promise((resolve, reject) => {
      const articlesJson = stringifyArticles(data.articles);

      const values = [
        data.commande_id,
        data.utilisateur_id,
        data.statut || 'en_attente',
        data.total,
        articlesJson,
        data.payment_intent_id || null,
      ];

      this.mysqlConnector.query(queries.INSERT_COMMANDE, values, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.commande_id);
        }
      });
    });
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatut(commandeId: string, nouveauStatut: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COMMANDE_STATUT,
        [nouveauStatut, commandeId],
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
   * Mettre à jour le total d'une commande
   */
  async updateTotal(commandeId: string, nouveauTotal: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COMMANDE_TOTAL,
        [nouveauTotal, commandeId],
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
   * Mettre à jour les articles d'une commande
   */
  async updateArticles(commandeId: string, articles: any[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const articlesJson = stringifyArticles(articles);

      this.mysqlConnector.query(
        queries.UPDATE_COMMANDE_ARTICLES,
        [articlesJson, commandeId],
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
   * Mettre à jour le payment_intent_id d'une commande
   */
  async updatePaymentIntent(commandeId: string, paymentIntentId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COMMANDE_PAYMENT_INTENT,
        [paymentIntentId, commandeId],
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
   * Mettre à jour une commande (mise à jour dynamique)
   */
  async update(commandeId: string, data: UpdateCommandeData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.statut !== undefined) {
        updates.push('statut = ?');
        values.push(data.statut);
      }

      if (data.total !== undefined) {
        updates.push('total = ?');
        values.push(data.total);
      }

      if (data.articles !== undefined) {
        updates.push('articles = ?');
        values.push(stringifyArticles(data.articles));
      }

      if (data.payment_intent_id !== undefined) {
        updates.push('payment_intent_id = ?');
        values.push(data.payment_intent_id);
      }

      if (updates.length === 0) {
        resolve(false);
        return;
      }

      values.push(commandeId);
      const sql = queries.buildUpdateCommandeQuery(updates);

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
   * Supprimer une commande
   */
  async delete(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COMMANDE,
        [commandeId],
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
   * Supprimer les commandes d'un utilisateur (utiliser avec précaution)
   */
  async deleteByUser(utilisateurId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COMMANDES_BY_USER,
        [utilisateurId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        }
      );
    });
  }

  /**
   * Supprimer les commandes annulées anciennes (nettoyage)
   */
  async deleteOldCancelled(days: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_OLD_CANCELLED_COMMANDES,
        [days],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        }
      );
    });
  }
}
