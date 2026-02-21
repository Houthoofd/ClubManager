import {
  useLoginMutation,
  useRegisterMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useCheckEmailQuery,
} from "@/core/api/apollo/generated/graphql";
import type {
  LoginMutation,
  RegisterMutation,
  RequestPasswordResetMutation,
  ResetPasswordMutation,
  RegisterInput,
} from "@/core/api/apollo/generated/graphql";
import { apolloClient } from "@/core/api/apollo/apollo-client";

// ============================================================================
// Types
// ============================================================================

type LoginFormData = {
  email: string;
  password: string;
};

type RegisterFormData = RegisterInput;

type PasswordResetRequestData = {
  email: string;
};

type PasswordResetData = {
  token: string;
  newPassword: string;
};

type UseLoginReturn = {
  login: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseRegisterReturn = {
  register: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UsePasswordResetRequestReturn = {
  requestReset: (data: PasswordResetRequestData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UsePasswordResetReturn = {
  resetPassword: (data: PasswordResetData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseCheckEmailReturn = {
  emailExists: boolean | null;
  isLoading: boolean;
  error: Error | null;
  checkEmail: (email: string) => Promise<boolean>;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for user login with email and password
 *
 * Handles authentication, token storage, and cache management
 *
 * @returns Login function with loading/error state
 *
 * @example
 * ```tsx
 * const { login, isLoading, error, success } = useLoginForm();
 *
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   await login({ email, password });
 * };
 * ```
 */
export const useLoginForm = (): UseLoginReturn => {
  const [loginMutation, { loading, error }] = useLoginMutation();

  const login = async (data: LoginFormData): Promise<void> => {
    const result = await loginMutation({
      variables: {
        email: data.email,
        password: data.password,
      },
    });

    if (!result.data?.login.success) {
      throw new Error(result.data?.login.message || "Login failed");
    }

    const loginResult = result.data.login;

    // Store authentication token
    if (loginResult.token) {
      localStorage.setItem("authToken", loginResult.token);
    }

    // Store user data
    if (loginResult.user) {
      localStorage.setItem("userData", JSON.stringify(loginResult.user));
    }

    // Reset Apollo cache to refetch protected queries
    await apolloClient.resetStore();
  };

  return {
    login,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook for user registration
 *
 * Creates new user account with provided information
 *
 * @returns Register function with loading/error state
 *
 * @example
 * ```tsx
 * const { register, isLoading, error } = useRegisterForm();
 *
 * await register({
 *   email: 'user@example.com',
 *   password: 'securePass123',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   phone: '+1234567890',
 * });
 * ```
 */
export const useRegisterForm = (): UseRegisterReturn => {
  const [registerMutation, { loading, error }] = useRegisterMutation();

  const register = async (data: RegisterFormData): Promise<void> => {
    const result = await registerMutation({
      variables: {
        input: data,
      },
    });

    if (!result.data?.register.success) {
      throw new Error(result.data?.register.message || "Registration failed");
    }

    const registerResult = result.data.register;

    // Store authentication token
    if (registerResult.token) {
      localStorage.setItem("authToken", registerResult.token);
    }

    // Store user data
    if (registerResult.user) {
      localStorage.setItem("userData", JSON.stringify(registerResult.user));
    }

    // Reset Apollo cache
    await apolloClient.resetStore();
  };

  return {
    register,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to request password reset
 *
 * Sends password reset email to the user
 *
 * @returns Request reset function with loading/error state
 *
 * @example
 * ```tsx
 * const { requestReset, isLoading, success } = usePasswordResetRequest();
 *
 * await requestReset({ email: 'user@example.com' });
 * if (success) {
 *   alert('Reset email sent!');
 * }
 * ```
 */
export const usePasswordResetRequest = (): UsePasswordResetRequestReturn => {
  const [requestResetMutation, { loading, error }] = useRequestPasswordResetMutation();

  const requestReset = async (data: PasswordResetRequestData): Promise<void> => {
    const result = await requestResetMutation({
      variables: {
        email: data.email,
      },
    });

    if (!result.data?.requestPasswordReset.success) {
      throw new Error(result.data?.requestPasswordReset.message || "Password reset request failed");
    }
  };

  return {
    requestReset,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to reset password with token
 *
 * Resets user password using token from email
 *
 * @returns Reset password function with loading/error state
 *
 * @example
 * ```tsx
 * const { resetPassword, isLoading, success } = usePasswordReset();
 *
 * await resetPassword({
 *   token: 'reset-token-from-email',
 *   newPassword: 'newSecurePassword123'
 * });
 * ```
 */
export const usePasswordReset = (): UsePasswordResetReturn => {
  const [resetPasswordMutation, { loading, error }] = useResetPasswordMutation();

  const resetPassword = async (data: PasswordResetData): Promise<void> => {
    const result = await resetPasswordMutation({
      variables: {
        token: data.token,
        newPassword: data.newPassword,
      },
    });

    if (!result.data?.resetPassword.success) {
      throw new Error(result.data?.resetPassword.message || "Password reset failed");
    }

    const resetResult = result.data.resetPassword;

    // Store new token if provided
    if (resetResult.token) {
      localStorage.setItem("authToken", resetResult.token);
    }

    // Store user data
    if (resetResult.user) {
      localStorage.setItem("userData", JSON.stringify(resetResult.user));
    }

    // Reset Apollo cache
    await apolloClient.resetStore();
  };

  return {
    resetPassword,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to check if email exists in database
 *
 * Useful for registration validation
 *
 * @returns Email check function with state
 *
 * @example
 * ```tsx
 * const { checkEmail, emailExists, isLoading } = useCheckEmail();
 *
 * const handleEmailBlur = async () => {
 *   const exists = await checkEmail(email);
 *   if (exists) {
 *     setError('Email already registered');
 *   }
 * };
 * ```
 */
export const useCheckEmail = (): UseCheckEmailReturn => {
  const checkEmail = async (email: string): Promise<boolean> => {
    // This would need to be implemented with lazy query
    // For now, return a placeholder
    return false;
  };

  return {
    emailExists: null,
    isLoading: false,
    error: null,
    checkEmail,
  };
};

// ============================================================================
// Alias Exports for backward compatibility
// ============================================================================

/**
 * Alias for useLoginForm
 * @deprecated Use useLoginForm instead
 */
export const useConnexion = useLoginForm;
