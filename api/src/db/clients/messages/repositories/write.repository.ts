/**
 * Repository d'ÉCRITURE pour le module Messages
 * Responsabilité: Opérations d'écriture (INSERT, UPDATE, DELETE)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  CreateTypeMessageData,
  UpdateTypeMessageData,
  SendMessagePersonnaliseData,
  SaveMessageData,
  UpdateMessageStatusData,
} from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations d'écriture sur les messages
 */
export class MessagesWriteRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // TYPES DE MESSAGES PERSONNALISÉS
  // ============================================================================

  /**
   * Créer un nouveau type de message
   */
  async createTypeMessage(data: CreateTypeMessageData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_TYPE_MESSAGE,
        [data.nom_type, data.description || null, data.actif !== false ? 1 : 0],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour un type de message
   */
  async updateTypeMessage(typeId: number, data: UpdateTypeMessageData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_TYPE_MESSAGE,
        [data.nom_type, data.description || null, data.actif !== false ? 1 : 0, typeId],
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
   * Supprimer un type de message
   */
  async deleteTypeMessage(typeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.DELETE_TYPE_MESSAGE, [typeId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Désactiver un type de message
   */
  async deactivateTypeMessage(typeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DEACTIVATE_TYPE_MESSAGE,
        [typeId],
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
   * Réactiver un type de message
   */
  async reactivateTypeMessage(typeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.REACTIVATE_TYPE_MESSAGE,
        [typeId],
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

  // ============================================================================
  // MESSAGES PERSONNALISÉS
  // ============================================================================

  /**
   * Envoyer un message personnalisé
   */
  async sendMessagePersonnalise(data: SendMessagePersonnaliseData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_MESSAGE_PERSONNALISE,
        [
          data.titre,
          data.contenu,
          data.type_id,
          data.expediteur_id,
          data.destinataire_id,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  /**
   * Marquer un message comme lu
   */
  async marquerMessageCommeLu(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.MARK_MESSAGE_AS_READ,
        [messageId],
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
   * Marquer un message comme non lu
   */
  async marquerMessageCommeNonLu(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.MARK_MESSAGE_AS_UNREAD,
        [messageId],
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
   * Supprimer un message reçu (soft delete)
   */
  async supprimerMessageRecu(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.SOFT_DELETE_MESSAGE, [messageId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Restaurer un message supprimé
   */
  async restaurerMessage(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.RESTORE_MESSAGE, [messageId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Supprimer définitivement un message
   */
  async supprimerDefinitivementMessage(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_MESSAGE_PERMANENTLY,
        [messageId],
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
   * Désactiver un message
   */
  async desactiverMessage(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.DEACTIVATE_MESSAGE, [messageId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  /**
   * Réactiver un message
   */
  async reactiverMessage(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.REACTIVATE_MESSAGE, [messageId], (error, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows > 0);
        }
      });
    });
  }

  // ============================================================================
  // HISTORIQUE DES MESSAGES (EMAILS)
  // ============================================================================

  /**
   * Sauvegarder un message dans l'historique
   */
  async saveMessageToDatabase(data: SaveMessageData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_MESSAGE_HISTORIQUE,
        [
          data.utilisateur_id,
          data.type_message,
          data.contenu,
          data.status_envoi,
          data.email_recipient,
          data.message_id || null,
          data.error_message || null,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le statut d'un message dans l'historique
   */
  async updateMessageStatus(data: UpdateMessageStatusData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_MESSAGE_STATUS,
        [data.status, data.emailMessageId || null, data.errorMessage || null, data.messageId],
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
   * Supprimer un message de l'historique
   */
  async deleteMessageHistorique(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_MESSAGE_HISTORIQUE,
        [messageId],
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

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  /**
   * Créer un nouveau template d'email
   */
  async createEmailTemplate(
    nomTemplate: string,
    sujet: string,
    contenuHtml: string,
    contenuTexte?: string,
    variablesDisponibles?: string,
    actif: boolean = true
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_EMAIL_TEMPLATE,
        [
          nomTemplate,
          sujet,
          contenuHtml,
          contenuTexte || null,
          variablesDisponibles || null,
          actif ? 1 : 0,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  /**
   * Mettre à jour un template d'email
   */
  async updateEmailTemplate(
    templateId: number,
    nomTemplate: string,
    sujet: string,
    contenuHtml: string,
    contenuTexte?: string,
    variablesDisponibles?: string,
    actif: boolean = true
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_EMAIL_TEMPLATE,
        [
          nomTemplate,
          sujet,
          contenuHtml,
          contenuTexte || null,
          variablesDisponibles || null,
          actif ? 1 : 0,
          templateId,
        ],
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
   * Supprimer un template d'email
   */
  async deleteEmailTemplate(templateId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_EMAIL_TEMPLATE,
        [templateId],
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
   * Désactiver un template d'email
   */
  async deactivateEmailTemplate(templateId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DEACTIVATE_EMAIL_TEMPLATE,
        [templateId],
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
   * Réactiver un template d'email
   */
  async reactivateEmailTemplate(templateId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.REACTIVATE_EMAIL_TEMPLATE,
        [templateId],
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
}
