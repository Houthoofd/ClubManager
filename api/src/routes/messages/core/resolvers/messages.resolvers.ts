/**
 * Resolvers GraphQL pour le module Messages
 * ✅ MIGRÉ : Pattern standardisé avec middlewares centralisés
 * - Auth middleware (requireAuth, requireAdmin)
 * - Sentry monitoring (withSentry)
 * - Validation Zod centralisée
 * - Erreurs GraphQL standardisées
 *
 * @package api
 */

import {
  requireAuth,
  requireAdmin,
  combineMiddlewares,
  type GraphQLContext,
} from "../../../../shared/middleware/auth.middleware.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { validateInput } from "../../../../shared/middleware/validation.middleware.js";
import { withSentry } from "../../../../shared/middleware/sentry.middleware.js";

// Services
import { messagesPersonnalisesService } from "../services/messages-personnalises.service.js";
import { typesMessagesService } from "../services/types-messages.service.js";

// Validators centralisés depuis @clubmanager/types
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
  type SendMessageInput,
  type MarkAsReadInput,
  type GetUserMessagesInput,
  type DeleteMessageInput,
  type RestoreMessageInput,
  type MessageStatsInput,
  type SendPaymentReminderInput,
  type CountUnreadMessagesInput,
  type ToggleMessageStatusInput,
} from "@clubmanager/types/validators";

/**
 * Interfaces pour les arguments GraphQL
 */
interface GetMessagesRecusArgs {
  userId: number;
}

interface GetMessagesSupprimesArgs {
  userId: number;
  limit?: number;
}

interface CompterMessagesNonLusArgs {
  userId: number;
}

interface StatistiquesMessagesArgs {
  periode?: string;
  userId?: number;
}

interface EnvoyerMessageArgs {
  destinataires: number[];
  type_message_id: number;
  envoyerEmail?: boolean;
}

interface MarquerMessageCommeLuArgs {
  messageId: number;
}

interface SupprimerMessageArgs {
  messageId: number;
  userId: number;
}

interface SupprimerDefinitivementArgs {
  messageId: number;
}

interface RestaurerMessageArgs {
  messageId: number;
}

interface DesactiverMessageArgs {
  messageId: number;
}

interface ReactiverMessageArgs {
  messageId: number;
}

interface EnvoyerRappelPaiementArgs {
  echeanceIds: number[];
  messagePersonnalise?: string;
}

interface GetTypeMessageArgs {
  id: number;
}

interface CreerTypeMessageArgs {
  title: string;
  content: string;
}

interface ModifierTypeMessageArgs {
  id: number;
  title: string;
  content: string;
}

interface SupprimerTypeMessageArgs {
  id: number;
}

/**
 * Resolvers GraphQL pour Messages
 */
export const messagesResolvers = {
  Query: {
    /**
     * ✅ Récupérer les messages reçus par un utilisateur
     * @requires Auth
     * @sentry enabled
     */
    messagesRecus: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetMessagesRecusArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Query: messagesRecus", {
          userId: args.userId,
          requestedBy: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(getUserMessagesSchema, {
          userId: args.userId,
        });

        // Vérification de sécurité : un utilisateur ne peut voir que ses propres messages
        // sauf s'il est admin
        if (
          context.user?.id !== validatedArgs.userId &&
          context.user?.role !== "admin"
        ) {
          throw new ValidationError(
            "Vous ne pouvez accéder qu'à vos propres messages",
          );
        }

        const result = await messagesPersonnalisesService.getMessagesRecus(
          validatedArgs.userId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la récupération des messages",
          );
        }

        return result.data || [];
      },
    ),

    /**
     * ✅ Récupérer les messages supprimés par un utilisateur
     * @requires Auth
     * @sentry enabled
     */
    messagesSupprimes: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetMessagesSupprimesArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Query: messagesSupprimes", {
          userId: args.userId,
          limit: args.limit,
        });

        // Validation
        const validatedArgs = validateInput(getUserMessagesSchema, args);

        // Vérification de sécurité
        if (
          context.user?.id !== validatedArgs.userId &&
          context.user?.role !== "admin"
        ) {
          throw new ValidationError(
            "Vous ne pouvez accéder qu'à vos propres messages",
          );
        }

        const result = await messagesPersonnalisesService.getMessagesSupprimes(
          validatedArgs.userId,
          validatedArgs.limit,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message ||
              "Erreur lors de la récupération des messages supprimés",
          );
        }

        return result.data || [];
      },
    ),

    /**
     * ✅ Récupérer les messages inactifs (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    messagesInactifs: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(async (_parent: any, _args: any, _context: GraphQLContext) => {
      console.log("🔍 [GraphQL] Query: messagesInactifs");

      const result = await messagesPersonnalisesService.getMessagesInactifs();

      if (!result.success) {
        throw new InternalServerError(
          result.message ||
            "Erreur lors de la récupération des messages inactifs",
        );
      }

      return result.data || [];
    }),

    /**
     * ✅ Compter les messages non lus d'un utilisateur
     * @requires Auth
     * @sentry enabled
     */
    compterMessagesNonLus: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: CompterMessagesNonLusArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Query: compterMessagesNonLus", {
          userId: args.userId,
        });

        // Validation
        const validatedArgs = validateInput(countUnreadMessagesSchema, {
          userId: args.userId,
        });

        // Vérification de sécurité
        if (
          context.user?.id !== validatedArgs.userId &&
          context.user?.role !== "admin"
        ) {
          throw new ValidationError(
            "Vous ne pouvez accéder qu'à vos propres statistiques",
          );
        }

        const result = await messagesPersonnalisesService.compterMessagesNonLus(
          validatedArgs.userId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors du comptage des messages non lus",
          );
        }

        return {
          success: true,
          count: result.count || 0,
          userId: validatedArgs.userId,
        };
      },
    ),

    /**
     * ✅ Récupérer les statistiques des messages
     * @requires Auth
     * @sentry enabled
     */
    statistiquesMessages: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: StatistiquesMessagesArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Query: statistiquesMessages", {
          periode: args.periode,
          userId: args.userId,
        });

        // Validation
        const validatedArgs = validateInput(messageStatsSchema, args);

        const result =
          await messagesPersonnalisesService.getStatistiquesMessages(
            validatedArgs.periode || "mois",
          );

        if (!result.success || !result.data) {
          throw new InternalServerError(
            result.message || "Erreur lors de la récupération des statistiques",
          );
        }

        return {
          totalMessages: result.data.totalMessages || 0,
          messagesNonLus: result.data.messagesNonLus || 0,
          messagesLus: result.data.messagesLus || 0,
          messagesSupprimes: result.data.messagesSupprimes || 0,
          periode: validatedArgs.periode || "mois",
        };
      },
    ),

    /**
     * ✅ Récupérer tous les types de messages (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    typesMessages: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(async (_parent: any, _args: any, _context: GraphQLContext) => {
      console.log("🔍 [GraphQL] Query: typesMessages");

      const result = await typesMessagesService.getAllTypesMessages();

      if (!result.success) {
        throw new InternalServerError(
          result.message ||
            "Erreur lors de la récupération des types de messages",
        );
      }

      return result.data || [];
    }),

    /**
     * ✅ Récupérer un type de message par son ID (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    typeMessage: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetTypeMessageArgs,
        _context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Query: typeMessage", {
          id: args.id,
        });

        const result = await typesMessagesService.getTypeMessageById(args.id);

        if (!result.success || !result.data) {
          throw new NotFoundError("Type de message non trouvé");
        }

        return result.data;
      },
    ),
  },

  Mutation: {
    /**
     * ✅ Envoyer un message personnalisé à plusieurs destinataires
     * @requires Auth
     * @sentry enabled
     */
    envoyerMessage: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: EnvoyerMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: envoyerMessage", {
          destinataires: args.destinataires,
          type_message_id: args.type_message_id,
          envoyerEmail: args.envoyerEmail,
          userId: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(sendMessageSchema, args);

        const result = await messagesPersonnalisesService.envoyerMessage(
          validatedArgs.destinataires,
          validatedArgs.type_message_id,
          validatedArgs.envoyerEmail,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de l'envoi du message",
          );
        }

        return result;
      },
    ),

    /**
     * ✅ Marquer un message comme lu
     * @requires Auth
     * @sentry enabled
     */
    marquerMessageCommeLu: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: MarquerMessageCommeLuArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: marquerMessageCommeLu", {
          messageId: args.messageId,
          userId: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(markAsReadSchema, {
          messageId: args.messageId,
        });

        const result = await messagesPersonnalisesService.marquerCommeLu(
          validatedArgs.messageId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors du marquage du message comme lu",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Supprimer un message (soft delete)
     * @requires Auth
     * @sentry enabled
     */
    supprimerMessage: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: SupprimerMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: supprimerMessage", {
          messageId: args.messageId,
          userId: args.userId,
          requestedBy: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(deleteMessageSchema, args);

        // Vérification de sécurité
        if (
          context.user?.id !== validatedArgs.userId &&
          context.user?.role !== "admin"
        ) {
          throw new ValidationError(
            "Vous ne pouvez supprimer que vos propres messages",
          );
        }

        const result = await messagesPersonnalisesService.supprimerMessage(
          validatedArgs.messageId,
          validatedArgs.userId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la suppression du message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Supprimer définitivement un message (hard delete, Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    supprimerDefinitivement: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: SupprimerDefinitivementArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: supprimerDefinitivement", {
          messageId: args.messageId,
          userId: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(toggleMessageStatusSchema, {
          messageId: args.messageId,
        });

        const result =
          await messagesPersonnalisesService.supprimerDefinitivement(
            validatedArgs.messageId,
          );

        if (!result.success) {
          throw new InternalServerError(
            result.message ||
              "Erreur lors de la suppression définitive du message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Restaurer un message supprimé
     * @requires Auth
     * @sentry enabled
     */
    restaurerMessage: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: RestaurerMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: restaurerMessage", {
          messageId: args.messageId,
          userId: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(restoreMessageSchema, {
          messageId: args.messageId,
        });

        const result = await messagesPersonnalisesService.restaurerMessage(
          validatedArgs.messageId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la restauration du message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Désactiver un message (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    desactiverMessage: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: DesactiverMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: desactiverMessage", {
          messageId: args.messageId,
          userId: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(toggleMessageStatusSchema, {
          messageId: args.messageId,
        });

        const result = await messagesPersonnalisesService.desactiverMessage(
          validatedArgs.messageId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la désactivation du message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Réactiver un message (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    reactiverMessage: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: ReactiverMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: reactiverMessage", {
          messageId: args.messageId,
          userId: context.user?.id,
        });

        // Validation
        const validatedArgs = validateInput(toggleMessageStatusSchema, {
          messageId: args.messageId,
        });

        const result = await messagesPersonnalisesService.reactiverMessage(
          validatedArgs.messageId,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la réactivation du message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Envoyer un rappel de paiement (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    envoyerRappelPaiement: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: EnvoyerRappelPaiementArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: envoyerRappelPaiement", {
          echeanceIds: args.echeanceIds,
          hasCustomMessage: !!args.messagePersonnalise,
          userId: context.user?.id,
        });

        // Validation avec les IDs d'échéances
        const echeanceIds = Array.isArray(args.echeanceIds)
          ? args.echeanceIds
          : [args.echeanceIds];

        const result = await messagesPersonnalisesService.envoyerRappelPaiement(
          echeanceIds,
          args.messagePersonnalise || "",
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de l'envoi du rappel de paiement",
          );
        }

        return result;
      },
    ),

    /**
     * ✅ Créer un nouveau type de message (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    creerTypeMessage: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: CreerTypeMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: creerTypeMessage", {
          title: args.title,
          userId: context.user?.id,
        });

        const result = await typesMessagesService.createTypeMessage(
          args.title,
          args.content,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la création du type de message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Modifier un type de message existant (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    modifierTypeMessage: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: ModifierTypeMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: modifierTypeMessage", {
          id: args.id,
          title: args.title,
          userId: context.user?.id,
        });

        const result = await typesMessagesService.updateTypeMessage(
          args.id,
          args.title,
          args.content,
        );

        if (!result.success) {
          throw new InternalServerError(
            result.message ||
              "Erreur lors de la modification du type de message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),

    /**
     * ✅ Supprimer un type de message (Admin uniquement)
     * @requires Auth + Admin
     * @sentry enabled
     */
    supprimerTypeMessage: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: SupprimerTypeMessageArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: supprimerTypeMessage", {
          id: args.id,
          userId: context.user?.id,
        });

        const result = await typesMessagesService.deleteTypeMessage(args.id);

        if (!result.success) {
          throw new InternalServerError(
            result.message ||
              "Erreur lors de la suppression du type de message",
          );
        }

        return {
          success: true,
          message: result.message,
        };
      },
    ),
  },
};

export default messagesResolvers;
