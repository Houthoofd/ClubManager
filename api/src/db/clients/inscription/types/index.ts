/**
 * Types pour le module Inscription (Cours)
 * Gestion des inscriptions aux cours, des cours récurrents, et de la présence
 */

// ============================================================================
// TYPES TYPESCRIPT - COURS
// ============================================================================

/**
 * Informations complètes d'un cours
 */
export interface Cours {
  id: number;
  date_cours: Date | string;
  jour_cours?: string;
  jour_semaine?: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Cours avec informations sur les professeurs
 */
export interface CoursAvecProfesseurs extends Cours {
  professeurs?: Professeur[];
}

/**
 * Cours avec liste des utilisateurs inscrits
 */
export interface CoursAvecUtilisateurs extends Cours {
  utilisateurs: UtilisateurInscrit[];
}

/**
 * Informations d'un cours récurrent
 */
export interface CoursRecurrent {
  id: number;
  jour_semaine: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  date_debut: Date | string;
  date_fin?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Jour de cours avec professeurs
 */
export interface JourDeCours {
  id?: number;
  jour: string;
  jour_semaine?: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  professeurs: string[];
  date_debut?: Date | string;
  date_fin?: Date | string | null;
}

/**
 * Informations d'une semaine avec cours
 */
export interface SemaineAvecCours {
  numero_semaine: number;
  annee: number;
  date_debut: Date | string;
  date_fin: Date | string;
  nombre_cours: number;
}

// ============================================================================
// TYPES TYPESCRIPT - INSCRIPTIONS
// ============================================================================

/**
 * Inscription d'un utilisateur à un cours
 */
export interface Inscription {
  id: number;
  cours_id: number;
  utilisateur_id: number;
  date_inscription: Date | string;
  presence: 'present' | 'absent' | 'en_attente' | null;
  est_valide: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Utilisateur inscrit à un cours avec informations de présence
 */
export interface UtilisateurInscrit {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  presence: 'present' | 'absent' | 'en_attente' | null;
  date_inscription?: Date | string;
  est_valide?: boolean;
}

/**
 * Participant (utilisateur) pour les cours
 */
export interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  status_id: number;
}

/**
 * Professeur associé à un cours
 */
export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

/**
 * Résultat de vérification d'inscription
 */
export interface VerificationInscription {
  isBooked: boolean;
  isFind: boolean;
  message: string;
  data: {
    inscriptionId?: number;
    userId?: number;
    coursId?: number;
    presence?: string;
    est_valide?: boolean;
  };
}

// ============================================================================
// TYPES TYPESCRIPT - STATISTIQUES
// ============================================================================

/**
 * Statistiques de présence par cours
 */
export interface StatistiquesPresenceCours {
  cours_id: number;
  date_cours: Date | string;
  type_cours: string;
  total_inscrits: number;
  presents: number;
  absents: number;
  en_attente: number;
  taux_presence: number;
}

/**
 * Statistiques de présence par utilisateur
 */
export interface StatistiquesPresenceUtilisateur {
  utilisateur_id: number;
  nom: string;
  prenom: string;
  total_cours: number;
  presents: number;
  absents: number;
  en_attente: number;
  taux_presence: number;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Structure brute d'une ligne de la table cours
 */
export interface CoursRow {
  id: number;
  date_cours: Date;
  jour_cours: string | null;
  jour_semaine: number | null;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Structure brute d'une ligne de cours récurrent
 */
export interface CoursRecurrentRow {
  id: number;
  jour_semaine: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  date_debut: Date;
  date_fin: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row pour inscription
 */
export interface InscriptionRow {
  id: number;
  cours_id: number;
  utilisateur_id: number;
  date_inscription: Date;
  presence: string | null;
  est_valide: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row pour utilisateur inscrit avec présence
 */
export interface UtilisateurInscritRow {
  id: number;
  nom: string;
  prenom: string;
  email: string | null;
  presence: string | null;
  date_inscription: Date | null;
  est_valide: number | null;
}

/**
 * Row pour professeur
 */
export interface ProfesseurRow {
  id: number;
  nom: string;
  prenom: string;
  email: string | null;
}

/**
 * Row pour jour de cours avec professeurs
 */
export interface JourDeCoursRow {
  id: number;
  jour_semaine: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  date_debut: Date;
  date_fin: Date | null;
  professeurs: string;
}

/**
 * Row pour semaine avec cours
 */
export interface SemaineAvecCoursRow {
  numero_semaine: number;
  annee: number;
  date_debut: Date;
  date_fin: Date;
  nombre_cours: number;
}

/**
 * Row pour statistiques de présence par cours
 */
export interface StatistiquesPresenceCoursRow {
  cours_id: number;
  date_cours: Date;
  type_cours: string;
  total_inscrits: number;
  presents: number;
  absents: number;
  en_attente: number;
}

/**
 * Row pour statistiques de présence par utilisateur
 */
export interface StatistiquesPresenceUtilisateurRow {
  utilisateur_id: number;
  nom: string;
  prenom: string;
  total_cours: number;
  presents: number;
  absents: number;
  en_attente: number;
}

// ============================================================================
// TYPES DE DONNÉES POUR OPÉRATIONS
// ============================================================================

/**
 * Données pour créer un cours récurrent
 */
export interface CreateCoursRecurrentData {
  jour: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  date_debut?: string;
  date_fin?: string;
  professeurs?: string[];
}

/**
 * Données pour modifier un cours récurrent
 */
export interface UpdateCoursRecurrentData {
  id: number;
  jour?: string;
  type_cours?: string;
  heure_debut?: string;
  heure_fin?: string;
  date_fin?: string;
  professeurs?: string[];
}

/**
 * Données pour créer un cours ponctuel
 */
export interface CreateCoursData {
  date_cours: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  professeurs?: string[];
}

/**
 * Données pour inscription utilisateur
 */
export interface InscriptionData {
  coursId: number;
  utilisateurId: number;
  presence?: 'present' | 'absent' | 'en_attente';
  est_valide?: boolean;
}

/**
 * Données pour mise à jour de présence
 */
export interface UpdatePresenceData {
  inscriptionId: number;
  presence: 'present' | 'absent' | 'en_attente';
}

// ============================================================================
// TYPES DE RÉSULTAT
// ============================================================================

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  data?: any;
}

/**
 * Résultat de recherche
 */
export interface SearchResult<T> {
  isFind: boolean;
  message: string;
  data: T | null;
}

/**
 * Résultat d'opération avec données
 */
export interface OperationResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Jours de la semaine
 */
export enum JourSemaine {
  LUNDI = 1,
  MARDI = 2,
  MERCREDI = 3,
  JEUDI = 4,
  VENDREDI = 5,
  SAMEDI = 6,
  DIMANCHE = 0,
}

/**
 * Status de présence
 */
export enum StatusPresence {
  PRESENT = 'present',
  ABSENT = 'absent',
  EN_ATTENTE = 'en_attente',
}

/**
 * Mapping des jours
 */
export const JOURS_MAPPING: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un cours est valide
 */
export function isValidCours(cours: any): cours is Cours {
  return (
    cours &&
    typeof cours.id === 'number' &&
    typeof cours.type_cours === 'string' &&
    typeof cours.heure_debut === 'string' &&
    typeof cours.heure_fin === 'string'
  );
}

/**
 * Vérifie si une inscription est valide
 */
export function isValidInscription(inscription: any): inscription is Inscription {
  return (
    inscription &&
    typeof inscription.id === 'number' &&
    typeof inscription.cours_id === 'number' &&
    typeof inscription.utilisateur_id === 'number'
  );
}

/**
 * Vérifie si un jour de semaine est valide (0-6)
 */
export function isValidJourSemaine(jour: number): boolean {
  return Number.isInteger(jour) && jour >= 0 && jour <= 6;
}

/**
 * Vérifie si une heure est au format valide (HH:MM:SS ou HH:MM)
 */
export function isValidHeureFormat(heure: string): boolean {
  const heureRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
  return heureRegex.test(heure);
}

/**
 * Vérifie si une date de cours est valide
 */
export function isValidDateCours(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Vérifie si un status de présence est valide
 */
export function isValidPresence(presence: string): presence is StatusPresence {
  return Object.values(StatusPresence).includes(presence as StatusPresence);
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Options de filtrage pour les cours
 */
export interface CoursFilterOptions {
  dateDebut?: string;
  dateFin?: string;
  typeCours?: string;
  jourSemaine?: number;
  utilisateurId?: number;
  includeUtilisateurs?: boolean;
  includeProfesseurs?: boolean;
}

/**
 * Options de filtrage pour les inscriptions
 */
export interface InscriptionFilterOptions {
  coursId?: number;
  utilisateurId?: number;
  presence?: StatusPresence;
  estValide?: boolean;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * Options de statistiques
 */
export interface StatistiquesOptions {
  dateDebut?: string;
  dateFin?: string;
  typeCours?: string;
  utilisateurId?: number;
  coursId?: number;
}

/**
 * Type pour les champs de cours pouvant être mis à jour
 */
export type UpdatableCoursFields =
  | 'date_cours'
  | 'type_cours'
  | 'heure_debut'
  | 'heure_fin'
  | 'jour_cours'
  | 'jour_semaine';

/**
 * Type pour les champs de cours récurrent pouvant être mis à jour
 */
export type UpdatableCoursRecurrentFields =
  | 'jour_semaine'
  | 'type_cours'
  | 'heure_debut'
  | 'heure_fin'
  | 'date_fin';

/**
 * Type pour les champs d'inscription pouvant être mis à jour
 */
export type UpdatableInscriptionFields = 'presence' | 'est_valide';

// ============================================================================
// HELPERS DE CONVERSION
// ============================================================================

/**
 * Convertit un nom de jour en numéro
 */
export function jourToNumber(jour: string): number {
  const jourLower = jour.toLowerCase();
  return JOURS_MAPPING[jourLower] ?? -1;
}

/**
 * Convertit un numéro de jour en nom
 */
export function numberToJour(num: number): string {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return jours[num] || '';
}

/**
 * Formate une date pour SQL (YYYY-MM-DD)
 */
export function formatDateForSQL(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Formate une heure pour SQL (HH:MM:SS)
 */
export function formatTimeForSQL(time: string): string {
  if (time.length === 5) {
    return `${time}:00`;
  }
  return time;
}
