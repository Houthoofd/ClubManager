/**
 * ====================================================================
 * AUTHENTICATION SERVICE
 * ====================================================================
 *
 * Centralizes all authentication-related logic:
 * - Token storage and retrieval
 * - User session management
 * - Authentication state checks
 * - Logout functionality
 *
 * This service provides a clean API for auth operations across the app.
 */

import { apolloClient } from "../api";

// ====================================================================
// TYPES
// ====================================================================

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur?: string;
  email: string;
  status?: string;
  role?: string;
  genres?: any;
  grades?: any;
  abonnement?: any;
  date_of_birth?: string;
  phone?: string;
  active?: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

// ====================================================================
// STORAGE KEYS
// ====================================================================

const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  REFRESH_TOKEN: "refreshToken",
} as const;

// ====================================================================
// TOKEN MANAGEMENT
// ====================================================================

/**
 * Store authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error("[AuthService] Failed to store auth token:", error);
  }
};

/**
 * Retrieve authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("[AuthService] Failed to retrieve auth token:", error);
    return null;
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("[AuthService] Failed to remove auth token:", error);
  }
};

/**
 * Store refresh token in localStorage
 */
export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error("[AuthService] Failed to store refresh token:", error);
  }
};

/**
 * Retrieve refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error("[AuthService] Failed to retrieve refresh token:", error);
    return null;
  }
};

/**
 * Remove refresh token from localStorage
 */
export const removeRefreshToken = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error("[AuthService] Failed to remove refresh token:", error);
  }
};

// ====================================================================
// USER DATA MANAGEMENT
// ====================================================================

/**
 * Store user data in localStorage
 */
export const setUserData = (user: AuthUser): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (error) {
    console.error("[AuthService] Failed to store user data:", error);
  }
};

/**
 * Retrieve user data from localStorage
 */
export const getUserData = (): AuthUser | null => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("[AuthService] Failed to retrieve user data:", error);
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error("[AuthService] Failed to remove user data:", error);
  }
};

// ====================================================================
// SESSION MANAGEMENT
// ====================================================================

/**
 * Store complete authentication session (token + user data)
 */
export const setAuthSession = (session: AuthSession): void => {
  setAuthToken(session.token);
  setUserData(session.user);
};

/**
 * Retrieve complete authentication session
 */
export const getAuthSession = (): AuthSession | null => {
  const token = getAuthToken();
  const user = getUserData();

  if (!token || !user) {
    return null;
  }

  return { token, user };
};

/**
 * Clear complete authentication session
 */
export const clearAuthSession = (): void => {
  removeAuthToken();
  removeUserData();
  removeRefreshToken();
};

// ====================================================================
// AUTHENTICATION STATE
// ====================================================================

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): AuthUser | null => {
  return getUserData();
};

/**
 * Get current user ID
 */
export const getCurrentUserId = (): number | null => {
  const user = getUserData();
  return user?.id ?? null;
};

/**
 * Check if current user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const user = getUserData();
  return user?.role === role;
};

/**
 * Check if current user is admin
 */
export const isAdmin = (): boolean => {
  return hasRole("admin");
};

/**
 * Check if current user is professor
 */
export const isProfessor = (): boolean => {
  return hasRole("professeur");
};

// ====================================================================
// LOGOUT
// ====================================================================

/**
 * Perform complete logout
 * - Clears all auth data from localStorage
 * - Resets Apollo Client cache
 * - Redirects to login page (optional)
 */
export const logout = async (redirectToLogin = true): Promise<void> => {
  try {
    // Clear all authentication data
    clearAuthSession();

    // Clear Apollo Client cache
    await apolloClient.clearStore();

    console.log("✅ [AuthService] Logout successful");

    // Redirect to login page if requested
    if (redirectToLogin && window.location.pathname !== "/pages/connexion") {
      window.location.href = "/pages/connexion";
    }
  } catch (error) {
    console.error("[AuthService] Logout error:", error);
    // Clear data anyway even if Apollo fails
    clearAuthSession();
    if (redirectToLogin) {
      window.location.href = "/pages/connexion";
    }
  }
};

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Get redirect path based on user role/status
 */
export const getRedirectPath = (user: AuthUser): string => {
  if (user.status === "utilisateur" || user.status === "visiteur") {
    return "/pages/cours/inscription";
  }
  return "/pages/dashboard";
};

/**
 * Check if token is expired (basic check - doesn't decode JWT)
 * This is a simple check, for production use a JWT library
 */
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;

  // TODO: Implement proper JWT expiration check
  // For now, assume token is valid if it exists
  return false;
};

// ====================================================================
// DEFAULT EXPORT
// ====================================================================

const authService = {
  // Token management
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setRefreshToken,
  getRefreshToken,
  removeRefreshToken,

  // User data management
  setUserData,
  getUserData,
  removeUserData,

  // Session management
  setAuthSession,
  getAuthSession,
  clearAuthSession,

  // Authentication state
  isAuthenticated,
  getCurrentUser,
  getCurrentUserId,
  hasRole,
  isAdmin,
  isProfessor,

  // Logout
  logout,

  // Utility
  getRedirectPath,
  isTokenExpired,
};

export default authService;
