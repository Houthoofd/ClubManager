/**
 * Exports du module Auth (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { authResolvers, authTypeDefs } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/index.js";
