/**
 * Auth Feature - API Layer
 *
 * Gère toutes les requêtes HTTP liées à l'authentification.
 * Utilise le httpClient partagé et retourne des Result pour une gestion d'erreurs type-safe.
 */

import { httpClient } from "@/shared/api/client";
import type { ApiResult } from "@/shared/api/client";
import type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  AuthStatusResponse,
  LogoutResponse,
  ForgotPasswordData,
  ForgotPasswordResponse,
  ResetPasswordData,
  ResetPasswordResponse,
  ChangePasswordData,
  User,
} from "../model/types";

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  /**
   * Connexion utilisateur
   *
   * @param credentials - Email et mot de passe
   * @returns Result contenant les données utilisateur et le token
   *
   * @example
   * ```ts
   * const result = await authApi.login({ email: 'user@example.com', password: 'secret' });
   * result.match(
   *   (data) => console.log('Connecté:', data.user),
   *   (error) => console.error('Erreur:', error.message)
   * );
   * ```
   */
  login: async (
    credentials: LoginCredentials,
  ): Promise<ApiResult<LoginResponse>> => {
    const result = await httpClient.post<LoginResponse>(
      "auth/login",
      credentials,
      { skipAuth: true },
    );

    // Si succès, sauvegarder le token
    result.match(
      (data) => {
        if (data.token) {
          httpClient.setAuthToken(data.token);
          localStorage.setItem("userData", JSON.stringify(data.user));
        }
      },
      () => {
        // Erreur, ne rien faire
      },
    );

    return result;
  },

  /**
   * Inscription d'un nouvel utilisateur
   *
   * @param data - Données d'inscription
   * @returns Result contenant les données utilisateur
   *
   * @example
   * ```ts
   * const result = await authApi.register({
   *   email: 'newuser@example.com',
   *   password: 'secret123',
   *   confirmPassword: 'secret123',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   * ```
   */
  register: async (
    data: RegisterData,
  ): Promise<ApiResult<RegisterResponse>> => {
    return httpClient.post<RegisterResponse>("auth/register", data, {
      skipAuth: true,
    });
  },

  /**
   * Déconnexion utilisateur
   *
   * @returns Result de confirmation
   */
  logout: async (): Promise<ApiResult<LogoutResponse>> => {
    const result = await httpClient.post<LogoutResponse>("auth/logout");

    // Nettoyer les données locales
    httpClient.clearAuthToken();
    localStorage.removeItem("userData");

    return result;
  },

  /**
   * Récupère le profil de l'utilisateur connecté
   *
   * @returns Result contenant les données utilisateur
   */
  getProfile: async (): Promise<ApiResult<User>> => {
    return httpClient.get<User>("auth/profile");
  },

  /**
   * Vérifie le statut d'authentification
   *
   * @returns Result indiquant si l'utilisateur est authentifié
   *
   * @example
   * ```ts
   * const result = await authApi.checkStatus();
   * result.match(
   *   (data) => {
   *     if (data.authenticated) {
   *       console.log('Utilisateur:', data.user);
   *     }
   *   },
   *   (error) => console.error('Erreur:', error)
   * );
   * ```
   */
  checkStatus: async (): Promise<ApiResult<AuthStatusResponse>> => {
    return httpClient.get<AuthStatusResponse>("auth/status");
  },

  /**
   * Demande de réinitialisation de mot de passe
   *
   * @param data - Email de l'utilisateur
   * @returns Result de confirmation
   */
  forgotPassword: async (
    data: ForgotPasswordData,
  ): Promise<ApiResult<ForgotPasswordResponse>> => {
    return httpClient.post<ForgotPasswordResponse>(
      "auth/forgot-password",
      data,
      { skipAuth: true },
    );
  },

  /**
   * Réinitialisation du mot de passe avec token
   *
   * @param data - Token et nouveau mot de passe
   * @returns Result de confirmation
   */
  resetPassword: async (
    data: ResetPasswordData,
  ): Promise<ApiResult<ResetPasswordResponse>> => {
    return httpClient.post<ResetPasswordResponse>("auth/reset-password", data, {
      skipAuth: true,
    });
  },

  /**
   * Vérifie la validité d'un token de réinitialisation
   *
   * @param token - Token à vérifier
   * @returns Result indiquant si le token est valide
   */
  verifyResetToken: async (
    token: string,
  ): Promise<ApiResult<{ valid: boolean; message?: string }>> => {
    return httpClient.get<{ valid: boolean; message?: string }>(
      `auth/verify-token/${token}`,
      { skipAuth: true },
    );
  },

  /**
   * Changement de mot de passe (utilisateur connecté)
   *
   * @param data - Mot de passe actuel et nouveau
   * @returns Result de confirmation
   */
  changePassword: async (
    data: ChangePasswordData,
  ): Promise<ApiResult<{ success: boolean; message: string }>> => {
    return httpClient.post<{ success: boolean; message: string }>(
      "auth/change-password",
      data,
    );
  },

  /**
   * Confirmation d'email
   *
   * @param token - Token de confirmation reçu par email
   * @param userId - ID de l'utilisateur
   * @returns Result de confirmation
   */
  confirmEmail: async (
    token: string,
    userId: number,
  ): Promise<ApiResult<{ success: boolean; message: string }>> => {
    return httpClient.get<{ success: boolean; message: string }>(
      `auth/confirm-email?token=${token}&userId=${userId}`,
      { skipAuth: true },
    );
  },

  /**
   * Renvoie l'email de confirmation
   *
   * @param email - Email de l'utilisateur
   * @returns Result de confirmation
   */
  resendConfirmationEmail: async (
    email: string,
  ): Promise<ApiResult<{ success: boolean; message: string }>> => {
    return httpClient.post<{ success: boolean; message: string }>(
      "auth/resend-confirmation",
      { email },
      { skipAuth: true },
    );
  },

  /**
   * Rafraîchit le token d'authentification
   *
   * @returns Result contenant le nouveau token
   */
  refreshToken: async (): Promise<ApiResult<{ token: string }>> => {
    const result = await httpClient.post<{ token: string }>("auth/refresh");

    // Sauvegarder le nouveau token
    result.match(
      (data) => {
        if (data.token) {
          httpClient.setAuthToken(data.token);
        }
      },
      () => {
        // Erreur, ne rien faire
      },
    );

    return result;
  },

  /**
   * Vérifie si un email existe déjà
   *
   * @param email - Email à vérifier
   * @returns Result indiquant si l'email existe
   */
  checkEmailExists: async (
    email: string,
  ): Promise<ApiResult<{ exists: boolean; message?: string }>> => {
    return httpClient.post<{ exists: boolean; message?: string }>(
      "auth/check-email",
      { email },
      { skipAuth: true },
    );
  },

  checkUsernameExists: async (
    username: string,
  ): Promise<ApiResult<{ exists: boolean; message?: string }>> => {
    return httpClient.post<{ exists: boolean; message?: string }>(
      "auth/check-username",
      { username },
      { skipAuth: true },
    );
  },

  // ============================================================================
  // Profile Management
  // ============================================================================

  /**
   * Met à jour le profil de l'utilisateur connecté
   *
   * @param data - Données du profil à mettre à jour
   * @returns Result contenant l'utilisateur mis à jour
   */
  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    dateOfBirth?: string;
    genre_id?: number;
    grade_id?: number;
  }): Promise<ApiResult<User>> => {
    return httpClient.put<User>("users/profile", data);
  },

  /**
   * Upload de l'avatar de l'utilisateur
   *
   * @param file - Fichier image à uploader
   * @returns Result contenant l'URL de l'avatar
   */
  uploadAvatar: async (
    file: File,
  ): Promise<ApiResult<{ photo_url: string; user: User }>> => {
    const formData = new FormData();
    formData.append("avatar", file);

    return httpClient.post<{ photo_url: string; user: User }>(
      "users/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  /**
   * Supprime l'avatar de l'utilisateur
   *
   * @returns Result de confirmation
   */
  deleteAvatar: async (): Promise<
    ApiResult<{ success: boolean; user: User }>
  > => {
    return httpClient.delete<{ success: boolean; user: User }>("users/avatar");
  },

  /**
   * Récupère les préférences de l'utilisateur
   *
   * @returns Result contenant les préférences
   */
  getPreferences: async (): Promise<
    ApiResult<{
      emailNotifications: boolean;
      smsNotifications: boolean;
      language: string;
      theme: string;
    }>
  > => {
    return httpClient.get("users/preferences");
  },

  /**
   * Met à jour les préférences de l'utilisateur
   *
   * @param preferences - Nouvelles préférences
   * @returns Result de confirmation
   */
  updatePreferences: async (preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    language?: string;
    theme?: string;
  }): Promise<
    ApiResult<{
      success: boolean;
      preferences: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        language: string;
        theme: string;
      };
    }>
  > => {
    return httpClient.put("users/preferences", preferences);
  },

  /**
   * Désactive le compte utilisateur (soft delete)
   *
   * @param reason - Raison de la désactivation
   * @returns Result de confirmation
   */
  deactivateAccount: async (
    reason: string,
  ): Promise<ApiResult<{ success: boolean; message: string }>> => {
    return httpClient.post<{ success: boolean; message: string }>(
      "users/deactivate",
      { reason },
    );
  },

  /**
   * Demande l'export des données personnelles (RGPD)
   *
   * @returns Result contenant le lien de téléchargement
   */
  requestDataExport: async (): Promise<
    ApiResult<{ success: boolean; downloadUrl: string; expiresAt: string }>
  > => {
    return httpClient.post("users/export-data");
  },

  /**
   * Demande la suppression définitive du compte (RGPD)
   *
   * @param password - Mot de passe pour confirmation
   * @returns Result de confirmation
   */
  requestAccountDeletion: async (
    password: string,
  ): Promise<
    ApiResult<{ success: boolean; message: string; deletionDate: string }>
  > => {
    return httpClient.post("users/request-deletion", { password });
  },
};

// ============================================================================
// Exports
// ============================================================================

export default authApi;
