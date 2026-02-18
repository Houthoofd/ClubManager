/**
 * 🔄 Resolvers GraphQL - Audit
 *
 * Gère les opérations GraphQL pour audit
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { AuditService } from "../services/audit.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const auditService = new AuditService();

/**
 * Resolvers GraphQL pour audit
 */
export const auditResolvers = {
  Query: {
    /**
     * Récupère tous les audits
     */
    audit: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:audit");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await auditService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un audit par ID
     */
    audit: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:audit");
      const userId = getUserIdFromContext(context);

      const result = await auditService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Audit avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau audit
     */
    createAudit: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:audit");
      const userId = getUserIdFromContext(context);

      return await auditService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un audit
     */
    updateAudit: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:audit");
      const userId = getUserIdFromContext(context);

      return await auditService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un audit
     */
    deleteAudit: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:audit");
      const userId = getUserIdFromContext(context);

      await auditService.delete(args.id, userId);
      return { success: true, message: "Audit supprimé avec succès" };
    },
  },
};

export default auditResolvers;
