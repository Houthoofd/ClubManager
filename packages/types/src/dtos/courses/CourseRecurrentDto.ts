/**
 * DTOs CourseRecurrent pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un cours récurrent
 */
export interface CreateCourseRecurrentDto {
  type_cours: string;
  jour_semaine: number; // 1-7 (Lundi-Dimanche)
  heure_debut: string; // Format HH:MM ou HH:MM:SS
  heure_fin: string; // Format HH:MM ou HH:MM:SS
  active?: boolean; // Default: true
  professeur_ids?: number[]; // IDs des professeurs à assigner
}

/**
 * DTO pour mettre à jour un cours récurrent
 */
export interface UpdateCourseRecurrentDto {
  id: number;
  type_cours?: string;
  jour_semaine?: number;
  heure_debut?: string;
  heure_fin?: string;
  active?: boolean;
  professeur_ids?: number[]; // Remplace les professeurs existants
}

/**
 * DTO pour la réponse CourseRecurrent
 */
export interface CourseRecurrentResponseDto {
  id: number;
  type_cours: string;
  jour_semaine: number;
  jour_semaine_nom: string; // Ex: "Lundi"
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number; // Calculé
  active: boolean;

  // Professeurs assignés
  professeurs: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
    email?: string;
    specialite?: string;
    photo_url?: string;
    grade?: {
      id: number;
      nom: string;
      couleur?: string;
    };
  }[];

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste de cours récurrents
 */
export interface CourseRecurrentListItemDto {
  id: number;
  type_cours: string;
  jour_semaine: number;
  jour_semaine_nom: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  active: boolean;
  nombre_professeurs: number;
  professeurs_noms: string[]; // Liste des noms complets
}

/**
 * DTO pour assigner/désassigner un professeur
 */
export interface AssignProfessorDto {
  cours_recurrent_id: number;
  professeur_id: number;
}

/**
 * DTO pour désassigner un professeur
 */
export interface UnassignProfessorDto {
  cours_recurrent_id: number;
  professeur_id: number;
}

/**
 * DTO pour dupliquer un cours récurrent
 */
export interface DuplicateCourseRecurrentDto {
  id: number;
  nouveau_jour_semaine?: number; // Si changement de jour
  nouvelle_heure_debut?: string;
  nouvelle_heure_fin?: string;
}

/**
 * DTO pour recherche/filtre de cours récurrents
 */
export interface SearchCourseRecurrentDto {
  type_cours?: string;
  jour_semaine?: number;
  professeur_id?: number;
  active?: boolean;
}

/**
 * DTO pour planning hebdomadaire
 */
export interface WeeklyScheduleDto {
  jour: number; // 1-7
  jour_nom: string;
  cours: CourseRecurrentListItemDto[];
}
