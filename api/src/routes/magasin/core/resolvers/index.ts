/**
 * Index des resolvers GraphQL pour le module Magasin
 * Export centralisé des resolvers
 *
 * @module magasin/resolvers
 */

export { magasinArticlesResolvers } from "./magasin.resolvers.js";

// Export combiné de tous les resolvers magasin
import { magasinArticlesResolvers } from "./magasin.resolvers.js";

export const magasinResolvers = {
  Query: {
    ...magasinArticlesResolvers.Query,
  },
  Mutation: {
    ...magasinArticlesResolvers.Mutation,
  },
};
