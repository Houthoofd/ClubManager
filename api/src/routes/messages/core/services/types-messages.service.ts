/**
 * Service pour la gestion des types de messages personnalisés
 *
 * Ce service encapsule la logique métier pour les opérations CRUD
 * sur les types de messages personnalisés.
 *
 * Migré vers Prisma avec intégration Sentry
 *
 * @module types-messages.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";

/**
 * Service pour la gestion des types de messages personnalisés
 */
export class TypesMessagesService {
  /**
   * Récupérer tous les types de messages
   *
   * @returns {Promise<any>} Liste des types de messages
   */
  async getAllTypesMessages() {
    try {
      addSentryBreadcrumb(
        "Récupération de tous les types de messages",
        "service.types-messages",
        "info",
      );

      console.log(
        "✅ [TypesMessagesService] Récupération tous les types de messages",
      );

      const typesMessages = await prisma.types_messages_personnalises.findMany({
        orderBy: {
          title: "asc",
        },
      });

      return {
        success: true,
        message: "Types de messages récupérés avec succès",
        data: typesMessages,
        count: typesMessages.length,
      };
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesService] Erreur getAllTypesMessages:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "types-messages",
          operation: "getAllTypesMessages",
        },
      });

      throw new Error(
        `Erreur lors de la récupération des types de messages: ${error.message}`,
      );
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
      addSentryBreadcrumb(
        `Récupération type de message: ${id}`,
        "service.types-messages",
        "info",
        { id },
      );

      console.log(
        "✅ [TypesMessagesService] Récupération type de message:",
        id,
      );

      const typeMessage = await prisma.types_messages_personnalises.findUnique({
        where: { id },
      });

      if (!typeMessage) {
        return {
          success: false,
          message: "Type de message non trouvé",
          data: null,
        };
      }

      return {
        success: true,
        message: "Type de message trouvé",
        data: typeMessage,
      };
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesService] Erreur getTypeMessageById:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "types-messages",
          operation: "getTypeMessageById",
        },
        extra: { id },
      });

      throw new Error(
        `Erreur lors de la récupération du type de message: ${error.message}`,
      );
    }
  }

  /**
   * Créer un nouveau type de message
   *
   * @param {string} titre - Titre du type de message
   * @param {string} contenu - Contenu du type de message
   * @returns {Promise<any>} Résultat de la création
   */
  async createTypeMessage(titre: string, description?: string) {
    try {
      addSentryBreadcrumb(
        `Création type de message: ${titre}`,
        "service.types-messages",
        "info",
        { titre },
      );

      console.log("✅ [TypesMessagesService] Création type de message:", titre);

      // Vérifier si un type avec ce titre existe déjà
      const existing = await prisma.types_messages_personnalises.findFirst({
        where: {
          title: {
            equals: titre.trim(),
          },
        },
      });

      if (existing) {
        return {
          success: false,
          message: "Un type de message avec ce titre existe déjà",
        };
      }

      const typeMessage = await prisma.types_messages_personnalises.create({
        data: {
          title: titre.trim(),
          content: description?.trim() || "",
        },
      });

      return {
        success: true,
        message: "Type de message créé avec succès",
        data: typeMessage,
      };
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesService] Erreur createTypeMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "types-messages",
          operation: "createTypeMessage",
        },
        extra: { titre },
      });

      throw new Error(
        `Erreur lors de la création du type de message: ${error.message}`,
      );
    }
  }

  /**
   * Modifier un type de message existant
   *
   * @param {number} id - ID du type de message
   * @param {string} titre - Nouveau titre
   * @param {string} contenu - Nouveau contenu
   * @returns {Promise<any>} Résultat de la modification
   */
  async updateTypeMessage(id: number, titre: string, description?: string) {
    try {
      addSentryBreadcrumb(
        `Modification type de message: ${id}`,
        "service.types-messages",
        "info",
        { id, titre },
      );

      console.log(
        "✅ [TypesMessagesService] Modification type de message:",
        id,
      );

      // Vérifier si le type existe
      const existing = await prisma.types_messages_personnalises.findUnique({
        where: { id },
      });

      if (!existing) {
        return {
          success: false,
          message: "Type de message non trouvé",
        };
      }

      // Vérifier les doublons de titre (sauf pour le type actuel)
      const duplicate = await prisma.types_messages_personnalises.findFirst({
        where: {
          id: { not: id },
          title: {
            equals: titre.trim(),
          },
        },
      });

      if (duplicate) {
        return {
          success: false,
          message: "Un autre type de message avec ce titre existe déjà",
        };
      }

      const typeMessage = await prisma.types_messages_personnalises.update({
        where: { id },
        data: {
          title: titre.trim(),
          content: description?.trim() || "",
        },
      });

      return {
        success: true,
        message: "Type de message modifié avec succès",
        data: typeMessage,
      };
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesService] Erreur updateTypeMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "types-messages",
          operation: "updateTypeMessage",
        },
        extra: { id, titre },
      });

      throw new Error(
        `Erreur lors de la modification du type de message: ${error.message}`,
      );
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
      addSentryBreadcrumb(
        `Suppression type de message: ${id}`,
        "service.types-messages",
        "warning",
        { id },
      );

      console.log("✅ [TypesMessagesService] Suppression type de message:", id);

      // Vérifier si le type existe
      const existing = await prisma.types_messages_personnalises.findUnique({
        where: { id },
      });

      if (!existing) {
        return {
          success: false,
          message: "Type de message non trouvé",
        };
      }

      // Vérifier s'il y a des messages utilisant ce type
      // Note: messages_personnalises table doesn't have type_message_id field
      // Returning 0 for now - may need schema migration if this feature is needed
      const usageCount = 0;

      if (usageCount > 0) {
        return {
          success: false,
          message: `Impossible de supprimer: ${usageCount} message(s) utilisent ce type`,
          data: null,
        };
      }

      await prisma.types_messages_personnalises.delete({
        where: { id },
      });

      return {
        success: true,
        message: "Type de message supprimé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesService] Erreur deleteTypeMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "types-messages",
          operation: "deleteTypeMessage",
        },
        extra: { id },
      });

      throw new Error(
        `Erreur lors de la suppression du type de message: ${error.message}`,
      );
    }
  }
}

// Export instance singleton
export const typesMessagesService = new TypesMessagesService();
