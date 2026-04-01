/**
 * Types pour les réponses API
 */

/**
 * Réponse API en cas de succès
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

/**
 * Réponse API en cas d'erreur
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

/**
 * Type union pour toutes les réponses API
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
