/**
 * Paiements Domain
 */

// Base types (paiements.ts - avoid conflict types)
export type {
  Paiement,
  EcheancePaiement,
  StatutPaiement,
  MethodePaiement,
  PaiementAvecDetails,
} from "./types.js";

// Validators
export * from "./validators.js";
export * from "./echeances.validators.js";
export * from "./confirmation.validators.js";

// GraphQL
export * from "./graphql.types.js";
export * from "./echeances.graphql.typedefs.js";
export * from "./confirmation.graphql.typedefs.js";

export { paiementsTypeDefs } from "./graphql.types.js";
export { echeancesTypeDefs } from "./echeances.graphql.typedefs.js";
export { confirmationTypeDefs } from "./confirmation.graphql.typedefs.js";
