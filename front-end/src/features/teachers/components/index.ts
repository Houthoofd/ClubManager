/**
 * Teachers Components - Barrel Export
 *
 * Re-exports all components for the teachers feature.
 * Centralizes component imports for cleaner imports elsewhere.
 *
 * Usage:
 *   import { CoursCard, PlanningGrid, PlanningFilter } from '@/features/teachers/components';
 */

// ============================================================================
// Course Components
// ============================================================================

export { default as CoursCard } from "./CoursCard";

// ============================================================================
// Planning Components
// ============================================================================

export { default as PlanningFilter } from "./PlanningFilter";
export { default as PlanningGrid } from "./PlanningGrid";
export { default as PlanningStatistics } from "./PlanningStatistics";

// ============================================================================
// Teacher Management Components (Atomic/Modular)
// ============================================================================

export { TeacherCard, default as TeacherCardDefault } from "./TeacherCard";
export type { TeacherCardProps, TeacherCardInfoRowProps } from "./TeacherCard";

export { TeacherList, default as TeacherListDefault } from "./TeacherList";
export type { TeacherListProps } from "./TeacherList";

export { TeacherSearch, default as TeacherSearchDefault } from "./TeacherSearch";
export type { TeacherSearchProps } from "./TeacherSearch";

export { EmptyTeacherState, default as EmptyTeacherStateDefault } from "./EmptyTeacherState";
export type { EmptyTeacherStateProps } from "./EmptyTeacherState";
