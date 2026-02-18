/**
 * 📦 Types personnalisés - Users
 *
 * Types TypeScript spécifiques au domaine users
 */

/**
 * Options de filtrage pour users
 */
export interface UsersFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour users
 */
export interface UsersPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface UsersMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
