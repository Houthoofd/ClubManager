/**
 * Exports du module auth
 * Module migré vers GraphQL
 */

// Export des resolvers et typeDefs GraphQL
export { authResolvers, authTypeDefs } from "./core/resolvers/index.js";

// Export de l'ancien router REST (à supprimer après migration complète)
export { default } from "./auth.routes.js";
export { default as authRouter } from "./auth.routes.js";
