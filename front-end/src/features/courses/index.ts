/**
 * Courses Feature - Main Barrel Export
 *
 * This file serves as the main entry point for the courses feature,
 * exporting all public APIs, components, hooks, types, and constants.
 *
 * Usage:
 *   import { AddCoursePage, useCours, COURSE_TYPES } from '@/features/courses';
 */

// ============================================================================
// Pages
// ============================================================================

export { default as AddCoursePage } from "./pages/AddCoursePage";
export { default as InscriptionPage } from "./pages/InscriptionPage";
export { default as ParticipantsPage } from "./pages/ParticipantsPage";

// ============================================================================
// Components
// ============================================================================

// Course Cards
export { default as CarteCours } from "./components/CarteCours";
export { default as CoursCard } from "./components/CoursCard";

// Course Forms
export { default as CoursForm } from "./components/CoursForm";
export { default as FormulaireCours } from "./components/FormulaireCours";

// Course Lists
export { default as CoursList } from "./components/CoursList";
export { default as ListeCours } from "./components/ListeCours";

// Modals
export { default as CoursModals } from "./components/CoursModals";
export { default as ModalsCours } from "./components/ModalsCours";

// Participant Components
export { default as ParticipantCard } from "./components/ParticipantCard";
export { default as ParticipantsStats } from "./components/ParticipantsStats";

// Professor Components
export { default as ProfesseurCard } from "./components/ProfesseurCard";
export { default as ProfesseurForm } from "./components/ProfesseurForm";
export { default as ProfesseursList } from "./components/ProfesseursList";

// Utility Components
export { default as SelectAllUsers } from "./components/SelectAllUsers";

// ============================================================================
// Hooks
// ============================================================================

export * from "./hooks/index";

// Named exports for commonly used hooks
export {
  // Course management hooks
  useAjouterCours,
  useModifierCours,
  useSupprimerCours,
  useJoursDeCours,
  useCours,

  // Professor hooks
  useProfesseurs,
  useAjouterProfesseur,
  useModifierProfesseur,
  useSupprimerProfesseur,

  // Inscription hooks
  useInscriptionsCours,
  useInscriptionsUtilisateur,
  useInscrireUtilisateurCours,
  useAnnulerInscription,
  useInscriptionValidation,

  // Participant hooks
  useParticipants,
  useParticipantsCours,
} from "./hooks/index";

// ============================================================================
// Types
// ============================================================================

export type {
  // Feature-specific types
  CoursFormData,
  CoursModificationData,
  PlanningCheckOptions,
  ProfesseurDissociation,
  ParticipantEnrollment,
  CoursStats,
  InscriptionValidation,
  CoursFilters,
  CoursSortBy,
  SortDirection,
  CoursSortOptions,
} from "./types";

// ============================================================================
// Constants
// ============================================================================

export {
  // Course types
  COURSE_TYPES,
  COURSE_TYPE_OPTIONS,
  COURSE_TYPE_LABELS,

  // Days
  DAYS_OF_WEEK,
  DAYS_OF_WEEK_OPTIONS,
  DAY_ABBREVIATIONS,
  DAY_ORDER,

  // Time slots
  TIME_SLOTS,
  DEFAULT_COURSE_DURATION,
  MIN_COURSE_DURATION,
  MAX_COURSE_DURATION,

  // Inscription status
  INSCRIPTION_STATUS,
  INSCRIPTION_STATUS_LABELS,
  INSCRIPTION_STATUS_COLORS,

  // Validation rules
  MAX_PARTICIPANTS_PER_COURSE,
  MIN_PARTICIPANTS_TO_RUN,
  MAX_COURSES_PER_PARTICIPANT_PER_WEEK,
  MIN_CANCELLATION_NOTICE_HOURS,
  MIN_PROFESSORS_PER_COURSE,
  MAX_PROFESSORS_PER_COURSE,

  // UI constants
  COURSE_TABS,
  COURSE_TAB_LABELS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,

  // Messages
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,

  // API/GraphQL
  QUERY_KEYS,
  MUTATION_KEYS,
  CACHE_INVALIDATION_DELAY,

  // Feature flags
  FEATURES,

  // All constants grouped
  COURSES_CONSTANTS,
} from "./constants";

// ============================================================================
// Routes
// ============================================================================

export { default as coursesRoutes } from "./routes";
