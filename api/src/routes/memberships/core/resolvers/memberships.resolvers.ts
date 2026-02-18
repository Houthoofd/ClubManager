/**
 * 🔄 Resolvers GraphQL - Memberships
 *
 * Gère les opérations GraphQL pour memberships
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { MembershipsService } from "../services/memberships.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const membershipsService = new MembershipsService();

/**
 * Resolvers GraphQL pour memberships
 */
export const membershipsResolvers = {
  Query: {
    /**
     * Récupère tous les memberships
     */
    memberships: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:memberships");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await membershipsService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un membership par ID
     */
    membership: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:memberships");
      const userId = getUserIdFromContext(context);

      const result = await membershipsService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Memberships avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau membership
     */
    createMemberships: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:memberships");
      const userId = getUserIdFromContext(context);

      return await membershipsService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un membership
     */
    updateMemberships: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:memberships");
      const userId = getUserIdFromContext(context);

      return await membershipsService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un membership
     */
    deleteMemberships: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:memberships");
      const userId = getUserIdFromContext(context);

      await membershipsService.delete(args.id, userId);
      return { success: true, message: "Memberships supprimé avec succès" };
    },
  },
};

export default membershipsResolvers;
