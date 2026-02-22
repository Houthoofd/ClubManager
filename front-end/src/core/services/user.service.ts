/**
 * ====================================================================
 * USER SERVICE
 * ====================================================================
 *
 * Centralizes all user-related operations:
 * - User profile management
 * - User data retrieval
 * - User preferences
 * - User update operations
 *
 * This service provides a clean API for user operations across the app.
 */

import authService from "./auth.service";
import type { AuthUser } from "./auth.service";
import { logger } from "@/core/utils/appLogger";

// ====================================================================
// TYPES
// ====================================================================

export interface UserProfile extends AuthUser {
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface UserPreferences {
  language?: string;
  theme?: "light" | "dark" | "auto";
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
}

// ====================================================================
// STORAGE KEYS
// ====================================================================

const STORAGE_KEYS = {
  USER_PREFERENCES: "userPreferences",
  USER_PROFILE_CACHE: "userProfileCache",
} as const;

// ====================================================================
// USER DATA RETRIEVAL
// ====================================================================

/**
 * Get current user profile
 */
export const getCurrentUserProfile = (): UserProfile | null => {
  return authService.getCurrentUser();
};

/**
 * Get user full name
 */
export const getUserFullName = (user?: AuthUser | null): string => {
  const currentUser = user || authService.getCurrentUser();
  if (!currentUser) return "Unknown User";
  return `${currentUser.first_name} ${currentUser.last_name}`;
};

/**
 * Get user display name (nom_utilisateur or full name)
 */
export const getUserDisplayName = (user?: AuthUser | null): string => {
  const currentUser = user || authService.getCurrentUser();
  if (!currentUser) return "Unknown User";
  return currentUser.nom_utilisateur || getUserFullName(currentUser);
};

/**
 * Get user initials
 */
export const getUserInitials = (user?: AuthUser | null): string => {
  const currentUser = user || authService.getCurrentUser();
  if (!currentUser) return "??";

  const firstInitial = currentUser.first_name?.charAt(0)?.toUpperCase() || "";
  const lastInitial = currentUser.last_name?.charAt(0)?.toUpperCase() || "";

  return `${firstInitial}${lastInitial}`;
};

/**
 * Get user email
 */
export const getUserEmail = (): string | null => {
  const user = authService.getCurrentUser();
  return user?.email ?? null;
};

/**
 * Get user ID
 */
export const getUserId = (): number | null => {
  return authService.getCurrentUserId();
};

/**
 * Get user role
 */
export const getUserRole = (): string | null => {
  const user = authService.getCurrentUser();
  return user?.role ?? null;
};

/**
 * Get user status
 */
export const getUserStatus = (): string | null => {
  const user = authService.getCurrentUser();
  return user?.status ?? null;
};

// ====================================================================
// USER PREFERENCES
// ====================================================================

/**
 * Get user preferences from localStorage
 */
export const getUserPreferences = (): UserPreferences => {
  try {
    const prefsJson = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return prefsJson ? JSON.parse(prefsJson) : {};
  } catch (error) {
    logger.error("[UserService] Failed to get user preferences:", error as Error);
    return {};
  }
};

/**
 * Set user preferences in localStorage
 */
export const setUserPreferences = (preferences: UserPreferences): void => {
  try {
    const currentPrefs = getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
  } catch (error) {
    logger.error("[UserService] Failed to set user preferences:", error as Error);
  }
};

/**
 * Clear user preferences
 */
export const clearUserPreferences = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  } catch (error) {
    logger.error("[UserService] Failed to clear user preferences:", error as Error);
  }
};

// ====================================================================
// USER VALIDATION
// ====================================================================

/**
 * Check if user has valid subscription
 */
export const hasActiveSubscription = (): boolean => {
  const user = authService.getCurrentUser();
  return !!user?.abonnement;
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (user?: AuthUser | null): boolean => {
  const currentUser = user || authService.getCurrentUser();
  if (!currentUser) return false;

  return !!(
    currentUser.first_name &&
    currentUser.last_name &&
    currentUser.email &&
    currentUser.phone &&
    currentUser.date_of_birth
  );
};

/**
 * Check if user is active
 */
export const isUserActive = (): boolean => {
  const user = authService.getCurrentUser();
  return user?.active ?? false;
};

// ====================================================================
// ROLE-BASED CHECKS
// ====================================================================

/**
 * Check if user can access admin features
 */
export const canAccessAdmin = (): boolean => {
  return authService.isAdmin();
};

/**
 * Check if user can access professor features
 */
export const canAccessProfessor = (): boolean => {
  return authService.isProfessor() || authService.isAdmin();
};

/**
 * Check if user can manage courses
 */
export const canManageCourses = (): boolean => {
  return canAccessProfessor();
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (): boolean => {
  return authService.isAdmin();
};

/**
 * Check if user can view analytics
 */
export const canViewAnalytics = (): boolean => {
  return authService.isAdmin();
};

// ====================================================================
// USER PROFILE CACHE
// ====================================================================

/**
 * Cache user profile data
 */
export const cacheUserProfile = (profile: UserProfile): void => {
  try {
    const cacheData = {
      profile,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE_CACHE, JSON.stringify(cacheData));
  } catch (error) {
    logger.error("[UserService] Failed to cache user profile:", error as Error);
  }
};

/**
 * Get cached user profile
 */
export const getCachedUserProfile = (maxAge = 5 * 60 * 1000): UserProfile | null => {
  try {
    const cacheJson = localStorage.getItem(STORAGE_KEYS.USER_PROFILE_CACHE);
    if (!cacheJson) return null;

    const { profile, timestamp } = JSON.parse(cacheJson);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      // Cache expired
      clearUserProfileCache();
      return null;
    }

    return profile;
  } catch (error) {
    logger.error("[UserService] Failed to get cached user profile:", error as Error);
    return null;
  }
};

/**
 * Clear user profile cache
 */
export const clearUserProfileCache = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE_CACHE);
  } catch (error) {
    logger.error("[UserService] Failed to clear user profile cache:", error as Error);
  }
};

// ====================================================================
// USER UPDATE HELPERS
// ====================================================================

/**
 * Update current user data in localStorage
 */
export const updateCurrentUserData = (updates: Partial<AuthUser>): void => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    logger.warn("[UserService] Cannot update user data: no user logged in");
    return;
  }

  const updatedUser = { ...currentUser, ...updates };
  authService.setUserData(updatedUser);

  // Clear cache when user data changes
  clearUserProfileCache();
};

// ====================================================================
// CLEANUP
// ====================================================================

/**
 * Clear all user-related data
 */
export const clearAllUserData = (): void => {
  clearUserPreferences();
  clearUserProfileCache();
  authService.clearAuthSession();
};

// ====================================================================
// DEFAULT EXPORT
// ====================================================================

const userService = {
  // User data retrieval
  getCurrentUserProfile,
  getUserFullName,
  getUserDisplayName,
  getUserInitials,
  getUserEmail,
  getUserId,
  getUserRole,
  getUserStatus,

  // User preferences
  getUserPreferences,
  setUserPreferences,
  clearUserPreferences,

  // User validation
  hasActiveSubscription,
  isProfileComplete,
  isUserActive,

  // Role-based checks
  canAccessAdmin,
  canAccessProfessor,
  canManageCourses,
  canManageUsers,
  canViewAnalytics,

  // User profile cache
  cacheUserProfile,
  getCachedUserProfile,
  clearUserProfileCache,

  // User updates
  updateCurrentUserData,

  // Cleanup
  clearAllUserData,
};

export default userService;
