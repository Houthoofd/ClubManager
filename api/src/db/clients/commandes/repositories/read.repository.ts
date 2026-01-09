/**
 * Repository de LECTURE pour le module Commandes
 * Responsabilité: Opérations de lecture uniquement (SELECT)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Commande,
  CommandeRow,
} from '../types.js';
import * as queries from '../queries/index.js';
import {
  parseCommandeRow,
  parseCommandeRows,
} from '../utils/index.js';

/**
 * Repository pour les opérations de lecture sur les commandes
 */
export class CommandesReadRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Récupérer toutes les commandes avec informations utilisateur
   */
  async findAll(): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_COMMANDES,
        [],
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
   * Récupérer une commande par son ID
   */
  async findById(commandeId: string): Promise<Commande | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDE_BY_ID,
        [commandeId],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseCommandeRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async findByUserId(utilisateurId: number): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDES_BY_USER_ID,
        [utilisateurId],
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
   * Récupérer les commandes par statut
   */
  async findByStatut(statut: string): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDES_BY_STATUT,
        [statut],
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
   * Récupérer une commande par payment_intent_id
   */
  async findByPaymentIntent(paymentIntentId: string): Promise<Commande | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDE_BY_PAYMENT_INTENT,
        [paymentIntentId],
        (error, results: CommandeRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseCommandeRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer les commandes récentes d'un utilisateur
   */
  async getRecentUserCommandes(utilisateurId: number, minutes: number = 30): Promise<Commande[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_RECENT_USER_COMMANDES,
        [utilisateurId, minutes],
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
}
