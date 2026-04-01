/**
 * DTOs Professor pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un professeur
 */
export interface CreateProfessorDto {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  grade_id?: number;
  photo_url?: string;
  actif?: boolean; // Default: true
}

/**
 * DTO pour mettre à jour un professeur
 */
export interface UpdateProfessorDto {
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
 * DTO pour la réponse Professor avec relations
 */
export interface ProfessorResponseDto {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string; // Calculé: "prenom nom"
  email?: string;
  telephone?: string;
  specialite?: string;
  photo_url?: string;
  actif: boolean;

  // Grade
  grade?: {
    id: number;
    nom: string;
    niveau?: number;
    couleur?: string;
  };

  // Cours récurrents assignés
  cours_recurrents: {
    id: number;
    type_cours: string;
    jour_semaine: number;
    jour_semaine_nom: string;
    heure_debut: string;
    heure_fin: string;
    active: boolean;
  }[];

  // Statistiques
  stats: {
    nombre_cours_total: number;
    nombre_cours_actifs: number;
    prochains_cours: {
      id: number;
      type_cours: string;
      date: string; // Date du prochain cours
      heure_debut: string;
      heure_fin: string;
    }[];
  };

  created_at: string; // ISO 8601
  updated_at?: string;
}

/**
 * DTO pour liste de professeurs (simplifié)
 */
export interface ProfessorListItemDto {
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
  nombre_cours: number; // Nombre de cours récurrents assignés
}

/**
 * DTO pour recherche/filtre de professeurs
 */
export interface SearchProfessorDto {
  nom?: string;
  prenom?: string;
  specialite?: string;
  grade_id?: number;
  actif?: boolean;
}

/**
 * DTO pour statistiques d'un professeur
 */
export interface ProfessorStatsDto {
  professeur_id: number;
  nom_complet: string;
  nombre_cours_total: number; // Total de cours récurrents assignés
  nombre_cours_actifs: number; // Cours actifs uniquement
  prochains_cours: {
    id: number;
    type_cours: string;
    date: string; // ISO 8601
    jour_semaine: number;
    jour_semaine_nom: string;
    heure_debut: string;
    heure_fin: string;
  }[];
}

/**
 * DTO pour assigner un cours récurrent à un professeur
 */
export interface AssignCourseDto {
  professeur_id: number;
  cours_recurrent_id: number;
}

/**
 * DTO pour désassigner un cours récurrent d'un professeur
 */
export interface UnassignCourseDto {
  professeur_id: number;
  cours_recurrent_id: number;
}
