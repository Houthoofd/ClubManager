/**
 * Repository pour les opérations d'écriture de la Messagerie
 * Responsabilité: Création, modification et suppression de données
 */

import MysqlConnector from "../../../connector/mysqlconnector.js";
import type {
  CreateTypeMessageData,
  UpdateTypeMessageData,
  EnvoyerMessageData,
  EnvoyerMessagePersonnaliseData,
  SaveMessageData,
  CreateEmailTemplateData,
  UpdateEmailTemplateData,
  ConfirmationResult,
} from "../types.js";
import * as queries from "../queries/index.js";

/**
 * Repository pour les opérations d'écriture
 */
export class WriteRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DES TYPES DE MESSAGES
  // ==========================================================================

  /**
   * Créer un nouveau type de message
   */
  async createTypeMessage(data: CreateTypeMessageData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_TYPE_MESSAGE,
        [data.title, data.content],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        },
      );
    });
  }

  /**
   * Mettre à jour un type de message
   */
  async updateTypeMessage(
    id: number,
    data: UpdateTypeMessageData,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_TYPE_MESSAGE,
        [data.title, data.content, id],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Supprimer un type de message
   */
  async deleteTypeMessage(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_TYPE_MESSAGE,
        [id],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DES MESSAGES PERSONNALISÉS
  // ==========================================================================

  /**
   * Envoyer un message personnalisé à un utilisateur
   */
  async envoyerMessagePersonnalise(
    data: EnvoyerMessagePersonnaliseData,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_MESSAGE_PERSONNALISE,
        [data.destinataireId, data.contenu],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  /**
   * Envoyer des messages à plusieurs utilisateurs
   */
  async envoyerMessages(
    destinataires: number[],
    contenu: string,
  ): Promise<{ success: boolean; count: number; message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        let successCount = 0;

        for (const destinataireId of destinataires) {
          try {
            await new Promise<void>((res, rej) => {
              this.mysqlConnector.query(
                queries.INSERT_MESSAGE_PERSONNALISE,
                [destinataireId, contenu],
                (error) => {
                  if (error) rej(error);
                  else res();
                },
              );
            });
            successCount++;
          } catch (error) {
            console.error(
              `Erreur envoi message à utilisateur ${destinataireId}:`,
              error,
            );
          }
        }

        resolve({
          success: successCount > 0,
          count: successCount,
          message: `Message envoyé à ${successCount}/${destinataires.length} destinataire(s)`,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Marquer un message comme lu
   */
  async marquerMessageLu(messageId: number, userId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_MESSAGE_LU,
        [messageId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Supprimer un message reçu
   */
  async supprimerMessageRecu(
    messageId: number,
    userId?: number,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_MESSAGE_PERSONNALISE,
        [messageId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Supprimer tous les messages d'un utilisateur
   */
  async supprimerMessagesUtilisateur(userId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_MESSAGES_BY_USER,
        [userId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        },
      );
    });
  }

  /**
   * Nettoyer les anciens messages
   */
  async nettoyerAnciennesMessages(joursAConserver: number = 30): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_OLD_MESSAGES,
        [joursAConserver],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DES TEMPLATES D'EMAIL
  // ==========================================================================

  /**
   * Créer un nouveau template d'email
   */
  async createEmailTemplate(data: CreateEmailTemplateData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_EMAIL_TEMPLATE,
        [
          data.title,
          data.subject,
          data.content_text,
          data.content_html,
          data.variables || null,
          data.category || null,
          data.active !== false ? 1 : 0,
        ],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        },
      );
    });
  }

  /**
   * Mettre à jour un template d'email
   */
  async updateEmailTemplate(
    id: number,
    data: UpdateEmailTemplateData,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_EMAIL_TEMPLATE,
        [
          data.title,
          data.subject,
          data.content_text,
          data.content_html,
          data.variables || null,
          data.category || null,
          data.active !== false ? 1 : 0,
          id,
        ],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Activer/Désactiver un template d'email
   */
  async toggleEmailTemplateStatus(
    id: number,
    active: boolean,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_EMAIL_TEMPLATE_STATUS,
        [active ? 1 : 0, id],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Supprimer un template d'email
   */
  async deleteEmailTemplate(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_EMAIL_TEMPLATE,
        [id],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DE L'HISTORIQUE DES MESSAGES
  // ==========================================================================

  /**
   * Sauvegarder un message dans l'historique
   */
  async saveMessageToDb(data: SaveMessageData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_HISTORIQUE_MESSAGE,
        [
          data.utilisateur_id || null,
          data.type_message,
          data.sujet,
          data.contenu,
          data.recipients,
          data.status || "pending",
          data.error_message || null,
        ],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        },
      );
    });
  }

  /**
   * Mettre à jour le statut d'un message dans l'historique
   */
  async updateMessageStatus(
    messageId: number,
    status: "sent" | "failed",
    errorMessage?: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_HISTORIQUE_MESSAGE_STATUS,
        [status, errorMessage || null, status, messageId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Marquer un message comme envoyé
   */
  async markMessageAsSent(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_HISTORIQUE_MESSAGE_SENT,
        [messageId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Marquer un message comme échoué
   */
  async markMessageAsFailed(
    messageId: number,
    errorMessage: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_HISTORIQUE_MESSAGE_FAILED,
        [errorMessage, messageId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Supprimer un message de l'historique
   */
  async deleteHistoriqueMessage(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_HISTORIQUE_MESSAGE,
        [id],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        },
      );
    });
  }

  /**
   * Nettoyer les anciens messages de l'historique
   */
  async nettoyerHistoriqueAncien(joursAConserver: number = 90): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_OLD_HISTORIQUE_MESSAGES,
        [joursAConserver],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        },
      );
    });
  }

  /**
   * Nettoyer les messages en échec
   */
  async nettoyerMessagesEchec(joursAConserver: number = 30): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_FAILED_HISTORIQUE_MESSAGES,
        [joursAConserver],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE MAINTENANCE
  // ==========================================================================

  /**
   * Réinitialiser les messages bloqués en statut pending
   */
  async resetStuckMessages(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.RESET_STUCK_MESSAGES,
        [],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        },
      );
    });
  }
}
