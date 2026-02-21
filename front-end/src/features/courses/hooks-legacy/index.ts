/**
 * Courses Hooks - Barrel Export
 *
 * Re-exports course, session, and enrollment management hooks from features/courses.
 */

export {
  useCours,
  useInscriptionsCours,
  useParticipants,
  useProfesseurs,
  useInscriptionValidation,
} from "@/features/courses/hooks";
