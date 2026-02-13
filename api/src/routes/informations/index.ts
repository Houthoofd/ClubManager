/**
 * Exports du module Informations (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { informationsResolvers } from "./core/resolvers/index.js";

// Note: Les services sont importés depuis un chemin legacy
// TODO: Migrer les services vers core/services/ pour uniformiser la structure
