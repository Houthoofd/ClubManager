/**
 * Types for authentication services
 */

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId: string;
}

export interface RegisterUserData {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  genderId?: number;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  token?: string;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  actif: boolean;
  tenantId: string;
}

export interface PasswordResetData {
  email: string;
  tenantId: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  tenantId: string;
}