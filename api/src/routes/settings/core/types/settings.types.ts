/**
 * 📦 Types personnalisés - Settings
 *
 * Types TypeScript spécifiques au domaine settings
 */

/**
 * Options de filtrage pour settings
 */
export interface SettingsFilterOptions {
  userId?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat paginé pour settings
 */
export interface SettingsPaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Réponse de création/mise à jour
 */
export interface SettingsMutationResult {
  success: boolean;
  message: string;
  data?: any;
}
