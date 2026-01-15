/**
 * Repository pour les opérations de lecture de la Messagerie
 * Responsabilité: Récupération de données sans modification
 */

import MysqlConnector from "../../../connector/mysqlconnector.js";
import type {
  TypeMessage,
  TypeMessageRow,
  MessageAvecExpediteur,
  MessagePersonnalise,
  MessagePersonnaliseRow,
  UtilisateurMessagerie,
  UtilisateurRow,
  EmailTemplate,
  EmailTemplateRow,
  HistoriqueMessage,
  HistoriqueMessageRow,
  StatistiquesMessagerie,
  MessageParJour,
} from "../types.js";
import * as queries from "../queries/index.js";

/**
 * Repository pour les opérations de lecture
 */
export class ReadRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES TYPES DE MESSAGES
  // ==========================================================================

  /**
   * Récupérer tous les types de messages
   */
  async getAllTypesMessages(): Promise<TypeMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_TYPES_MESSAGES,
        [],
        (error, results: TypeMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(Array.isArray(results) ? results : []);
          }
        },
      );
    });
  }

  /**
   * Récupérer un type de message par son ID
   */
  async getTypeMessageById(id: number): Promise<TypeMessage | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TYPE_MESSAGE_BY_ID,
        [id],
        (error, results: TypeMessageRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        },
      );
    });
  }

  /**
   * Récupérer un type de message par son titre
   */
  async getTypeMessageByTitle(title: string): Promise<TypeMessage | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TYPE_MESSAGE_BY_TITLE,
        [title],
        (error, results: TypeMessageRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES MESSAGES PERSONNALISÉS
  // ==========================================================================

  /**
   * Récupérer les messages reçus d'un utilisateur
   */
  async getMessagesRecus(userId: string): Promise<MessageAvecExpediteur[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Convertir userId en id numérique si nécessaire
        let userIdNum = userId;

        if (isNaN(Number(userId))) {
          const numericId = await this.getUserIdFromUserId(userId);
          if (!numericId) {
            throw new Error("Utilisateur non trouvé");
          }
          userIdNum = numericId.toString();
        }

        this.mysqlConnector.query(
          queries.SELECT_MESSAGES_BY_USER,
          [userIdNum],
          (error, results: any[]) => {
            if (error) {
              reject(error);
            } else {
              resolve(Array.isArray(results) ? results : []);
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Récupérer un message personnalisé par son ID
   */
  async getMessageById(id: number): Promise<MessagePersonnalise | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGE_BY_ID,
        [id],
        (error, results: MessagePersonnaliseRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        },
      );
    });
  }

  /**
   * Récupérer les messages non lus d'un utilisateur
   */
  async getMessagesNonLus(userId: number): Promise<MessageAvecExpediteur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGES_NON_LUS,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(Array.isArray(results) ? results : []);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES UTILISATEURS
  // ==========================================================================

  /**
   * Récupérer l'ID numérique d'un utilisateur à partir de son userId
   */
  async getUserIdFromUserId(userId: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_ID_FROM_USERID,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        },
      );
    });
  }

  /**
   * Récupérer tous les utilisateurs actifs
   */
  async getAllUsers(): Promise<UtilisateurMessagerie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_ACTIVE_USERS,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(Array.isArray(results) ? results : []);
          }
        },
      );
    });
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUserById(id: number): Promise<UtilisateurMessagerie | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_ID,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        },
      );
    });
  }

  /**
   * Récupérer un utilisateur par son email
   */
  async getUserByEmail(email: string): Promise<UtilisateurMessagerie | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_USER_BY_EMAIL,
        [email],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES TEMPLATES D'EMAIL
  // ==========================================================================

  /**
   * Récupérer tous les templates d'email
   */
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_EMAIL_TEMPLATES,
        [],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else {
            const templates = Array.isArray(results) ? results : [];
            resolve(
              templates.map((t) => ({
                ...t,
                active: Boolean(t.active),
              })),
            );
          }
        },
      );
    });
  }

  /**
   * Récupérer un template d'email par son ID
   */
  async getEmailTemplateById(id: number): Promise<EmailTemplate | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_EMAIL_TEMPLATE_BY_ID,
        [id],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const template = results[0];
            resolve({
              ...template,
              active: Boolean(template.active),
            });
          }
        },
      );
    });
  }

  /**
   * Récupérer un template d'email par son titre
   */
  async getEmailTemplateByTitle(title: string): Promise<EmailTemplate | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_EMAIL_TEMPLATE_BY_TITLE,
        [title],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const template = results[0];
            resolve({
              ...template,
              active: Boolean(template.active),
            });
          }
        },
      );
    });
  }

  /**
   * Récupérer les templates actifs
   */
  async getActiveEmailTemplates(): Promise<EmailTemplate[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ACTIVE_EMAIL_TEMPLATES,
        [],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else {
            const templates = Array.isArray(results) ? results : [];
            resolve(
              templates.map((t) => ({
                ...t,
                active: Boolean(t.active),
              })),
            );
          }
        },
      );
    });
  }

  /**
   * Récupérer les templates par catégorie
   */
  async getEmailTemplatesByCategory(
    category: string,
  ): Promise<EmailTemplate[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_EMAIL_TEMPLATES_BY_CATEGORY,
        [category],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else {
            const templates = Array.isArray(results) ? results : [];
            resolve(
              templates.map((t) => ({
                ...t,
                active: Boolean(t.active),
              })),
            );
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE L'HISTORIQUE DES MESSAGES
  // ==========================================================================

  /**
   * Récupérer l'historique des messages
   */
  async getHistoriqueMessages(
    limit: number = 100,
  ): Promise<HistoriqueMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_MESSAGES,
        [limit],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = Array.isArray(results)
              ? results.map((r) => ({
                  ...r,
                  status: r.status as "pending" | "sent" | "failed",
                }))
              : [];
            resolve(messages);
          }
        },
      );
    });
  }

  /**
   * Récupérer l'historique des messages d'un utilisateur
   */
  async getHistoriqueMessagesByUser(
    userId: number,
    limit: number = 100,
  ): Promise<HistoriqueMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_MESSAGES_BY_USER,
        [userId, limit],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = Array.isArray(results)
              ? results.map((r) => ({
                  ...r,
                  status: r.status as "pending" | "sent" | "failed",
                }))
              : [];
            resolve(messages);
          }
        },
      );
    });
  }

  /**
   * Récupérer l'historique des messages par statut
   */
  async getHistoriqueMessagesByStatus(
    status: string,
    limit: number = 100,
  ): Promise<HistoriqueMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_MESSAGES_BY_STATUS,
        [status, limit],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = Array.isArray(results)
              ? results.map((r) => ({
                  ...r,
                  status: r.status as "pending" | "sent" | "failed",
                }))
              : [];
            resolve(messages);
          }
        },
      );
    });
  }

  /**
   * Récupérer un message de l'historique par son ID
   */
  async getHistoriqueMessageById(
    id: number,
  ): Promise<HistoriqueMessage | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_MESSAGE_BY_ID,
        [id],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const message = {
              ...results[0],
              status: results[0].status as "pending" | "sent" | "failed",
            };
            resolve(message);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques de la messagerie
   */
  async getStatistiquesMessages(
    userId?: number,
  ): Promise<StatistiquesMessagerie> {
    return new Promise(async (resolve, reject) => {
      try {
        // Nombre total de types de messages
        const totalTypes = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(
            queries.COUNT_TOTAL_TYPES_MESSAGES,
            [],
            (err, results: any[]) => {
              if (err) rej(err);
              else res(results[0]?.count || 0);
            },
          );
        });

        // Nombre total de messages envoyés
        const totalMessages = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(
            queries.COUNT_TOTAL_MESSAGES_ENVOYES,
            [],
            (err, results: any[]) => {
              if (err) rej(err);
              else res(results[0]?.count || 0);
            },
          );
        });

        // Messages par jour
        const messagesParJour = await new Promise<MessageParJour[]>(
          (res, rej) => {
            this.mysqlConnector.query(
              queries.SELECT_MESSAGES_PAR_JOUR,
              [],
              (err, results: any[]) => {
                if (err) rej(err);
                else res(Array.isArray(results) ? results : []);
              },
            );
          },
        );

        const stats: StatistiquesMessagerie = {
          totalTypesMessages: totalTypes,
          totalMessagesEnvoyes: totalMessages,
          messagesParJour: messagesParJour,
        };

        // Si userId spécifié, statistiques pour cet utilisateur
        if (userId) {
          const userMessages = await new Promise<number>((res, rej) => {
            this.mysqlConnector.query(
              queries.COUNT_MESSAGES_BY_USER,
              [userId],
              (err, results: any[]) => {
                if (err) rej(err);
                else res(results[0]?.count || 0);
              },
            );
          });
          stats.messagesUtilisateur = userMessages;
        }

        resolve(stats);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Obtenir le taux de succès d'envoi
   */
  async getTauxSucces(jours: number = 7): Promise<{
    succes: number;
    echecs: number;
    total: number;
    taux: number;
  }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TAUX_SUCCES,
        [jours],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve({ succes: 0, echecs: 0, total: 0, taux: 0 });
          } else {
            const data = results[0];
            const succes = data.succes || 0;
            const echecs = data.echecs || 0;
            const total = data.total || 0;
            const taux = total > 0 ? (succes / total) * 100 : 0;
            resolve({ succes, echecs, total, taux });
          }
        },
      );
    });
  }
}
