/**
 * Domain Types - CourseRecurrent
 * Basé sur la table `cours_recurrent` de la DB
 */

/**
 * Interface principale CourseRecurrent
 * Correspond à la structure de la table `cours_recurrent`
 */
export interface CourseRecurrent {
  // Identifiants
  id: number;

  // Informations du cours
  type_cours: string; // VARCHAR(255)
  jour_semaine: number; // 1=Lundi, 7=Dimanche
  heure_debut: string; // TIME format HH:MM:SS
  heure_fin: string; // TIME format HH:MM:SS

  // Statut
  active: boolean;

  // Timestamps
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * CourseRecurrent avec relations chargées (professeurs)
 */
export interface CourseRecurrentWithRelations extends CourseRecurrent {
  // Professeurs assignés (via cours_recurrent_professeur)
  professeurs: {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
    specialite?: string;
    grade?: {
      id: number;
      nom: string;
      couleur?: string;
    };
  }[];
}

/**
 * CourseRecurrent pour l'affichage public
 */
export interface CourseRecurrentPublic {
  id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  active: boolean;
}

/**
 * CourseRecurrent avec nom du jour lisible
 */
export interface CourseRecurrentWithDayName extends CourseRecurrent {
  jour_semaine_nom: string; // Ex: "Lundi", "Mardi", etc.
}

/**
 * Enum pour les jours de la semaine (1-7)
 */
export enum DayOfWeek {
  LUNDI = 1,
  MARDI = 2,
  MERCREDI = 3,
  JEUDI = 4,
  VENDREDI = 5,
  SAMEDI = 6,
  DIMANCHE = 7,
}

/**
 * Mapping des jours de la semaine
 */
export const DAY_OF_WEEK_NAMES: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

/**
 * CourseRecurrent minimal (pour références)
 */
export interface CourseRecurrentBasic {
  id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
}
