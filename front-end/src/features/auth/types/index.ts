/**
 * Auth Feature Types
 * Re-exports from @clubmanager/types package + local types
 */

// Re-export from shared package if available
export type {
  Users,
  UsersInsert,
  UsersUpdate,
} from "@clubmanager/types";

// Local auth-specific types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_naissance: string;
  abonnement: string;
  genre: string;
  telephone?: string;
  adresse?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role?: string;
  avatar?: string;
  date_naissance?: string;
  telephone?: string;
  adresse?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface UpdateProfileData {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  date_naissance?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Email verification
export interface EmailVerificationData {
  token: string;
}

// Session types
export interface SessionData {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

// Form validation errors
export interface AuthFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  prenom?: string;
  nom?: string;
  date_naissance?: string;
  telephone?: string;
  general?: string;
}
