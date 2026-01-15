/**
 * Repository de VALIDATION pour le module Messages
 * Responsabilité: Opérations de validation et vérification
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de validation sur les messages
 */
export class MessagesValidationRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // VALIDATION DES TYPES DE MESSAGES
  // ============================================================================

  /**
   * Vérifier si un type de message existe par ID
   */
  async typeMessageExists(typeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_EXISTS,
        [typeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un type de message existe par nom
   */
  async typeMessageExistsByName(nomType: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_EXISTS_BY_NAME,
        [nomType],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un type de message est actif
   */
  async typeMessageIsActive(typeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_IS_ACTIVE,
        [typeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.actif === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un type de message a des messages associés
   */
  async typeMessageHasMessages(typeId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_HAS_MESSAGES,
        [typeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATION DES MESSAGES PERSONNALISÉS
  // ============================================================================

  /**
   * Vérifier si un message existe
   */
  async messageExists(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MESSAGE_EXISTS,
        [messageId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un message appartient à un utilisateur
   */
  async messageBelongsToUser(messageId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MESSAGE_BELONGS_TO_USER,
        [messageId, utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un message est déjà lu
   */
  async messageIsRead(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MESSAGE_IS_READ,
        [messageId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.lu === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un message est supprimé
   */
  async messageIsDeleted(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MESSAGE_IS_DELETED,
        [messageId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.supprime === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si l'utilisateur peut envoyer un message
   */
  async userCanSendMessage(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_CAN_SEND_MESSAGE,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si l'utilisateur peut recevoir un message
   */
  async userCanReceiveMessage(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_CAN_RECEIVE_MESSAGE,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATION DES UTILISATEURS
  // ============================================================================

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
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur a un email valide
   */
  async userHasValidEmail(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_HAS_VALID_EMAIL,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un email existe
   */
  async emailExists(email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_EXISTS,
        [email],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur est actif
   */
  async userIsActive(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_IS_ACTIVE,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATION DE L'HISTORIQUE
  // ============================================================================

  /**
   * Vérifier si un message d'historique existe
   */
  async historiqueMessageExists(messageId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HISTORIQUE_MESSAGE_EXISTS,
        [messageId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un message d'historique appartient à un utilisateur
   */
  async historiqueBelongsToUser(messageId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HISTORIQUE_BELONGS_TO_USER,
        [messageId, utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier le statut d'un message d'historique
   */
  async getHistoriqueMessageStatus(messageId: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HISTORIQUE_MESSAGE_STATUS,
        [messageId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.status_envoi || null);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATION DES TEMPLATES
  // ============================================================================

  /**
   * Vérifier si un template existe par ID
   */
  async templateExists(templateId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TEMPLATE_EXISTS,
        [templateId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un template existe par nom
   */
  async templateExistsByName(nomTemplate: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TEMPLATE_EXISTS_BY_NAME,
        [nomTemplate],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un template est actif
   */
  async templateIsActive(templateId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TEMPLATE_IS_ACTIVE,
        [templateId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.actif === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un template est actif par nom
   */
  async templateIsActiveByName(nomTemplate: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TEMPLATE_IS_ACTIVE_BY_NAME,
        [nomTemplate],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.actif === 1);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATION DES ÉCHEANCES (pour rappels de paiement)
  // ============================================================================

  /**
   * Vérifier si une échéance existe
   */
  async echeanceExists(echeanceId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ECHEANCE_EXISTS,
        [echeanceId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si des échéances existent
   */
  async echeancesExist(echeanceIds: number[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (echeanceIds.length === 0) {
        resolve(false);
        return;
      }

      this.mysqlConnector.query(
        queries.CHECK_ECHEANCES_EXIST,
        [echeanceIds],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count === echeanceIds.length);
          }
        }
      );
    });
  }

  /**
   * Vérifier si une échéance appartient à un utilisateur
   */
  async echeanceBelongsToUser(echeanceId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ECHEANCE_BELONGS_TO_USER,
        [echeanceId, utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        }
      );
    });
  }

  /**
   * Récupérer l'utilisateur d'une échéance
   */
  async getUserFromEcheance(echeanceId: number): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GET_USER_FROM_ECHEANCE,
        [echeanceId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.user_id || null);
          }
        }
      );
    });
  }
}
