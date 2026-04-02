/**
 * Professors Feature - Public API
 *
 * Point d'entrée centralisé pour la feature de gestion des professeurs.
 * Exporte uniquement ce qui doit être utilisé par les autres layers (pages, widgets, etc.).
 *
 * Règle FSD: Les features exportent leur API publique via index.ts
 */

// ============================================================================
// UI Components
// ============================================================================

export { ProfessorCard } from "./ui/ProfessorCard";
export { ProfessorsList } from "./ui/ProfessorsList";
export { ProfessorForm } from "./ui/ProfessorForm";
// export { ProfessorDetail } from './ui/ProfessorDetail'; // TODO

// ============================================================================
// Model (Hooks & State)
// ============================================================================

export {
  useProfessors,
  useProfessor,
  useCreateProfessor,
  useUpdateProfessor,
  useDeleteProfessor,
  useToggleProfessorActive,
  useProfessorPhoto,
  useProfessorStats,
  useAssignCourse,
  useUnassignCourse,
  useProfessorCourses,
  useActiveProfessors,
  useSearchProfessors,
  useAvailableProfessors,
  useCheckEmailExists,
  usePrefetchProfessor,
  useProfessorMutations,
  professorsKeys,
} from "./model/useProfessors";

// ============================================================================
// Types
// ============================================================================

export type {
  Professor,
  ProfessorWithRelations,
  ProfessorPublic,
  ProfessorListItem,
  ProfessorWithStats,
  ProfessorResponse,
  CreateProfessorData,
  UpdateProfessorData,
  SearchProfessorParams,
  AssignCourseData,
  UnassignCourseData,
  ProfessorsListResponse,
  CreateProfessorResponse,
  UpdateProfessorResponse,
  DeleteProfessorResponse,
  ProfessorStatsResponse,
  AssignCourseResponse,
  ProfessorValidationErrors,
} from "./model/types";

export {
  ProfessorStatus,
  ProfessorSortField,
  SortOrder,
  isActiveProfessor,
  hasGrade,
  hasCourses,
  getProfessorFullName,
  getProfessorInitials,
  hasPhoto,
} from "./model/types";

// ============================================================================
// API (optionnel - généralement pas exposé)
// ============================================================================

// Note: L'API n'est généralement pas exportée car elle est utilisée
// uniquement par les hooks de la feature. Si besoin dans des cas
// exceptionnels, décommenter :
// export { professorsApi } from './api/professorsApi';
