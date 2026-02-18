/**
 * 📦 Types personnalisés - Memberships
 *
 * Types TypeScript spécifiques au domaine memberships
 */

/**
 * Options de filtrage pour memberships
 */
export interface MembershipsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour memberships
 */
export interface MembershipsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface MembershipsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
