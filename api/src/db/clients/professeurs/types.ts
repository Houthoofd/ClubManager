/**
 * Types et interfaces pour le module professeurs
 */

// ============================================================================
// Types de base
// ============================================================================

/**
 * Représente un professeur dans le système
 */
export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_naissance: Date | string;
  grade_id: number;
}

/**
 * Représente un professeur avec informations étendues
 */
export interface ProfesseurComplet extends Professeur {
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date | string;
  status_id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Représente un cours récurrent d'un professeur
 */
export interface CoursRecurrent {
  cours_recurrent_id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  est_recurrent_actif: boolean | number;
  professeur_id: number;
  professeur_nom: string;
  professeur_prenom: string;
}

/**
 * Représente un utilisateur complet du système
 */
export interface Utilisateur {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_of_birth: Date | string;
  grade_id: number;
  status_id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * DTO pour créer/ajouter un professeur
 */
export interface AjouterProfesseurDTO {
  id: number;
}

/**
 * DTO pour un batch d'ajout de professeurs
 */
export interface AjouterProfesseursBatchDTO {
  utilisateurs: number[] | AjouterProfesseurDTO[];
}

/**
 * DTO pour modifier le statut d'un professeur
 */
export interface ModifierStatutProfesseurDTO {
  id: number;
  status_id: number;
}

/**
 * DTO pour retirer la promotion d'un professeur
 */
export interface RetirerPromotionDTO {
  id: number;
}

// ============================================================================
// Résultats et réponses
// ============================================================================

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
}

/**
 * Résultat de vérification avec données
 */
export interface VerifyResultWithData<T = any> {
  isFind: boolean;
  message: string;
  data: T;
}

/**
 * Résultat de recherche de professeurs
 */
export interface ProfesseursSearchResult {
  professeurs: Professeur[];
  total: number;
}

/**
 * Résultat de planning de cours
 */
export interface PlanningCoursResult {
  cours: CoursRecurrent[];
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

// ============================================================================
// Enums et constantes
// ============================================================================

/**
 * ID de statut pour les professeurs
 */
export const PROFESSEUR_STATUS_ID = 5;

/**
 * ID de statut pour les utilisateurs réguliers
 */
export const UTILISATEUR_STATUS_ID = 1;

/**
 * Statuts d'utilisateurs
 */
export enum UserStatus {
  UTILISATEUR = 1,
  ADMIN = 2,
  MODERATEUR = 3,
  ELEVE = 4,
  PROFESSEUR = 5,
}

/**
 * Jours de la semaine pour les cours récurrents
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

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Vérifie si un objet est un Professeur valide
 */
export function isProfesseur(obj: any): obj is Professeur {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.nom === "string" &&
    typeof obj.prenom === "string" &&
    typeof obj.email === "string" &&
    typeof obj.genre_id === "number" &&
    typeof obj.grade_id === "number"
  );
}

/**
 * Vérifie si un objet est un ProfesseurComplet valide
 */
export function isProfesseurComplet(obj: any): obj is ProfesseurComplet {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.nom === "string" &&
    typeof obj.prenom === "string" &&
    typeof obj.email === "string" &&
    typeof obj.genre_id === "number" &&
    typeof obj.grade_id === "number" &&
    typeof obj.status_id === "number"
  );
}

/**
 * Vérifie si un objet est un CoursRecurrent valide
 */
export function isCoursRecurrent(obj: any): obj is CoursRecurrent {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.cours_recurrent_id === "number" &&
    typeof obj.type_cours === "string" &&
    typeof obj.jour_semaine === "number" &&
    typeof obj.heure_debut === "string" &&
    typeof obj.heure_fin === "string" &&
    typeof obj.professeur_id === "number"
  );
}

/**
 * Vérifie si un objet est un Utilisateur valide
 */
export function isUtilisateur(obj: any): obj is Utilisateur {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.first_name === "string" &&
    typeof obj.last_name === "string" &&
    typeof obj.email === "string" &&
    typeof obj.status_id === "number"
  );
}

/**
 * Vérifie si un utilisateur est un professeur
 */
export function isUtilisateurProfesseur(obj: Utilisateur): boolean {
  return obj.status_id === PROFESSEUR_STATUS_ID;
}

// ============================================================================
// Utilitaires de mapping
// ============================================================================

/**
 * Mappe un résultat de BDD vers un objet Professeur
 */
export function mapRowToProfesseur(row: any): Professeur {
  return {
    id: row.id,
    nom: row.first_name || row.nom,
    prenom: row.last_name || row.prenom,
    nom_utilisateur: row.nom_utilisateur,
    email: row.email,
    genre_id: row.genre_id,
    date_naissance: row.date_of_birth || row.date_naissance,
    grade_id: row.grade_id,
  };
}

/**
 * Mappe un résultat de BDD vers un objet ProfesseurComplet
 */
export function mapRowToProfesseurComplet(row: any): ProfesseurComplet {
  return {
    ...mapRowToProfesseur(row),
    first_name: row.first_name,
    last_name: row.last_name,
    date_of_birth: row.date_of_birth,
    status_id: row.status_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Mappe un résultat de BDD vers un objet CoursRecurrent
 */
export function mapRowToCoursRecurrent(row: any): CoursRecurrent {
  return {
    cours_recurrent_id: row.cours_recurrent_id,
    type_cours: row.type_cours,
    jour_semaine: row.jour_semaine,
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    est_recurrent_actif: Boolean(row.est_recurrent_actif),
    professeur_id: row.professeur_id,
    professeur_nom: row.professeur_nom,
    professeur_prenom: row.professeur_prenom,
  };
}

/**
 * Mappe un résultat de BDD vers un objet Utilisateur
 */
export function mapRowToUtilisateur(row: any): Utilisateur {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    nom_utilisateur: row.nom_utilisateur,
    email: row.email,
    genre_id: row.genre_id,
    date_of_birth: row.date_of_birth,
    grade_id: row.grade_id,
    status_id: row.status_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
