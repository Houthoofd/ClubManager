/**
 * 🔄 Resolvers GraphQL - Shop
 *
 * Gère les opérations GraphQL pour shop
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { ShopService } from "../services/shop.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const shopService = new ShopService();

/**
 * Resolvers GraphQL pour shop
 */
export const shopResolvers = {
  Query: {
    /**
     * Récupère tous les shops
     */
    shop: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:shop");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await shopService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un shop par ID
     */
    shop: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:shop");
      const userId = getUserIdFromContext(context);

      const result = await shopService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Shop avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau shop
     */
    createShop: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:shop");
      const userId = getUserIdFromContext(context);

      return await shopService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un shop
     */
    updateShop: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:shop");
      const userId = getUserIdFromContext(context);

      return await shopService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un shop
     */
    deleteShop: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:shop");
      const userId = getUserIdFromContext(context);

      await shopService.delete(args.id, userId);
      return { success: true, message: "Shop supprimé avec succès" };
    },
  },
};

export default shopResolvers;
