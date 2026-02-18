/**
 * Exports du module Communications (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { communicationsResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/communications.service.js";
