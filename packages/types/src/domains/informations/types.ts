/**
 * Types pour le service Informations
 * Gestion des informations du club et des référentiels
 */

// Using number type instead of Decimal for better compatibility
// Decimal will be handled at runtime by Prisma
type Decimal = number;

/**
 * Information du club
 */
export interface Information {
  id: number;
  titre: string;
  contenu: string;
  date_creation: Date;
  status_id: number;
}

/**
 * Input pour créer/modifier une information
 */
export interface InformationInput {
  titre: string;
  contenu: string;
}

/**
 * Résultat d'une opération sur une information
 */
export interface InformationResult {
  success: boolean;
  message: string;
  data?: Information;
}

/**
 * Status (référentiel)
 */
export interface Status {
  id: number;
  status_name: string;
  description?: string | null;
}

/**
 * Plan tarifaire (référentiel)
 */
export interface PlanTarifaire {
  id: number;
  nom_plan: string;
  prix: number | Decimal;
  periode: string;
  duree_mois: number;
  description?: string | null;
}

/**
 * Grade (référentiel)
 */
export interface Grade {
  id: number;
  nom: string;
  ordre?: number;
}

/**
 * Genre (référentiel)
 */
export interface Genre {
  id: number;
  nom: string;
}
