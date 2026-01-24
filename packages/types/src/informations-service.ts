/**
 * Types pour le service Informations
 * Gestion des informations du club et des référentiels
 */

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
 * Plan tarifaire (référentiel)
 */
export interface PlanTarifaire {
  id: number;
  nom: string;
}
