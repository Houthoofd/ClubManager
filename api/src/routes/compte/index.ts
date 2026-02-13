/**
 * Exports du module Compte (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL
export { compteResolvers } from "./core/resolvers/index.js";

// Note: Les services sont importés depuis un chemin legacy
// TODO: Migrer les services vers core/services/ pour uniformiser la structure
