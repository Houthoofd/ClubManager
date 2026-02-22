// ============================================================================
// Teachers Feature - Barrel Export
// ============================================================================

/**
 * Main barrel export for the Teachers feature
 * Provides a centralized entry point for all teacher-related exports
 */

// ============================================================================
// Pages
// ============================================================================
export { default as TeachersManagePage } from "./pages/TeachersManagePage.old";
export { default as TeacherPlanningPage } from "./pages/TeacherPlanningPage";

// ============================================================================
// Components
// ============================================================================
export { default as PlanningGrid } from "./components/PlanningGrid";
export { default as PlanningFilter } from "./components/PlanningFilter";
export { default as PlanningStatistics } from "./components/PlanningStatistics";
export { default as CoursCard } from "./components/CoursCard";

// ============================================================================
// Hooks
// ============================================================================
export {
  useInstructors,
  useCreateInstructor,
  useUpdateInstructor,
  useDeleteInstructor,
  useAllInstructors,
  // Legacy aliases
  useProfesseurs,
  useAjouterProfesseur,
  useModifierProfesseur,
  useSupprimerProfesseur,
} from "./hooks";

export type { UseTeachersReturn, UseTeacherMutationReturn } from "./hooks";

// ============================================================================
// Types
// ============================================================================
export type {
  Teacher,
  PlanningCourse,
  UserForPromotion,
  TeacherListItem,
  CreateTeacherInput,
  UpdateTeacherInput,
  PromotionResult,
  PromoteTeachersInput,
  RemovePromotionInput,
  VerifyTeachersResult,
  VerifyTeachersInput,
  PlanningStatistics as PlanningStatisticsType,
  PlanningFilter as PlanningFilterType,
  TeachersManagePageState,
  PlanningPageState,
  TeachersListProps,
  UserSelectionProps,
  PlanningGridProps,
  PlanningFilterProps,
  PlanningStatisticsProps,
} from "@clubmanager/types";

// ============================================================================
// Constants
// ============================================================================
export {
  TEACHER_TABS,
  TEACHER_TAB_LABELS,
  DAYS_OF_WEEK,
  FILTER_DAYS,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  INFO_MESSAGES,
  USER_STATUS,
  MESSAGE_VARIANTS,
  STATUS_COLORS,
  ACTION_ICONS,
  SEARCH_RESULTS_LIMIT,
  SEARCH_DEBOUNCE_DELAY,
  PLANNING_POLLING_INTERVAL,
  TEACHER_CLASSES,
  DEFAULT_COURSE_CAPACITY,
  CONFIRMATION_MESSAGES,
  VALIDATION_PATTERNS,
  SUCCESS_MODAL_AUTO_CLOSE_DELAY,
  PLANNING_COLORS,
} from "./constants";
