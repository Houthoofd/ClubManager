/**
 * Repository pour les opérations de validation de la Messagerie
 * Responsabilité: Vérification de l'existence et de la validité des données
 */

import MysqlConnector from "../../../connector/mysqlconnector.js";
import * as queries from "../queries/index.js";

/**
 * Repository pour les opérations de validation
 */
export class ValidationRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DES TYPES DE MESSAGES
  // ==========================================================================

  /**
   * Vérifier si un type de message existe
   */
  async typeMessageExists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_EXISTS,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un type de message existe par titre
   */
  async typeMessageExistsByTitle(title: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_EXISTS_BY_TITLE,
        [title],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un type de message existe (excluant un ID)
   */
  async typeMessageExistsByTitleExcludeId(
    title: string,
    excludeId: number,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_TYPE_MESSAGE_EXISTS_BY_TITLE_EXCLUDE_ID,
        [title, excludeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DES MESSAGES PERSONNALISÉS
  // ==========================================================================

  /**
   * Vérifier si un message existe
   */
  async messageExists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MESSAGE_EXISTS,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un message appartient à un utilisateur
   */
  async messageBelongsToUser(messageId: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_MESSAGE_BELONGS_TO_USER,
        [messageId, userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un utilisateur a des messages
   */
  async userHasMessages(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_HAS_MESSAGES,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DES UTILISATEURS
  // ==========================================================================

  /**
   * Vérifier si un utilisateur existe par ID
   */
  async userExists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXISTS,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un utilisateur existe par userId
   */
  async userExistsByUserId(userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXISTS_BY_USERID,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un utilisateur existe par email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXISTS_BY_EMAIL,
        [email],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un utilisateur est actif
   */
  async userIsActive(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_IS_ACTIVE,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DES TEMPLATES D'EMAIL
  // ==========================================================================

  /**
   * Vérifier si un template d'email existe
   */
  async emailTemplateExists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_TEMPLATE_EXISTS,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un template d'email existe par titre
   */
  async emailTemplateExistsByTitle(title: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_TEMPLATE_EXISTS_BY_TITLE,
        [title],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un template d'email existe (excluant un ID)
   */
  async emailTemplateExistsByTitleExcludeId(
    title: string,
    excludeId: number,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_TEMPLATE_EXISTS_BY_TITLE_EXCLUDE_ID,
        [title, excludeId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un template est actif
   */
  async emailTemplateIsActive(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_EMAIL_TEMPLATE_IS_ACTIVE,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DE L'HISTORIQUE
  // ==========================================================================

  /**
   * Vérifier si un message existe dans l'historique
   */
  async historiqueMessageExists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HISTORIQUE_MESSAGE_EXISTS,
        [id],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un message de l'historique appartient à un utilisateur
   */
  async historiqueMessageBelongsToUser(
    messageId: number,
    userId: number,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HISTORIQUE_MESSAGE_BELONGS_TO_USER,
        [messageId, userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION DE COHÉRENCE
  // ==========================================================================

  /**
   * Vérifier si tous les utilisateurs d'une liste existent
   */
  async allUsersExist(userIds: number[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ALL_USERS_EXIST,
        [userIds],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const count = results[0]?.count || 0;
            resolve(count === userIds.length);
          }
        },
      );
    });
  }

  /**
   * Vérifier si tous les utilisateurs d'une liste sont actifs
   */
  async allUsersActive(userIds: number[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ALL_USERS_ACTIVE,
        [userIds],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const count = results[0]?.count || 0;
            resolve(count === userIds.length);
          }
        },
      );
    });
  }
}
