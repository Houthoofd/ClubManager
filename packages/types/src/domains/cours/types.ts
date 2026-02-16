/**
 * Types pour le module Cours
 * Les schémas Zod sont dans validators.ts
 *
 * @module cours/types
 */

import type { Professeur } from "../utilisateurs/types.js";

// ============================================================================
// COURSE TYPE TYPES (Nouvelle table de référence - Phase 1)
// ============================================================================

/**
 * Type de cours (table de référence)
 */
export interface CourseType {
  /** Identifiant unique */
  id: number;

  /** ID du sport associé */
  sport_id?: number | null;

  /** Code unique du type de cours */
  code: string;

  /** Nom du type de cours */
  name: string;

  /** Description du type de cours */
  description?: string | null;

  /** Le type de cours est-il actif ? */
  active: boolean;

  /** Date de création */
  created_at: Date;
}

/**
 * Données pour créer un type de cours
 */
export interface CreateCourseTypeInput {
  sport_id?: number;
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

/**
 * Données pour mettre à jour un type de cours
 */
export interface UpdateCourseTypeInput {
  sport_id?: number;
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
}

/**
 * Type de cours avec informations du sport
 */
export interface CourseTypeWithSport extends CourseType {
  sport?: {
    id: number;
    code: string;
    name: string;
    color: string;
  };
}

// ============================================================================
// COURSE TYPES (Types principaux)
// ============================================================================

export type CoursData = {
  id: number;
  date_cours: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  utilisateurs?: Utilisateur[];
};

export type Utilisateur = {
  nom: string;
  prenom: string;
  presence: number;
};

export type UtilisateursParCours = CoursData & {
  utilisateurs: Utilisateur[];
};

export type DataReservation = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type DataAnnulation = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type DataValidation = {
  cours_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export type DataInscription = {
  cours_id: number;
  utilisateur_id: number;
  status_id: number;
};

export type JourCours = {
  jour: string;
  type_cours: string;
  heure_debut: string | null;
  heure_fin: string | null;
  professeurs: string[];
};

export type AjoutCours = {
  nom: string;
  heure_debut: string | null;
  heure_fin: string | null;
  jour_semaine: string;
  type_cours: string;
  professeurs: string[];
};

// Nouveau type pour les données du planning professeur
export type PlanningCoursProfesseur = {
  cours_recurrent_id: number;
  type_cours: string;
  course_type_id?: number; // Nouvelle FK vers CourseType
  jour_semaine: number | string;
  heure_debut: string;
  heure_fin: string;
  est_recurrent_actif: boolean | number;
  professeur_id: number;
  professeur_nom: string;
  professeur_prenom: string;
};

/**
 * Cours récurrent avec type de cours détaillé
 */
export interface CoursRecurrentWithCourseType {
  id: number;
  type_cours?: string | null;
  course_type_id: number;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  places_max?: number | null;
  active?: boolean;
  course_type?: CourseType;
}
