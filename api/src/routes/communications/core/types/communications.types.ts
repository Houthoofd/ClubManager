/**
 * 📦 Types personnalisés - Communications
 *
 * Types TypeScript spécifiques au domaine communications
 */

/**
 * Options de filtrage pour communications
 */
export interface CommunicationsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour communications
 */
export interface CommunicationsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface CommunicationsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
