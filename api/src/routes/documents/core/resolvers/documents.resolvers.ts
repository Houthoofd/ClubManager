/**
 * 🔄 Resolvers GraphQL - Documents
 *
 * Gère les opérations GraphQL pour documents
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { DocumentsService } from "../services/documents.service.js";
import { getUserIdFromContext, requirePermission } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

const documentsService = new DocumentsService();

/**
 * Resolvers GraphQL pour documents
 */
export const documentsResolvers = {
  Query: {
    /**
     * Récupère tous les documents
     */
    documents: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:documents");
      const userId = getUserIdFromContext(context);

      const { limit = 50, offset = 0 } = args;
      return await documentsService.findAll({ limit, offset, userId });
    },

    /**
     * Récupère un document par ID
     */
    document: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "read:documents");
      const userId = getUserIdFromContext(context);

      const result = await documentsService.findById(args.id, userId);
      if (!result) {
        throw new NotFoundError(`Documents avec l'ID ${args.id} introuvable`);
      }
      return result;
    },
  },

  Mutation: {
    /**
     * Crée un nouveau document
     */
    createDocuments: async (
      _parent: unknown,
      args: { input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "create:documents");
      const userId = getUserIdFromContext(context);

      return await documentsService.create({ ...args.input, userId });
    },

    /**
     * Met à jour un document
     */
    updateDocuments: async (
      _parent: unknown,
      args: { id: number; input: any },
      context: GraphQLContext
    ) => {
      requirePermission(context, "update:documents");
      const userId = getUserIdFromContext(context);

      return await documentsService.update(args.id, { ...args.input, userId });
    },

    /**
     * Supprime un document
     */
    deleteDocuments: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requirePermission(context, "delete:documents");
      const userId = getUserIdFromContext(context);

      await documentsService.delete(args.id, userId);
      return { success: true, message: "Documents supprimé avec succès" };
    },
  },
};

export default documentsResolvers;
