/**
 * Types GraphQL pour Alertes (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module alertes/graphql.types
 */

/**
 * Type représentant une alerte système (GraphQL)
 */
export interface Alerte {
  id: number;
  type: string;
  severite: string;
  message: string;
  utilisateurId?: number;
  statut: string;
  dateDetection: string;
  dateResolution?: string;
  notes?: string;
}

/**
 * Dashboard des alertes avec statistiques globales (GraphQL)
 */
export interface AlerteDashboard {
  totalAlertes: number;
  alertesCritiques: number;
  alertesEnAttente: number;
  alertesResolues: number;
  alertesParType: Record<string, any>;
  tendances: Record<string, any>;
}

/**
 * Résultat d'une opération sur une alerte (GraphQL)
 */
export interface AlerteOperationResult {
  success: boolean;
  message: string;
}

/**
 * Input pour résoudre une alerte (GraphQL)
 */
export interface ResoudreAlerteInput {
  alerteId: number;
  notes?: string;
}

/**
 * Input pour ignorer une alerte (GraphQL)
 */
export interface IgnorerAlerteInput {
  alerteId: number;
  notes?: string;
}

/**
 * Contexte GraphQL pour Alertes
 */
export interface AlertesContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
