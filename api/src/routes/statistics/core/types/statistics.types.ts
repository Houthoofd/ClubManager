/**
 * 📦 Types personnalisés - Statistics
 *
 * Types TypeScript spécifiques au domaine statistics
 */

/**
 * Options de filtrage pour statistics
 */
export interface StatisticsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour statistics
 */
export interface StatisticsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface StatisticsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
