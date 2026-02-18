import {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
} from "@/lib/apollo/generated/graphql";
import type { LoginMutation, GetMeQuery } from "@/lib/apollo/generated/graphql";
import { apolloClient } from "@/lib/apollo/apollo-client";
import { useNavigate } from "react-router-dom";

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

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    const result = await loginMutation({
      variables: { email, password },
    });

    if (!result.data?.login) {
      throw new Error("Login failed");
    }

    const loginResult = result.data.login;

    // Store token in localStorage
    if (loginResult.token) {
      localStorage.setItem("authToken", loginResult.token);
    }

    // Store user data
    if (loginResult.user) {
      localStorage.setItem("userData", JSON.stringify(loginResult.user));
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

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation();

      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      // Clear Apollo cache
      await apolloClient.clearStore();

      // Redirect to login page
      navigate("/connexion");
    } catch (err) {
      console.error("Logout error:", err);
      // Even if server logout fails, clear local data
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
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
  const { data, loading, error, refetch } = useGetMeQuery({
    fetchPolicy: "network-only",
    errorPolicy: "all",
    skip: !localStorage.getItem("authToken"),
  });

  return {
    isAuthenticated: !!data?.me,
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
  const { data, loading, error, refetch } = useGetMeQuery({
    fetchPolicy: "cache-first",
    skip: !localStorage.getItem("authToken"),
  });

  return {
    isAuthenticated: !!data?.me,
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
  const hasToken = !!localStorage.getItem("authToken");
  const { data } = useGetMeQuery({
    skip: !hasToken,
    fetchPolicy: "cache-only",
  });

  return hasToken && !!data?.me;
};
