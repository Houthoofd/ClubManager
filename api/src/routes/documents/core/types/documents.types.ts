/**
 * 📦 Types personnalisés - Documents
 *
 * Types TypeScript spécifiques au domaine documents
 */

/**
 * Options de filtrage pour documents
 */
export interface DocumentsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour documents
 */
export interface DocumentsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface DocumentsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
