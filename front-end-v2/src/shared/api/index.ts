/**
 * Shared API Module
 *
 * Barrel export for all API-related functionality.
 * Provides centralized HTTP client and error types.
 *
 * @module shared/api
 */

export {
  apiClient,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  type HttpMethod,
  type RequestConfig,
  type ApiClientConfig,
  type ApiErrorData,
  ApiError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
} from './client';

export { default } from './client';
