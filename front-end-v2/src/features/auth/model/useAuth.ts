/**
 * Auth Feature - useAuth Hook
 *
 * Hook principal pour gérer l'authentification avec React Query.
 * Fournit l'état d'authentification et les mutations pour login/logout.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * const handleLogin = async () => {
 *   await login.mutateAsync({ email, password });
 * };
 * ```
 */

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import type {
  LoginCredentials,
  RegisterData,
  User,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
} from "./types";

// ============================================================================
// Query Keys
// ============================================================================

export const authKeys = {
  all: ["auth"] as const,
  status: () => [...authKeys.all, "status"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  preferences: () => [...authKeys.all, "preferences"] as const,
  user: (id: number) => [...authKeys.all, "user", id] as const,
};

// ============================================================================
// useAuthStatus Hook
// ============================================================================

/**
 * Hook pour vérifier le statut d'authentification
 */
export const useAuthStatus = () => {
  return useQuery({
    queryKey: authKeys.status(),
    queryFn: async () => {
      const result = await authApi.checkStatus();
      return result.match(
        (data) => data,
        (error) => {
          console.error("Error checking auth status:", error);
          return { authenticated: false, user: undefined };
        },
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: true,
  });
};

// ============================================================================
// useAuth Hook
// ============================================================================

/**
 * Hook principal pour l'authentification
 *
 * Fournit:
 * - L'état d'authentification (user, isAuthenticated, isLoading)
 * - Les mutations (login, logout, register)
 * - Les helpers (hasPermission, isAdmin, etc.)
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Query pour le statut
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();

  // Computed values
  const user = authStatus?.user ?? null;
  const isAuthenticated = authStatus?.authenticated ?? false;

  // ========================================
  // Login Mutation
  // ========================================

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await authApi.login(credentials);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(authKeys.status(), {
        authenticated: true,
        user: data.user,
      });
      queryClient.setQueryData(authKeys.profile(), data.user);

      // Invalider pour forcer un refetch si nécessaire
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
    },
  });

  // ========================================
  // Register Mutation
  // ========================================

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const result = await authApi.register(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data) => {
      // Si pas besoin de vérification email, connecter directement
      if (!data.requiresEmailVerification) {
        queryClient.setQueryData(authKeys.status(), {
          authenticated: true,
          user: data.user,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Register error:", error);
    },
  });

  // ========================================
  // Logout Mutation
  // ========================================

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await authApi.logout();
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: () => {
      // Nettoyer tout le cache d'authentification
      queryClient.setQueryData(authKeys.status(), {
        authenticated: false,
        user: undefined,
      });
      queryClient.removeQueries({ queryKey: authKeys.all });

      // Nettoyer tout le cache (optionnel, peut être trop agressif)
      // queryClient.clear();

      // Rediriger vers la page de connexion
      navigate("/pages/connexion");
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      // Même en cas d'erreur, nettoyer le cache local
      queryClient.setQueryData(authKeys.status(), {
        authenticated: false,
        user: undefined,
      });
      navigate("/pages/connexion");
    },
  });

  // ========================================
  // Forgot Password Mutation
  // ========================================

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const result = await authApi.forgotPassword(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
  });

  // ========================================
  // Reset Password Mutation
  // ========================================

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const result = await authApi.resetPassword(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
  });

  // ========================================
  // Change Password Mutation
  // ========================================

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const result = await authApi.changePassword(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
  });

  // ========================================
  // Helper Functions
  // ========================================

  const isAdmin = user?.role === "admin";
  const isProfesseur = user?.role === "professeur";
  const isUtilisateur = user?.role === "utilisateur";

  const canManageCourses = isAdmin || isProfesseur;
  const canAccessAdmin = isAdmin;

  // ========================================
  // Return
  // ========================================

  return {
    // State
    user,
    isAuthenticated,
    isLoading:
      isCheckingAuth || loginMutation.isPending || logoutMutation.isPending,
    isCheckingAuth,

    // Mutations
    login: loginMutation,
    logout: logoutMutation,
    register: registerMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    changePassword: changePasswordMutation,

    // Helpers
    isAdmin,
    isProfesseur,
    isUtilisateur,
    canManageCourses,
    canAccessAdmin,

    // Functions
    hasRole: (role: string) => user?.role === role,
    hasPermission: (permission: string) => {
      // TODO: Implémenter la logique de permissions
      return isAdmin;
    },
  };
};

// ============================================================================
// useCurrentUser Hook
// ============================================================================

/**
 * Hook pour récupérer l'utilisateur connecté
 * Version simplifiée de useAuth qui ne retourne que l'utilisateur
 */
export const useCurrentUser = () => {
  const { data: authStatus } = useAuthStatus();
  return authStatus?.user ?? null;
};

// ============================================================================
// useRequireAuth Hook
// ============================================================================

/**
 * Hook qui redirige vers la page de connexion si non authentifié
 *
 * @example
 * ```tsx
 * const MyProtectedPage = () => {
 *   useRequireAuth();
 *   return <div>Protected content</div>;
 * };
 * ```
 */
export const useRequireAuth = (redirectTo: string = "/pages/connexion") => {
  const { isAuthenticated, isCheckingAuth } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isCheckingAuth, navigate, redirectTo]);

  return { isAuthenticated, isCheckingAuth };
};

// ============================================================================
// useRequireRole Hook
// ============================================================================

/**
 * Hook qui redirige si l'utilisateur n'a pas le rôle requis
 *
 * @example
 * ```tsx
 * const AdminPage = () => {
 *   useRequireRole('admin');
 *   return <div>Admin content</div>;
 * };
 * ```
 */
export const useRequireRole = (
  requiredRole: string,
  redirectTo: string = "/pages/dashboard",
) => {
  const { user, isCheckingAuth } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isCheckingAuth && user?.role !== requiredRole) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, requiredRole, isCheckingAuth, navigate, redirectTo]);

  return { hasRequiredRole: user?.role === requiredRole, isCheckingAuth };
};

// ============================================================================
// useProfile Hook
// ============================================================================

/**
 * Hook pour gérer le profil utilisateur
 */
export const useProfile = () => {
  const queryClient = useQueryClient();

  // Query pour récupérer le profil
  const profileQuery = useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const result = await authApi.getProfile();
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string;
      telephone?: string;
      adresse?: string;
      dateOfBirth?: string;
      genre_id?: number;
      grade_id?: number;
    }) => {
      const result = await authApi.updateProfile(data);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (updatedUser) => {
      // Mettre à jour le cache
      queryClient.setQueryData(authKeys.profile(), updatedUser);
      queryClient.setQueryData(authKeys.status(), {
        authenticated: true,
        user: updatedUser,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation,
    refetch: profileQuery.refetch,
  };
};

// ============================================================================
// useAvatar Hook
// ============================================================================

/**
 * Hook pour gérer l'avatar utilisateur
 */
export const useAvatar = () => {
  const queryClient = useQueryClient();

  // Mutation pour uploader un avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await authApi.uploadAvatar(file);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data) => {
      // Mettre à jour le cache avec le nouvel utilisateur
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.setQueryData(authKeys.status(), {
        authenticated: true,
        user: data.user,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  // Mutation pour supprimer l'avatar
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const result = await authApi.deleteAvatar();
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.setQueryData(authKeys.status(), {
        authenticated: true,
        user: data.user,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  return {
    uploadAvatar: uploadAvatarMutation,
    deleteAvatar: deleteAvatarMutation,
  };
};

// ============================================================================
// usePreferences Hook
// ============================================================================

/**
 * Hook pour gérer les préférences utilisateur
 */
export const usePreferences = () => {
  const queryClient = useQueryClient();

  // Query pour récupérer les préférences
  const preferencesQuery = useQuery({
    queryKey: authKeys.preferences(),
    queryFn: async () => {
      const result = await authApi.getPreferences();
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation pour mettre à jour les préférences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      language?: string;
      theme?: string;
    }) => {
      const result = await authApi.updatePreferences(preferences);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(authKeys.preferences(), data.preferences);
    },
  });

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    updatePreferences: updatePreferencesMutation,
    refetch: preferencesQuery.refetch,
  };
};

// ============================================================================
// useAccountManagement Hook
// ============================================================================

/**
 * Hook pour gérer les opérations sensibles du compte
 */
export const useAccountManagement = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutation pour désactiver le compte
  const deactivateAccountMutation = useMutation({
    mutationFn: async (reason: string) => {
      const result = await authApi.deactivateAccount(reason);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: () => {
      // Déconnecter l'utilisateur
      queryClient.clear();
      navigate("/pages/connexion");
    },
  });

  // Mutation pour demander l'export des données
  const requestDataExportMutation = useMutation({
    mutationFn: async () => {
      const result = await authApi.requestDataExport();
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
  });

  // Mutation pour demander la suppression du compte
  const requestAccountDeletionMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await authApi.requestAccountDeletion(password);
      return result.match(
        (data) => data,
        (error) => {
          throw new Error(error.message);
        },
      );
    },
    onSuccess: () => {
      // Déconnecter l'utilisateur
      queryClient.clear();
      navigate("/pages/connexion");
    },
  });

  return {
    deactivateAccount: deactivateAccountMutation,
    requestDataExport: requestDataExportMutation,
    requestAccountDeletion: requestAccountDeletionMutation,
  };
};
