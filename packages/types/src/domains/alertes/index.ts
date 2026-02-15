/**
 * Alertes Domain
 * Types, validators, and GraphQL definitions for the alertes (alerts) system
 */

// ============================================================================
// BASE TYPES
// ============================================================================
export type {
  AlertePriorite,
  AlerteUtilisateur,
  AlerteDashboard,
} from "./types.js";

// Note: AlerteStatut and AlerteType are exported from validators as they're used there
// Use the validator versions for consistency

// ============================================================================
// VALIDATORS & ZOD SCHEMAS
// ============================================================================
export {
  AlerteTypeEnum,
  AlerteSeveriteEnum,
  AlerteStatutEnum,
  alerteIdSchema,
  userIdAlerteSchema,
  resoudreAlerteSchema,
  ignorerAlerteSchema,
  obtenirAlerteSchema,
  obtenirAlertesUtilisateurSchema,
  alerteSchema,
  creerAlerteSchema,
  mettreAJourAlerteSchema,
  filtrerAlertesSchema,
} from "./validators.js";

export type {
  AlerteIdInput,
  UserIdAlerteInput,
  ResoudreAlerteInput,
  IgnorerAlerteInput,
  ObtenirAlerteInput,
  ObtenirAlertesUtilisateurInput,
  AlerteData,
  CreerAlerteInput,
  MettreAJourAlerteInput,
  FiltrerAlertesInput,
  AlerteType,
  AlerteSeverite,
  AlerteStatut,
} from "./validators.js";

// ============================================================================
// GRAPHQL TYPES & TYPEDEFS
// ============================================================================
// Export all GraphQL types
export * from "./graphql.typedefs.js";

// Export the typedefs
export { alertesTypeDefs } from "./graphql.typedefs.js";
