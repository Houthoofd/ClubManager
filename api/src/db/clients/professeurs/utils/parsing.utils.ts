/**
 * Utilitaires de parsing pour le module professeurs
 * Responsabilité: Conversion des données brutes de la base de données vers les types TypeScript
 */

import type {
  Professeur,
  ProfesseurComplet,
  CoursRecurrent,
  Utilisateur,
} from '../types.js';

// ============================================================================
// Types pour les lignes de base de données
// ============================================================================

/**
 * Représente une ligne brute de la base de données pour un utilisateur/professeur
 */
export interface UtilisateurRow {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_of_birth: string | Date;
  grade_id: number;
  status_id: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Représente une ligne brute pour un cours récurrent
 */
export interface CoursRecurrentRow {
  cours_recurrent_id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  est_recurrent_actif: number | boolean;
  professeur_id: number;
  professeur_nom: string;
  professeur_prenom: string;
}

// ============================================================================
// Fonctions de parsing - Professeur
// ============================================================================

/**
 * Parse une ligne de base de données vers un objet Professeur
 */
export function parseProfesseurRow(row: UtilisateurRow): Professeur {
  return {
    id: toInt(row.id),
    nom: toString(row.first_name || row.last_name),
    prenom: toString(row.last_name || row.first_name),
    nom_utilisateur: toString(row.nom_utilisateur),
    email: toString(row.email),
    genre_id: toInt(row.genre_id),
    date_naissance: toDate(row.date_of_birth),
    grade_id: toInt(row.grade_id),
  };
}

/**
 * Parse plusieurs lignes vers un tableau de Professeur
 */
export function parseProfesseurRows(rows: UtilisateurRow[]): Professeur[] {
  return rows.map(parseProfesseurRow);
}

/**
 * Parse une ligne vers un objet ProfesseurComplet
 */
export function parseProfesseurCompletRow(row: UtilisateurRow): ProfesseurComplet {
  return {
    id: toInt(row.id),
    nom: toString(row.first_name),
    prenom: toString(row.last_name),
    nom_utilisateur: toString(row.nom_utilisateur),
    email: toString(row.email),
    genre_id: toInt(row.genre_id),
    date_naissance: toDate(row.date_of_birth),
    grade_id: toInt(row.grade_id),
    first_name: toString(row.first_name),
    last_name: toString(row.last_name),
    date_of_birth: toDate(row.date_of_birth),
    status_id: toInt(row.status_id),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
}

/**
 * Parse plusieurs lignes vers un tableau de ProfesseurComplet
 */
export function parseProfesseurCompletRows(rows: UtilisateurRow[]): ProfesseurComplet[] {
  return rows.map(parseProfesseurCompletRow);
}

// ============================================================================
// Fonctions de parsing - Utilisateur
// ============================================================================

/**
 * Parse une ligne vers un objet Utilisateur
 */
export function parseUtilisateurRow(row: UtilisateurRow): Utilisateur {
  return {
    id: toInt(row.id),
    first_name: toString(row.first_name),
    last_name: toString(row.last_name),
    nom_utilisateur: toString(row.nom_utilisateur),
    email: toString(row.email),
    genre_id: toInt(row.genre_id),
    date_of_birth: toDate(row.date_of_birth),
    grade_id: toInt(row.grade_id),
    status_id: toInt(row.status_id),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
}

/**
 * Parse plusieurs lignes vers un tableau d'Utilisateur
 */
export function parseUtilisateurRows(rows: UtilisateurRow[]): Utilisateur[] {
  return rows.map(parseUtilisateurRow);
}

// ============================================================================
// Fonctions de parsing - CoursRecurrent
// ============================================================================

/**
 * Parse une ligne vers un objet CoursRecurrent
 */
export function parseCoursRecurrentRow(row: CoursRecurrentRow): CoursRecurrent {
  return {
    cours_recurrent_id: toInt(row.cours_recurrent_id),
    type_cours: toString(row.type_cours),
    jour_semaine: toInt(row.jour_semaine),
    heure_debut: toString(row.heure_debut),
    heure_fin: toString(row.heure_fin),
    est_recurrent_actif: toBoolean(row.est_recurrent_actif),
    professeur_id: toInt(row.professeur_id),
    professeur_nom: toString(row.professeur_nom),
    professeur_prenom: toString(row.professeur_prenom),
  };
}

/**
 * Parse plusieurs lignes vers un tableau de CoursRecurrent
 */
export function parseCoursRecurrentRows(rows: CoursRecurrentRow[]): CoursRecurrent[] {
  return rows.map(parseCoursRecurrentRow);
}

// ============================================================================
// Utilitaires de conversion de types
// ============================================================================

/**
 * Convertit une valeur en entier
 * Gère les cas null/undefined
 */
export function toInt(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convertit une valeur en chaîne de caractères
 * Gère les cas null/undefined
 */
export function toString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Convertit une valeur en booléen
 * Gère les cas 0/1, true/false, 'true'/'false'
 */
export function toBoolean(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
}

/**
 * Convertit une valeur en Date ou string
 * Gère les cas null/undefined
 */
export function toDate(value: any): Date | string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value;
  }
  return String(value);
}

/**
 * Convertit une valeur en float
 * Gère les cas null/undefined
 */
export function toFloat(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Vérifie si une valeur est définie (pas null ni undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Vérifie si une valeur est une chaîne non vide
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Vérifie si une valeur est un nombre valide
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Nettoie une chaîne de caractères (trim et remove extra spaces)
 */
export function cleanString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Parse un tableau de résultats génériques
 */
export function parseRows<TRow, TResult>(
  rows: TRow[],
  parser: (row: TRow) => TResult
): TResult[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map(parser).filter(isDefined);
}

/**
 * Parse un résultat unique ou retourne null
 */
export function parseRowOrNull<TRow, TResult>(
  rows: TRow[],
  parser: (row: TRow) => TResult
): TResult | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return parser(rows[0]);
}

/**
 * Parse un résultat de comptage (COUNT query)
 */
export function parseCountResult(rows: any[]): number {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }
  const row = rows[0];
  return toInt(row.count || row.total || row.cnt || 0);
}

/**
 * Parse un résultat EXISTS
 */
export function parseExistsResult(rows: any[]): boolean {
  return parseCountResult(rows) > 0;
}
