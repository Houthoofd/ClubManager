/**
 * Export centralisé des utilitaires Auth
 */

// Cookie helpers
export {
  setCookie,
  setRefreshTokenCookie,
  setSessionCookie,
  setContextCookie,
  clearCookie,
  clearRefreshTokenCookie,
  clearSessionCookie,
  clearAllAuthCookies,
  clearContextCookie,
  getCookie,
  getRefreshTokenFromContext,
  getSessionIdFromContext,
  getAllCookies,
  parseCookieHeader,
  isValidCookieName,
  isValidCookieValue,
  encodeCookieValue,
  decodeCookieValue,
  createExpirationDate,
  isExpired,
  getTimeUntilExpiration,
  hasResponseObject,
  CookieHelpers,
} from './cookie.helpers.js';

export type {
  CookieOptions,
  CookieContext,
} from './cookie.helpers.js';
