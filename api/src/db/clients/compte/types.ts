/**
 * Types pour le module Compte
 */

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

/**
 * Informations complètes d'un utilisateur
 */
export interface Utilisateur {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  password?: string;
  genre_id: number | null;
  date_of_birth: Date | string | null;
  status_id: number;
  grade_id: number | null;
  abonnement_id: number | null;
  phone?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Informations utilisateur avec noms des relations
 */
export interface UtilisateurAvecRelations {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  genres?: string;
  status?: string;
  grades?: string;
  abonnement?: string;
  date_of_birth: Date | string | null;
  phone?: string | null;
}

/**
 * Informations basiques du compte
 */
export interface CompteInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: Date | string | null;
  phone?: string | null;
}

/**
 * Données pour mettre à jour un compte
 */
export interface UpdateCompteData {
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string;
  phone?: string;
}

/**
 * Données pour mettre à jour un utilisateur (admin)
 */
export interface UpdateUtilisateurData {
  email?: string;
  date_naissance?: string;
  genres?: string | number;
  grades?: string | number;
  abonnement?: string | number;
  status?: string | number;
  password?: string;
}

/**
 * Données pour créer/mettre à jour un mot de passe
 */
export interface PasswordUpdateData {
  id: number;
  hash: string;
  isCreation: boolean;
}

/**
 * Résultat de recherche utilisateur
 */
export interface UserSearchResult {
  isFind: boolean;
  message: string;
  data: Utilisateur[] | UtilisateurAvecRelations | any;
}

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}

/**
 * Genre d'un utilisateur
 */
export interface Genre {
  id: number;
  genre_name: string;
}

/**
 * Grade d'un utilisateur
 */
export interface Grade {
  id: number;
  grade_id: string;
  nom_grade: string;
}

/**
 * Status d'un utilisateur
 */
export interface Status {
  id: number;
  nom_role: string;
}

/**
 * Plan tarifaire (abonnement)
 */
export interface PlanTarifaire {
  id: number;
  nom_plan: string;
  prix: number;
  duree: string;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Structure brute d'une ligne de la table utilisateurs
 */
export interface UtilisateurRow {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  password: string | null;
  genre_id: number | null;
  date_of_birth: Date | null;
  status_id: number;
  grade_id: number | null;
  abonnement_id: number | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row avec relations jointes
 */
export interface UtilisateurAvecRelationsRow {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  password: string | null;
  genres: string | null;
  status: string | null;
  grades: string | null;
  abonnement: string | null;
  date_of_birth: Date | null;
}

/**
 * Row simple pour compte info
 */
export interface CompteInfoRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: Date | null;
  phone: string | null;
}

/**
 * Row pour genre
 */
export interface GenreRow {
  id: number;
  genre_name: string;
}

/**
 * Row pour grade
 */
export interface GradeRow {
  id: number;
  grade_id: string;
  nom_grade: string;
}

/**
 * Row pour status
 */
export interface StatusRow {
  id: number;
  nom_role: string;
}

/**
 * Row pour plan tarifaire
 */
export interface PlanTarifaireRow {
  id: number;
  nom_plan: string;
  prix: number;
  duree: string;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Status possibles d'un utilisateur
 */
export enum UtilisateurStatus {
  INACTIF = 0,
  ACTIF = 1,
  SUSPENDU = 2,
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un utilisateur est valide
 */
export function isValidUtilisateur(user: any): user is Utilisateur {
  return (
    user &&
    typeof user.id === 'number' &&
    typeof user.first_name === 'string' &&
    typeof user.last_name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.status_id === 'number'
  );
}

/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifie si une date est valide
 */
export function isValidDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Vérifie si un téléphone est valide
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[0-9\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone);
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Type pour les champs pouvant être mis à jour
 */
export type UpdatableUtilisateurFields =
  | 'email'
  | 'date_of_birth'
  | 'genre_id'
  | 'grade_id'
  | 'abonnement_id'
  | 'status_id'
  | 'password'
  | 'phone';

/**
 * Type pour les champs de compte pouvant être mis à jour
 */
export type UpdatableCompteFields =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'date_of_birth'
  | 'phone';

/**
 * Options de recherche d'utilisateur
 */
export interface UserSearchOptions {
  includePassword?: boolean;
  includeInactive?: boolean;
}
