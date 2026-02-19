// ============================================================================
// Teachers Feature Hooks - Barrel Export
// ============================================================================

/**
 * This file re-exports teacher-related hooks from the courses feature hooks
 * to provide a feature-specific interface while maintaining consistency
 * with the existing GraphQL hooks infrastructure.
 *
 * Note: Teacher hooks are currently located in features/courses/hooks
 * as teachers are instructors for courses.
 */

// Re-export from courses feature hooks
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
} from '@/features/courses/hooks/useProfesseurs';

// ============================================================================
// Feature-specific types for hooks
// ============================================================================

export type {
  Teacher,
  TeacherListItem,
  CreateTeacherInput,
  UpdateTeacherInput,
  PromotionResult,
  PromoteTeachersInput,
  RemovePromotionInput,
  VerifyTeachersResult,
  VerifyTeachersInput,
  PlanningCourse,
  PlanningStatistics,
  PlanningFilter,
} from '../types';

// ============================================================================
// Additional hook utilities
// ============================================================================

/**
 * Utility type for teacher hooks return values
 */
export type UseTeachersReturn = {
  teachers: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Utility type for teacher mutation hooks
 */
export type UseTeacherMutationReturn = {
  execute: (...args: any[]) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};
