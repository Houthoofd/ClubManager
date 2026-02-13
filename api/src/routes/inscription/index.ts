/**
 * Exports du module Inscription (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { inscriptionResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/inscription.service.js";
