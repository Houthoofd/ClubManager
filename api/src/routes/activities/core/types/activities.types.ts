/**
 * 📦 Types personnalisés - Activities
 *
 * Types TypeScript spécifiques au domaine activities
 */

/**
 * Options de filtrage pour activities
 */
export interface ActivitiesFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour activities
 */
export interface ActivitiesPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface ActivitiesMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
