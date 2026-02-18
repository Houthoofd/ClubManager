/**
 * 📦 Types personnalisés - Audit
 *
 * Types TypeScript spécifiques au domaine audit
 */

/**
 * Options de filtrage pour audit
 */
export interface AuditFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour audit
 */
export interface AuditPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface AuditMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
