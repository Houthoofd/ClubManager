/**
 * Repository de VALIDATION pour le module Commandes
 * Responsabilité: Opérations de validation et vérification uniquement
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';
import { toInt, toNumber } from '../utils/index.js';

/**
 * Repository pour les opérations de validation sur les commandes
 */
export class CommandesValidationRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Vérifier si une commande existe
   */
  async exists(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_EXISTS,
        [commandeId],
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
   * Vérifier si un utilisateur existe
   */
  async userExists(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXISTS,
        [utilisateurId],
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
   * Vérifier si un payment_intent_id existe déjà
   */
  async paymentIntentExists(paymentIntentId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PAYMENT_INTENT_EXISTS,
        [paymentIntentId],
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
   * Vérifier si un utilisateur a une commande en cours
   */
  async userHasPendingCommande(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_HAS_PENDING_COMMANDE,
        [utilisateurId],
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
   * Obtenir le statut d'une commande
   */
  async getCommandeStatut(commandeId: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_STATUT,
        [commandeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].statut);
          }
        }
      );
    });
  }

  /**
   * Vérifier si une commande peut être annulée
   */
  async canBeCancelled(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_CAN_BE_CANCELLED,
        [commandeId],
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
   * Vérifier si une commande peut être modifiée
   */
  async canBeModified(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_CAN_BE_MODIFIED,
        [commandeId],
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
   * Vérifier si une commande peut être remboursée
   */
  async canBeRefunded(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_CAN_BE_REFUNDED,
        [commandeId],
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
   * Compter les commandes récentes d'un utilisateur
   */
  async countRecentUserCommandes(utilisateurId: number, minutes: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_RECENT_USER_COMMANDES,
        [utilisateurId, minutes],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(toInt(results[0].count));
          }
        }
      );
    });
  }

  /**
   * Calculer le total des commandes récentes d'un utilisateur
   */
  async sumRecentUserCommandesTotal(utilisateurId: number, minutes: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SUM_RECENT_USER_COMMANDES_TOTAL,
        [utilisateurId, minutes],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(toNumber(results[0].total || 0));
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur dépasse la limite de commandes
   */
  async userExceedsOrderLimit(
    utilisateurId: number,
    hours: number,
    limit: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXCEEDS_ORDER_LIMIT,
        [utilisateurId, hours, limit],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.length > 0 && toInt(results[0].count) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur a trop de commandes annulées
   */
  async userHasTooManyCancelled(
    utilisateurId: number,
    days: number,
    tauxMax: number
  ): Promise<{ hasTooMany: boolean; stats: any }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_HAS_TOO_MANY_CANCELLED,
        [utilisateurId, days, tauxMax],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const hasTooMany = results.length > 0;
            const stats = hasTooMany
              ? {
                  total_commandes: toInt(results[0].total_commandes),
                  commandes_annulees: toInt(results[0].commandes_annulees),
                  taux_annulation: toNumber(results[0].taux_annulation),
                }
              : null;
            resolve({ hasTooMany, stats });
          }
        }
      );
    });
  }

  /**
   * Détecter les tentatives de commandes multiples avec le même payment_intent
   */
  async checkDuplicatePaymentIntent(
    paymentIntentId: string
  ): Promise<{ hasDuplicate: boolean; commandeIds: string[] }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_DUPLICATE_PAYMENT_INTENT,
        [paymentIntentId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const hasDuplicate = results.length > 0 && toInt(results[0].count) > 1;
            const commandeIds = hasDuplicate
              ? results[0].commande_ids.split(',')
              : [];
            resolve({ hasDuplicate, commandeIds });
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur peut commander
   */
  async userCanOrder(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_CAN_ORDER,
        [utilisateurId],
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
   * Vérifier la cohérence du total d'une commande
   */
  async checkCommandeTotalConsistency(
    commandeId: string
  ): Promise<{ isConsistent: boolean; details?: any }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_TOTAL_CONSISTENCY,
        [commandeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const isConsistent = results.length === 0;
            const details = results.length > 0
              ? {
                  commande_id: results[0].commande_id,
                  total_enregistre: toNumber(results[0].total_enregistre),
                  total_calcule: toNumber(results[0].total_calcule),
                  difference: Math.abs(
                    toNumber(results[0].total_enregistre) - toNumber(results[0].total_calcule)
                  ),
                }
              : undefined;
            resolve({ isConsistent, details });
          }
        }
      );
    });
  }

  /**
   * Vérifier si une commande a des articles
   */
  async commandeHasArticles(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_HAS_ARTICLES,
        [commandeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            // Si la requête ne retourne rien, c'est que la commande a des articles
            resolve(results.length === 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un statut est valide
   */
  checkValidStatut(statut: string): boolean {
    return queries.CHECK_VALID_STATUT(statut);
  }

  /**
   * Vérifier si une transition de statut est valide
   */
  isValidStatusTransition(currentStatut: string, newStatut: string): boolean {
    return queries.isValidStatusTransition(currentStatut, newStatut);
  }

  /**
   * Vérifier si un statut est final
   */
  isFinalStatus(statut: string): boolean {
    return queries.isFinalStatus(statut);
  }

  /**
   * Vérifier si une commande est trop ancienne
   */
  async isCommandeTooOld(commandeId: string, hours: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_TOO_OLD,
        [commandeId, hours],
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
   * Vérifier si une commande est expirée
   */
  async isCommandeExpired(commandeId: string, hours: number = 24): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COMMANDE_EXPIRED,
        [commandeId, hours],
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
   * Obtenir les commandes expirées
   */
  async getExpiredCommandes(hours: number, limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_EXPIRED_COMMANDES,
        [hours, limit],
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
   * Vérifier si un montant est valide
   */
  checkValidMontant(montant: number): boolean {
    return queries.CHECK_VALID_MONTANT(montant);
  }

  /**
   * Vérifier si un montant est suspect
   */
  checkSuspiciousMontant(montant: number): boolean {
    return queries.CHECK_SUSPICIOUS_MONTANT(montant);
  }

  /**
   * Obtenir le montant moyen des commandes d'un utilisateur
   */
  async getUserAverageOrderAmount(utilisateurId: number, days: number = 90): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_AVERAGE_ORDER_AMOUNT,
        [utilisateurId, days],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(toNumber(results[0]?.montant_moyen || 0));
          }
        }
      );
    });
  }

  /**
   * Vérifier si un montant dévie trop de la moyenne
   */
  async checkMontantDeviation(
    utilisateurId: number,
    montant: number,
    days: number = 90
  ): Promise<{ hasDeviation: boolean; stats?: any }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MONTANT_DEVIATION,
        [montant, montant, utilisateurId, days],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const hasDeviation = results.length > 0;
            const stats = hasDeviation
              ? {
                  montant_actuel: toNumber(results[0].montant_actuel),
                  montant_moyen: toNumber(results[0].montant_moyen),
                  ecart_type: toNumber(results[0].ecart_type),
                  z_score: toNumber(results[0].z_score),
                }
              : undefined;
            resolve({ hasDeviation, stats });
          }
        }
      );
    });
  }

  /**
   * Vérifier l'intégrité référentielle
   */
  async checkReferentialIntegrity(commandeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_REFERENTIAL_INTEGRITY,
        [commandeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            // Si la requête retourne un résultat, il y a un problème d'intégrité
            resolve(results.length === 0);
          }
        }
      );
    });
  }

  /**
   * Obtenir les commandes orphelines
   */
  async getOrphanedCommandes(limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ORPHANED_COMMANDES,
        [limit],
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
   * Vérifier les doublons potentiels
   */
  async checkPotentialDuplicates(
    commandeId: string
  ): Promise<{ hasDuplicates: boolean; duplicates: any[] }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_POTENTIAL_DUPLICATES,
        [commandeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              hasDuplicates: results.length > 0,
              duplicates: results,
            });
          }
        }
      );
    });
  }
}
