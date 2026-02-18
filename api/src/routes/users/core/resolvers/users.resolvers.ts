/**
 * 🔄 Resolvers GraphQL - Users
 *
 * Gère les opérations GraphQL pour users
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { UsersService } from "../services/users.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const usersService = new UsersService();

/**
 * Resolvers GraphQL pour users
 */
export const usersResolvers = {
  Query: {
    /**
     * Récupère tous les users
     */
    users: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:users");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await usersService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un user par ID
     */
    user: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:users");
      const userId = getUserIdFromContext(context);

      const result = await usersService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Users avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau user
     */
    createUsers: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:users");
      const userId = getUserIdFromContext(context);

      return await usersService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un user
     */
    updateUsers: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:users");
      const userId = getUserIdFromContext(context);

      return await usersService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un user
     */
    deleteUsers: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:users");
      const userId = getUserIdFromContext(context);

      await usersService.delete(args.id, userId);
      return { success: true, message: "Users supprimé avec succès" };
    },
  },
};

export default usersResolvers;
