/**
 * Exports du module Settings (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { settingsResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/settings.service.js";
