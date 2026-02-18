/**
 * Utils Module Exports
 *
 * This barrel file exports all utility hooks:
 * - Informations (reference data: grades, statuses, genders, subscriptions)
 * - Upload (file upload utilities)
 * - Toast (notification system)
 * - Email Debug (email testing utilities)
 * - Alerts (system alerts and warnings)
 */

// ============================================================================
// Reference Data / Informations
// ============================================================================

export {
  useGrades,
  useStatuses,
  useGenders,
  useSubscriptions,
  useAllReferenceData,
  // Legacy aliases
  useAbonnements,
  useGenres,
  useStatus,
} from "./useInformations";

// ============================================================================
// File Upload
// ============================================================================

export {
  useFileUpload,
  useImageUpload,
  useMultipleImageUpload,
} from "./useUpload";

// ============================================================================
// Toast Notifications
// ============================================================================

export { useToast } from "./useToast";
export type { ToastVariant, ToastOptions } from "./useToast";

// ============================================================================
// Email Debug
// ============================================================================

export { useEmailDebug } from "./useEmailDebug";

// ============================================================================
// Alerts
// ============================================================================

export {
  useDashboardAlertes,
  useAlertesActives,
  useAlertesUtilisateur,
  useStatistiquesAlertes,
  useDetecterAlertes,
  useResoudreAlerte,
  useIgnorerAlerte,
  useCreerAlerte,
} from "./useAlertes";
