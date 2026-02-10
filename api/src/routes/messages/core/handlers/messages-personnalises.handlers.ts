import { Request, Response } from "express";
import {
  MessagesPersonnalisesService,
  messagesPersonnalisesService,
} from "../services/messages-personnalises.service.js";
import {
  sendMessageSchema,
  markAsReadSchema,
  getUserMessagesSchema,
  deleteMessageSchema,
  restoreMessageSchema,
  messageStatsSchema,
  sendPaymentReminderSchema,
  countUnreadMessagesSchema,
  toggleMessageStatusSchema,
} from "@clubmanager/types/validators";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Fonction utilitaire pour récupérer le rôle utilisateur
 */
const getUserRole = (req: any): string | null => {
  return req.user?.role || req.user?.status || null;
};

/**
 * Fonction utilitaire pour vérifier les permissions admin
 */
const isAdmin = (req: any): boolean => {
  const userRole = getUserRole(req);
  return userRole === "super-administrateur" || userRole === "administrateur";
};

/**
 * Factory pour créer les handlers de messages personnalisés avec injection de dépendances
 * @param service Service de messages personnalisés (optionnel, utilise le singleton par défaut)
 */
export const createMessagesPersonnalisesHandlers = (
  service?: MessagesPersonnalisesService,
) => {
  const messagesService = service || messagesPersonnalisesService;

  return {
    /**
     * Handler pour récupérer les messages reçus par un utilisateur
     *
     * @route GET /api/messages/recus/:userId
     * @access Public (temporairement sans auth)
     */
    getMessagesRecus: async (req: Request, res: Response) => {
      try {
        console.log(
          "📩 [MessagesPersonnalisesHandler] Récupération messages reçus:",
          req.params.userId,
        );

        // Validation de l'userId
        const { userId } = getUserMessagesSchema.parse({
          userId: req.params.userId,
          limit: req.query.limit as string,
        });

        const result = await messagesService.getMessagesRecus(userId);

        if (!result.success) {
          throw new NotFoundError(result.message || "Messages non trouvés");
        }

        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          count: result.count,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur getMessagesRecus:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID utilisateur invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des messages",
        );
      }
    },

    /**
     * Handler pour marquer un message comme lu
     *
     * @route PUT /api/messages/:messageId/marquer-lu
     * @access Protected
     */
    marquerMessageCommeLu: async (req: Request, res: Response) => {
      try {
        console.log(
          "✅ [MessagesPersonnalisesHandler] Marquer message comme lu:",
          req.params.messageId,
        );

        const { messageId } = markAsReadSchema.parse(req.params);

        const result = await messagesService.marquerCommeLu(messageId);

        if (!result.success) {
          throw new NotFoundError(result.message || "Message non trouvé");
        }

        res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur marquerMessageCommeLu:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID message invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors du marquage du message comme lu",
        );
      }
    },

    /**
     * Handler pour supprimer un message (soft delete)
     *
     * @route DELETE /api/messages/:messageId
     * @access Protected
     */
    supprimerMessage: async (req: any, res: Response) => {
      try {
        console.log(
          "🗑️ [MessagesPersonnalisesHandler] Suppression message:",
          req.params.messageId,
        );

        const { messageId } = deleteMessageSchema.parse(req.params);
        const userId = req.user?.id;

        if (!userId) {
          throw new AuthorizationError("Utilisateur non authentifié");
        }

        const result = await messagesService.supprimerMessage(
          messageId,
          userId,
        );

        if (!result.success) {
          throw new NotFoundError(result.message || "Message non trouvé");
        }

        res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur supprimerMessage:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID message invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la suppression du message",
        );
      }
    },

    /**
     * Handler pour récupérer les messages supprimés (corbeille)
     *
     * @route GET /api/messages/corbeille/:userId
     * @access Protected
     */
    getMessagesSupprimes: async (req: Request, res: Response) => {
      try {
        console.log(
          "🗑️ [MessagesPersonnalisesHandler] Récupération corbeille:",
          req.params.userId,
        );

        const validatedData = getUserMessagesSchema.parse({
          userId: req.params.userId,
          limit: req.query.limit as string,
        });

        const result = await messagesService.getMessagesSupprimes(
          validatedData.userId,
          parseInt(validatedData.limit as any),
        );

        if (!result.success) {
          throw new NotFoundError(
            result.message || "Messages supprimés non trouvés",
          );
        }

        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          count: result.count,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur getMessagesSupprimes:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Paramètres invalides",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la récupération des messages supprimés",
        );
      }
    },

    /**
     * Handler pour restaurer un message supprimé
     *
     * @route PUT /api/messages/:messageId/restaurer
     * @access Protected
     */
    restaurerMessage: async (req: Request, res: Response) => {
      try {
        console.log(
          "♻️ [MessagesPersonnalisesHandler] Restauration message:",
          req.params.messageId,
        );

        const { messageId } = restoreMessageSchema.parse(req.params);

        const result = await messagesService.restaurerMessage(messageId);

        if (!result.success) {
          throw new NotFoundError(result.message || "Message non trouvé");
        }

        res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur restaurerMessage:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID message invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la restauration du message",
        );
      }
    },

    /**
     * Handler pour supprimer définitivement un message (admin seulement)
     *
     * @route DELETE /api/messages/:messageId/definitif
     * @access Protected (admin)
     */
    supprimerDefinitivement: async (req: any, res: Response) => {
      try {
        console.log(
          "⚠️ [MessagesPersonnalisesHandler] Suppression définitive:",
          req.params.messageId,
        );

        // Vérifier les permissions admin
        if (!isAdmin(req)) {
          throw new AuthorizationError(
            "Accès refusé. Droits administrateur requis.",
          );
        }

        const { messageId } = deleteMessageSchema.parse(req.params);

        const result = await messagesService.supprimerDefinitivement(messageId);

        if (!result.success) {
          throw new NotFoundError(result.message || "Message non trouvé");
        }

        res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur supprimerDefinitivement:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID message invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la réactivation du message",
        );
      }
    },

    /**
     * Handler pour désactiver un message (admin seulement)
     *
     * @route PUT /api/messages/:messageId/desactiver
     * @access Protected (admin)
     */
    desactiverMessage: async (req: any, res: Response) => {
      try {
        console.log(
          "🚫 [MessagesPersonnalisesHandler] Désactivation message:",
          req.params.messageId,
        );

        if (!isAdmin(req)) {
          throw new AuthorizationError(
            "Accès refusé. Droits administrateur requis.",
          );
        }

        const { messageId } = toggleMessageStatusSchema.parse(req.params);

        const result = await messagesService.desactiverMessage(messageId);

        if (!result.success) {
          throw new NotFoundError(result.message || "Message non trouvé");
        }

        res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur desactiverMessage:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID message invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la suppression définitive du message",
        );
      }
    },

    /**
     * Handler pour réactiver un message (admin seulement)
     *
     * @route PUT /api/messages/:messageId/reactiver
     * @access Protected (admin)
     */
    reactiverMessage: async (req: any, res: Response) => {
      try {
        console.log(
          "✅ [MessagesPersonnalisesHandler] Réactivation message:",
          req.params.messageId,
        );

        if (!isAdmin(req)) {
          throw new AuthorizationError(
            "Accès refusé. Droits administrateur requis.",
          );
        }

        const { messageId } = toggleMessageStatusSchema.parse(req.params);

        const result = await messagesService.reactiverMessage(messageId);

        if (!result.success) {
          throw new NotFoundError(result.message || "Message non trouvé");
        }

        res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur reactiverMessage:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID message invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la désactivation du message",
        );
      }
    },

    /**
     * Handler pour obtenir les messages inactifs (admin seulement)
     *
     * @route GET /api/messages/inactifs
     * @access Protected (admin)
     */
    getMessagesInactifs: async (req: any, res: Response) => {
      try {
        console.log(
          "📋 [MessagesPersonnalisesHandler] Récupération messages inactifs",
        );

        if (!isAdmin(req)) {
          throw new AuthorizationError(
            "Accès refusé. Droits administrateur requis.",
          );
        }

        const userId = req.params.userId
          ? parseInt(req.params.userId, 10)
          : undefined;
        const limit = req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined;

        const result = await messagesService.getMessagesInactifs(userId, limit);

        if (!result.success) {
          throw new NotFoundError(
            result.message || "Messages inactifs non trouvés",
          );
        }

        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          count: result.count,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur getMessagesInactifs:",
          error,
        );

        throw new InternalServerError(
          "Erreur lors de la récupération des messages inactifs",
        );
      }
    },

    /**
     * Handler pour compter les messages non lus d'un utilisateur
     *
     * @route GET /api/messages/non-lus/:userId
     * @access Public
     */
    compterMessagesNonLus: async (req: Request, res: Response) => {
      try {
        console.log(
          "🔢 [MessagesPersonnalisesHandler] Comptage messages non lus:",
          req.params.userId,
        );

        const { userId } = countUnreadMessagesSchema.parse(req.params);

        const result = await messagesService.compterMessagesNonLus(userId);

        res.status(200).json({
          success: true,
          message: result.message,
          count: result.count,
          userId: result.userId,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur compterMessagesNonLus:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID utilisateur invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors du comptage des messages non lus",
        );
      }
    },

    /**
     * Handler pour envoyer un message à plusieurs destinataires
     *
     * @route POST /api/messages/envoie
     * @access Protected
     */
    envoyerMessage: async (req: Request, res: Response) => {
      try {
        console.log("📤 [MessagesPersonnalisesHandler] Envoi de messages");

        const validatedData = sendMessageSchema.parse(req.body);

        const result = await messagesService.envoyerMessage(
          validatedData.destinataires,
          validatedData.type_message_id,
          validatedData.envoyerEmail,
        );

        if (!result.success) {
          throw new DatabaseError(
            result.message || "Erreur lors de l'envoi du message",
          );
        }

        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur envoyerMessage:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Données invalides",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError("Erreur lors de l'envoi du message");
      }
    },

    /**
     * Handler pour envoyer un rappel de paiement
     *
     * @route POST /api/messages/envoyer-rappel
     * @access Public
     */
    envoyerRappelPaiement: async (req: Request, res: Response) => {
      try {
        console.log(
          "📧 [MessagesPersonnalisesHandler] Envoi rappel de paiement",
        );

        const validatedData = sendPaymentReminderSchema.parse(req.body);

        const result = await messagesService.envoyerRappelPaiement(
          validatedData.echeanceIds as number[],
          validatedData.messagePersonnalise,
        );

        if (!result.success) {
          throw new DatabaseError(
            result.message || "Erreur lors de l'envoi du rappel de paiement",
          );
        }

        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur envoyerRappelPaiement:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Données invalides",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de l'envoi du rappel de paiement",
        );
      }
    },

    /**
     * Handler pour obtenir les statistiques des messages (admin)
     *
     * @route GET /api/messages/statistiques
     * @access Protected (admin)
     */
    getStatistiquesMessages: async (req: any, res: Response) => {
      try {
        console.log(
          "📊 [MessagesPersonnalisesHandler] Récupération statistiques messages",
        );

        if (!isAdmin(req)) {
          throw new AuthorizationError(
            "Accès refusé. Droits administrateur requis.",
          );
        }

        const validatedData = messageStatsSchema.parse(req.query);

        const result = await messagesService.getStatistiquesMessages(
          validatedData.periode,
        );

        if (!result.success) {
          throw new DatabaseError(
            result.message || "Erreur lors de la récupération des statistiques",
          );
        }

        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          periode: validatedData.periode,
        });
      } catch (error: any) {
        console.error(
          "❌ [MessagesPersonnalisesHandler] Erreur getStatistiquesMessages:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Paramètres invalides",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur lors de la récupération des statistiques",
        );
      }
    },
  };
};

// Créer et exporter les handlers par défaut
const defaultHandlers = createMessagesPersonnalisesHandlers();

export const getMessagesRecus = defaultHandlers.getMessagesRecus;
export const marquerMessageCommeLu = defaultHandlers.marquerMessageCommeLu;
export const supprimerMessage = defaultHandlers.supprimerMessage;
export const getMessagesSupprimes = defaultHandlers.getMessagesSupprimes;
export const restaurerMessage = defaultHandlers.restaurerMessage;
export const supprimerDefinitivement = defaultHandlers.supprimerDefinitivement;
export const desactiverMessage = defaultHandlers.desactiverMessage;
export const reactiverMessage = defaultHandlers.reactiverMessage;
export const getMessagesInactifs = defaultHandlers.getMessagesInactifs;
export const compterMessagesNonLus = defaultHandlers.compterMessagesNonLus;
export const envoyerMessage = defaultHandlers.envoyerMessage;
export const envoyerRappelPaiement = defaultHandlers.envoyerRappelPaiement;
export const getStatistiquesMessages = defaultHandlers.getStatistiquesMessages;
