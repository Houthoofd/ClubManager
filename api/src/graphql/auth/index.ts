/**
 * Point d'entrée du module GraphQL Auth
 * Exporte les typeDefs et resolvers pour intégration dans le serveur GraphQL
 */

import { authTypeDefs } from './auth.typeDefs.js';
import { authResolvers } from './auth.resolvers.js';

export { authTypeDefs, authResolvers };

// Export par défaut pour import groupé
export default {
  typeDefs: authTypeDefs,
  resolvers: authResolvers
};
