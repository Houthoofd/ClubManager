/**
 * Exports du module Audit (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { auditResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/audit.service.js";
