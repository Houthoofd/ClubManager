/**
 * Courses Components - Barrel Export
 *
 * Re-exports all components for the courses feature.
 * Centralizes component imports for cleaner imports elsewhere.
 *
 * Usage:
 *   import { CoursCard, CoursForm, ParticipantCard } from '@/features/courses/components';
 */

// ============================================================================
// Atomic Components (NEW - Modular Architecture)
// ============================================================================

export { CourseCard } from "./CourseCard";
export { CourseList } from "./CourseList";
export { CourseSearch } from "./CourseSearch";
export { EmptyCourseState } from "./EmptyCourseState";

// ============================================================================
// Course Cards (Legacy)
// ============================================================================

export { default as CarteCours } from "./CarteCours";
export { default as CoursCard } from "./CoursCard";

// ============================================================================
// Course Forms
// ============================================================================

export { default as CoursForm } from "./CoursForm";
export { default as FormulaireCours } from "./FormulaireCours";

// ============================================================================
// Course Lists (Legacy)
// ============================================================================

export { default as CoursList } from "./CoursList";
export { default as ListeCours } from "./ListeCours";

// ============================================================================
// Modals
// ============================================================================

export { default as CoursModals } from "./CoursModals";
export { default as ModalsCours } from "./ModalsCours";

// ============================================================================
// Participant Components
// ============================================================================

export { default as ParticipantCard } from "./ParticipantCard";
export { default as ParticipantsStats } from "./ParticipantsStats";

// ============================================================================
// Professor Components
// ============================================================================

export { default as ProfesseurCard } from "./ProfesseurCard";
export { default as ProfesseurForm } from "./ProfesseurForm";
export { default as ProfesseursList } from "./ProfesseursList";

// ============================================================================
// Utility Components
// ============================================================================

export { default as SelectAllUsers } from "./SelectAllUsers";

// ============================================================================
// Sub-folder Components
// ============================================================================

// Note: inscription and planning subfolder components can be added here if needed
// export * from './inscription';
// export * from './planning';
