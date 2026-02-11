/**
 * Index du module GraphQL Webhooks Stripe
 * ✅ Export centralisé des resolvers et typedefs
 */

export { webhooksResolvers } from "./webhooks.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { webhooksTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./webhooks.resolvers.js";
