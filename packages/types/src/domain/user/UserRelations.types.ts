/**
 * Types pour les relations User
 * Basés sur les tables de référence de la DB
 */

/**
 * Genre (table: genres)
 */
export interface Genre {
  id: number;
  nom: string;
}

/**
 * Grade de jiu-jitsu (table: grades)
 */
export interface Grade {
  id: number;
  nom: string;
  ordre: number;
  couleur?: string;
}

/**
 * Status utilisateur (table: status)
 */
export interface Status {
  id: number;
  nom: string;
  description?: string;
}

/**
 * Plan tarifaire / Abonnement (table: plans_tarifaires)
 */
export interface PlanTarifaire {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  duree_mois: number;
  actif: boolean;
  created_at: Date;
  updated_at?: Date;
}
