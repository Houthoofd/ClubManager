/**
 * Course Types
 *
 * Type definitions for the courses feature following FSD architecture.
 */

/**
 * Type de cours disponibles dans le club
 */
export type CourseType = 'krav-maga' | 'fitness' | 'yoga' | 'self-defense';

/**
 * Niveau du cours
 */
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Statut du cours
 */
export type CourseStatus = 'active' | 'inactive' | 'full';

/**
 * Interface représentant un cours
 */
export interface Course {
  id: number;
  name: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  professorId: number;
  professor?: {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
  };
  capacity: number;
  enrolled: number;
  price: number;
  duration: number; // en minutes
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Filtres pour la recherche de cours
 */
export interface CourseFilters {
  type?: CourseType;
  level?: CourseLevel;
  professorId?: number;
  status?: CourseStatus;
  search?: string;
}

/**
 * Données pour créer un nouveau cours
 */
export interface CreateCourseData {
  name: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  professorId: number;
  capacity: number;
  price: number;
  duration: number;
}

/**
 * Données pour mettre à jour un cours existant
 */
export interface UpdateCourseData extends Partial<CreateCourseData> {
  id: number;
}

/**
 * Labels lisibles pour les types de cours
 */
export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  'krav-maga': 'Krav Maga',
  'fitness': 'Fitness',
  'yoga': 'Yoga',
  'self-defense': 'Self-Defense',
};

/**
 * Labels lisibles pour les niveaux
 */
export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire',
  'advanced': 'Avancé',
};

/**
 * Labels lisibles pour les statuts
 */
export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  'active': 'Actif',
  'inactive': 'Inactif',
  'full': 'Complet',
};
