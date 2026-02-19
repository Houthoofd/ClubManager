/**
 * Types for the Courses feature
 *
 * This file contains all TypeScript types and interfaces used in the courses domain.
 */

// ============================================================================
// Feature-Specific Types
// ============================================================================

/**
 * Form data for creating or editing a course
 */
export interface CoursFormData {
  nom?: string;
  type_cours: string | null;
  jour_semaine: string | null;
  heure_debut: string;
  heure_fin: string;
  professeurs: Array<{ id: number; name: string }>;
}

/**
 * Extended course data with original values for modification tracking
 */
export interface CoursModificationData extends CoursFormData {
  jour_original?: string;
  type_cours_original?: string;
  heure_debut_original?: string;
  heure_fin_original?: string;
}

/**
 * Planning conflict check options
 */
export interface PlanningCheckOptions {
  excludeOriginal?: boolean;
  originalJour?: string;
  originalType?: string;
  originalHeureDebut?: string;
  originalHeureFin?: string;
}

/**
 * Professor dissociation data
 */
export interface ProfesseurDissociation {
  cours: any; // TODO: Type this properly with Cours type
  prof: {
    id: number;
    name: string;
  };
  isLastProfessor?: boolean;
}

/**
 * Participant enrollment data
 */
export interface ParticipantEnrollment {
  userId: number;
  userName: string;
  coursId: number;
  coursName: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
}

/**
 * Course statistics
 */
export interface CoursStats {
  totalCours: number;
  totalInscriptions: number;
  averageParticipants: number;
  coursParJour: Record<string, number>;
  inscriptionsParStatut: Record<string, number>;
}

/**
 * Inscription validation result
 */
export interface InscriptionValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Course filter options
 */
export interface CoursFilters {
  jour?: string | null;
  typeCours?: string | null;
  professeur?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
}

/**
 * Course sort options
 */
export type CoursSortBy = "jour" | "heure" | "type" | "professeur";
export type SortDirection = "asc" | "desc";

export interface CoursSortOptions {
  sortBy: CoursSortBy;
  direction: SortDirection;
}
