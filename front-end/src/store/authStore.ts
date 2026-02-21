import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { setSentryUser, clearSentryUser } from "@/core/monitoring/sentry";

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  gender_id?: number;
  role: string;
  active: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Helpers
  getUserId: () => number | null;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
}

// ============================================================================
// Store
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),

      setToken: (token) =>
        set((state) => {
          state.token = token;
        }),

      login: (user, token) =>
        set((state) => {
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          state.error = null;
          console.log("✅ [AuthStore] User logged in:", user.email);

          // Sentry: Set user context for error tracking
          setSentryUser({
            id: user.id,
            email: user.email,
            username: `${user.first_name} ${user.last_name}`,
            role: user.role,
          });
        }),

      logout: () =>
        set((state) => {
          console.log("🚪 [AuthStore] User logged out");
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.error = null;

          // Sentry: Clear user context
          clearSentryUser();
        }),

      updateUser: (updates) =>
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...updates };
            console.log("✅ [AuthStore] User updated:", updates);
          }
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          console.error("❌ [AuthStore] Error:", error);
        }),

      clearError: () =>
        set((state) => {
          state.error = null;
        }),

      // Helpers
      getUserId: () => {
        const state = get();
        return state.user?.id ?? null;
      },

      isAdmin: () => {
        const state = get();
        return state.user?.role === "admin" || state.user?.role === "ADMIN";
      },

      isInstructor: () => {
        const state = get();
        return (
          state.user?.role === "instructor" ||
          state.user?.role === "INSTRUCTOR" ||
          state.user?.role === "admin" ||
          state.user?.role === "ADMIN"
        );
      },
    })),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectToken = (state: AuthState) => state.token;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectUserId = (state: AuthState) => state.user?.id ?? null;
export const selectUserRole = (state: AuthState) => state.user?.role ?? null;

// ============================================================================
// Hooks (convenience)
// ============================================================================

export const useUser = () => useAuthStore(selectUser);
export const useToken = () => useAuthStore(selectToken);
export const useIsAuthenticated = () => useAuthStore(selectIsAuthenticated);
export const useAuthLoading = () => useAuthStore(selectIsLoading);
export const useAuthError = () => useAuthStore(selectError);
export const useUserId = () => useAuthStore(selectUserId);
export const useUserRole = () => useAuthStore(selectUserRole);

// ============================================================================
// Migration helper (from localStorage)
// ============================================================================

export const migrateFromLocalStorage = () => {
  try {
    // Check if already migrated
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      console.log("✅ [AuthStore] Already migrated");
      return;
    }

    // Get old localStorage data
    const oldToken = localStorage.getItem("authToken");
    const oldUserData = localStorage.getItem("userData");

    if (oldToken && oldUserData) {
      const user = JSON.parse(oldUserData);
      console.log("🔄 [AuthStore] Migrating from localStorage...");

      // Use the store to set data (will auto-persist)
      useAuthStore.getState().login(user, oldToken);

      // Clean up old storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      console.log("✅ [AuthStore] Migration complete");
    }
  } catch (error) {
    console.error("❌ [AuthStore] Migration error:", error);
  }
};
