/**
 * Types pour le module Cours
 */

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

/**
 * Cours avec informations complètes
 */
export interface Cours {
  id: number;
  date_cours: Date | string;
  jour_cours?: string;
  jour_semaine?: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  capacite_max?: number;
  description?: string;
  actif: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Cours avec professeurs
 */
export interface CoursAvecProfesseurs extends Cours {
  professeurs: Professeur[];
}

/**
 * Cours avec utilisateurs participants
 */
export interface CoursAvecUtilisateurs extends Cours {
  utilisateurs: UtilisateurParticipant[];
}

/**
 * Cours récurrent (template pour générer des cours)
 */
export interface CoursRecurrent {
  id: number;
  jour_semaine: number; // 0-6 (dimanche à samedi)
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  actif: boolean;
  created_at?: Date | string;
}

/**
 * Jour de cours (vue hebdomadaire)
 */
export interface JourDeCours {
  jour: string; // lundi, mardi, etc.
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  professeurs: string[]; // Noms des professeurs
}

/**
 * Professeur
 */
export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  specialites?: string[];
}

/**
 * Utilisateur participant à un cours
 */
export interface UtilisateurParticipant {
  id: number;
  nom: string;
  prenom: string;
  presence: boolean;
  date_inscription?: Date | string;
}

/**
 * Inscription d'un utilisateur à un cours
 */
export interface Inscription {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_inscription: Date | string;
  status_id: number;
  present: boolean;
  notes?: string;
  created_at?: Date | string;
}

/**
 * Informations de semaine
 */
export interface Semaine {
  annee: number;
  numero_semaine: number;
  date_debut: Date | string;
  date_fin: Date | string;
  nombre_cours: number;
}

/**
 * Statistiques de présence par cours
 */
export interface StatistiquesPresenceCours {
  cours_id: number;
  type_cours: string;
  date_cours: Date | string;
  total_inscrits: number;
  presents: number;
  absents: number;
  taux_presence: number;
}

/**
 * Statistiques de présence par utilisateur
 */
export interface StatistiquesPresenceUtilisateur {
  utilisateur_id: number;
  nom: string;
  prenom: string;
  total_cours_inscrits: number;
  cours_assistes: number;
  cours_manques: number;
  taux_presence: number;
}

/**
 * Données pour créer un cours récurrent
 */
export interface CreateCoursRecurrentData {
  jour_semaine: number | string; // Nom du jour ou numéro
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  date_debut?: Date | string;
  date_fin?: Date | string;
  professeurs?: string[]; // Noms des professeurs
}

/**
 * Données pour modifier un cours récurrent
 */
export interface UpdateCoursRecurrentData {
  type_cours?: string;
  heure_debut?: string;
  heure_fin?: string;
  actif?: boolean;
  professeurs?: string[];
}

/**
 * Données pour créer un cours ponctuel
 */
export interface CreateCoursData {
  date_cours: Date | string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  capacite_max?: number;
  description?: string;
  professeurs?: number[]; // IDs des professeurs
}

/**
 * Données pour inscrire un utilisateur
 */
export interface InscriptionData {
  utilisateur_id: number;
  cours_id: number;
  notes?: string;
}

/**
 * Résultat de vérification d'inscription
 */
export interface VerificationInscription {
  isBooked: boolean;
  isFind: boolean;
  message: string;
  data?: {
    inscriptionId?: number;
    userId?: number;
  };
}

/**
 * Résultat de confirmation d'opération
 */
export interface CoursConfirmationResult {
  isConfirm: boolean;
  message: string;
  data?: any;
}

/**
 * Filtres de recherche de cours
 */
export interface CoursSearchFilters {
  type_cours?: string;
  date_debut?: Date | string;
  date_fin?: Date | string;
  jour_semaine?: number;
  heure_debut?: string;
  heure_fin?: string;
  actif?: boolean;
  avec_places_disponibles?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Options de recherche d'inscriptions
 */
export interface InscriptionSearchFilters {
  utilisateur_id?: number;
  cours_id?: number;
  present?: boolean;
  date_debut?: Date | string;
  date_fin?: Date | string;
  limit?: number;
  offset?: number;
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
  jour_cours?: string;
  jour_semaine?: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  capacite_max?: number;
  description?: string;
  actif: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Structure brute d'une ligne de la table cours_recurrent
 */
export interface CoursRecurrentRow {
  id: number;
  jour_semaine: number;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  actif: boolean;
  created_at: Date;
}

/**
 * Structure brute d'une ligne de la table inscriptions
 */
export interface InscriptionRow {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_inscription: Date;
  status_id: number;
  present: boolean;
  notes?: string;
  created_at: Date;
}

/**
 * Row pour professeur
 */
export interface ProfesseurRow {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

/**
 * Row pour utilisateur participant
 */
export interface UtilisateurParticipantRow {
  id: number;
  nom: string;
  prenom: string;
  presence: boolean;
  date_inscription?: Date;
}

/**
 * Row pour jour de cours
 */
export interface JourDeCoursRow {
  jour: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  professeurs?: string; // JSON ou CSV
}

/**
 * Row pour statistiques
 */
export interface StatistiquesRow {
  cours_id?: number;
  utilisateur_id?: number;
  type_cours?: string;
  date_cours?: Date;
  nom?: string;
  prenom?: string;
  total_inscrits?: number;
  presents?: number;
  absents?: number;
  total_cours_inscrits?: number;
  cours_assistes?: number;
  cours_manques?: number;
  taux_presence?: number;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Jours de la semaine (0 = dimanche, 6 = samedi)
 */
export enum JourSemaine {
  DIMANCHE = 0,
  LUNDI = 1,
  MARDI = 2,
  MERCREDI = 3,
  JEUDI = 4,
  VENDREDI = 5,
  SAMEDI = 6,
}

/**
 * Mapping des noms de jours vers numéros
 */
export const JOURS_MAPPING: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

/**
 * Mapping inverse : numéros vers noms
 */
export const JOURS_NAMES: Record<number, string> = {
  0: 'dimanche',
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi',
};

/**
 * Status d'inscription possibles
 */
export enum InscriptionStatus {
  EN_ATTENTE = 1,
  CONFIRMEE = 2,
  ANNULEE = 3,
  VALIDEE = 4,
}

/**
 * Types de cours courants
 */
export enum TypeCours {
  KARATE = 'Karaté',
  KOBUDO = 'Kobudo',
  SELF_DEFENSE = 'Self Défense',
  COMPETITION = 'Compétition',
  ENFANTS = 'Enfants',
  ADULTES = 'Adultes',
  AVANCE = 'Avancé',
  DEBUTANT = 'Débutant',
}

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
 * Vérifie si une heure est valide (format HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Vérifie si une date est valide
 */
export function isValidDate(date: string | Date): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Vérifie si un jour de semaine est valide
 */
export function isValidJourSemaine(jour: number | string): boolean {
  if (typeof jour === 'number') {
    return jour >= 0 && jour <= 6;
  }
  return jour.toLowerCase() in JOURS_MAPPING;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Résultat paginé de cours
 */
export interface PaginatedCoursResult {
  cours: Cours[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Résultat paginé d'inscriptions
 */
export interface PaginatedInscriptionResult {
  inscriptions: Inscription[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Disponibilité d'un cours
 */
export interface DisponibiliteCours {
  cours_id: number;
  capacite_max: number;
  places_occupees: number;
  places_disponibles: number;
  complet: boolean;
}

/**
 * Résumé hebdomadaire
 */
export interface ResumeHebdomadaire {
  semaine: Semaine;
  cours: CoursAvecProfesseurs[];
  total_cours: number;
  total_participants: number;
}
