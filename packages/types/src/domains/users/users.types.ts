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
  role?: 'admin' | 'instructor' | 'member';
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
  role?: 'admin' | 'instructor' | 'member';
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
  role?: 'admin' | 'instructor' | 'member';
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
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at?: string;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
}

export interface AccountDeletionRequestsInsert {
  user_id: number;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at?: string;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
}

export interface AccountDeletionRequestsUpdate {
  user_id?: number;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at?: string;
  processed_at?: string;
  processed_by?: number;
  notes?: string;
}

