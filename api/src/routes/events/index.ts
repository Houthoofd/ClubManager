/**
 * Exports du module Events (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { eventsResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/events.service.js";
