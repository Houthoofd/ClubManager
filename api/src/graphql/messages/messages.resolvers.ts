/**
 * Resolvers GraphQL pour le module Messages
 */

import { getMessagesRepository } from "../../db/clients/messages/messages.repository.js";
import type {
  CreateTypeMessageData,
  UpdateTypeMessageData,
  SendMessagePersonnaliseData,
  WelcomeEmailData,
  ValidationEmailData,
  RecoveryEmailData,
  RappelPaiementEmailData,
} from "../../db/clients/messages/types.js";

/**
 * Contexte GraphQL
 */
interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  };
}

/**
 * Resolvers pour les messages
 */
export const messagesResolvers = {
  Query: {
    /**
     * Récupérer tous les types de messages actifs
     */
    getAllTypesMessages: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagesRepository();
        return await repository.obtenirTousLesTypesDeMessages();
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des types de messages:",
          error,
        );
        throw new Error("Impossible de récupérer les types de messages");
      }
    },

    /**
     * Récupérer un type de message par ID
     */
    getTypeMessageById: async (
      _: any,
      { typeId }: { typeId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.obtenirTypeMessageParId(typeId);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du type de message:",
          error,
        );
        throw new Error("Impossible de récupérer le type de message");
      }
    },

    /**
     * Récupérer les messages reçus par un utilisateur
     */
    getMessagesRecusParUtilisateur: async (
      _: any,
      { utilisateurId }: { utilisateurId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.obtenirMessagesRecusParUtilisateur(
          utilisateurId,
        );
      } catch (error) {
        console.error("Erreur lors de la récupération des messages:", error);
        throw new Error("Impossible de récupérer les messages");
      }
    },

    /**
     * Compter les messages non lus d'un utilisateur
     */
    compterMessagesNonLus: async (
      _: any,
      { utilisateurId }: { utilisateurId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.compterMessagesNonLus(utilisateurId);
      } catch (error) {
        console.error("Erreur lors du comptage des messages non lus:", error);
        throw new Error("Impossible de compter les messages non lus");
      }
    },

    /**
     * Récupérer les messages inactifs
     */
    getMessagesInactifs: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagesRepository();
        return await repository.obtenirMessagesInactifs();
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des messages inactifs:",
          error,
        );
        throw new Error("Impossible de récupérer les messages inactifs");
      }
    },

    /**
     * Récupérer les messages supprimés
     */
    getMessagesSupprimes: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagesRepository();
        return await repository.obtenirMessagesSupprimes();
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des messages supprimés:",
          error,
        );
        throw new Error("Impossible de récupérer les messages supprimés");
      }
    },

    /**
     * Obtenir les statistiques des messages
     */
    getStatistiquesMessages: async (
      _: any,
      __: any,
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        const result = await repository.obtenirStatistiquesMessages();
        return result.data;
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des statistiques:",
          error,
        );
        throw new Error("Impossible de récupérer les statistiques");
      }
    },

    /**
     * Obtenir les statistiques de suppression
     */
    getStatistiquesSuppressions: async (
      _: any,
      __: any,
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        const result = await repository.obtenirStatistiquesSuppressions();
        return result.data;
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des statistiques de suppression:",
          error,
        );
        throw new Error(
          "Impossible de récupérer les statistiques de suppression",
        );
      }
    },

    /**
     * Récupérer l'historique des messages d'un utilisateur
     */
    getMessageHistory: async (
      _: any,
      {
        utilisateurId,
        limit = 50,
        offset = 0,
      }: { utilisateurId: number; limit?: number; offset?: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.getMessageHistory(utilisateurId, limit, offset);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        throw new Error("Impossible de récupérer l'historique des messages");
      }
    },

    /**
     * Récupérer tous les templates actifs
     */
    getAllTemplates: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagesRepository();
        return await repository.getAllTemplates();
      } catch (error) {
        console.error("Erreur lors de la récupération des templates:", error);
        throw new Error("Impossible de récupérer les templates");
      }
    },

    /**
     * Récupérer un template par nom
     */
    getTemplateByName: async (
      _: any,
      { nomTemplate }: { nomTemplate: string },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.getTemplateByName(nomTemplate);
      } catch (error) {
        console.error("Erreur lors de la récupération du template:", error);
        throw new Error("Impossible de récupérer le template");
      }
    },
  },

  Mutation: {
    /**
     * Créer un nouveau type de message
     */
    creerTypeMessage: async (
      _: any,
      { input }: { input: CreateTypeMessageData },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.creerTypeMessage(input);
      } catch (error) {
        console.error("Erreur lors de la création du type de message:", error);
        throw new Error("Impossible de créer le type de message");
      }
    },

    /**
     * Modifier un type de message
     */
    modifierTypeMessage: async (
      _: any,
      { typeId, input }: { typeId: number; input: UpdateTypeMessageData },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.modifierTypeMessage(typeId, input);
      } catch (error) {
        console.error(
          "Erreur lors de la modification du type de message:",
          error,
        );
        throw new Error("Impossible de modifier le type de message");
      }
    },

    /**
     * Supprimer un type de message
     */
    supprimerTypeMessage: async (
      _: any,
      { typeId }: { typeId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.supprimerTypeMessage(typeId);
      } catch (error) {
        console.error(
          "Erreur lors de la suppression du type de message:",
          error,
        );
        throw new Error("Impossible de supprimer le type de message");
      }
    },

    /**
     * Envoyer un message personnalisé
     */
    envoyerMessage: async (
      _: any,
      { input }: { input: SendMessagePersonnaliseData },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.envoyerMessage(input);
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        throw new Error("Impossible d'envoyer le message");
      }
    },

    /**
     * Envoyer un message avec emails
     * Note: Cette fonctionnalité nécessite l'intégration avec messageClient
     */
    envoyerMessageAvecEmails: async (
      _: any,
      { input }: { input: any },
      context: GraphQLContext,
    ) => {
      try {
        // Cette fonctionnalité complexe doit être implémentée avec le MessageClient
        // Pour l'instant, on retourne une structure par défaut
        throw new Error(
          "Fonctionnalité non implémentée - utiliser le MessageClient legacy",
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi du message avec emails:", error);
        throw new Error("Impossible d'envoyer le message avec emails");
      }
    },

    /**
     * Marquer un message comme lu
     */
    marquerMessageCommeLu: async (
      _: any,
      { messageId }: { messageId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.marquerMessageCommeLu(messageId);
      } catch (error) {
        console.error("Erreur lors du marquage du message comme lu:", error);
        throw new Error("Impossible de marquer le message comme lu");
      }
    },

    /**
     * Supprimer un message reçu
     */
    supprimerMessageRecu: async (
      _: any,
      { messageId }: { messageId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.supprimerMessageRecu(messageId);
      } catch (error) {
        console.error("Erreur lors de la suppression du message:", error);
        throw new Error("Impossible de supprimer le message");
      }
    },

    /**
     * Restaurer un message supprimé
     */
    restaurerMessage: async (
      _: any,
      { messageId }: { messageId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.restaurerMessage(messageId);
      } catch (error) {
        console.error("Erreur lors de la restauration du message:", error);
        throw new Error("Impossible de restaurer le message");
      }
    },

    /**
     * Supprimer définitivement un message
     */
    supprimerDefinitivementMessage: async (
      _: any,
      { messageId }: { messageId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.supprimerDefinitivementMessage(messageId);
      } catch (error) {
        console.error(
          "Erreur lors de la suppression définitive du message:",
          error,
        );
        throw new Error("Impossible de supprimer définitivement le message");
      }
    },

    /**
     * Désactiver un message
     */
    desactiverMessage: async (
      _: any,
      { messageId }: { messageId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.desactiverMessage(messageId);
      } catch (error) {
        console.error("Erreur lors de la désactivation du message:", error);
        throw new Error("Impossible de désactiver le message");
      }
    },

    /**
     * Réactiver un message
     */
    reactiverMessage: async (
      _: any,
      { messageId }: { messageId: number },
      context: GraphQLContext,
    ) => {
      try {
        const repository = getMessagesRepository();
        return await repository.reactiverMessage(messageId);
      } catch (error) {
        console.error("Erreur lors de la réactivation du message:", error);
        throw new Error("Impossible de réactiver le message");
      }
    },

    /**
     * Envoyer un email de bienvenue
     * Note: Ces fonctionnalités d'email nécessitent le MessageClient
     * TODO: Adapter les types pour correspondre au MessageClient legacy
     */
    envoyerEmailBienvenue: async (
      _: any,
      { input }: { input: WelcomeEmailData },
      context: GraphQLContext,
    ) => {
      try {
        // Temporairement désactivé - incompatibilité de types
        throw new Error(
          "Fonctionnalité temporairement désactivée - utiliser directement MessageClient",
        );
        /*
        // Import dynamique pour éviter les dépendances circulaires
        const { MessageClient } =
          await import("../../db/clients/messages/messageClient.js");
        const messageClient = new MessageClient();
        return await messageClient.envoyerEmailBienvenue(input);
        */
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
        throw new Error("Impossible d'envoyer l'email de bienvenue");
      }
    },

    /**
     * Envoyer un email de validation
     * TODO: Adapter les types pour correspondre au MessageClient legacy
     */
    envoyerValidationEmail: async (
      _: any,
      { input }: { input: ValidationEmailData },
      context: GraphQLContext,
    ) => {
      try {
        // Temporairement désactivé - incompatibilité de types
        throw new Error(
          "Fonctionnalité temporairement désactivée - utiliser directement MessageClient",
        );
        /*
        const { MessageClient } =
          await import("../../db/clients/messages/messageClient.js");
        const messageClient = new MessageClient();
        return await messageClient.envoyerValidationEmail(input);
        */
      } catch (error) {
        console.error(
          "Erreur lors de l'envoi de l'email de validation:",
          error,
        );
        throw new Error("Impossible d'envoyer l'email de validation");
      }
    },

    /**
     * Envoyer un email de récupération
     * TODO: Adapter les types pour correspondre au MessageClient legacy
     */
    envoyerRecuperationUserId: async (
      _: any,
      { input }: { input: RecoveryEmailData },
      context: GraphQLContext,
    ) => {
      try {
        // Temporairement désactivé - incompatibilité de types
        throw new Error(
          "Fonctionnalité temporairement désactivée - utiliser directement MessageClient",
        );
        /*
        const { MessageClient } =
          await import("../../db/clients/messages/messageClient.js");
        const messageClient = new MessageClient();
        return await messageClient.envoyerRecuperationUserId(input);
        */
      } catch (error) {
        console.error(
          "Erreur lors de l'envoi de l'email de récupération:",
          error,
        );
        throw new Error("Impossible d'envoyer l'email de récupération");
      }
    },

    /**
     * Envoyer un rappel de paiement avec email
     * TODO: Adapter les types pour correspondre au Message legacy
     */
    envoyerRappelPaiementAvecEmail: async (
      _: any,
      { input }: { input: RappelPaiementEmailData },
      context: GraphQLContext,
    ) => {
      try {
        // Temporairement désactivé - incompatibilité de types
        throw new Error(
          "Fonctionnalité temporairement désactivée - utiliser directement Message",
        );
        /*
        const { Message } =
          await import("../../db/clients/messages/messages.js");
        const messageInstance = new Message();
        return await messageInstance.envoyerRappelPaiementAvecEmail(input);
        */
      } catch (error) {
        console.error("Erreur lors de l'envoi du rappel de paiement:", error);
        throw new Error("Impossible d'envoyer le rappel de paiement");
      }
    },
  },
};
