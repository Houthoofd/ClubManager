/**
 * Exports du module Magasin (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { magasinResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/index.js";
