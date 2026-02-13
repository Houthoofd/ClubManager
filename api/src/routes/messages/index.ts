/**
 * Exports du module Messages (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { messagesResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/index.js";
