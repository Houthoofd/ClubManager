/**
 * Statistiques Domain
 */

// Base types
export type {
  FrequentationParCours,
  FrequentationParMois,
  StatistiquesFrequentation,
  ProgressionParCours,
  StatistiquesProgressionUtilisateur,
} from "./types.js";

// Validators and schemas
export {
  frequentationParCoursSchema,
  frequentationParMoisSchema,
  statistiquesFrequentationSchema,
  progressionParCoursSchema,
  statistiquesProgressionUtilisateurSchema,
} from "./validators.js";

// Service types (main source - has more complete types)
export * from "./service.js";

// GraphQL typedefs only
export { statistiquesTypeDefs } from "./graphql.typedefs.js";
