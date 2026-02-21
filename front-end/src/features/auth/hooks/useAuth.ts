import {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
} from "@/core/api/apollo/generated/graphql";
import type { LoginMutation, GetMeQuery } from "@/core/api/apollo/generated/graphql";
import { apolloClient } from "@/core/api/apollo/apollo-client";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

// ============================================================================
// Types
// ============================================================================

type User = NonNullable<GetMeQuery["me"]>;
type LoginResult = NonNullable<LoginMutation["login"]>;

type UseLoginReturn = {
  login: (email: string, password: string) => Promise<LoginResult>;
  isLoading: boolean;
  error: Error | null;
  data: LoginResult | null;
};

type UseLogoutReturn = {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
};

type UseAuthStatusReturn = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for user login
 *
 * Authenticates user with email/password and stores the token
 *
 * @returns Login function with loading state
 *
 * @example
 * ```tsx
 * const { login, isLoading, error } = useLogin();
 * await login('user@example.com', 'password123');
 * ```
 */
export const useLogin = (): UseLoginReturn => {
  const [loginMutation, { data, loading, error }] = useLoginMutation();
  const authStore = useAuthStore();

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const result = await loginMutation({
      variables: { email, password },
    });

    if (!result.data?.login) {
      throw new Error("Login failed");
    }

    const loginResult = result.data.login;

    // Store in Zustand (which persists to localStorage automatically)
    if (loginResult.token && loginResult.user) {
      authStore.login(loginResult.user as any, loginResult.token);
    }

    // Reset Apollo cache after login to refetch protected queries
    await apolloClient.resetStore();

    return loginResult;
  };

  return {
    login,
    isLoading: loading,
    error: error ?? null,
    data: data?.login ?? null,
  };
};

/**
 * Hook for user logout
 *
 * Logs out user and clears authentication data
 *
 * @returns Logout function with loading state
 *
 * @example
 * ```tsx
 * const { logout, isLoading } = useLogout();
 * await logout();
 * ```
 */
export const useLogout = (): UseLogoutReturn => {
  const [logoutMutation, { loading, error }] = useLogoutMutation();
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation();

      // Clear Zustand store (which also clears persisted localStorage)
      authStore.logout();

      // Clear Apollo cache
      await apolloClient.clearStore();

      // Redirect to login page
      navigate("/connexion");
    } catch (err) {
      console.error("Logout error:", err);
      // Even if server logout fails, clear local data
      authStore.logout();
      await apolloClient.clearStore();
      navigate("/connexion");
    }
  };

  return {
    logout,
    isLoading: loading,
    error: error ?? null,
  };
};

/**
 * Hook to check authentication status
 *
 * Fetches current user data to verify authentication
 *
 * @returns Authentication status with user data
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, isLoading } = useAuthStatus();
 * if (isAuthenticated) {
 *   console.log('Logged in as:', user.email);
 * }
 * ```
 */
export const useAuthStatus = (): UseAuthStatusReturn => {
  const { token, isAuthenticated: storeIsAuthenticated } = useAuthStore();
  const { data, loading, error, refetch } = useGetMeQuery({
    fetchPolicy: "network-only",
    errorPolicy: "all",
    skip: !token,
  });

  return {
    isAuthenticated: storeIsAuthenticated && !!data?.me,
    user: data?.me ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to get current user profile
 *
 * Returns the authenticated user's profile data
 *
 * @returns User profile with loading state
 *
 * @example
 * ```tsx
 * const { user, isLoading } = useProfile();
 * ```
 */
export const useProfile = (): UseAuthStatusReturn => {
  const { token, isAuthenticated: storeIsAuthenticated } = useAuthStore();
  const { data, loading, error, refetch } = useGetMeQuery({
    fetchPolicy: "cache-first",
    skip: !token,
  });

  return {
    isAuthenticated: storeIsAuthenticated && !!data?.me,
    user: data?.me ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to check if user is authenticated (simple boolean check)
 *
 * @returns Boolean indicating if user is logged in
 *
 * @example
 * ```tsx
 * const isAuthenticated = useIsAuthenticated();
 * ```
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated;
};

/**
 * Legacy alias for useIsAuthenticated
 * @deprecated Use useIsAuthenticated instead
 */
export const useAuthentifie = useIsAuthenticated;

/**
 * Alias for useAuthStatus
 */
export const useAuth = useAuthStatus;
