/**
 * Point d'entrée pour le module GraphQL Commandes
 * Exporte les typeDefs et resolvers
 */

export { commandesTypeDefs } from './commandes.typeDefs.js';
export { commandesResolvers } from './commandes.resolvers.js';

/**
 * Export par défaut combiné
 */
export default {
  typeDefs: commandesTypeDefs,
  resolvers: commandesResolvers,
};
