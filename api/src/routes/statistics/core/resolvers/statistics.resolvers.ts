/**
 * 🔄 Resolvers GraphQL - Statistics
 *
 * Gère les opérations GraphQL pour statistics
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { StatisticsService } from "../services/statistics.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const statisticsService = new StatisticsService();

/**
 * Resolvers GraphQL pour statistics
 */
export const statisticsResolvers = {
  Query: {
    /**
     * Récupère tous les statistics
     */
    statistics: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:statistics");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await statisticsService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un statistic par ID
     */
    statistic: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:statistics");
      const userId = getUserIdFromContext(context);

      const result = await statisticsService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Statistics avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau statistic
     */
    createStatistics: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:statistics");
      const userId = getUserIdFromContext(context);

      return await statisticsService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un statistic
     */
    updateStatistics: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:statistics");
      const userId = getUserIdFromContext(context);

      return await statisticsService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un statistic
     */
    deleteStatistics: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:statistics");
      const userId = getUserIdFromContext(context);

      await statisticsService.delete(args.id, userId);
      return { success: true, message: "Statistics supprimé avec succès" };
    },
  },
};

export default statisticsResolvers;
