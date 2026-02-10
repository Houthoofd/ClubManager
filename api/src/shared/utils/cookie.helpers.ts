/**
 * Cookie Helpers
 *
 * Utilities for managing HTTP cookies in Express responses.
 * Provides consistent cookie handling across the application.
 */

import { Response } from 'express';

/**
 * Cookie options interface
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
}

/**
 * Default cookie options
 */
export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

/**
 * Set a cookie in the response
 */
export function setCookie(
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const mergedOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options,
  };

  res.cookie(name, value, mergedOptions);
}

/**
 * Clear a cookie from the response
 */
export function clearCookie(
  res: Response,
  name: string,
  options: Omit<CookieOptions, 'maxAge' | 'expires'> = {}
): void {
  const mergedOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options,
  };

  res.clearCookie(name, mergedOptions);
}

/**
 * Set authentication token cookie
 */
export function setAuthTokenCookie(
  res: Response,
  token: string,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours default
): void {
  setCookie(res, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    maxAge,
  });
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): void {
  setCookie(res, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    maxAge,
  });
}

/**
 * Clear authentication token cookie
 */
export function clearAuthTokenCookie(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    path: '/',
  };

  clearCookie(res, 'token', cookieOptions);
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshTokenCookie(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    path: '/',
  };

  clearCookie(res, 'refreshToken', cookieOptions);
}

/**
 * Clear all authentication cookies
 */
export function clearAllAuthCookies(res: Response): void {
  clearAuthTokenCookie(res);
  clearRefreshTokenCookie(res);

  // Also clear session cookie if it exists
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
      domain: process.env.NODE_ENV === 'production'
        ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
        : 'localhost',
      path: '/',
    };

    clearCookie(res, 'sessionId', cookieOptions);
  } catch (error) {
    // Ignore errors if cookie doesn't exist
  }

  // Add security headers
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Clear-Site-Data', '"cookies", "storage"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}

/**
 * Get cookie value from request
 */
export function getCookie(req: any, name: string): string | undefined {
  return req.cookies?.[name];
}

/**
 * Check if cookie exists in request
 */
export function hasCookie(req: any, name: string): boolean {
  return !!req.cookies?.[name];
}

/**
 * Set session cookie
 */
export function setSessionCookie(
  res: Response,
  sessionId: string,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours default
): void {
  setCookie(res, 'sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    maxAge,
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    path: '/',
  };

  clearCookie(res, 'sessionId', cookieOptions);
}

/**
 * Set remember me cookie (long-lived)
 */
export function setRememberMeCookie(
  res: Response,
  token: string,
  maxAge: number = 30 * 24 * 60 * 60 * 1000 // 30 days default
): void {
  setCookie(res, 'rememberMe', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    maxAge,
  });
}

/**
 * Clear remember me cookie
 */
export function clearRememberMeCookie(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
    domain: process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN || 'clubmanagment.com'
      : 'localhost',
    path: '/',
  };

  clearCookie(res, 'rememberMe', cookieOptions);
}

/**
 * Parse cookie string
 */
export function parseCookieString(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) {
    return cookies;
  }

  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=');

    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });

  return cookies;
}

/**
 * Serialize cookie to string
 */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.maxAge) {
    parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`);
  }

  return parts.join('; ');
}
