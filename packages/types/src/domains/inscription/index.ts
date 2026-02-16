/**
 * Inscription Domain
 */

// Base types (no validators types to avoid duplicates)
export type {
  EmailVerificationResult,
  InscriptionUtilisateurResult,
  InscriptionUtilisateurInput as InscriptionUtilisateurInputBase,
  VerificationEmailInput as VerificationEmailInputBase,
} from "./types.js";

// Service types
export * from "./service.js";

// Validators (these take precedence)
export * from "./validators.js";

// GraphQL
// export * from "./graphql.types.js"; // Importable directement si nécessaire
export { inscriptionTypeDefs } from "./graphql.typedefs.js";
