/**
 * HTTP Client with Result Pattern
 *
 * Client HTTP centralisé qui utilise le pattern Result de @clubmanager/types
 * pour une gestion d'erreurs type-safe et explicite.
 *
 * @example
 * ```ts
 * const result = await httpClient.post('auth/login', credentials);
 * result.match(
 *   (data) => console.log('Success:', data),
 *   (error) => console.error('Error:', error.message)
 * );
 * ```
 */

import { Result, ok, err } from '@clubmanager/types';
import type { DomainError } from '@clubmanager/types';
import { API_BASE_URL } from '../config/env';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Erreur API (réponse HTTP avec erreur)
 */
export class ApiError implements DomainError {
  readonly _tag = 'ApiError';

  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly details?: unknown
  ) {}

  toString(): string {
    return `API Error ${this.status}: ${this.message}`;
  }
}

/**
 * Erreur réseau (pas de réponse)
 */
export class NetworkError implements DomainError {
  readonly _tag = 'NetworkError';

  constructor(public readonly message: string) {}

  toString(): string {
    return `Network Error: ${this.message}`;
  }
}

/**
 * Erreur de validation
 */
export class ValidationError implements DomainError {
  readonly _tag = 'ValidationError';

  constructor(
    public readonly message: string,
    public readonly fields?: Record<string, string[]>
  ) {}

  toString(): string {
    return `Validation Error: ${this.message}`;
  }
}

/**
 * Erreur d'authentification
 */
export class AuthenticationError implements DomainError {
  readonly _tag = 'AuthenticationError';

  constructor(public readonly message: string) {}

  toString(): string {
    return `Authentication Error: ${this.message}`;
  }
}

/**
 * Type union pour toutes les erreurs possibles
 */
export type HttpError =
  | ApiError
  | NetworkError
  | ValidationError
  | AuthenticationError;

/**
 * Type Result pour les requêtes HTTP
 */
export type ApiResult<T> = Result<T, HttpError>;

// ============================================================================
// Configuration Types
// ============================================================================

interface RequestConfig extends Omit<RequestInit, 'body'> {
  /**
   * Skip l'ajout automatique du token d'authentification
   */
  skipAuth?: boolean;

  /**
   * Timeout en millisecondes (par défaut: 30000)
   */
  timeout?: number;

  /**
   * Retry automatique en cas d'erreur réseau
   */
  retries?: number;
}

// ============================================================================
// Storage Helper
// ============================================================================

/**
 * Gestion sécurisée du localStorage
 */
class StorageHelper {
  /**
   * Récupère le token d'authentification
   */
  getAuthToken(): string | null {
    try {
      const token = localStorage.getItem('authToken');
      if (token) return token;

      // Fallback: chercher dans userData
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.token || null;
      }

      return null;
    } catch (error) {
      console.warn('Error reading auth token from localStorage:', error);
      return null;
    }
  }

  /**
   * Sauvegarde le token d'authentification
   */
  setAuthToken(token: string): void {
    try {
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving auth token to localStorage:', error);
    }
  }

  /**
   * Supprime le token d'authentification
   */
  clearAuthToken(): void {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing auth token from localStorage:', error);
    }
  }
}

// ============================================================================
// HTTP Client
// ============================================================================

class HttpClient {
  private baseURL: string;
  private storage: StorageHelper;
  private defaultTimeout = 30000; // 30 secondes

  constructor(baseURL: string) {
    this.baseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
    this.storage = new StorageHelper();
  }

  /**
   * Construit l'URL complète à partir d'un endpoint
   */
  private buildUrl(endpoint: string): string {
    const normalized = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}${normalized}`;
  }

  /**
   * Prépare les headers pour la requête
   */
  private prepareHeaders(config: RequestConfig): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    };

    // Ajouter le token si nécessaire
    if (!config.skipAuth) {
      const token = this.storage.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Gère le timeout d'une requête
   */
  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Parse la réponse HTTP
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    // Si ce n'est pas du JSON, retourner le texte
    const text = await response.text();
    return text as unknown as T;
  }

  /**
   * Crée une erreur appropriée selon le statut HTTP
   */
  private createErrorFromResponse(
    status: number,
    data: any
  ): HttpError {
    const message = data?.message || data?.error || `HTTP ${status}`;

    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 422:
        return new ValidationError(message, data?.errors);
      default:
        return new ApiError(status, message, data);
    }
  }

  /**
   * Exécute une requête HTTP avec gestion d'erreurs
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResult<T>> {
    const {
      skipAuth = false,
      timeout = this.defaultTimeout,
      retries = 0,
      ...restConfig
    } = config;

    const url = this.buildUrl(endpoint);
    const headers = this.prepareHeaders({ ...config, skipAuth });

    let lastError: HttpError | null = null;
    const maxAttempts = retries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Faire la requête avec timeout
        const response = await this.withTimeout(
          fetch(url, {
            ...restConfig,
            headers,
            credentials: 'include',
          }),
          timeout
        );

        // Si la réponse est OK, parser et retourner
        if (response.ok) {
          const data = await this.parseResponse<T>(response);
          return ok(data);
        }

        // Gérer les erreurs HTTP
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const error = this.createErrorFromResponse(response.status, errorData);

        // Si c'est une erreur d'auth, nettoyer le token
        if (error._tag === 'AuthenticationError') {
          this.storage.clearAuthToken();
        }

        return err(error);

      } catch (error) {
        // Erreur réseau ou timeout
        if (error instanceof Error) {
          lastError = new NetworkError(error.message);

          // Retry si ce n'est pas la dernière tentative
          if (attempt < maxAttempts - 1) {
            // Attendre un peu avant de réessayer (exponential backoff)
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
            continue;
          }
        } else {
          lastError = new NetworkError('Unknown error');
        }
      }
    }

    // Si on arrive ici, toutes les tentatives ont échoué
    return err(lastError || new NetworkError('Request failed'));
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }

  /**
   * Sauvegarde le token d'authentification
   */
  setAuthToken(token: string): void {
    this.storage.setAuthToken(token);
  }

  /**
   * Supprime le token d'authentification
   */
  clearAuthToken(): void {
    this.storage.clearAuthToken();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Instance singleton du client HTTP
 */
export const httpClient = new HttpClient(API_BASE_URL);

/**
 * Fonction helper pour construire des URLs (compatibilité avec ancien code)
 */
export const apiUrl = (endpoint: string): string => {
  const normalized = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}${normalized}`;
};

// ============================================================================
// Exports
// ============================================================================

export type { RequestConfig };
