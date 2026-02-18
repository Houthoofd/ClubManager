/**
 * 🔄 Resolvers GraphQL - Gdpr
 *
 * Gère les opérations GraphQL pour gdpr
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { GdprService } from "../services/gdpr.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const gdprService = new GdprService();

/**
 * Resolvers GraphQL pour gdpr
 */
export const gdprResolvers = {
  Query: {
    /**
     * Récupère tous les gdprs
     */
    gdpr: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:gdpr");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await gdprService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un gdpr par ID
     */
    gdpr: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:gdpr");
      const userId = getUserIdFromContext(context);

      const result = await gdprService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Gdpr avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau gdpr
     */
    createGdpr: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:gdpr");
      const userId = getUserIdFromContext(context);

      return await gdprService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un gdpr
     */
    updateGdpr: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:gdpr");
      const userId = getUserIdFromContext(context);

      return await gdprService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un gdpr
     */
    deleteGdpr: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:gdpr");
      const userId = getUserIdFromContext(context);

      await gdprService.delete(args.id, userId);
      return { success: true, message: "Gdpr supprimé avec succès" };
    },
  },
};

export default gdprResolvers;
