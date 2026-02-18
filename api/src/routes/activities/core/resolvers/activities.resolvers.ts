/**
 * 🔄 Resolvers GraphQL - Activities
 *
 * Gère les opérations GraphQL pour activities
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { ActivitiesService } from "../services/activities.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const activitiesService = new ActivitiesService();

/**
 * Resolvers GraphQL pour activities
 */
export const activitiesResolvers = {
  Query: {
    /**
     * Récupère tous les activities
     */
    activities: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:activities");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await activitiesService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un activitie par ID
     */
    activitie: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:activities");
      const userId = getUserIdFromContext(context);

      const result = await activitiesService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Activities avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau activitie
     */
    createActivities: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:activities");
      const userId = getUserIdFromContext(context);

      return await activitiesService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un activitie
     */
    updateActivities: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:activities");
      const userId = getUserIdFromContext(context);

      return await activitiesService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un activitie
     */
    deleteActivities: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:activities");
      const userId = getUserIdFromContext(context);

      await activitiesService.delete(args.id, userId);
      return { success: true, message: "Activities supprimé avec succès" };
    },
  },
};

export default activitiesResolvers;
