/**
 * Types pour le module Utilisateurs
 * Les schémas Zod sont dans validators.ts
 *
 * @module utilisateurs/types
 */

// ============================================================================
// PHASE 2 - USER SPLIT TABLES TYPES
// ============================================================================

/**
 * Profil utilisateur (table séparée - Phase 2)
 */
export interface UserProfile {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** ID du grade actuel */
  grade_id?: number | null;

  /** Biographie */
  bio?: string | null;

  /** URL de l'avatar */
  avatar_url?: string | null;

  /** Numéro de téléphone */
  phone?: string | null;

  /** Nom du contact d'urgence */
  emergency_contact_name?: string | null;

  /** Téléphone du contact d'urgence */
  emergency_contact_phone?: string | null;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer un profil utilisateur
 */
export interface CreateUserProfileInput {
  user_id: number;
  grade_id?: number;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

/**
 * Données pour mettre à jour un profil utilisateur
 */
export interface UpdateUserProfileInput {
  grade_id?: number;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

/**
 * Sécurité utilisateur (table séparée - Phase 2)
 */
export interface UserSecurity {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** Mot de passe hashé */
  password: string;

  /** Email vérifié ? */
  email_verified: boolean;

  /** Date de vérification de l'email */
  email_verified_at?: Date | null;

  /** Date de dernière connexion */
  last_login_at?: Date | null;

  /** Nombre de tentatives de connexion échouées */
  failed_login_attempts: number;

  /** Verrouillé jusqu'à */
  locked_until?: Date | null;

  /** Authentification à deux facteurs activée ? */
  two_factor_enabled: boolean;

  /** Secret 2FA */
  two_factor_secret?: string | null;

  /** Date du dernier changement de mot de passe */
  password_changed_at?: Date | null;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer la sécurité utilisateur
 */
export interface CreateUserSecurityInput {
  user_id: number;
  password: string;
  email_verified?: boolean;
}

/**
 * Données pour mettre à jour la sécurité utilisateur
 */
export interface UpdateUserSecurityInput {
  password?: string;
  email_verified?: boolean;
  email_verified_at?: Date | string;
  last_login_at?: Date | string;
  failed_login_attempts?: number;
  locked_until?: Date | string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  password_changed_at?: Date | string;
}

/**
 * Abonnement utilisateur (table séparée - Phase 2)
 */
export interface UserSubscription {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** ID de l'abonnement */
  abonnement_id?: number | null;

  /** ID du statut */
  status_id?: number | null;

  /** ID client Stripe */
  stripe_customer_id?: string | null;

  /** ID abonnement Stripe */
  stripe_subscription_id?: string | null;

  /** Date de début d'abonnement */
  subscription_start_at?: Date | null;

  /** Date de fin d'abonnement */
  subscription_end_at?: Date | null;

  /** Renouvellement automatique */
  auto_renew: boolean;

  /** Raison d'annulation */
  cancellation_reason?: string | null;

  /** Date d'annulation */
  cancelled_at?: Date | null;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer un abonnement utilisateur
 */
export interface CreateUserSubscriptionInput {
  user_id: number;
  abonnement_id?: number;
  status_id?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start_at?: Date | string;
  subscription_end_at?: Date | string;
  auto_renew?: boolean;
}

/**
 * Données pour mettre à jour un abonnement utilisateur
 */
export interface UpdateUserSubscriptionInput {
  abonnement_id?: number;
  status_id?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start_at?: Date | string;
  subscription_end_at?: Date | string;
  auto_renew?: boolean;
  cancellation_reason?: string;
  cancelled_at?: Date | string;
}

/**
 * Préférences utilisateur (table séparée - Phase 2)
 */
export interface UserPreferences {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** Langue préférée */
  language: string;

  /** Fuseau horaire */
  timezone: string;

  /** Notifications par email */
  notifications_email: boolean;

  /** Notifications par SMS */
  notifications_sms: boolean;

  /** Notifications push */
  notifications_push: boolean;

  /** Thème de l'interface */
  theme: string;

  /** Format de date */
  date_format: string;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer les préférences utilisateur
 */
export interface CreateUserPreferencesInput {
  user_id: number;
  language?: string;
  timezone?: string;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  notifications_push?: boolean;
  theme?: string;
  date_format?: string;
}

/**
 * Données pour mettre à jour les préférences utilisateur
 */
export interface UpdateUserPreferencesInput {
  language?: string;
  timezone?: string;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  notifications_push?: boolean;
  theme?: string;
  date_format?: string;
}

/**
 * Utilisateur complet avec toutes ses tables associées (Phase 2)
 */
export interface UserComplete {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  genre_id?: number | null;
  date_of_birth: Date;
  active: boolean;
  date_inscription: Date;
  deleted_at?: Date | null;

  // Tables Phase 2
  profile?: UserProfile;
  security?: UserSecurity;
  subscription?: UserSubscription;
  preferences?: UserPreferences;
}

// ============================================================================
// LEGACY TYPES (Compatibility)
// ============================================================================

export interface UserDataSession {
  isFind: boolean;
  message: string;
  dataToStore: {
    id: number | null;
    userId?: string; // Ajouter le userId optionnel
    prenom: string;
    nom: string;
    nom_utilisateur: string;
    email: string;
    date_naissance: string;
    status_id: number;
    grade_id: number | null;
    abonnement_id: number | null;
  };
}

export type Professeur = {
  id: string;
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_naissance: string;
  grade_id: number;
};

export type UserDataLogin = {
  email: string;
  password: string;
};

export type Abonnement = {
  id: number;
  nom_plan: string;
};

export type Grade = {
  id: number;
  grade_id: string;
};

export type Genres = {
  id: number;
  genre_name: string;
};

export type Status = {
  id: number;
  status_name: string;
};

export type UserDataInscription = {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  date: string;
  abonnement: string | number;
  genre: string | number;
};

export type UserDataAjout = {
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  date_of_birth: string;
  genres: number;
  grades: number;
  abonnement: number;
  status: number;
};

export type UtilisateurInscriptionPayload = {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  password: string;
  genre_id: number;
  abonnement_id: number;
  date_naissance: string;
  date_inscription: string;
  status_id: number;
  grade_id: number;
};

export type UserSearchByEmail = {
  email: string;
};

export interface AvailableUserForLogin {
  userId: string;
  prenom: string;
  nom: string;
  date_naissance: string;
  nom_utilisateur: string;
  age: number;
  initiales: string;
  relation_familiale?: string;
  est_responsable?: boolean;
}

export interface UserData {
  id?: number;
  userId?: string;
  prenom?: string;
  nom?: string;
  first_name?: string;
  last_name?: string;
  nom_utilisateur?: string;
  email?: string;
  genre_id?: number | null;
  date_of_birth?: string;
  date_naissance?: string;
  password?: string;
  status_id?: number;
  active?: boolean;
  grade_id?: number | null;
  abonnement_id?: number | null;
  date_inscription?: string;
}

export type UserDataLoginByUserId = {
  userId: string;
  password: string;
};

// ============================================================================
// DEPRECATED FIELDS NOTICE
// ============================================================================

/**
 * ⚠️ DEPRECATED FIELDS in utilisateurs table:
 *
 * - password → Use user_security.password
 * - status_id → Use user_subscriptions.status_id
 * - grade_id → Use user_profiles.grade_id
 * - abonnement_id → Use user_subscriptions.abonnement_id
 * - stripe_customer_id → Use user_subscriptions.stripe_customer_id
 * - stripe_subscription_id → Use user_subscriptions.stripe_subscription_id
 * - email_verified → Use user_security.email_verified
 * - email_verified_at → Use user_security.email_verified_at
 *
 * Ces champs sont conservés pour compatibilité mais utiliser les nouvelles tables
 */
