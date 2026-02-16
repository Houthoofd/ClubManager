/**
 * Paiements Domain
 */

// Base types
export type {
  Paiement,
  EcheancePaiement,
  StatutPaiement,
  MethodePaiement,
  PaiementAvecDetails,
} from "./types.js";

// Validators
export * from "./validators.js";

// Subdomains (namespace exports)
export * as Echeances from "./echeances/index.js";
export * as Confirmation from "./confirmation/index.js";

// GraphQL types
// export * from "./graphql.types.js"; // Importable directement si nécessaire

// GraphQL typedefs
export { paiementsTypeDefs } from "./graphql.typedefs.js";
export { echeancesTypeDefs } from "./echeances/index.js";
export { confirmationTypeDefs } from "./confirmation/index.js";
