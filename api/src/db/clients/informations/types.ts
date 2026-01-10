/**
 * Types pour le module Informations
 */

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

/**
 * Information avec données complètes
 */
export interface Information {
  id: number;
  titre: string;
  contenu: string;
  date_creation: Date | string;
  date_modification?: Date | string;
  status_id: number;
  auteur_id?: number;
  categorie_id?: number;
  priorite?: number;
  visible: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Information avec relations
 */
export interface InformationAvecRelations extends Information {
  auteur?: string;
  categorie?: string;
  status?: string;
}

/**
 * Status d'une information
 */
export interface Status {
  id: number;
  nom_role: string;
  description?: string;
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
  ordre?: number;
}

/**
 * Plan tarifaire
 */
export interface PlanTarifaire {
  id: number;
  nom_plan: string;
  prix: number;
  duree: string;
  description?: string;
}

/**
 * Catégorie d'information
 */
export interface CategorieInformation {
  id: number;
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
}

/**
 * Données pour créer une information
 */
export interface CreateInformationData {
  titre: string;
  contenu: string;
  auteur_id?: number;
  categorie_id?: number;
  priorite?: number;
  visible?: boolean;
}

/**
 * Données pour mettre à jour une information
 */
export interface UpdateInformationData {
  titre?: string;
  contenu?: string;
  categorie_id?: number;
  priorite?: number;
  visible?: boolean;
  status_id?: number;
}

/**
 * Résultat de confirmation d'opération
 */
export interface InformationConfirmationResult {
  isConfirm: boolean;
  message: string;
  data?: any;
}

/**
 * Filtres de recherche d'informations
 */
export interface InformationSearchFilters {
  titre?: string;
  contenu?: string;
  categorie_id?: number;
  status_id?: number;
  auteur_id?: number;
  visible?: boolean;
  date_debut?: Date | string;
  date_fin?: Date | string;
  priorite_min?: number;
  priorite_max?: number;
  limit?: number;
  offset?: number;
}

/**
 * Résultat paginé d'informations
 */
export interface PaginatedInformationResult {
  informations: Information[] | InformationAvecRelations[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Statistiques des informations
 */
export interface InformationStatistiques {
  total_informations: number;
  informations_actives: number;
  informations_archivees: number;
  par_categorie: CountByCategorie[];
  par_status: CountByStatus[];
  informations_recentes: number;
}

/**
 * Comptage par catégorie
 */
export interface CountByCategorie {
  categorie: string;
  count: number;
}

/**
 * Comptage par status
 */
export interface CountByStatus {
  status: string;
  count: number;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Structure brute d'une ligne de la table informations
 */
export interface InformationRow {
  id: number;
  titre: string;
  contenu: string;
  date_creation: Date;
  date_modification?: Date;
  status_id: number;
  auteur_id?: number;
  categorie_id?: number;
  priorite?: number;
  visible: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row avec relations jointes
 */
export interface InformationAvecRelationsRow {
  id: number;
  titre: string;
  contenu: string;
  date_creation: Date;
  date_modification?: Date;
  status_id: number;
  auteur_id?: number;
  categorie_id?: number;
  priorite?: number;
  visible: boolean;
  auteur?: string;
  categorie?: string;
  status?: string;
}

/**
 * Row pour status
 */
export interface StatusRow {
  id: number;
  nom_role: string;
  description?: string;
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
  ordre?: number;
}

/**
 * Row pour plan tarifaire
 */
export interface PlanTarifaireRow {
  id: number;
  nom_plan: string;
  prix: number;
  duree: string;
  description?: string;
}

/**
 * Row pour catégorie
 */
export interface CategorieInformationRow {
  id: number;
  nom: string;
  description?: string;
  couleur?: string;
  icone?: string;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Status possibles d'une information
 */
export enum InformationStatus {
  BROUILLON = 0,
  PUBLIE = 1,
  ARCHIVE = 2,
  SUPPRIME = 3,
}

/**
 * Niveaux de priorité
 */
export enum InformationPriorite {
  BASSE = 1,
  NORMALE = 2,
  HAUTE = 3,
  URGENTE = 4,
}

/**
 * Types de contenu
 */
export enum InformationTypeContenu {
  TEXTE = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si une information est valide
 */
export function isValidInformation(info: any): info is Information {
  return (
    info &&
    typeof info.id === 'number' &&
    typeof info.titre === 'string' &&
    typeof info.contenu === 'string' &&
    typeof info.status_id === 'number'
  );
}

/**
 * Vérifie si un titre est valide
 */
export function isValidTitre(titre: string): boolean {
  return titre && titre.trim().length >= 3 && titre.trim().length <= 200;
}

/**
 * Vérifie si un contenu est valide
 */
export function isValidContenu(contenu: string): boolean {
  return contenu && contenu.trim().length >= 10;
}

/**
 * Vérifie si une priorité est valide
 */
export function isValidPriorite(priorite: number): boolean {
  return Number.isInteger(priorite) && priorite >= 1 && priorite <= 4;
}

/**
 * Vérifie si une date est valide
 */
export function isValidDate(date: string | Date): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Type pour les champs pouvant être mis à jour
 */
export type UpdatableInformationFields =
  | 'titre'
  | 'contenu'
  | 'categorie_id'
  | 'priorite'
  | 'visible'
  | 'status_id';

/**
 * Options de tri
 */
export interface InformationSortOptions {
  field: 'date_creation' | 'date_modification' | 'titre' | 'priorite';
  order: 'ASC' | 'DESC';
}

/**
 * Résumé d'une information (version courte)
 */
export interface InformationResume {
  id: number;
  titre: string;
  extrait: string; // Premier N caractères du contenu
  date_creation: Date | string;
  priorite?: number;
  categorie?: string;
}

/**
 * Historique de modification
 */
export interface InformationHistorique {
  id: number;
  information_id: number;
  champ_modifie: string;
  ancienne_valeur: string;
  nouvelle_valeur: string;
  utilisateur_id: number;
  date_modification: Date | string;
}

/**
 * Notification liée à une information
 */
export interface InformationNotification {
  id: number;
  information_id: number;
  utilisateur_id: number;
  lu: boolean;
  date_notification: Date | string;
}

/**
 * Vue d'une information (tracking)
 */
export interface InformationVue {
  id: number;
  information_id: number;
  utilisateur_id?: number;
  date_vue: Date | string;
  ip_address?: string;
}

// ============================================================================
// TYPES POUR LES RÉFÉRENTIELS
// ============================================================================

/**
 * Tous les référentiels en un seul objet
 */
export interface Referentiels {
  status: Status[];
  genres: Genre[];
  grades: Grade[];
  plansTarifaires: PlanTarifaire[];
  categories?: CategorieInformation[];
}

/**
 * Options pour récupérer les référentiels
 */
export interface ReferentielsOptions {
  includeInactifs?: boolean;
  filtreParType?: string;
}
