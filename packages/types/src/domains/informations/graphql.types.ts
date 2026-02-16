/**
 * Types GraphQL pour Informations (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module informations/graphql.types
 */

/**
 * Information du club (annonce, actualité) (GraphQL)
 */
export interface Information {
  id: number;
  titre: string;
  contenu: string;
  dateCreation: string;
  statusId: number;
}

/**
 * Résultat d'une opération sur une information (GraphQL)
 */
export interface InformationResult {
  success: boolean;
  message: string;
  data?: Information;
}

/**
 * Grade de ceinture (référentiel) (GraphQL)
 */
export interface Grade {
  id: number;
  nom: string;
  ordre?: number;
}

/**
 * Genre (référentiel) (GraphQL)
 */
export interface Genre {
  id: number;
  nom: string;
}

/**
 * Status (référentiel) (GraphQL)
 */
export interface Status {
  id: number;
  nom: string;
}

/**
 * Plan tarifaire / Abonnement (référentiel) (GraphQL)
 */
export interface PlanTarifaire {
  id: number;
  nomPlan: string;
  prix: number;
  dureeMois: number;
  description?: string;
}

/**
 * Tous les référentiels en un seul objet (GraphQL)
 */
export interface AllReferences {
  grades: Grade[];
  genres: Genre[];
  status: Status[];
  abonnements: PlanTarifaire[];
}

/**
 * Health check des référentiels (GraphQL)
 */
export interface ReferenceHealthCheck {
  status: string;
  checks: ReferenceHealthChecks;
  message: string;
  timestamp?: string;
}

/**
 * Détail des checks par référentiel (GraphQL)
 */
export interface ReferenceHealthChecks {
  grades: boolean;
  genres: boolean;
  status: boolean;
  abonnements: boolean;
}

/**
 * Input pour créer/modifier une information (GraphQL)
 */
export interface InformationInput {
  titre: string;
  contenu: string;
}

/**
 * Contexte GraphQL pour Informations
 */
export interface InformationsContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
