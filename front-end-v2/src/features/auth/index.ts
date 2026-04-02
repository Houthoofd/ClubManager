/**
 * Auth Feature - Public API
 *
 * Point d'entrée centralisé pour la feature d'authentification.
 * Exporte uniquement ce qui doit être utilisé par les autres layers (pages, widgets, etc.).
 *
 * Règle FSD: Les features exportent leur API publique via index.ts
 */

// ============================================================================
// UI Components
// ============================================================================

export { LoginForm } from "./ui/LoginForm";
export { UserProfile } from "./ui/UserProfile";
export { UserPreferences } from "./ui/UserPreferences";
export { AccountSecurity } from "./ui/AccountSecurity";
// export { RegisterForm } from './ui/RegisterForm'; // TODO
// export { ForgotPasswordForm } from './ui/ForgotPasswordForm'; // TODO
// export { ResetPasswordForm } from './ui/ResetPasswordForm'; // TODO

// ============================================================================
// Model (Hooks & State)
// ============================================================================

export {
  useAuth,
  useAuthStatus,
  useCurrentUser,
  useRequireAuth,
  useRequireRole,
  useProfile,
  useAvatar,
  usePreferences,
  useAccountManagement,
  authKeys,
} from "./model/useAuth";

// ============================================================================
// Types
// ============================================================================

export type {
  User,
  UserRole,
  UserStatus,
  UserPreview,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  LoginResponse,
  RegisterResponse,
  AuthStatusResponse,
  LogoutResponse,
  AuthState,
  ValidationErrors,
  Permission,
} from "./model/types";

export {
  isAdmin,
  isProfesseur,
  canManageCourses,
  canAccessAdmin,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  ROLE_PERMISSIONS,
  initialAuthState,
} from "./model/types";

// ============================================================================
// API (optionnel - généralement pas exposé)
// ============================================================================

// Note: L'API n'est généralement pas exportée car elle est utilisée
// uniquement par les hooks de la feature. Si besoin dans des cas
// exceptionnels, décommenter :
// export { authApi } from './api/authApi';
