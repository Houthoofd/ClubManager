/**
 * Index du module GraphQL Audit
 * ✅ Export centralisé des resolvers et typedefs
 */

export { auditResolvers } from "./audit.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { auditTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./audit.resolvers.js";
