/**
 * 🔄 Resolvers GraphQL - Events
 *
 * Gère les opérations GraphQL pour events
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { EventsService } from "../services/events.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const eventsService = new EventsService();

/**
 * Resolvers GraphQL pour events
 */
export const eventsResolvers = {
  Query: {
    /**
     * Récupère tous les events
     */
    events: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:events");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await eventsService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un event par ID
     */
    event: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:events");
      const userId = getUserIdFromContext(context);

      const result = await eventsService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Events avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau event
     */
    createEvents: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:events");
      const userId = getUserIdFromContext(context);

      return await eventsService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un event
     */
    updateEvents: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:events");
      const userId = getUserIdFromContext(context);

      return await eventsService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un event
     */
    deleteEvents: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:events");
      const userId = getUserIdFromContext(context);

      await eventsService.delete(args.id, userId);
      return { success: true, message: "Events supprimé avec succès" };
    },
  },
};

export default eventsResolvers;
