/**
 * Utils Module Exports
 *
 * This barrel file exports all utility hooks:
 * - Informations (reference data: grades, statuses, genders, subscriptions)
 * - Upload (file upload utilities)
 * - Toast (notification system)
 * - Email Debug (email testing utilities)
 * - Alerts (system alerts and warnings)
 * - Debounce (value debouncing for search, inputs)
 * - LocalStorage (persistent state management)
 * - MediaQuery (responsive breakpoints)
 * - Toggle (boolean state management)
 * - Previous (track previous values)
 */

// ============================================================================
// Debounce Hooks
// ============================================================================

export { useDebounce, useDebouncedValue, useDebouncedCallback } from "./useDebounce";

// ============================================================================
// LocalStorage Hooks
// ============================================================================

export {
  useLocalStorage,
  useLocalStorageSync,
  useLocalStorageValue,
  useLocalStorageObject,
} from "./useLocalStorage";

// ============================================================================
// Media Query Hooks
// ============================================================================

export {
  useMediaQuery,
  useMediaQueries,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsPortrait,
  useIsLandscape,
  useIsDarkMode,
  usePrefersReducedMotion,
  useIsTouchDevice,
  useBreakpoint,
  useResponsiveValue,
  BREAKPOINTS,
} from "./useMediaQuery";

// ============================================================================
// Toggle Hooks
// ============================================================================

export {
  useToggle,
  useToggleWithControls,
  useToggleWithCallbacks,
  useMultipleToggles,
  usePersistedToggle,
} from "./useToggle";

// ============================================================================
// Previous Value Hooks
// ============================================================================

export {
  usePrevious,
  usePreviousWithInitial,
  useCompare,
  useHasChanged,
  usePreviousValues,
  useHistory,
  useDeepCompareChanged,
  usePreviousDistinct,
} from "./usePrevious";

// ============================================================================
// Error Handling Hooks
// ============================================================================

export {
  useErrorHandler,
  useGraphQLErrorHandler,
  useAsyncWithErrorHandler,
  useFormWithErrorHandler,
} from "./useErrorHandler";
export type { UseErrorHandlerOptions, UseErrorHandlerReturn } from "./useErrorHandler";

// ============================================================================
// Optimistic Mutation Hooks
// ============================================================================

export { useOptimisticMutation } from "../useOptimisticMutation";

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

export { useFileUpload, useImageUpload, useMultipleImageUpload } from "./useUpload";

// ============================================================================
// Toast Notifications
// ============================================================================

export { useToast } from "../useToast";
export type { ToastVariant, ToastOptions } from "../useToast";

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
