/**
 * 📦 Types personnalisés - Events
 *
 * Types TypeScript spécifiques au domaine events
 */

/**
 * Options de filtrage pour events
 */
export interface EventsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour events
 */
export interface EventsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface EventsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
