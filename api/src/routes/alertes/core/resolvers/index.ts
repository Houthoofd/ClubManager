/**
 * Index du module GraphQL Alertes
 * ✅ Export centralisé des resolvers et typedefs
 */

export { alertesResolvers } from "./alertes.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { alertesTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./alertes.resolvers.js";
