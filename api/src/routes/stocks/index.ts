/**
 * Exports du module Stocks (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { stocksResolvers } from "./core/resolvers/index.js";

// Export des services (réutilisables)
export * from "./core/services/stocks.service.js";
