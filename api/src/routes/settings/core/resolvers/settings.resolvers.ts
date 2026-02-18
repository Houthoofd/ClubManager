/**
 * 🔄 Resolvers GraphQL - Settings
 *
 * Gère les opérations GraphQL pour settings
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { SettingsService } from "../services/settings.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const settingsService = new SettingsService();

/**
 * Resolvers GraphQL pour settings
 */
export const settingsResolvers = {
  Query: {
    /**
     * Récupère tous les settings
     */
    settings: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:settings");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await settingsService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un setting par ID
     */
    setting: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:settings");
      const userId = getUserIdFromContext(context);

      const result = await settingsService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Settings avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau setting
     */
    createSettings: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:settings");
      const userId = getUserIdFromContext(context);

      return await settingsService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un setting
     */
    updateSettings: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:settings");
      const userId = getUserIdFromContext(context);

      return await settingsService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un setting
     */
    deleteSettings: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:settings");
      const userId = getUserIdFromContext(context);

      await settingsService.delete(args.id, userId);
      return { success: true, message: "Settings supprimé avec succès" };
    },
  },
};

export default settingsResolvers;
