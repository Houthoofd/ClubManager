/**
 * 📦 Types personnalisés - Gdpr
 *
 * Types TypeScript spécifiques au domaine gdpr
 */

/**
 * Options de filtrage pour gdpr
 */
export interface GdprFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour gdpr
 */
export interface GdprPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface GdprMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
