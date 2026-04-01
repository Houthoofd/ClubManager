/**
 * Domain Types - Inscription
 * Basé sur la table `inscriptions` de la DB
 */

/**
 * Interface principale Inscription
 * Correspond à la structure de la table `inscriptions`
 */
export interface Inscription {
  // Identifiants
  id: number;

  // Relations (Foreign Keys)
  utilisateur_id: number;
  cours_id: number;
  status_id?: number | null; // NULL=absent, 1=présent (ou autre status)

  // Informations
  date_inscription: Date;
  commentaire?: string | null; // TEXT

  // Note: Pas de timestamps updated_at dans la table
}

/**
 * Inscription avec relations chargées
 */
export interface InscriptionWithRelations extends Inscription {
  // Utilisateur inscrit
  utilisateur: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
    grade?: {
      id: number;
      nom: string;
      couleur?: string;
    };
  };

  // Cours concerné
  cours: {
    id: number;
    date_cours: Date;
    type_cours: string;
    heure_debut: string;
    heure_fin: string;
    annule: boolean;
  };

  // Statut de présence
  status?: {
    id: number;
    nom: string;
    description?: string;
  } | null;
}

/**
 * Inscription pour l'affichage public
 */
export interface InscriptionPublic {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_inscription: Date;
  status_id?: number | null;
}

/**
 * Inscription avec noms lisibles
 */
export interface InscriptionWithNames extends Inscription {
  utilisateur_nom_complet: string; // Ex: "John Doe"
  cours_type: string;
  cours_date: Date;
  status_nom?: string; // Ex: "Présent", "Absent"
}

/**
 * Inscription minimal (pour références)
 */
export interface InscriptionBasic {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  status_id?: number | null;
}

/**
 * Inscription pour liste/tableau
 */
export interface InscriptionListItem {
  id: number;
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  cours_id: number;
  cours_type: string;
  cours_date: Date;
  date_inscription: Date;
  status_nom?: string;
  commentaire?: string;
}

/**
 * Inscription pour feuille de présence
 */
export interface InscriptionAttendanceSheet {
  id: number;
  utilisateur_id: number;
  nom_complet: string;
  grade_nom?: string;
  status_id?: number | null;
  present: boolean; // Calculé à partir de status_id
  commentaire?: string;
}

/**
 * Statistiques d'inscription
 */
export interface InscriptionStats {
  total_inscriptions: number;
  total_presents: number;
  total_absents: number;
  taux_presence: number; // Pourcentage (0-100)
}

/**
 * Enum pour les statuts de présence courants
 * Note: Les valeurs exactes dépendent de la table `status`
 */
export enum PresenceStatus {
  ABSENT = 0, // NULL dans la DB
  PRESENT = 1,
  EXCUSE = 2,
  RETARD = 3,
}
