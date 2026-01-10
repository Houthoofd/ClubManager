/**
 * Module GraphQL pour Informations
 *
 * Point d'entrée pour les définitions de types et resolvers GraphQL
 * du module de gestion des informations/actualités du club.
 */

export { informationsTypeDefs } from './informations.typeDefs.js';
export { informationsResolvers } from './informations.resolvers.js';

// Export par défaut pour import groupé
export default {
  typeDefs: informationsTypeDefs,
  resolvers: informationsResolvers,
};
