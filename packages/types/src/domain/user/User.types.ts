/**
 * Domain Types - User
 * Basé sur la table `utilisateurs` de la DB
 */

/**
 * Interface principale User
 * Correspond à la structure de la table `utilisateurs`
 */
export interface User {
  // Identifiants
  id: number;
  userId: string; // Format: U-YYYY-XXXX

  // Informations personnelles
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  date_of_birth: Date;
  telephone?: string;
  adresse?: string;

  // Relations (Foreign Keys)
  genre_id: number;
  grade_id?: number;
  abonnement_id?: number;
  status_id: number;

  // Sécurité
  password: string; // Hashé (bcrypt ou argon2)
  active: boolean;
  email_verified: boolean;
  photo_url?: string;

  // RGPD v4.1 - Soft Delete
  deleted_at?: Date | null;
  deleted_by?: number | null;
  deletion_reason?: string | null;
  anonymized: boolean;

  // Timestamps
  date_inscription: Date;
  derniere_connexion?: Date | null;
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * User avec relations chargées
 * Inclut les données des tables liées
 */
export interface UserWithRelations extends User {
  genre: {
    id: number;
    nom: string;
  };
  grade?: {
    id: number;
    nom: string;
    ordre: number;
    couleur?: string;
  };
  abonnement?: {
    id: number;
    nom: string;
    prix: number;
    duree_mois: number;
  };
  status: {
    id: number;
    nom: string;
    description?: string;
  };
}

/**
 * User pour l'affichage (sans données sensibles)
 * Utilisé dans les listes et réponses API publiques
 */
export interface UserPublic {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  email_verified: boolean;
  photo_url?: string;
  genre_id: number;
  grade_id?: number;
  status_id: number;
  date_inscription: Date;
}

/**
 * Données minimales pour un User (utilisé dans les références)
 */
export interface UserBasic {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  email: string;
}
