/**
 * Exports du module Documents (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { documentsResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/documents.service.js";
