/**
 * Point d'entrée du module GraphQL Alertes
 * Exporte les typeDefs et resolvers pour intégration dans le serveur GraphQL
 */

import { alertesTypeDefs } from './alertes.typeDefs.js';
import { alertesResolvers } from './alertes.resolvers.js';

export { alertesTypeDefs, alertesResolvers };

// Export par défaut pour import groupé
export default {
  typeDefs: alertesTypeDefs,
  resolvers: alertesResolvers
};
