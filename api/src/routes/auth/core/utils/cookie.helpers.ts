/**
 * Cookie Helpers for Authentication
 *
 * Utilitaires pour gérer les cookies d'authentification (refresh token, session, etc.)
 */

import type { Response } from 'express';

// Configuration des cookies
const COOKIE_CONFIG = {
  REFRESH_TOKEN: {
    name: 'refreshToken',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: '/',
  },
  SESSION: {
    name: 'sessionId',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    path: '/',
  },
  AUTH_STATE: {
    name: 'authState',
    httpOnly: false, // Accessible depuis JS pour l'UI
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    path: '/',
  },
};

/**
 * Définit le cookie de refresh token
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(COOKIE_CONFIG.REFRESH_TOKEN.name, token, {
    httpOnly: COOKIE_CONFIG.REFRESH_TOKEN.httpOnly,
    secure: COOKIE_CONFIG.REFRESH_TOKEN.secure,
    sameSite: COOKIE_CONFIG.REFRESH_TOKEN.sameSite,
    maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
    path: COOKIE_CONFIG.REFRESH_TOKEN.path,
  });

  console.log(`✅ [Cookie] Refresh token défini (expire dans ${COOKIE_CONFIG.REFRESH_TOKEN.maxAge / 1000}s)`);
}

/**
 * Définit le cookie de session
 */
export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie(COOKIE_CONFIG.SESSION.name, sessionId, {
    httpOnly: COOKIE_CONFIG.SESSION.httpOnly,
    secure: COOKIE_CONFIG.SESSION.secure,
    sameSite: COOKIE_CONFIG.SESSION.sameSite,
    maxAge: COOKIE_CONFIG.SESSION.maxAge,
    path: COOKIE_CONFIG.SESSION.path,
  });

  console.log(`✅ [Cookie] Session définie (ID: ${sessionId.substring(0, 8)}...)`);
}

/**
 * Définit le cookie d'état d'authentification (pour l'UI)
 */
export function setAuthStateCookie(res: Response, state: 'authenticated' | 'unauthenticated'): void {
  res.cookie(COOKIE_CONFIG.AUTH_STATE.name, state, {
    httpOnly: COOKIE_CONFIG.AUTH_STATE.httpOnly,
    secure: COOKIE_CONFIG.AUTH_STATE.secure,
    sameSite: COOKIE_CONFIG.AUTH_STATE.sameSite,
    maxAge: COOKIE_CONFIG.AUTH_STATE.maxAge,
    path: COOKIE_CONFIG.AUTH_STATE.path,
  });

  console.log(`✅ [Cookie] État d'authentification: ${state}`);
}

/**
 * Efface le cookie de refresh token
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_CONFIG.REFRESH_TOKEN.name, {
    httpOnly: COOKIE_CONFIG.REFRESH_TOKEN.httpOnly,
    secure: COOKIE_CONFIG.REFRESH_TOKEN.secure,
    sameSite: COOKIE_CONFIG.REFRESH_TOKEN.sameSite,
    path: COOKIE_CONFIG.REFRESH_TOKEN.path,
  });

  console.log('🗑️ [Cookie] Refresh token effacé');
}

/**
 * Efface le cookie de session
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_CONFIG.SESSION.name, {
    httpOnly: COOKIE_CONFIG.SESSION.httpOnly,
    secure: COOKIE_CONFIG.SESSION.secure,
    sameSite: COOKIE_CONFIG.SESSION.sameSite,
    path: COOKIE_CONFIG.SESSION.path,
  });

  console.log('🗑️ [Cookie] Session effacée');
}

/**
 * Efface le cookie d'état d'authentification
 */
export function clearAuthStateCookie(res: Response): void {
  res.clearCookie(COOKIE_CONFIG.AUTH_STATE.name, {
    httpOnly: COOKIE_CONFIG.AUTH_STATE.httpOnly,
    secure: COOKIE_CONFIG.AUTH_STATE.secure,
    sameSite: COOKIE_CONFIG.AUTH_STATE.sameSite,
    path: COOKIE_CONFIG.AUTH_STATE.path,
  });

  console.log('🗑️ [Cookie] État d\'authentification effacé');
}

/**
 * Efface tous les cookies d'authentification
 */
export function clearAllAuthCookies(res: Response): void {
  clearRefreshTokenCookie(res);
  clearSessionCookie(res);
  clearAuthStateCookie(res);

  console.log('🗑️ [Cookie] Tous les cookies d\'authentification effacés');
}

/**
 * Récupère le refresh token depuis les cookies
 */
export function getRefreshTokenFromCookies(cookies: Record<string, string>): string | undefined {
  return cookies[COOKIE_CONFIG.REFRESH_TOKEN.name];
}

/**
 * Récupère le session ID depuis les cookies
 */
export function getSessionIdFromCookies(cookies: Record<string, string>): string | undefined {
  return cookies[COOKIE_CONFIG.SESSION.name];
}

/**
 * Récupère l'état d'authentification depuis les cookies
 */
export function getAuthStateFromCookies(cookies: Record<string, string>): 'authenticated' | 'unauthenticated' | undefined {
  const state = cookies[COOKIE_CONFIG.AUTH_STATE.name];
  if (state === 'authenticated' || state === 'unauthenticated') {
    return state;
  }
  return undefined;
}

/**
 * Vérifie si un utilisateur est authentifié selon les cookies
 */
export function isAuthenticatedFromCookies(cookies: Record<string, string>): boolean {
  const hasRefreshToken = !!getRefreshTokenFromCookies(cookies);
  const authState = getAuthStateFromCookies(cookies);

  return hasRefreshToken && authState === 'authenticated';
}

/**
 * Renouvelle les cookies d'authentification (pour refresh)
 */
export function refreshAuthCookies(res: Response, newRefreshToken: string, sessionId: string): void {
  setRefreshTokenCookie(res, newRefreshToken);
  setSessionCookie(res, sessionId);
  setAuthStateCookie(res, 'authenticated');

  console.log('🔄 [Cookie] Cookies d\'authentification renouvelés');
}

/**
 * Configure les cookies pour une nouvelle authentification
 */
export function setAuthenticationCookies(
  res: Response,
  refreshToken: string,
  sessionId: string
): void {
  setRefreshTokenCookie(res, refreshToken);
  setSessionCookie(res, sessionId);
  setAuthStateCookie(res, 'authenticated');

  console.log('✅ [Cookie] Cookies d\'authentification configurés');
}

/**
 * Export de la configuration pour tests
 */
export const COOKIE_NAMES = {
  REFRESH_TOKEN: COOKIE_CONFIG.REFRESH_TOKEN.name,
  SESSION: COOKIE_CONFIG.SESSION.name,
  AUTH_STATE: COOKIE_CONFIG.AUTH_STATE.name,
} as const;
