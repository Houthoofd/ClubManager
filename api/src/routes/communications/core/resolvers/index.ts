/**
 * Index du module GraphQL Communications
 * ✅ Export centralisé des resolvers et typedefs
 */

import { messagesResolvers } from "./messages.resolvers.js";
import { notificationsResolvers } from "./notifications.resolvers.js";
import { communicationsResolvers } from "./communications.resolvers.js";

// Merger tous les resolvers
export const combinedCommunicationsResolvers = {
  Query: {
    ...messagesResolvers.Query,
    ...notificationsResolvers.Query,
    ...communicationsResolvers.Query,
  },
  Mutation: {
    ...messagesResolvers.Mutation,
    ...notificationsResolvers.Mutation,
    ...communicationsResolvers.Mutation,
  },
};

// Export des resolvers individuels
export { messagesResolvers } from "./messages.resolvers.js";
export { notificationsResolvers } from "./notifications.resolvers.js";
export { communicationsResolvers } from "./communications.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { communicationsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export default combinedCommunicationsResolvers;
