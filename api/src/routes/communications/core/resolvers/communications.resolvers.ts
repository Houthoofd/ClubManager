/**
 * 🔄 Resolvers GraphQL - Communications
 *
 * Gère les opérations GraphQL pour communications
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { CommunicationsService } from "../services/communications.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const communicationsService = new CommunicationsService();

/**
 * Resolvers GraphQL pour communications
 */
export const communicationsResolvers = {
  Query: {
    /**
     * Récupère tous les communications
     */
    communications: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:communications");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await communicationsService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un communication par ID
     */
    communication: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:communications");
      const userId = getUserIdFromContext(context);

      const result = await communicationsService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Communications avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau communication
     */
    createCommunications: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:communications");
      const userId = getUserIdFromContext(context);

      return await communicationsService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un communication
     */
    updateCommunications: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:communications");
      const userId = getUserIdFromContext(context);

      return await communicationsService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un communication
     */
    deleteCommunications: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:communications");
      const userId = getUserIdFromContext(context);

      await communicationsService.delete(args.id, userId);
      return { success: true, message: "Communications supprimé avec succès" };
    },
  },
};

export default communicationsResolvers;
