/**
 * Domain Types - Course
 * Basé sur la table `cours` de la DB
 */

/**
 * Interface principale Course
 * Correspond à la structure de la table `cours`
 */
export interface Course {
  // Identifiants
  id: number;

  // Informations du cours
  date_cours: Date;
  type_cours: string; // VARCHAR(50)
  heure_debut: string; // TIME format HH:MM:SS
  heure_fin: string; // TIME format HH:MM:SS

  // Relations (Foreign Keys)
  cours_recurrent_id: number;

  // Statut
  annule: boolean;

  // Timestamps
  created_at: Date;
}

/**
 * Course avec relations chargées
 */
export interface CourseWithRelations extends Course {
  // Cours récurrent (template)
  cours_recurrent: {
    id: number;
    type_cours: string;
    jour_semaine: number;
    heure_debut: string;
    heure_fin: string;
    active: boolean;
  };

  // Professeurs (via cours_recurrent -> cours_recurrent_professeur)
  professeurs?: {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
    specialite?: string;
    photo_url?: string;
    grade?: {
      id: number;
      nom: string;
      couleur?: string;
    };
  }[];

  // Inscriptions au cours
  inscriptions?: {
    id: number;
    utilisateur_id: number;
    date_inscription: Date;
    status_id?: number;
  }[];

  // Réservations
  reservations?: {
    id: number;
    utilisateur_id: number;
    date_reservation: Date;
    annule: boolean;
  }[];

  // Statistiques calculées
  nombre_inscrits?: number;
  nombre_reservations?: number;
}

/**
 * Course pour l'affichage public
 */
export interface CoursePublic {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  annule: boolean;
  nombre_places_disponibles?: number;
}

/**
 * Course avec détails complets pour l'affichage
 */
export interface CourseDetail extends CourseWithRelations {
  jour_semaine_nom: string; // Ex: "Lundi"
  duree_minutes: number; // Calculé
  est_complet: boolean; // Si capacité max atteinte
}

/**
 * Course minimal (pour références)
 */
export interface CourseBasic {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  annule: boolean;
}

/**
 * Course pour calendrier/planning
 */
export interface CourseCalendarItem {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  annule: boolean;
  professeurs: string[]; // Liste des noms de professeurs
  nombre_inscrits: number;
}
