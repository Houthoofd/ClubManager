/**
 * Exports du module Users (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { usersResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/users.service.js";
