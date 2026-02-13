/**
 * Service pour la gestion des messages personnalisés
 *
 * Ce service encapsule la logique métier pour les opérations sur
 * les messages personnalisés (envoi, réception, suppression, etc.)
 *
 * Migré vers Prisma avec intégration Sentry
 *
 * @module messages-personnalises.service
 */

import { prisma } from '@/infrastructure/database/prisma-client.js';
import {
  captureException,
  addSentryBreadcrumb,
} from '@/shared/config/sentry.config.js';

/**
 * Service pour la gestion des messages personnalisés
 */
export class MessagesPersonnalisesService {
  /**
   * Récupérer les messages reçus par un utilisateur
   *
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Liste des messages reçus
   */
  async getMessagesRecus(userId: number) {
    try {
      addSentryBreadcrumb(
        `Récupération messages reçus pour userId: ${userId}`,
        "service.messages",
        "info",
        { userId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Récupération messages pour userId:",
        userId,
      );

      const messages = await prisma.messages_personnalises.findMany({
        where: {
          destinataire_id: userId,
          supprime: false,
        },
        orderBy: {
          date_envoi: "desc",
        },
      });

      return {
        success: true,
        message: "Messages récupérés avec succès",
        data: messages,
        count: messages.length,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getMessagesRecus:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "getMessagesRecus",
        },
        extra: { userId },
      });

      throw new Error(
        `Erreur lors de la récupération des messages: ${error.message}`,
      );
    }
  }

  /**
   * Marquer un message comme lu
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de l'opération
   */
  async marquerCommeLu(messageId: number) {
    try {
      addSentryBreadcrumb(
        `Marquage message comme lu: ${messageId}`,
        "service.messages",
        "info",
        { messageId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Marquage message comme lu:",
        messageId,
      );

      const message = await prisma.messages_personnalises.update({
        where: { id: messageId },
        data: { lu: true },
      });

      return {
        success: true,
        message: "Message marqué comme lu",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur marquerCommeLu:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "marquerCommeLu",
        },
        extra: { messageId },
      });

      throw new Error(
        `Erreur lors du marquage du message comme lu: ${error.message}`,
      );
    }
  }

  /**
   * Supprimer un message (soft delete)
   *
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Résultat de l'opération
   */
  async supprimerMessage(messageId: number, userId: number) {
    try {
      addSentryBreadcrumb(
        `Suppression message: ${messageId} par userId: ${userId}`,
        "service.messages",
        "info",
        { messageId, userId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Suppression message:",
        messageId,
      );

      const message = await prisma.messages_personnalises.update({
        where: {
          id: messageId,
          destinataire_id: userId,
        },
        data: {
          supprime: true,
          date_suppression: new Date(),
        },
      });

      return {
        success: true,
        message: "Message supprimé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur supprimerMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "supprimerMessage",
        },
        extra: { messageId, userId },
      });

      throw new Error(
        `Erreur lors de la suppression du message: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages supprimés par un utilisateur
   *
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Liste des messages supprimés
   */
  async getMessagesSupprimes(userId: number) {
    try {
      addSentryBreadcrumb(
        `Récupération messages supprimés pour userId: ${userId}`,
        "service.messages",
        "info",
        { userId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Récupération messages supprimés pour userId:",
        userId,
      );

      const messages = await prisma.messages_personnalises.findMany({
        where: {
          destinataire_id: userId,
          supprime: true,
        },
        orderBy: {
          date_suppression: "desc",
        },
      });

      return {
        success: true,
        message: "Messages supprimés récupérés avec succès",
        data: messages,
        count: messages.length,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getMessagesSupprimes:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "getMessagesSupprimes",
        },
        extra: { userId },
      });

      throw new Error(
        `Erreur lors de la récupération des messages supprimés: ${error.message}`,
      );
    }
  }

  /**
   * Restaurer un message supprimé
   *
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Résultat de l'opération
   */
  async restaurerMessage(messageId: number, userId: number) {
    try {
      addSentryBreadcrumb(
        `Restauration message: ${messageId} par userId: ${userId}`,
        "service.messages",
        "info",
        { messageId, userId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Restauration message:",
        messageId,
      );

      const message = await prisma.messages_personnalises.update({
        where: {
          id: messageId,
          destinataire_id: userId,
        },
        data: {
          supprime: false,
          date_suppression: null,
        },
      });

      return {
        success: true,
        message: "Message restauré avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur restaurerMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "restaurerMessage",
        },
        extra: { messageId, userId },
      });

      throw new Error(
        `Erreur lors de la restauration du message: ${error.message}`,
      );
    }
  }

  /**
   * Supprimer définitivement un message
   *
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Résultat de l'opération
   */
  async supprimerDefinitivement(messageId: number, userId: number) {
    try {
      addSentryBreadcrumb(
        `Suppression définitive message: ${messageId} par userId: ${userId}`,
        "service.messages",
        "warning",
        { messageId, userId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Suppression définitive message:",
        messageId,
      );

      await prisma.messages_personnalises.delete({
        where: {
          id: messageId,
          destinataire_id: userId,
        },
      });

      return {
        success: true,
        message: "Message supprimé définitivement",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur supprimerDefinitivement:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "supprimerDefinitivement",
        },
        extra: { messageId, userId },
      });

      throw new Error(
        `Erreur lors de la suppression définitive du message: ${error.message}`,
      );
    }
  }

  /**
   * Désactiver un message (Admin)
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de l'opération
   */
  async desactiverMessage(messageId: number) {
    try {
      addSentryBreadcrumb(
        `Désactivation message: ${messageId}`,
        "service.messages",
        "info",
        { messageId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Désactivation message:",
        messageId,
      );

      const message = await prisma.messages_personnalises.update({
        where: { id: messageId },
        data: { actif: false },
      });

      return {
        success: true,
        message: "Message désactivé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur desactiverMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "desactiverMessage",
        },
        extra: { messageId },
      });

      throw new Error(
        `Erreur lors de la désactivation du message: ${error.message}`,
      );
    }
  }

  /**
   * Réactiver un message (Admin)
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de l'opération
   */
  async reactiverMessage(messageId: number) {
    try {
      addSentryBreadcrumb(
        `Réactivation message: ${messageId}`,
        "service.messages",
        "info",
        { messageId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Réactivation message:",
        messageId,
      );

      const message = await prisma.messages_personnalises.update({
        where: { id: messageId },
        data: { actif: true },
      });

      return {
        success: true,
        message: "Message réactivé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur reactiverMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "reactiverMessage",
        },
        extra: { messageId },
      });

      throw new Error(
        `Erreur lors de la réactivation du message: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages inactifs (Admin)
   *
   * @returns {Promise<any>} Liste des messages inactifs
   */
  async getMessagesInactifs() {
    try {
      addSentryBreadcrumb(
        "Récupération messages inactifs",
        "service.messages",
        "info",
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Récupération messages inactifs",
      );

      const messages = await prisma.messages_personnalises.findMany({
        where: { actif: false },
        orderBy: { date_envoi: "desc" },
      });

      return {
        success: true,
        message: "Messages inactifs récupérés avec succès",
        data: messages,
        count: messages.length,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getMessagesInactifs:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "getMessagesInactifs",
        },
      });

      throw new Error(
        `Erreur lors de la récupération des messages inactifs: ${error.message}`,
      );
    }
  }

  /**
   * Compter les messages non lus d'un utilisateur
   *
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Nombre de messages non lus
   */
  async compterMessagesNonLus(userId: number) {
    try {
      addSentryBreadcrumb(
        `Comptage messages non lus pour userId: ${userId}`,
        "service.messages",
        "info",
        { userId },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Comptage messages non lus pour userId:",
        userId,
      );

      const count = await prisma.messages_personnalises.count({
        where: {
          destinataire_id: userId,
          lu: false,
          supprime: false,
          actif: true,
        },
      });

      return {
        success: true,
        message: "Comptage effectué avec succès",
        count,
        userId,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur compterMessagesNonLus:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "compterMessagesNonLus",
        },
        extra: { userId },
      });

      throw new Error(
        `Erreur lors du comptage des messages non lus: ${error.message}`,
      );
    }
  }

  /**
   * Envoyer un message personnalisé
   *
   * @param {object} data - Données du message
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async envoyerMessage(data: {
    expediteur_id: number;
    destinataires: number[];
    type_message_id: number;
    contenu: string;
    envoyerEmail?: boolean;
  }) {
    try {
      addSentryBreadcrumb(
        `Envoi message par userId: ${data.expediteur_id} vers ${data.destinataires.length} destinataires`,
        "service.messages",
        "info",
        {
          expediteur_id: data.expediteur_id,
          destinatairesCount: data.destinataires.length,
          type_message_id: data.type_message_id,
        },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Envoi message:",
        data.expediteur_id,
      );

      const messagesCreated = [];

      // Créer un message pour chaque destinataire
      for (const destinataire_id of data.destinataires) {
        const message = await prisma.messages_personnalises.create({
          data: {
            expediteur_id: data.expediteur_id,
            destinataire_id,
            type_message_id: data.type_message_id,
            contenu: data.contenu,
            date_envoi: new Date(),
            lu: false,
            supprime: false,
            actif: true,
          },
        });

        messagesCreated.push(message);
      }

      return {
        success: true,
        message: `${messagesCreated.length} message(s) envoyé(s) avec succès`,
        data: {
          messagesInternes: messagesCreated.length,
          emailsEnvoyes: data.envoyerEmail ? messagesCreated.length : 0,
          typeMessage: data.type_message_id,
          details: {
            totalDestinataires: data.destinataires.length,
            messagesEnvoyes: messagesCreated.length,
          },
        },
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur envoyerMessage:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "envoyerMessage",
        },
        extra: {
          expediteur_id: data.expediteur_id,
          destinatairesCount: data.destinataires.length,
        },
      });

      throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
    }
  }

  /**
   * Envoyer un rappel de paiement
   *
   * @param {object} data - Données du rappel
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async envoyerRappelPaiement(data: {
    userId: number;
    echeanceIds: number[];
    message?: string;
  }) {
    try {
      addSentryBreadcrumb(
        `Envoi rappel paiement pour userId: ${data.userId}`,
        "service.messages",
        "info",
        {
          userId: data.userId,
          echeancesCount: data.echeanceIds.length,
        },
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Envoi rappel paiement pour userId:",
        data.userId,
      );

      // Récupérer le type de message "Rappel de paiement"
      const typeMessage = await prisma.types_messages_personnalises.findFirst({
        where: { titre: "Rappel de paiement" },
      });

      if (!typeMessage) {
        throw new Error("Type de message 'Rappel de paiement' non trouvé");
      }

      const message = await prisma.messages_personnalises.create({
        data: {
          expediteur_id: 1, // Admin système
          destinataire_id: data.userId,
          type_message_id: typeMessage.id,
          contenu:
            data.message ||
            `Rappel: Vous avez ${data.echeanceIds.length} échéance(s) à payer.`,
          date_envoi: new Date(),
          lu: false,
          supprime: false,
          actif: true,
        },
      });

      return {
        success: true,
        message: "Rappel de paiement envoyé avec succès",
        data: message,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur envoyerRappelPaiement:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "envoyerRappelPaiement",
        },
        extra: {
          userId: data.userId,
          echeancesCount: data.echeanceIds.length,
        },
      });

      throw new Error(
        `Erreur lors de l'envoi du rappel de paiement: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les statistiques des messages
   *
   * @returns {Promise<any>} Statistiques des messages
   */
  async getStatistiquesMessages() {
    try {
      addSentryBreadcrumb(
        "Récupération statistiques messages",
        "service.messages",
        "info",
      );

      console.log(
        "✅ [MessagesPersonnalisesService] Récupération statistiques messages",
      );

      const [total, nonLus, supprimes, actifs] = await Promise.all([
        prisma.messages_personnalises.count(),
        prisma.messages_personnalises.count({ where: { lu: false } }),
        prisma.messages_personnalises.count({ where: { supprime: true } }),
        prisma.messages_personnalises.count({ where: { actif: true } }),
      ]);

      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        data: {
          total,
          nonLus,
          supprimes,
          actifs,
          inactifs: total - actifs,
        },
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getStatistiquesMessages:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "messages-personnalises",
          operation: "getStatistiquesMessages",
        },
      });

      throw new Error(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
    }
  }
}

// Export instance singleton
export const messagesPersonnalisesService = new MessagesPersonnalisesService();
