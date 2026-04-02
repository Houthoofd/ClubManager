/**
 * Auth Feature - Type Definitions
 *
 * Types et interfaces pour la feature d'authentification.
 * Aligné avec les types de @clubmanager/types du backend.
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * Rôles utilisateur dans l'application
 */
export type UserRole = 'admin' | 'professeur' | 'utilisateur';

/**
 * Statuts utilisateur
 */
export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';

/**
 * Entité User complète
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  genres?: string;
  grades?: string;
  abonnement?: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User partiel (pour l'affichage)
 */
export type UserPreview = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>;

// ============================================================================
// Credentials & Forms
// ============================================================================

/**
 * Credentials de connexion
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Données d'inscription
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username?: string;
  dateOfBirth?: string;
  genres?: string;
}

/**
 * Demande de réinitialisation de mot de passe
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Réinitialisation de mot de passe
 */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Changement de mot de passe (utilisateur connecté)
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Réponse de connexion
 */
export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

/**
 * Réponse d'inscription
 */
export interface RegisterResponse {
  success: boolean;
  user: User;
  message?: string;
  requiresEmailVerification?: boolean;
}

/**
 * Réponse de vérification de statut
 */
export interface AuthStatusResponse {
  authenticated: boolean;
  user?: User;
}

/**
 * Réponse de déconnexion
 */
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

/**
 * Réponse de demande de réinitialisation
 */
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Réponse de réinitialisation de mot de passe
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Auth State
// ============================================================================

/**
 * État d'authentification (pour store/context)
 */
export interface AuthState {
  /**
   * Utilisateur connecté
   */
  user: User | null;

  /**
   * Indique si l'utilisateur est authentifié
   */
  isAuthenticated: boolean;

  /**
   * Indique si une requête d'authentification est en cours
   */
  isLoading: boolean;

  /**
   * Indique si la vérification initiale est terminée
   */
  isInitialized: boolean;

  /**
   * Erreur d'authentification
   */
  error: string | null;

  /**
   * Token d'authentification (optionnel, généralement dans httpOnly cookie)
   */
  token?: string;
}

/**
 * État initial de l'authentification
 */
export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Erreurs de validation pour les formulaires
 */
export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  general?: string;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Type guard pour vérifier si un utilisateur est admin
 */
export const isAdmin = (user: User | null): user is User & { role: 'admin' } => {
  return user?.role === 'admin';
};

/**
 * Type guard pour vérifier si un utilisateur est professeur
 */
export const isProfesseur = (user: User | null): user is User & { role: 'professeur' } => {
  return user?.role === 'professeur';
};

/**
 * Type guard pour vérifier si un utilisateur peut gérer les cours
 */
export const canManageCourses = (user: User | null): boolean => {
  return isAdmin(user) || isProfesseur(user);
};

/**
 * Type guard pour vérifier si un utilisateur peut accéder à l'administration
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return isAdmin(user);
};

// ============================================================================
// Permissions
// ============================================================================

/**
 * Permissions disponibles
 */
export enum Permission {
  // Cours
  VIEW_COURSES = 'view_courses',
  MANAGE_COURSES = 'manage_courses',
  ENROLL_COURSES = 'enroll_courses',

  // Utilisateurs
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',

  // Magasin
  VIEW_SHOP = 'view_shop',
  MANAGE_PRODUCTS = 'manage_products',
  MANAGE_ORDERS = 'manage_orders',

  // Paiements
  VIEW_PAYMENTS = 'view_payments',
  MANAGE_PAYMENTS = 'manage_payments',

  // Statistiques
  VIEW_STATS = 'view_stats',
  VIEW_ALL_STATS = 'view_all_stats',

  // Messages
  SEND_MESSAGES = 'send_messages',
  VIEW_ALL_MESSAGES = 'view_all_messages',
}

/**
 * Map des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    Permission.VIEW_COURSES,
    Permission.MANAGE_COURSES,
    Permission.ENROLL_COURSES,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_SHOP,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_PAYMENTS,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_STATS,
    Permission.VIEW_ALL_STATS,
    Permission.SEND_MESSAGES,
    Permission.VIEW_ALL_MESSAGES,
  ],
  professeur: [
    Permission.VIEW_COURSES,
    Permission.MANAGE_COURSES,
    Permission.VIEW_USERS,
    Permission.VIEW_SHOP,
    Permission.VIEW_STATS,
    Permission.SEND_MESSAGES,
  ],
  utilisateur: [
    Permission.VIEW_COURSES,
    Permission.ENROLL_COURSES,
    Permission.VIEW_SHOP,
    Permission.SEND_MESSAGES,
  ],
};

/**
 * Vérifie si un utilisateur a une permission
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
};

/**
 * Vérifie si un utilisateur a toutes les permissions
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Vérifie si un utilisateur a au moins une des permissions
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};
