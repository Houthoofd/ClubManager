/**
 * Index du module GraphQL Gdpr
 * ✅ Export centralisé des resolvers et typedefs
 */

export { gdprResolvers } from "./gdpr.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { gdprTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./gdpr.resolvers.js";
