/**
 * Cookie Helpers
 *
 * Utilitaires pour gérer les cookies de manière centralisée et type-safe
 * Compatible avec Express et Apollo GraphQL Context
 */

import { Response } from 'express';
import { COOKIE_CONFIG } from '../config/auth.config.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Options pour un cookie
 */
export interface CookieOptions {
  name: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  maxAge?: number;
  domain?: string;
  expires?: Date;
}

/**
 * Contexte GraphQL minimal requis pour les cookies
 */
export interface CookieContext {
  res?: Response;
  req?: {
    headers: {
      cookie?: string;
    };
  };
}

// ============================================================================
// Set Cookie
// ============================================================================

/**
 * Définir un cookie avec options
 *
 * @param res - Response object Express
 * @param name - Nom du cookie
 * @param value - Valeur du cookie
 * @param options - Options du cookie (merge avec defaults)
 *
 * @example
 * ```ts
 * setCookie(res, 'refreshToken', token, {
 *   httpOnly: true,
 *   maxAge: 7 * 24 * 60 * 60 * 1000
 * });
 * ```
 */
export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: Partial<CookieOptions> = {}
): void => {
  const cookieOptions = {
    ...COOKIE_CONFIG.defaults,
    ...options,
  };

  res.cookie(name, value, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
    domain: cookieOptions.domain,
    expires: cookieOptions.expires,
  });
};

/**
 * Définir le refresh token cookie avec la config par défaut
 *
 * @param res - Response object
 * @param token - Refresh token
 *
 * @example
 * ```ts
 * setRefreshTokenCookie(res, refreshToken);
 * ```
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  setCookie(res, COOKIE_CONFIG.refreshToken.name, token, {
    httpOnly: COOKIE_CONFIG.refreshToken.httpOnly,
    secure: COOKIE_CONFIG.refreshToken.secure,
    sameSite: COOKIE_CONFIG.refreshToken.sameSite,
    path: COOKIE_CONFIG.refreshToken.path,
    maxAge: COOKIE_CONFIG.refreshToken.maxAge,
    domain: COOKIE_CONFIG.refreshToken.domain,
  });
};

/**
 * Définir un session cookie
 *
 * @param res - Response object
 * @param sessionId - Session ID
 */
export const setSessionCookie = (res: Response, sessionId: string): void => {
  setCookie(res, COOKIE_CONFIG.session.name, sessionId, {
    httpOnly: COOKIE_CONFIG.session.httpOnly,
    secure: COOKIE_CONFIG.session.secure,
    sameSite: COOKIE_CONFIG.session.sameSite,
    path: COOKIE_CONFIG.session.path,
    maxAge: COOKIE_CONFIG.session.maxAge,
  });
};

// ============================================================================
// Clear Cookie
// ============================================================================

/**
 * Supprimer un cookie
 *
 * @param res - Response object
 * @param name - Nom du cookie à supprimer
 * @param options - Options (notamment path et domain pour matcher le cookie original)
 *
 * @example
 * ```ts
 * clearCookie(res, 'refreshToken');
 * ```
 */
export const clearCookie = (
  res: Response,
  name: string,
  options: Partial<Pick<CookieOptions, 'path' | 'domain'>> = {}
): void => {
  res.clearCookie(name, {
    path: options.path || COOKIE_CONFIG.defaults.path,
    domain: options.domain,
  });
};

/**
 * Supprimer le refresh token cookie
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  clearCookie(res, COOKIE_CONFIG.refreshToken.name, {
    path: COOKIE_CONFIG.refreshToken.path,
    domain: COOKIE_CONFIG.refreshToken.domain,
  });
};

/**
 * Supprimer le session cookie
 */
export const clearSessionCookie = (res: Response): void => {
  clearCookie(res, COOKIE_CONFIG.session.name, {
    path: COOKIE_CONFIG.session.path,
  });
};

/**
 * Supprimer tous les cookies d'authentification
 */
export const clearAllAuthCookies = (res: Response): void => {
  clearRefreshTokenCookie(res);
  clearSessionCookie(res);
};

// ============================================================================
// Get Cookie
// ============================================================================

/**
 * Parser le header Cookie
 *
 * @param cookieHeader - Header "Cookie" brut
 * @returns Object avec les cookies parsés
 *
 * @example
 * ```ts
 * const cookies = parseCookieHeader('refreshToken=abc123; sessionId=xyz789');
 * // { refreshToken: 'abc123', sessionId: 'xyz789' }
 * ```
 */
export const parseCookieHeader = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    const value = rest.join('='); // Au cas où la valeur contient '='
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {} as Record<string, string>);
};

/**
 * Obtenir un cookie depuis le contexte GraphQL
 *
 * @param context - Contexte GraphQL (contient req)
 * @param name - Nom du cookie
 * @returns Valeur du cookie ou undefined
 *
 * @example
 * ```ts
 * const refreshToken = getCookie(context, 'refreshToken');
 * ```
 */
export const getCookie = (context: CookieContext, name: string): string | undefined => {
  const cookieHeader = context.req?.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = parseCookieHeader(cookieHeader);
  return cookies[name];
};

/**
 * Obtenir le refresh token depuis le contexte
 */
export const getRefreshTokenFromContext = (context: CookieContext): string | undefined => {
  return getCookie(context, COOKIE_CONFIG.refreshToken.name);
};

/**
 * Obtenir le session ID depuis le contexte
 */
export const getSessionIdFromContext = (context: CookieContext): string | undefined => {
  return getCookie(context, COOKIE_CONFIG.session.name);
};

/**
 * Obtenir tous les cookies depuis le contexte
 */
export const getAllCookies = (context: CookieContext): Record<string, string> => {
  const cookieHeader = context.req?.headers.cookie;
  return parseCookieHeader(cookieHeader);
};

// ============================================================================
// GraphQL Context Helpers
// ============================================================================

/**
 * Vérifier si le contexte contient un response object
 * (utile pour les resolvers GraphQL)
 */
export const hasResponseObject = (context: CookieContext): context is Required<CookieContext> => {
  return context.res !== undefined;
};

/**
 * Wrapper sécurisé pour setCookie dans un contexte GraphQL
 * Lance une erreur si res n'est pas disponible
 */
export const setContextCookie = (
  context: CookieContext,
  name: string,
  value: string,
  options?: Partial<CookieOptions>
): void => {
  if (!hasResponseObject(context)) {
    throw new Error('Response object not available in context');
  }
  setCookie(context.res, name, value, options);
};

/**
 * Wrapper sécurisé pour clearCookie dans un contexte GraphQL
 */
export const clearContextCookie = (
  context: CookieContext,
  name: string,
  options?: Partial<Pick<CookieOptions, 'path' | 'domain'>>
): void => {
  if (!hasResponseObject(context)) {
    throw new Error('Response object not available in context');
  }
  clearCookie(context.res, name, options);
};

// ============================================================================
// Cookie Validation
// ============================================================================

/**
 * Valider qu'un cookie name est valide (pas de caractères interdits)
 */
export const isValidCookieName = (name: string): boolean => {
  // Cookie names ne peuvent pas contenir: ()<>@,;:\"/[]?={} ou whitespace
  const invalidChars = /[()<>@,;:\\"/\[\]?={}\s]/;
  return !invalidChars.test(name);
};

/**
 * Valider qu'une valeur de cookie est valide
 */
export const isValidCookieValue = (value: string): boolean => {
  // Cookie values ne peuvent pas contenir: , ; ou whitespace (sauf si encodé)
  const invalidChars = /[,;\s]/;
  return !invalidChars.test(value);
};

/**
 * Encoder une valeur de cookie de manière sécurisée
 */
export const encodeCookieValue = (value: string): string => {
  return encodeURIComponent(value);
};

/**
 * Décoder une valeur de cookie
 */
export const decodeCookieValue = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value; // Retourner la valeur brute si décodage échoue
  }
};

// ============================================================================
// Cookie Expiration Helpers
// ============================================================================

/**
 * Créer une date d'expiration à partir d'un nombre de millisecondes
 */
export const createExpirationDate = (maxAgeMs: number): Date => {
  return new Date(Date.now() + maxAgeMs);
};

/**
 * Vérifier si un cookie devrait être expiré
 */
export const isExpired = (expiresAt: Date): boolean => {
  return expiresAt.getTime() < Date.now();
};

/**
 * Calculer le temps restant avant expiration (en ms)
 */
export const getTimeUntilExpiration = (expiresAt: Date): number => {
  return Math.max(0, expiresAt.getTime() - Date.now());
};

// ============================================================================
// Export groupé pour faciliter les imports
// ============================================================================

export const CookieHelpers = {
  // Set
  setCookie,
  setRefreshTokenCookie,
  setSessionCookie,
  setContextCookie,

  // Clear
  clearCookie,
  clearRefreshTokenCookie,
  clearSessionCookie,
  clearAllAuthCookies,
  clearContextCookie,

  // Get
  getCookie,
  getRefreshTokenFromContext,
  getSessionIdFromContext,
  getAllCookies,
  parseCookieHeader,

  // Validation
  isValidCookieName,
  isValidCookieValue,
  encodeCookieValue,
  decodeCookieValue,

  // Expiration
  createExpirationDate,
  isExpired,
  getTimeUntilExpiration,

  // Context
  hasResponseObject,
};

export default CookieHelpers;
