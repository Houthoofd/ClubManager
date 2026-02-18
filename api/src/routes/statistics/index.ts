/**
 * Exports du module Statistics (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { statisticsResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/statistics.service.js";
