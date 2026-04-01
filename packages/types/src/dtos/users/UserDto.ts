/**
 * DTOs User pour l'API
 * Utilisés pour les requêtes/réponses API
 */

/**
 * DTO pour créer un utilisateur
 * Utilisé lors de l'inscription
 */
export interface CreateUserDto {
  first_name: string;
  last_name: string;
  nom_utilisateur?: string; // Auto-généré si absent
  email: string;
  password: string; // En clair (sera hashé côté backend)
  date_of_birth: string; // Format: YYYY-MM-DD
  telephone?: string;
  adresse?: string;
  genre_id: number;
  grade_id?: number;
  abonnement_id?: number;
  status_id?: number; // Default: 1 (actif)
}

/**
 * DTO pour mettre à jour un utilisateur
 */
export interface UpdateUserDto {
  id: number;
  first_name?: string;
  last_name?: string;
  nom_utilisateur?: string;
  email?: string;
  password?: string;
  date_of_birth?: string;
  telephone?: string;
  adresse?: string;
  genre_id?: number;
  grade_id?: number;
  abonnement_id?: number;
  status_id?: number;
}

/**
 * DTO pour la réponse User (sans données sensibles)
 */
export interface UserResponseDto {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  date_of_birth: string;
  telephone?: string;
  email_verified: boolean;
  active: boolean;
  photo_url?: string;

  // Relations
  genre: {
    id: number;
    nom: string;
  };
  grade?: {
    id: number;
    nom: string;
    couleur?: string;
  };
  abonnement?: {
    id: number;
    nom: string;
    prix: number;
  };
  status: {
    id: number;
    nom: string;
  };

  date_inscription: string;
  derniere_connexion?: string;
}

/**
 * DTO pour soft delete (RGPD v4.1)
 */
export interface SoftDeleteUserDto {
  userId: number;
  deletedBy: number; // ID de l'admin
  reason: string; // Raison de la suppression
}

/**
 * DTO pour restaurer un utilisateur supprimé
 */
export interface RestoreUserDto {
  userId: number;
  restoredBy: number; // ID de l'admin
}

/**
 * DTO pour liste d'utilisateurs
 */
export interface UserListItemDto {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  email_verified: boolean;
  active: boolean;
  status_id: number;
  date_inscription: string;
}
