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

export { default as CoursCard } from './CoursCard';

// ============================================================================
// Planning Components
// ============================================================================

export { default as PlanningFilter } from './PlanningFilter';
export { default as PlanningGrid } from './PlanningGrid';
export { default as PlanningStatistics } from './PlanningStatistics';
