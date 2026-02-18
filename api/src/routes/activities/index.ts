/**
 * Exports du module Activities (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { activitiesResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/activities.service.js";
