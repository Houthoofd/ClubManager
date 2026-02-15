/**
 * Magasin Domain
 */

// Base types (all from types.ts)
export * from "./types.js";

// Compatibility aliases (old names)
export type {
  Categorie as MagasinCategorie,
  Commande as MagasinCommande,
} from "./types.js";

// GraphQL typedefs only
export { magasinTypeDefs } from "./graphql.typedefs.js";
export { stocksTypeDefs } from "./stock.graphql.typedefs.js";
