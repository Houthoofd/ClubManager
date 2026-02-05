import { Message } from '../../../../db/clients/messages/messages.js';

/**
 * Service pour la gestion des types de messages personnalisés
 *
 * Ce service encapsule la logique métier pour les opérations CRUD
 * sur les types de messages personnalisés.
 *
 * @class TypesMessagesService
 */
export class TypesMessagesService {
  private messageClient: Message;

  constructor() {
    this.messageClient = new Message();
  }

  /**
   * Récupérer tous les types de messages
   *
   * @returns {Promise<any>} Liste des types de messages
   */
  async getAllTypesMessages() {
    try {
      const result = await this.messageClient.obtenirTousLesTypesDeMessages();

      if (!result.isFind) {
        return {
          success: false,
          message: result.message || 'Aucun type de message trouvé',
          data: [],
        };
      }

      return {
        success: true,
        message: 'Types de messages récupérés avec succès',
        data: result.data,
        count: result.data?.length || 0,
      };
    } catch (error: any) {
      console.error('❌ [TypesMessagesService] Erreur getAllTypesMessages:', error);
      throw new Error(`Erreur lors de la récupération des types de messages: ${error.message}`);
    }
  }

  /**
   * Créer un nouveau type de message
   *
   * @param {string} title - Titre du type de message
   * @param {string} content - Contenu du type de message
   * @returns {Promise<any>} Résultat de la création
   */
  async createTypeMessage(title: string, content: string) {
    try {
      // Validation métier
      if (!title || title.trim().length === 0) {
        return {
          success: false,
          message: 'Le titre ne peut pas être vide',
        };
      }

      if (!content || content.trim().length === 0) {
        return {
          success: false,
          message: 'Le contenu ne peut pas être vide',
        };
      }

      // Vérifier si un type avec ce titre existe déjà
      const existing = await this.messageClient.obtenirTousLesTypesDeMessages();
      if (existing.isFind && existing.data) {
        const duplicate = existing.data.find(
          (type: any) => type.title.toLowerCase() === title.toLowerCase()
        );
        if (duplicate) {
          return {
            success: false,
            message: 'Un type de message avec ce titre existe déjà',
          };
        }
      }

      const result = await this.messageClient.creerTypeMessage(title.trim(), content.trim());

      if (!result.isConfirm) {
        return {
          success: false,
          message: result.message || 'Erreur lors de la création du type de message',
        };
      }

      return {
        success: true,
        message: result.message || 'Type de message créé avec succès',
      };
    } catch (error: any) {
      console.error('❌ [TypesMessagesService] Erreur createTypeMessage:', error);
      throw new Error(`Erreur lors de la création du type de message: ${error.message}`);
    }
  }

  /**
   * Modifier un type de message existant
   *
   * @param {number} id - ID du type de message
   * @param {string} title - Nouveau titre
   * @param {string} content - Nouveau contenu
   * @returns {Promise<any>} Résultat de la modification
   */
  async updateTypeMessage(id: number, title: string, content: string) {
    try {
      // Validation métier
      if (id <= 0) {
        return {
          success: false,
          message: 'ID invalide',
        };
      }

      if (!title || title.trim().length === 0) {
        return {
          success: false,
          message: 'Le titre ne peut pas être vide',
        };
      }

      if (!content || content.trim().length === 0) {
        return {
          success: false,
          message: 'Le contenu ne peut pas être vide',
        };
      }

      // Vérifier si le type existe
      const allTypes = await this.messageClient.obtenirTousLesTypesDeMessages();
      if (allTypes.isFind && allTypes.data) {
        const exists = allTypes.data.find((type: any) => type.id === id);
        if (!exists) {
          return {
            success: false,
            message: 'Type de message non trouvé',
          };
        }

        // Vérifier les doublons de titre (sauf pour le type actuel)
        const duplicate = allTypes.data.find(
          (type: any) => type.id !== id && type.title.toLowerCase() === title.toLowerCase()
        );
        if (duplicate) {
          return {
            success: false,
            message: 'Un autre type de message avec ce titre existe déjà',
          };
        }
      }

      const result = await this.messageClient.modifierTypeMessage(id, title.trim(), content.trim());

      if (!result.isConfirm) {
        return {
          success: false,
          message: result.message || 'Erreur lors de la modification du type de message',
        };
      }

      return {
        success: true,
        message: result.message || 'Type de message modifié avec succès',
      };
    } catch (error: any) {
      console.error('❌ [TypesMessagesService] Erreur updateTypeMessage:', error);
      throw new Error(`Erreur lors de la modification du type de message: ${error.message}`);
    }
  }

  /**
   * Supprimer un type de message
   *
   * @param {number} id - ID du type de message à supprimer
   * @returns {Promise<any>} Résultat de la suppression
   */
  async deleteTypeMessage(id: number) {
    try {
      // Validation métier
      if (id <= 0) {
        return {
          success: false,
          message: 'ID invalide',
        };
      }

      // Vérifier si le type existe
      const allTypes = await this.messageClient.obtenirTousLesTypesDeMessages();
      if (allTypes.isFind && allTypes.data) {
        const exists = allTypes.data.find((type: any) => type.id === id);
        if (!exists) {
          return {
            success: false,
            message: 'Type de message non trouvé',
          };
        }
      }

      const result = await this.messageClient.supprimerTypeMessage(id);

      if (!result.isConfirm) {
        return {
          success: false,
          message: result.message || 'Erreur lors de la suppression du type de message',
        };
      }

      return {
        success: true,
        message: result.message || 'Type de message supprimé avec succès',
      };
    } catch (error: any) {
      console.error('❌ [TypesMessagesService] Erreur deleteTypeMessage:', error);
      throw new Error(`Erreur lors de la suppression du type de message: ${error.message}`);
    }
  }

  /**
   * Récupérer un type de message par son ID
   *
   * @param {number} id - ID du type de message
   * @returns {Promise<any>} Type de message trouvé
   */
  async getTypeMessageById(id: number) {
    try {
      if (id <= 0) {
        return {
          success: false,
          message: 'ID invalide',
          data: null,
        };
      }

      const allTypes = await this.messageClient.obtenirTousLesTypesDeMessages();

      if (!allTypes.isFind || !allTypes.data) {
        return {
          success: false,
          message: 'Aucun type de message trouvé',
          data: null,
        };
      }

      const typeMessage = allTypes.data.find((type: any) => type.id === id);

      if (!typeMessage) {
        return {
          success: false,
          message: 'Type de message non trouvé',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Type de message trouvé',
        data: typeMessage,
      };
    } catch (error: any) {
      console.error('❌ [TypesMessagesService] Erreur getTypeMessageById:', error);
      throw new Error(`Erreur lors de la récupération du type de message: ${error.message}`);
    }
  }
}

// Export d'une instance singleton
export const typesMessagesService = new TypesMessagesService();
