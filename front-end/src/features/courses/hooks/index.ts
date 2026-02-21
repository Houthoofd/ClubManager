/**
 * Courses Hooks Module
 *
 * Centralized course, session, enrollment, and instructor management hooks
 * All hooks migrated to GraphQL/Apollo Client
 */

// ============================================================================
// Business Logic Hooks (NEW - Modular Architecture)
// ============================================================================
export { useCourseSearch } from "./useCourseSearch";

// ============================================================================
// Sessions Hooks
// ============================================================================
export {
  useSessions,
  useSessionById,
  useSessionTypes,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  // Legacy aliases
  useCours,
  useCoursPlanning,
  useJoursDeCours,
  useAjouterCours,
  useModifierCours,
  useSupprimerCours,
} from "./useCours";

// ============================================================================
// Enrollments Hooks
// ============================================================================
export {
  useSessionEnrollments,
  useUserEnrollments,
  useEnrollUser,
  useCancelEnrollment,
  useUpdateEnrollmentStatus,
  useValidatePresence,
  useCancelPresence,
  // Legacy aliases
  useInscriptionsUtilisateur,
  useInscriptionsCours,
  useInscrireUtilisateurCours,
  useAnnulerInscription,
  useValiderPresence,
  useAnnulerPresence,
} from "./useInscriptions";

// ============================================================================
// Participants Hooks
// ============================================================================
export {
  useParticipants,
  useUserSessions,
  useParticipantCount,
  useIsUserEnrolled,
  useConfirmedParticipants,
  usePendingParticipants,
  // Legacy aliases
  useParticipantsCours,
  useCoursUtilisateur,
} from "./useParticipants";

// ============================================================================
// Instructors Hooks
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
} from "./useProfesseurs";

// ============================================================================
// Validation Hooks (Client-side only)
// ============================================================================
export { useInscriptionValidation } from "./useInscriptionValidation";
