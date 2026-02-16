/**
 * Magasin Domain
 */

// Base types (all from types.ts)
export * from "./types.js";

// Stock subdomain (namespace export)
export * as Stock from "./stock/index.js";

// Compatibility aliases (old names)
export type {
  Categorie as MagasinCategorie,
  Commande as MagasinCommande,
} from "./types.js";

// GraphQL typedefs
export { magasinTypeDefs } from "./graphql.typedefs.js";
export { stocksTypeDefs } from "./stock/index.js";
