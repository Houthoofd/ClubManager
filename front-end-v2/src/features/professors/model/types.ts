/**
 * Professors Feature - Type Definitions
 *
 * Types et interfaces pour la feature professors.
 * Aligné avec les types de @clubmanager/types du backend.
 */

// ============================================================================
// Professor Types
// ============================================================================

/**
 * Entité Professor complète
 */
export interface Professor {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  photo_url?: string;
  grade_id?: number | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Professor avec relations chargées
 */
export interface ProfessorWithRelations extends Professor {
  grade?: {
    id: number;
    nom: string;
    ordre: number;
    couleur?: string;
  } | null;
  cours_recurrents?: {
    id: number;
    type_cours: string;
    jour_semaine: number;
    heure_debut: string;
    heure_fin: string;
    active: boolean;
  }[];
}

/**
 * Professor pour l'affichage public
 */
export interface ProfessorPublic {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  specialite?: string;
  photo_url?: string;
  grade?: {
    nom: string;
    couleur?: string;
  };
}

/**
 * Professor pour liste/tableau
 */
export interface ProfessorListItem {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  photo_url?: string;
  actif: boolean;
  grade_nom?: string;
  grade_couleur?: string;
  nombre_cours: number;
}

/**
 * Professor avec statistiques
 */
export interface ProfessorWithStats extends Professor {
  nombre_cours_assignes: number;
  nombre_cours_actifs: number;
  prochains_cours?: {
    id: number;
    date_cours: string;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
  }[];
}

/**
 * Professor response complète avec toutes les relations
 */
export interface ProfessorResponse {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  photo_url?: string;
  actif: boolean;
  grade?: {
    id: number;
    nom: string;
    niveau?: number;
    couleur?: string;
  };
  cours_recurrents: {
    id: number;
    type_cours: string;
    jour_semaine: number;
    jour_semaine_nom: string;
    heure_debut: string;
    heure_fin: string;
    active: boolean;
  }[];
  stats: {
    nombre_cours_total: number;
    nombre_cours_actifs: number;
    prochains_cours: {
      id: number;
      type_cours: string;
      date: string;
      heure_debut: string;
      heure_fin: string;
    }[];
  };
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// Form & Input Types
// ============================================================================

/**
 * Données pour créer un professeur
 */
export interface CreateProfessorData {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  grade_id?: number;
  photo_url?: string;
  actif?: boolean;
}

/**
 * Données pour mettre à jour un professeur
 */
export interface UpdateProfessorData {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  grade_id?: number;
  photo_url?: string;
  actif?: boolean;
}

/**
 * Paramètres de recherche/filtre
 */
export interface SearchProfessorParams {
  nom?: string;
  prenom?: string;
  specialite?: string;
  grade_id?: number;
  actif?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Données pour assigner un cours à un professeur
 */
export interface AssignCourseData {
  professeur_id: number;
  cours_recurrent_id: number;
}

/**
 * Données pour désassigner un cours d'un professeur
 */
export interface UnassignCourseData {
  professeur_id: number;
  cours_recurrent_id: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Réponse pour une liste paginée de professeurs
 */
export interface ProfessorsListResponse {
  data: ProfessorListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Réponse pour la création d'un professeur
 */
export interface CreateProfessorResponse {
  success: boolean;
  professor: ProfessorResponse;
  message?: string;
}

/**
 * Réponse pour la mise à jour d'un professeur
 */
export interface UpdateProfessorResponse {
  success: boolean;
  professor: ProfessorResponse;
  message?: string;
}

/**
 * Réponse pour la suppression d'un professeur
 */
export interface DeleteProfessorResponse {
  success: boolean;
  message?: string;
}

/**
 * Réponse pour les statistiques d'un professeur
 */
export interface ProfessorStatsResponse {
  professeur_id: number;
  nom_complet: string;
  nombre_cours_total: number;
  nombre_cours_actifs: number;
  prochains_cours: {
    id: number;
    type_cours: string;
    date: string;
    jour_semaine: number;
    jour_semaine_nom: string;
    heure_debut: string;
    heure_fin: string;
  }[];
}

/**
 * Réponse pour assigner/désassigner un cours
 */
export interface AssignCourseResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Erreurs de validation pour les formulaires
 */
export interface ProfessorValidationErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  grade_id?: string;
  general?: string;
}

// ============================================================================
// Helper Types & Enums
// ============================================================================

/**
 * Statut d'activité du professeur
 */
export enum ProfessorStatus {
  ACTIF = 'actif',
  INACTIF = 'inactif',
}

/**
 * Trier par
 */
export enum ProfessorSortField {
  NOM = 'nom',
  PRENOM = 'prenom',
  SPECIALITE = 'specialite',
  NOMBRE_COURS = 'nombre_cours',
  CREATED_AT = 'created_at',
}

/**
 * Ordre de tri
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Vérifie si un professeur est actif
 */
export const isActiveProfessor = (professor: Professor): boolean => {
  return professor.actif === true;
}

/**
 * Vérifie si un professeur a un grade
 */
export const hasGrade = (professor: Professor | ProfessorWithRelations): professor is ProfessorWithRelations => {
  return 'grade' in professor && professor.grade !== null && professor.grade !== undefined;
}

/**
 * Vérifie si un professeur a des cours assignés
 */
export const hasCourses = (professor: Professor | ProfessorWithRelations): professor is ProfessorWithRelations => {
  return 'cours_recurrents' in professor &&
         professor.cours_recurrents !== undefined &&
         professor.cours_recurrents.length > 0;
}

/**
 * Obtient le nom complet d'un professeur
 */
export const getProfessorFullName = (professor: Professor): string => {
  return professor.nom_complet || `${professor.prenom} ${professor.nom}`;
}

/**
 * Obtient l'initiale du professeur (pour avatar)
 */
export const getProfessorInitials = (professor: Professor): string => {
  const prenom = professor.prenom?.[0] || '';
  const nom = professor.nom?.[0] || '';
  return `${prenom}${nom}`.toUpperCase();
}

/**
 * Vérifie si un professeur a une photo
 */
export const hasPhoto = (professor: Professor): boolean => {
  return !!professor.photo_url && professor.photo_url.trim().length > 0;
}
