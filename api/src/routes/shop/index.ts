/**
 * Exports du module Shop (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { shopResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/shop.service.js";
