/**
 * Domain Types - Professor
 * Basé sur la table `professeurs` de la DB
 */

/**
 * Interface principale Professor
 * Correspond à la structure de la table `professeurs`
 */
export interface Professor {
  // Identifiants
  id: number;

  // Informations personnelles
  nom: string; // VARCHAR(100)
  prenom: string; // VARCHAR(100)
  email?: string; // VARCHAR(255)
  telephone?: string; // VARCHAR(20)
  specialite?: string; // VARCHAR(100)
  photo_url?: string; // VARCHAR(255)

  // Relations (Foreign Keys)
  grade_id?: number | null;

  // Statut
  actif: boolean;

  // Timestamps
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * Professor avec relations chargées
 */
export interface ProfessorWithRelations extends Professor {
  // Grade du professeur
  grade?: {
    id: number;
    nom: string;
    ordre: number;
    couleur?: string;
  } | null;

  // Cours récurrents assignés (via cours_recurrent_professeur)
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
  specialite?: string;
  photo_url?: string;
  grade?: {
    nom: string;
    couleur?: string;
  };
}

/**
 * Professor avec nom complet
 */
export interface ProfessorWithFullName extends Professor {
  nom_complet: string; // Ex: "John Doe"
}

/**
 * Professor minimal (pour références)
 */
export interface ProfessorBasic {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

/**
 * Professor pour liste/tableau
 */
export interface ProfessorListItem {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  grade_nom?: string;
  actif: boolean;
}

/**
 * Professor avec statistiques
 */
export interface ProfessorWithStats extends Professor {
  nombre_cours_assignes: number;
  nombre_cours_actifs: number;
  prochains_cours?: {
    id: number;
    date_cours: Date;
    type_cours: string;
    heure_debut: string;
  }[];
}
