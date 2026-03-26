/**
 * DTOs Course pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un cours
 */
export interface CreateCourseDto {
  date_cours: string; // Format YYYY-MM-DD
  type_cours: string;
  heure_debut: string; // Format HH:MM ou HH:MM:SS
  heure_fin: string; // Format HH:MM ou HH:MM:SS
  cours_recurrent_id?: number; // Référence au cours récurrent (optionnel)
  annule?: boolean; // Default: false
}

/**
 * DTO pour mettre à jour un cours
 */
export interface UpdateCourseDto {
  id: number;
  date_cours?: string; // Format YYYY-MM-DD
  type_cours?: string;
  heure_debut?: string;
  heure_fin?: string;
  cours_recurrent_id?: number | null;
  annule?: boolean;
}

/**
 * DTO pour la réponse Course
 */
export interface CourseResponseDto {
  id: number;
  date_cours: string; // ISO 8601
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number; // Calculé
  jour_semaine_nom: string; // Ex: "Lundi"
  annule: boolean;
  raison_annulation?: string;

  // Relation avec cours récurrent
  cours_recurrent?: {
    id: number;
    type_cours: string;
    jour_semaine: number;
    jour_semaine_nom: string;
    heure_debut: string;
    heure_fin: string;
    active: boolean;
  };

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

  // Statistiques
  nombre_inscriptions: number;
  nombre_reservations: number;
  places_disponibles?: number;
  capacite_max?: number;

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste de cours (simplifié)
 */
export interface CourseListItemDto {
  id: number;
  date_cours: string; // ISO 8601
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  jour_semaine_nom: string;
  annule: boolean;
  nombre_inscriptions: number;
  nombre_reservations: number;
  nombre_professeurs: number;
  professeurs_noms: string[]; // Liste des noms complets
  cours_recurrent_id?: number;
}

/**
 * DTO pour annuler un cours
 */
export interface CancelCourseDto {
  id: number;
  raison_annulation?: string;
}

/**
 * DTO pour recherche/filtre de cours
 */
export interface SearchCourseDto {
  date_debut?: string; // Format YYYY-MM-DD
  date_fin?: string; // Format YYYY-MM-DD
  type_cours?: string;
  professeur_id?: number;
  annule?: boolean;
  cours_recurrent_id?: number;
}

/**
 * DTO pour affichage calendrier
 */
export interface CourseCalendarDto {
  id: number;
  date_cours: string; // ISO 8601
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  annule: boolean;
  couleur?: string; // Couleur pour affichage calendrier
  professeurs_noms: string[];
  nombre_inscriptions: number;
  cours_recurrent_id?: number;
}

/**
 * DTO pour dupliquer un cours
 */
export interface DuplicateCourseDto {
  id: number;
  nouvelle_date: string; // Format YYYY-MM-DD
  nouvelle_heure_debut?: string;
  nouvelle_heure_fin?: string;
}

/**
 * DTO pour générer des cours à partir d'un cours récurrent
 */
export interface GenerateCoursesDto {
  cours_recurrent_id: number;
  date_debut: string; // Format YYYY-MM-DD
  date_fin: string; // Format YYYY-MM-DD
  exclure_dates?: string[]; // Dates à exclure (Format YYYY-MM-DD)
}

/**
 * DTO pour statistiques de cours
 */
export interface CourseStatsDto {
  total_cours: number;
  cours_annules: number;
  cours_actifs: number;
  taux_annulation: number; // Pourcentage
  moyenne_inscriptions: number;
  types_cours: {
    type: string;
    count: number;
  }[];
}
