/**
 * Types pour le service Professeurs
 * Gestion des professeurs, leur planning et statistiques
 * Les schémas Zod sont dans validators.ts
 *
 * @module professeurs/types
 */

/**
 * Statut d'un professeur
 */
export enum StatutProfesseur {
  ACTIF = "actif",
  INACTIF = "inactif",
  SUSPENDU = "suspendu",
}

/**
 * Type Professeur
 */
export type Professeur = {
  id: number;
  nom: string;
  prenom: string;
  nom_utilisateur?: string;
  email: string;
  genre_id?: number;
  date_naissance: Date | null;
  grade_id: number | null;
  status_id?: number;
};

/**
 * Professeur avec détails complets
 */
export interface ProfesseurAvecDetails extends Professeur {
  genre?: {
    id: number;
    nom: string;
  };
  grade?: {
    id: number;
    nom: string;
    niveau: number;
  };
  nombreCours?: number;
  nombreEleves?: number;
}

/**
 * Planning d'un cours pour un professeur
 */
export type PlanningCoursProf = {
  cours_recurrent_id: number;
  type_cours: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  est_recurrent_actif: boolean;
  professeur_id: number;
  professeur_nom: string;
  professeur_prenom: string;
};

/**
 * Input pour ajouter un professeur
 */
export type AjouterProfesseurInput = {
  utilisateurs: number[] | Array<{ id: number }>;
};

/**
 * Input pour modifier le statut d'un professeur
 */
export type ModifierStatutProfesseurInput = {
  id: number;
  status_id: number;
};

/**
 * Statistiques des professeurs
 */
export interface StatistiquesProfesseurs {
  totalProfesseurs: number;
  professeursActifs: number;
  professeursInactifs: number;
  totalCours: number;
  totalEleves: number;
  moyenneCoursParProfesseur: number;
  moyenneElevesParProfesseur: number;
  repartitionParGrade?: Array<{
    grade: string;
    count: number;
  }>;
}

/**
 * Statistiques par professeur
 */
export interface StatistiquesProfesseur {
  professeurId: number;
  nombreCours: number;
  nombreEleves: number;
  tauxPresence: number;
  heuresEnseignement: number;
}

/**
 * Réponse de professeur
 */
export interface ProfesseursResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Erreur personnalisée pour les professeurs
 */
export class ProfesseursError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ProfesseursError";
    this.code = code;
    Object.setPrototypeOf(this, ProfesseursError.prototype);
  }
}

/**
 * Options de filtrage pour les professeurs
 */
export interface ProfesseursFiltres {
  status_id?: number;
  grade_id?: number;
  genre_id?: number;
  recherche?: string;
  limit?: number;
  offset?: number;
}

/**
 * Résultat de traitement professeur
 */
export interface TraitementProfesseurResult {
  success: boolean;
  professeurId?: number;
  message: string;
}

/**
 * Réponse paginée pour les professeurs
 */
export interface ProfesseursPaginatedResponse {
  professeurs: ProfesseurAvecDetails[];
  total: number;
  hasMore: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Réponse pour le planning
 */
export interface PlanningProfesseurResponse {
  planning: PlanningCoursProf[];
  total: number;
  professeurId: number;
}

/**
 * Input pour retirer la promotion
 */
export interface RetirerPromotionInput {
  id: number;
  motif?: string;
}

/**
 * Résultat de l'ajout de professeurs
 */
export interface AjouterProfesseurResult {
  success: boolean;
  message: string;
  professeurs?: ProfesseurAvecDetails[];
  errors?: string[];
}
