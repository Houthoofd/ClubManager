/**
 * Index du module GraphQL Memberships
 * ✅ Export centralisé des resolvers et typedefs
 */

export { membershipsResolvers } from "./memberships.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { membershipsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./memberships.resolvers.js";
