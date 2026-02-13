/**
 * Exports du module Utilisateurs (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { utilisateursResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/utilisateurs.service.js";
