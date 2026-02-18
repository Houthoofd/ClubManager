/**
 * Exports du module Gdpr (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { gdprResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/gdpr.service.js";
