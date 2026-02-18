/**
 * 📦 Types personnalisés - Shop
 *
 * Types TypeScript spécifiques au domaine shop
 */

/**
 * Options de filtrage pour shop
 */
export interface ShopFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour shop
 */
export interface ShopPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface ShopMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
