/**
 * Types pour le service Professeurs
 * Gestion des professeurs, leur planning et statistiques
 */

import { z } from 'zod';

/**
 * Statut d'un professeur
 */
export enum StatutProfesseur {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  SUSPENDU = 'suspendu'
}

/**
 * Schéma Zod pour validation d'un professeur
 */
export const ProfesseurSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  nom_utilisateur: z.string().optional(),
  email: z.string().email(),
  genre_id: z.number().int().positive().optional(),
  date_naissance: z.date().nullable(),
  grade_id: z.number().int().positive().nullable(),
  status_id: z.number().int().optional()
});

/**
 * Type Professeur
 */
export type Professeur = z.infer<typeof ProfesseurSchema>;

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
export const PlanningCoursProfSchema = z.object({
  cours_recurrent_id: z.number().int().positive(),
  type_cours: z.string(),
  jour_semaine: z.number().int().min(0).max(6),
  heure_debut: z.string(),
  heure_fin: z.string(),
  est_recurrent_actif: z.boolean(),
  professeur_id: z.number().int().positive(),
  professeur_nom: z.string(),
  professeur_prenom: z.string()
});

export type PlanningCoursProf = z.infer<typeof PlanningCoursProfSchema>;

/**
 * Input pour ajouter un professeur
 */
export const AjouterProfesseurInputSchema = z.object({
  utilisateurs: z.union([
    z.array(z.number().int().positive()),
    z.array(z.object({ id: z.number().int().positive() }))
  ])
});

export type AjouterProfesseurInput = z.infer<typeof AjouterProfesseurInputSchema>;

/**
 * Input pour modifier le statut d'un professeur
 */
export const ModifierStatutProfesseurInputSchema = z.object({
  id: z.number().int().positive('ID professeur requis'),
  status_id: z.number().int().positive('Statut requis')
});

export type ModifierStatutProfesseurInput = z.infer<typeof ModifierStatutProfesseurInputSchema>;

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
    this.name = 'ProfesseursError';
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
