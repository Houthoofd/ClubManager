/**
 * Exports du module Memberships (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { membershipsResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/memberships.service.js";
