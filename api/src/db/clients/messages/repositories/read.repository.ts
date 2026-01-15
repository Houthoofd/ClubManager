/**
 * Repository de LECTURE pour le module Messages
 * Responsabilité: Opérations de lecture uniquement (SELECT)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  TypeMessagePersonnalise,
  TypeMessagePersonnaliseRow,
  MessagePersonnalise,
  MessagePersonnaliseRow,
  MessagePersonnaliseAvecDetails,
  MessagePersonnaliseAvecDetailsRow,
  HistoriqueMessage,
  HistoriqueMessageRow,
  EmailTemplate,
  EmailTemplateRow,
  MessageStatistiques,
  StatistiquesSuppressions,
} from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de lecture sur les messages
 */
export class MessagesReadRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // TYPES DE MESSAGES PERSONNALISÉS
  // ============================================================================

  /**
   * Récupérer tous les types de messages actifs
   */
  async getAllTypesMessages(): Promise<TypeMessagePersonnalise[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_TYPES_MESSAGES,
        [],
        (error, results: TypeMessagePersonnaliseRow[]) => {
          if (error) {
            reject(error);
          } else {
            const types = results.map(this.parseTypeMessageRow);
            resolve(types);
          }
        }
      );
    });
  }

  /**
   * Récupérer un type de message par ID
   */
  async getTypeMessageById(typeId: number): Promise<TypeMessagePersonnalise | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TYPE_MESSAGE_BY_ID,
        [typeId],
        (error, results: TypeMessagePersonnaliseRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseTypeMessageRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un type de message par nom
   */
  async getTypeMessageByName(nomType: string): Promise<TypeMessagePersonnalise | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TYPE_MESSAGE_BY_NAME,
        [nomType],
        (error, results: TypeMessagePersonnaliseRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseTypeMessageRow(results[0]));
          }
        }
      );
    });
  }

  // ============================================================================
  // MESSAGES PERSONNALISÉS
  // ============================================================================

  /**
   * Récupérer les messages reçus par un utilisateur
   */
  async getMessagesRecusParUtilisateur(
    utilisateurId: number
  ): Promise<MessagePersonnaliseAvecDetails[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGES_RECUS_PAR_UTILISATEUR,
        [utilisateurId],
        (error, results: MessagePersonnaliseAvecDetailsRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = results.map(this.parseMessageAvecDetailsRow);
            resolve(messages);
          }
        }
      );
    });
  }

  /**
   * Récupérer un message personnalisé par ID
   */
  async getMessageById(messageId: number): Promise<MessagePersonnalise | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGE_PERSONNALISE_BY_ID,
        [messageId],
        (error, results: MessagePersonnaliseRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseMessageRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un message avec détails complets
   */
  async getMessageWithDetails(messageId: number): Promise<MessagePersonnaliseAvecDetails | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGE_WITH_DETAILS,
        [messageId],
        (error, results: MessagePersonnaliseAvecDetailsRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseMessageAvecDetailsRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Compter les messages non lus d'un utilisateur
   */
  async compterMessagesNonLus(utilisateurId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_MESSAGES_NON_LUS,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        }
      );
    });
  }

  /**
   * Récupérer les messages inactifs
   */
  async getMessagesInactifs(): Promise<MessagePersonnalise[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGES_INACTIFS,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = results.map((row) => ({
              id: row.id,
              titre: row.titre,
              contenu: row.contenu,
              type_id: row.type_id,
              expediteur_id: row.expediteur_id,
              destinataire_id: row.destinataire_id,
              lu: Boolean(row.lu),
              supprime: Boolean(row.supprime),
              created_at: row.created_at,
              updated_at: row.updated_at,
            }));
            resolve(messages);
          }
        }
      );
    });
  }

  /**
   * Récupérer les messages supprimés
   */
  async getMessagesSupprimes(): Promise<MessagePersonnaliseAvecDetails[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGES_SUPPRIMES,
        [],
        (error, results: MessagePersonnaliseAvecDetailsRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = results.map(this.parseMessageAvecDetailsRow);
            resolve(messages);
          }
        }
      );
    });
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  /**
   * Obtenir les statistiques des messages
   */
  async getStatistiquesMessages(): Promise<MessageStatistiques> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATISTIQUES_MESSAGES,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const stats = results[0] || {};
            resolve({
              total: stats.total || 0,
              envoyes: stats.envoyes || 0,
              lus: stats.lus || 0,
              non_lus: stats.non_lus || 0,
              supprimes: stats.supprimes || 0,
            });
          }
        }
      );
    });
  }

  /**
   * Obtenir les statistiques de suppression
   */
  async getStatistiquesSuppressions(): Promise<StatistiquesSuppressions> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATISTIQUES_SUPPRESSIONS,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const stats = results[0] || {};
            resolve({
              total_supprimes: stats.total_supprimes || 0,
              derniere_suppression: stats.derniere_suppression || null,
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // HISTORIQUE DES MESSAGES (EMAILS)
  // ============================================================================

  /**
   * Récupérer l'historique des messages d'un utilisateur
   */
  async getMessageHistory(
    utilisateurId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<HistoriqueMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_MESSAGE_HISTORY,
        [utilisateurId, limit, offset],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = results.map(this.parseHistoriqueMessageRow);
            resolve(messages);
          }
        }
      );
    });
  }

  /**
   * Récupérer un message de l'historique par ID
   */
  async getHistoriqueMessageById(messageId: number): Promise<HistoriqueMessage | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_MESSAGE_BY_ID,
        [messageId],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseHistoriqueMessageRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer l'historique par type de message
   */
  async getHistoriqueByType(
    typeMessage: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<HistoriqueMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_BY_TYPE,
        [typeMessage, limit, offset],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = results.map(this.parseHistoriqueMessageRow);
            resolve(messages);
          }
        }
      );
    });
  }

  /**
   * Récupérer l'historique par status
   */
  async getHistoriqueByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<HistoriqueMessage[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_HISTORIQUE_BY_STATUS,
        [status, limit, offset],
        (error, results: HistoriqueMessageRow[]) => {
          if (error) {
            reject(error);
          } else {
            const messages = results.map(this.parseHistoriqueMessageRow);
            resolve(messages);
          }
        }
      );
    });
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  /**
   * Récupérer tous les templates actifs
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_TEMPLATES,
        [],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else {
            const templates = results.map(this.parseEmailTemplateRow);
            resolve(templates);
          }
        }
      );
    });
  }

  /**
   * Récupérer un template par nom
   */
  async getTemplateByName(nomTemplate: string): Promise<EmailTemplate | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TEMPLATE_BY_NAME,
        [nomTemplate],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseEmailTemplateRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer un template par ID
   */
  async getTemplateById(templateId: number): Promise<EmailTemplate | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TEMPLATE_BY_ID,
        [templateId],
        (error, results: EmailTemplateRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(this.parseEmailTemplateRow(results[0]));
          }
        }
      );
    });
  }

  // ============================================================================
  // UTILISATEURS (pour emails)
  // ============================================================================

  /**
   * Récupérer les emails des destinataires
   */
  async getEmailsDestinataires(utilisateursIds: number[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (utilisateursIds.length === 0) {
        resolve([]);
        return;
      }

      this.mysqlConnector.query(
        queries.SELECT_EMAILS_DESTINATAIRES,
        [utilisateursIds],
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
   * Récupérer un utilisateur avec email
   */
  async getUtilisateurWithEmail(utilisateurId: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_UTILISATEUR_WITH_EMAIL,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        }
      );
    });
  }

  // ============================================================================
  // HELPERS PRIVÉS - PARSING
  // ============================================================================

  /**
   * Parser une row de type message personnalisé
   */
  private parseTypeMessageRow(row: TypeMessagePersonnaliseRow): TypeMessagePersonnalise {
    return {
      id: row.id,
      nom_type: row.nom_type,
      description: row.description,
      actif: Boolean(row.actif),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Parser une row de message personnalisé
   */
  private parseMessageRow(row: MessagePersonnaliseRow): MessagePersonnalise {
    return {
      id: row.id,
      titre: row.titre,
      contenu: row.contenu,
      type_id: row.type_id,
      expediteur_id: row.expediteur_id,
      destinataire_id: row.destinataire_id,
      lu: Boolean(row.lu),
      supprime: Boolean(row.supprime),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Parser une row de message avec détails
   */
  private parseMessageAvecDetailsRow(
    row: MessagePersonnaliseAvecDetailsRow
  ): MessagePersonnaliseAvecDetails {
    return {
      id: row.id,
      titre: row.titre,
      contenu: row.contenu,
      type_nom: row.type_nom,
      expediteur_nom: row.expediteur_nom,
      expediteur_prenom: row.expediteur_prenom,
      destinataire_nom: row.destinataire_nom,
      destinataire_prenom: row.destinataire_prenom,
      lu: Boolean(row.lu),
      supprime: Boolean(row.supprime),
      created_at: row.created_at,
    };
  }

  /**
   * Parser une row d'historique de message
   */
  private parseHistoriqueMessageRow(row: HistoriqueMessageRow): HistoriqueMessage {
    return {
      id: row.id,
      utilisateur_id: row.utilisateur_id,
      type_message: row.type_message,
      contenu: row.contenu,
      status_envoi: row.status_envoi as 'pending' | 'sent' | 'failed',
      email_recipient: row.email_recipient,
      message_id: row.message_id,
      error_message: row.error_message,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Parser une row de template d'email
   */
  private parseEmailTemplateRow(row: EmailTemplateRow): EmailTemplate {
    return {
      id: row.id,
      nom_template: row.nom_template,
      sujet: row.sujet,
      contenu_html: row.contenu_html,
      contenu_texte: row.contenu_texte,
      variables_disponibles: row.variables_disponibles,
      actif: Boolean(row.actif),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
