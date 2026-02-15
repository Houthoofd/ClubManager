/**
 * Types pour la gestion des comptes utilisateurs
 */

/**
 * Informations complètes d'un compte utilisateur
 */
export interface CompteInfo {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur?: string;
  email: string;
  date_of_birth?: Date;
  phone?: string;
  genre_id?: number;
  genre_name?: string;
  status_id: number;
  status_name?: string;
  grade_id?: number;
  grade_name?: string;
  abonnement_id?: number;
  abonnement_name?: string;
}

/**
 * Données pour mettre à jour un compte
 */
export interface CompteUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: Date;
  phone?: string;
  genre_id?: number;
  grade_id?: number;
  abonnement_id?: number;
  status_id?: number;
}

/**
 * Données pour mettre à jour un mot de passe
 */
export interface ComptePasswordUpdate {
  utilisateur_id: number;
  new_password: string;
  is_creation?: boolean;
}

/**
 * Résultat d'une opération sur compte
 */
export interface CompteResult {
  success: boolean;
  message: string;
  compte?: CompteInfo;
}

/**
 * Résultat de recherche d'utilisateurs
 */
export interface CompteSearchResult {
  isFind: boolean;
  message: string;
  data: CompteInfo[];
}

/**
 * Données de conversion nom -> ID
 */
export interface ConversionInput {
  genres?: string | number;
  grades?: string | number;
  status?: string | number;
  abonnement?: string | number;
}

/**
 * Résultat de conversion
 */
export interface ConversionResult {
  genre_id?: number;
  grade_id?: number;
  status_id?: number;
  abonnement_id?: number;
}

/**
 * Options de référence (genres, grades, status, plans)
 */
export interface CompteGenre {
  id: number;
  genre_name: string;
}

export interface CompteGrade {
  id: number;
  grade_id: string;
  nom_grade?: string;
}

export interface CompteStatus {
  id: number;
  nom_role: string;
}

export interface ComptePlanTarifaire {
  id: number;
  nom_plan: string;
  prix?: number;
}
