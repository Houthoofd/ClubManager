/**
 * Index du dossier GraphQL
 * ✅ Export centralisé de tous les TypeDefs GraphQL
 *
 * @package @clubmanager/types
 */

// Export des TypeDefs GraphQL
// Export des TypeDefs GraphQL centralisés
export { messagesTypeDefs } from "./messages.graphql.types.js";
export { alertesTypeDefs } from "./alertes.graphql.types.js";
export { commandesTypeDefs } from "./commandes.graphql.types.js";
export { compteTypeDefs } from "./compte.graphql.types.js";
export { confirmationTypeDefs } from "./confirmation.graphql.types.js";
export { coursTypeDefs } from "./cours.graphql.types.js";
export { echeancesTypeDefs } from "./echeances.graphql.types.js";
export { informationsTypeDefs } from "./informations.graphql.types.js";
export { inscriptionTypeDefs } from "./inscription.graphql.types.js";
export { magasinTypeDefs } from "./magasin.graphql.types.js";
export { paiementsTypeDefs } from "./paiements.graphql.types.js";
export { professeursTypeDefs } from "./professeurs.graphql.types.js";
export { statistiquesTypeDefs } from "./statistiques.graphql.types.js";
export { stocksTypeDefs } from "./stocks.graphql.types.js";

// Export des types GraphQL existants
export * from "./auth.graphql.types.js";
export * from "./utilisateurs.graphql.types.js";
export * from "./verification.graphql.types.js";
export * from "./upload.graphql.types.js";

// Export des TypeDefs GraphQL
export * from "./auth.typedefs.js";
export * from "./utilisateurs.typedefs.js";
export * from "./verification.typedefs.js";
export * from "./upload.typedefs.js";

// Re-export par défaut pour faciliter l'importation groupée
export const allTypeDefs = [
  // Import dynamique si nécessaire
];
