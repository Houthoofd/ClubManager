/**
 * Generated TypeScript types for users domain
 * @generated - Do not edit manually
 */

export interface Genders {
  id: number;
  name: string;
  code?: string;
}

export interface GendersInsert {
  name: string;
  code?: string;
}

export interface GendersUpdate {
  name?: string;
  code?: string;
}

export interface Users {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  gender_id?: number;
  /** admin=administrateur, instructor=enseignant/coach, member=adhérent */
  role?: "admin" | "instructor" | "member";
  active?: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UsersInsert {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  gender_id?: number;
  /** admin=administrateur, instructor=enseignant/coach, member=adhérent */
  role?: "admin" | "instructor" | "member";
  active?: boolean;
  email_verified?: boolean;
}

export interface UsersUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  gender_id?: number;
  /** admin=administrateur, instructor=enseignant/coach, member=adhérent */
  role?: "admin" | "instructor" | "member";
  active?: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfiles {
  id: number;
  user_id: number;
  bio?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  /** Préférences utilisateur en JSON (notifications, langue, etc.) */
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfilesInsert {
  user_id: number;
  bio?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  /** Préférences utilisateur en JSON (notifications, langue, etc.) */
  preferences?: Record<string, any>;
}

export interface UserProfilesUpdate {
  user_id?: number;
  bio?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  /** Préférences utilisateur en JSON (notifications, langue, etc.) */
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UserSecurity {
  id: number;
  user_id: number;
  failed_login_attempts?: number;
  last_login_at?: string;
  last_login_ip?: string;
  account_locked_until?: string;
  password_changed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSecurityInsert {
  user_id: number;
  failed_login_attempts?: number;
  last_login_at?: string;
  last_login_ip?: string;
  account_locked_until?: string;
  password_changed_at?: string;
}

export interface UserSecurityUpdate {
  user_id?: number;
  failed_login_attempts?: number;
  last_login_at?: string;
  last_login_ip?: string;
  account_locked_until?: string;
  password_changed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PasswordResetTokens {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at?: string;
}

export interface PasswordResetTokensInsert {
  user_id: number;
  token: string;
  expires_at: string;
  used_at?: string;
}

export interface PasswordResetTokensUpdate {
  user_id?: number;
  token?: string;
  expires_at?: string;
  used_at?: string;
  created_at?: string;
}

export interface AccountDeletionRequests {
  id: number;
  user_id: number;
  reason?: string;
  status?: "pending" | "approved" | "rejected" | "completed";
  requested_at?: string;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
}

export interface AccountDeletionRequestsInsert {
  user_id: number;
  reason?: string;
  status?: "pending" | "approved" | "rejected" | "completed";
  requested_at?: string;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
}

export interface AccountDeletionRequestsUpdate {
  user_id?: number;
  reason?: string;
  status?: "pending" | "approved" | "rejected" | "completed";
  requested_at?: string;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
}

// ============================================
// Authentication & Session Types
// ============================================

export interface AuthToken {
  token: string;
  type: "access" | "refresh";
  expiresAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: "admin" | "instructor" | "member";
  iat?: number;
  exp?: number;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  revoked_at?: string;
  created_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface RefreshTokenInsert {
  user_id: number;
  token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface RefreshTokenUpdate {
  revoked_at?: string;
  updated_at?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  last_activity?: string;
  created_at?: string;
}

export interface UserSessionInsert {
  user_id: number;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
}

export interface UserSessionUpdate {
  last_activity?: string;
  expires_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Users;
  tokens: AuthTokens;
  session?: UserSession;
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  gender_id?: number;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  verified_at?: string;
  created_at?: string;
}

export interface EmailVerificationTokenInsert {
  user_id: number;
  token: string;
  expires_at: string;
}

export interface EmailVerificationTokenUpdate {
  verified_at?: string;
}

// ============================================
// Inscription/Registration Form Types
// ============================================

/**
 * Form data for user inscription/registration
 */
export interface InscriptionFormData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_naissance: string;
  abonnement: string;
  genre: string;
  nom_utilisateur: string;
  telephone?: string;
  adresse?: string;
}

/**
 * Validation state for inscription form fields
 */
export interface InscriptionValidationState {
  prenom: {
    isValid: boolean;
    message: string;
  };
  nom: {
    isValid: boolean;
    message: string;
  };
  email: {
    isValid: boolean;
    message: string;
  };
  password: {
    isValid: boolean;
    message: string;
  };
  confirmPassword: {
    isValid: boolean;
    message: string;
  };
  date_naissance: {
    isValid: boolean;
    message: string;
  };
  abonnement: {
    isValid: boolean;
    message: string;
  };
  genre: {
    isValid: boolean;
    message: string;
  };
  nom_utilisateur: {
    isValid: boolean;
    message: string;
  };
  telephone?: {
    isValid: boolean;
    message: string;
  };
  adresse?: {
    isValid: boolean;
    message: string;
  };
}

/**
 * Information modal data structure for inscription flow
 */
export interface InscriptionInformationModalData {
  title: string;
  message: string;
  type: "success" | "danger" | "warning" | "info";
  details?: {
    actions?: Array<{
      label: string;
      action: () => void;
      variant?: "primary" | "secondary" | "danger" | "link";
    }>;
  };
}

/**
 * Backend verification data for inscription
 */
export interface InscriptionVerificationData {
  nom: string;
  prenom: string;
  date_naissance: string;
}

/**
 * Backend verification response for inscription
 */
export interface InscriptionVerificationResponse {
  exists: boolean;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
    date_naissance: string;
    status?: string;
  };
  message?: string;
}

/**
 * Inscription submit data
 */
export interface InscriptionSubmitData {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  password: string;
  genre_id: number;
  abonnement_id: number;
  date_naissance: string;
  date_inscription: string;
  status_id: number;
  grade_id: number;
}

/**
 * Inscription response
 */
export interface InscriptionResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    prenom: string;
    nom: string;
  };
  token?: string;
}
