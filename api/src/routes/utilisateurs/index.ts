/**
 * Index du module Utilisateurs
 * Module migré vers GraphQL
 */

// Export des resolvers et typeDefs GraphQL
export {
  utilisateursResolvers,
  utilisateursTypeDefs,
} from "./core/resolvers/index.js";

// Export de l'ancien router REST (à supprimer après migration complète)
export { default } from "./utilisateurs.routes.js";
export { default as utilisateursRouter } from "./utilisateurs.routes.js";
