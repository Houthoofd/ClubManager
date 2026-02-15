/**
 * Statistiques Domain
 */

// Base types (only non-conflicting ones)
export type {
  StatistiquesFrequentation,
} from "./types.js";

export {
  frequentationParCoursSchema,
  frequentationParMoisSchema,
  statistiquesFrequentationSchema,
  progressionParCoursSchema,
  statistiquesProgressionUtilisateurSchema,
} from "./types.js";

// Service types (main source - has more complete types)
export * from "./service.js";

// GraphQL typedefs only
export { statistiquesTypeDefs } from "./graphql.types.js";
