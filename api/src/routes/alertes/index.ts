/**
 * Exports du module Alertes (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { alertesResolvers, alertesTypeDefs } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/alertes.service.js";
