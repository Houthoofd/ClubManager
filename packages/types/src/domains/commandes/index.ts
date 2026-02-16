/**
 * Commandes Domain
 */

// ============================================================================
// BASE TYPES (from commandes.ts)
// ============================================================================
export type {
  Commande as CommandeBase,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeComplete,
} from "./types.js";

// ============================================================================
// SERVICE TYPES (from commandes-service.ts)
// ============================================================================
export type {
  Commande,
  CommandeArticle,
  CommandeStatut,
  CreateCommandeInput,
  UpdateCommandeInput,
  CommandeResult,
  CommandeStats,
  CommandeCountByStatut,
  CommandeSearchFilters,
  CommandeSearchResult,
} from "./service.js";

// ============================================================================
// VALIDATORS
// ============================================================================
export * from "./validators.js";

// ============================================================================
// GRAPHQL
// ============================================================================
// export * from "./graphql.types.js"; // Importable directement si nécessaire
export { commandesTypeDefs } from "./graphql.typedefs.js";
