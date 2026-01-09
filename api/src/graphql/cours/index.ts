/**
 * Module GraphQL pour Cours
 *
 * Point d'entrée pour les définitions de types et resolvers GraphQL
 * du module de gestion des cours de karaté.
 */

import { coursTypeDefs } from "./cours.typeDefs.js";
import { coursResolvers } from "./cours.resolvers.js";

export { coursTypeDefs, coursResolvers };

// Export par défaut pour import groupé
export default {
  typeDefs: coursTypeDefs,
  resolvers: coursResolvers,
};
