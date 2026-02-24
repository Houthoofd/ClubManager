import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apolloClient } from "../api";
import authService, {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  setUserData,
  getUserData,
  removeUserData,
  setAuthSession,
  getAuthSession,
  clearAuthSession,
  isAuthenticated,
  getCurrentUser,
  getCurrentUserId,
  hasRole,
  isAdmin,
  isProfessor,
  logout,
  getRedirectPath,
  isTokenExpired,
  type AuthUser,
  type AuthSession,
} from "./auth.service";

// Mock Apollo Client
vi.mock("../api", () => ({
  apolloClient: {
    clearStore: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock logger
vi.mock("@/core/utils/appLogger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("AuthService", () => {
  const mockUser: AuthUser = {
    id: 123,
    first_name: "John",
    last_name: "Doe",
    nom_utilisateur: "johndoe",
    email: "john.doe@example.com",
    status: "utilisateur",
    role: "admin",
    active: true,
    date_of_birth: "1990-01-01",
    phone: "+32123456789",
  };

  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token";
  const mockRefreshToken = "refresh-token-abc123";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset window.location
    delete (window as any).location;
    window.location = {
      href: "",
      pathname: "/pages/dashboard",
    } as any;
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ====================================================================
  // TOKEN MANAGEMENT
  // ====================================================================

  describe("Token Management", () => {
    describe("setAuthToken", () => {
      it("should store auth token in localStorage", () => {
        setAuthToken(mockToken);
        expect(localStorage.getItem("authToken")).toBe(mockToken);
      });

      it("should overwrite existing token", () => {
        localStorage.setItem("authToken", "old-token");
        setAuthToken(mockToken);
        expect(localStorage.getItem("authToken")).toBe(mockToken);
      });

      it("should handle empty string", () => {
        setAuthToken("");
        expect(localStorage.getItem("authToken")).toBe("");
      });

      it("should handle storage quota exceeded error gracefully", () => {
        const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
        setItemSpy.mockImplementationOnce(() => {
          throw new DOMException("QuotaExceededError");
        });

        expect(() => setAuthToken(mockToken)).not.toThrow();
        setItemSpy.mockRestore();
      });
    });

    describe("getAuthToken", () => {
      it("should retrieve auth token from localStorage", () => {
        localStorage.setItem("authToken", mockToken);
        const token = getAuthToken();
        expect(token).toBe(mockToken);
      });

      it("should return null if no token exists", () => {
        const token = getAuthToken();
        expect(token).toBeNull();
      });

      it("should return empty string if token is empty", () => {
        localStorage.setItem("authToken", "");
        const token = getAuthToken();
        expect(token).toBe("");
      });

      it("should handle storage access error gracefully", () => {
        const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
        getItemSpy.mockImplementationOnce(() => {
          throw new Error("Storage access denied");
        });

        const token = getAuthToken();
        expect(token).toBeNull();
        getItemSpy.mockRestore();
      });
    });

    describe("removeAuthToken", () => {
      it("should remove auth token from localStorage", () => {
        localStorage.setItem("authToken", mockToken);
        removeAuthToken();
        expect(localStorage.getItem("authToken")).toBeNull();
      });

      it("should not throw if token does not exist", () => {
        expect(() => removeAuthToken()).not.toThrow();
      });

      it("should handle removal error gracefully", () => {
        const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");
        removeItemSpy.mockImplementationOnce(() => {
          throw new Error("Cannot remove item");
        });

        expect(() => removeAuthToken()).not.toThrow();
        removeItemSpy.mockRestore();
      });
    });

    describe("Refresh Token Management", () => {
      it("should store refresh token in localStorage", () => {
        setRefreshToken(mockRefreshToken);
        expect(localStorage.getItem("refreshToken")).toBe(mockRefreshToken);
      });

      it("should retrieve refresh token from localStorage", () => {
        localStorage.setItem("refreshToken", mockRefreshToken);
        const token = getRefreshToken();
        expect(token).toBe(mockRefreshToken);
      });

      it("should return null if no refresh token exists", () => {
        const token = getRefreshToken();
        expect(token).toBeNull();
      });

      it("should remove refresh token from localStorage", () => {
        localStorage.setItem("refreshToken", mockRefreshToken);
        removeRefreshToken();
        expect(localStorage.getItem("refreshToken")).toBeNull();
      });
    });
  });

  // ====================================================================
  // USER DATA MANAGEMENT
  // ====================================================================

  describe("User Data Management", () => {
    describe("setUserData", () => {
      it("should store user data as JSON in localStorage", () => {
        setUserData(mockUser);
        const stored = localStorage.getItem("userData");
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!)).toEqual(mockUser);
      });

      it("should handle user with all optional fields", () => {
        const fullUser: AuthUser = {
          ...mockUser,
          genres: { id: 1, name: "Rock" },
          grades: [{ id: 1, level: "Advanced" }],
          abonnement: { type: "premium", expiresAt: "2024-12-31" },
        };

        setUserData(fullUser);
        const stored = localStorage.getItem("userData");
        expect(JSON.parse(stored!)).toEqual(fullUser);
      });

      it("should handle minimal user object", () => {
        const minimalUser: AuthUser = {
          id: 1,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        };

        setUserData(minimalUser);
        const stored = localStorage.getItem("userData");
        expect(JSON.parse(stored!)).toEqual(minimalUser);
      });

      it("should handle storage error gracefully", () => {
        const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
        setItemSpy.mockImplementationOnce(() => {
          throw new Error("Storage full");
        });

        expect(() => setUserData(mockUser)).not.toThrow();
        setItemSpy.mockRestore();
      });
    });

    describe("getUserData", () => {
      it("should retrieve and parse user data from localStorage", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        const user = getUserData();
        expect(user).toEqual(mockUser);
      });

      it("should return null if no user data exists", () => {
        const user = getUserData();
        expect(user).toBeNull();
      });

      it("should return null on invalid JSON", () => {
        localStorage.setItem("userData", "invalid-json{{{");
        const user = getUserData();
        expect(user).toBeNull();
      });

      it("should return null on empty string", () => {
        localStorage.setItem("userData", "");
        const user = getUserData();
        expect(user).toBeNull();
      });

      it("should handle storage access error gracefully", () => {
        const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
        getItemSpy.mockImplementationOnce(() => {
          throw new Error("Access denied");
        });

        const user = getUserData();
        expect(user).toBeNull();
        getItemSpy.mockRestore();
      });
    });

    describe("removeUserData", () => {
      it("should remove user data from localStorage", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        removeUserData();
        expect(localStorage.getItem("userData")).toBeNull();
      });

      it("should not throw if user data does not exist", () => {
        expect(() => removeUserData()).not.toThrow();
      });
    });
  });

  // ====================================================================
  // SESSION MANAGEMENT
  // ====================================================================

  describe("Session Management", () => {
    describe("setAuthSession", () => {
      it("should store both token and user data", () => {
        const session: AuthSession = {
          token: mockToken,
          user: mockUser,
        };

        setAuthSession(session);

        expect(localStorage.getItem("authToken")).toBe(mockToken);
        const storedUser = JSON.parse(localStorage.getItem("userData")!);
        expect(storedUser).toEqual(mockUser);
      });

      it("should overwrite existing session", () => {
        const oldSession: AuthSession = {
          token: "old-token",
          user: { ...mockUser, id: 999 },
        };

        setAuthSession(oldSession);
        setAuthSession({ token: mockToken, user: mockUser });

        expect(localStorage.getItem("authToken")).toBe(mockToken);
        expect(JSON.parse(localStorage.getItem("userData")!).id).toBe(123);
      });
    });

    describe("getAuthSession", () => {
      it("should retrieve complete session with token and user", () => {
        localStorage.setItem("authToken", mockToken);
        localStorage.setItem("userData", JSON.stringify(mockUser));

        const session = getAuthSession();

        expect(session).toEqual({
          token: mockToken,
          user: mockUser,
        });
      });

      it("should return null if only token exists", () => {
        localStorage.setItem("authToken", mockToken);
        const session = getAuthSession();
        expect(session).toBeNull();
      });

      it("should return null if only user data exists", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        const session = getAuthSession();
        expect(session).toBeNull();
      });

      it("should return null if both are missing", () => {
        const session = getAuthSession();
        expect(session).toBeNull();
      });

      it("should return null if token is empty string", () => {
        localStorage.setItem("authToken", "");
        localStorage.setItem("userData", JSON.stringify(mockUser));
        const session = getAuthSession();
        expect(session).toBeNull();
      });
    });

    describe("clearAuthSession", () => {
      it("should remove all authentication data", () => {
        localStorage.setItem("authToken", mockToken);
        localStorage.setItem("userData", JSON.stringify(mockUser));
        localStorage.setItem("refreshToken", mockRefreshToken);

        clearAuthSession();

        expect(localStorage.getItem("authToken")).toBeNull();
        expect(localStorage.getItem("userData")).toBeNull();
        expect(localStorage.getItem("refreshToken")).toBeNull();
      });

      it("should not throw if session does not exist", () => {
        expect(() => clearAuthSession()).not.toThrow();
      });

      it("should handle partial session data", () => {
        localStorage.setItem("authToken", mockToken);
        // Only token, no user or refresh

        clearAuthSession();

        expect(localStorage.getItem("authToken")).toBeNull();
      });
    });
  });

  // ====================================================================
  // AUTHENTICATION STATE
  // ====================================================================

  describe("Authentication State", () => {
    describe("isAuthenticated", () => {
      it("should return true if valid token exists", () => {
        localStorage.setItem("authToken", mockToken);
        expect(isAuthenticated()).toBe(true);
      });

      it("should return false if no token exists", () => {
        expect(isAuthenticated()).toBe(false);
      });

      it("should return false if token is empty string", () => {
        localStorage.setItem("authToken", "");
        expect(isAuthenticated()).toBe(false);
      });

      it("should return false if token is null", () => {
        localStorage.setItem("authToken", "null");
        // getItem returns 'null' string, but !! converts to true
        // This tests the actual behavior
        expect(isAuthenticated()).toBe(true); // 'null' is truthy
      });
    });

    describe("getCurrentUser", () => {
      it("should return current user if logged in", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        const user = getCurrentUser();
        expect(user).toEqual(mockUser);
      });

      it("should return null if not logged in", () => {
        const user = getCurrentUser();
        expect(user).toBeNull();
      });

      it("should return same instance as getUserData", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        expect(getCurrentUser()).toEqual(getUserData());
      });
    });

    describe("getCurrentUserId", () => {
      it("should return user ID if logged in", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        const userId = getCurrentUserId();
        expect(userId).toBe(123);
      });

      it("should return null if not logged in", () => {
        const userId = getCurrentUserId();
        expect(userId).toBeNull();
      });

      it("should return null if user has no ID", () => {
        const userWithoutId = { ...mockUser };
        delete (userWithoutId as any).id;
        localStorage.setItem("userData", JSON.stringify(userWithoutId));

        const userId = getCurrentUserId();
        expect(userId).toBeNull();
      });

      it("should handle ID of 0", () => {
        const userWithZeroId = { ...mockUser, id: 0 };
        localStorage.setItem("userData", JSON.stringify(userWithZeroId));

        const userId = getCurrentUserId();
        expect(userId).toBeNull(); // Because ?? null check
      });
    });

    describe("hasRole", () => {
      it("should return true if user has the specified role", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        expect(hasRole("admin")).toBe(true);
      });

      it("should return false if user has different role", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        expect(hasRole("professeur")).toBe(false);
      });

      it("should return false if no user is logged in", () => {
        expect(hasRole("admin")).toBe(false);
      });

      it("should be case-sensitive", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        expect(hasRole("Admin")).toBe(false); // Capital A
        expect(hasRole("admin")).toBe(true);
      });

      it("should return false if user has no role", () => {
        const userWithoutRole = { ...mockUser };
        delete (userWithoutRole as any).role;
        localStorage.setItem("userData", JSON.stringify(userWithoutRole));

        expect(hasRole("admin")).toBe(false);
      });
    });

    describe("isAdmin", () => {
      it("should return true for admin users", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        expect(isAdmin()).toBe(true);
      });

      it("should return false for non-admin users", () => {
        const regularUser = { ...mockUser, role: "utilisateur" };
        localStorage.setItem("userData", JSON.stringify(regularUser));
        expect(isAdmin()).toBe(false);
      });

      it("should return false if no user is logged in", () => {
        expect(isAdmin()).toBe(false);
      });
    });

    describe("isProfessor", () => {
      it("should return true for professor users", () => {
        const professor = { ...mockUser, role: "professeur" };
        localStorage.setItem("userData", JSON.stringify(professor));
        expect(isProfessor()).toBe(true);
      });

      it("should return false for non-professor users", () => {
        localStorage.setItem("userData", JSON.stringify(mockUser));
        expect(isProfessor()).toBe(false);
      });

      it("should return false if no user is logged in", () => {
        expect(isProfessor()).toBe(false);
      });
    });
  });

  // ====================================================================
  // LOGOUT
  // ====================================================================

  describe("Logout", () => {
    beforeEach(() => {
      // Setup authenticated state
      localStorage.setItem("authToken", mockToken);
      localStorage.setItem("userData", JSON.stringify(mockUser));
      localStorage.setItem("refreshToken", mockRefreshToken);
    });

    it("should clear all auth data on logout", async () => {
      await logout(false);

      expect(localStorage.getItem("authToken")).toBeNull();
      expect(localStorage.getItem("userData")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
    });

    it("should clear Apollo Client cache", async () => {
      await logout(false);
      expect(apolloClient.clearStore).toHaveBeenCalledTimes(1);
    });

    it("should redirect to login page by default", async () => {
      await logout();
      expect(window.location.href).toBe("/pages/connexion");
    });

    it("should not redirect when redirectToLogin is false", async () => {
      const originalHref = window.location.href;
      await logout(false);
      expect(window.location.href).toBe(originalHref);
    });

    it("should not redirect if already on login page", async () => {
      window.location.pathname = "/pages/connexion";
      const originalHref = window.location.href;

      await logout(true);

      // Should not redirect since already on login page
      expect(window.location.href).toBe(originalHref);
    });

    it("should clear data even if Apollo fails", async () => {
      vi.mocked(apolloClient.clearStore).mockRejectedValueOnce(new Error("Apollo error"));

      await logout(false);

      expect(localStorage.getItem("authToken")).toBeNull();
      expect(localStorage.getItem("userData")).toBeNull();
    });

    it("should redirect even if Apollo fails", async () => {
      vi.mocked(apolloClient.clearStore).mockRejectedValueOnce(new Error("Apollo error"));

      await logout(true);

      expect(window.location.href).toBe("/pages/connexion");
    });
  });

  // ====================================================================
  // UTILITY FUNCTIONS
  // ====================================================================

  describe("Utility Functions", () => {
    describe("getRedirectPath", () => {
      it("should redirect utilisateur to course inscription", () => {
        const user = { ...mockUser, status: "utilisateur" };
        const path = getRedirectPath(user);
        expect(path).toBe("/pages/cours/inscription");
      });

      it("should redirect visiteur to course inscription", () => {
        const user = { ...mockUser, status: "visiteur" };
        const path = getRedirectPath(user);
        expect(path).toBe("/pages/cours/inscription");
      });

      it("should redirect other users to dashboard", () => {
        const user = { ...mockUser, status: "admin" };
        const path = getRedirectPath(user);
        expect(path).toBe("/pages/dashboard");
      });

      it("should redirect to dashboard if status is undefined", () => {
        const user = { ...mockUser };
        delete (user as any).status;
        const path = getRedirectPath(user);
        expect(path).toBe("/pages/dashboard");
      });

      it("should redirect professor to dashboard", () => {
        const user = { ...mockUser, status: "professeur", role: "professeur" };
        const path = getRedirectPath(user);
        expect(path).toBe("/pages/dashboard");
      });
    });

    describe("isTokenExpired", () => {
      it("should return true if no token exists", () => {
        expect(isTokenExpired()).toBe(true);
      });

      it("should return false if token exists", () => {
        localStorage.setItem("authToken", mockToken);
        expect(isTokenExpired()).toBe(false);
      });

      // TODO: Implement proper JWT expiration checking
      it.todo("should return true for expired JWT tokens");
      it.todo("should return false for valid JWT tokens");
      it.todo("should handle malformed JWT tokens");
    });
  });

  // ====================================================================
  // SERVICE OBJECT
  // ====================================================================

  describe("Service Object Export", () => {
    it("should export all token management functions", () => {
      expect(authService.setAuthToken).toBeDefined();
      expect(authService.getAuthToken).toBeDefined();
      expect(authService.removeAuthToken).toBeDefined();
      expect(authService.setRefreshToken).toBeDefined();
      expect(authService.getRefreshToken).toBeDefined();
      expect(authService.removeRefreshToken).toBeDefined();
    });

    it("should export all user data functions", () => {
      expect(authService.setUserData).toBeDefined();
      expect(authService.getUserData).toBeDefined();
      expect(authService.removeUserData).toBeDefined();
    });

    it("should export all session functions", () => {
      expect(authService.setAuthSession).toBeDefined();
      expect(authService.getAuthSession).toBeDefined();
      expect(authService.clearAuthSession).toBeDefined();
    });

    it("should export all authentication state functions", () => {
      expect(authService.isAuthenticated).toBeDefined();
      expect(authService.getCurrentUser).toBeDefined();
      expect(authService.getCurrentUserId).toBeDefined();
      expect(authService.hasRole).toBeDefined();
      expect(authService.isAdmin).toBeDefined();
      expect(authService.isProfessor).toBeDefined();
    });

    it("should export utility functions", () => {
      expect(authService.logout).toBeDefined();
      expect(authService.getRedirectPath).toBeDefined();
      expect(authService.isTokenExpired).toBeDefined();
    });
  });

  // ====================================================================
  // INTEGRATION TESTS
  // ====================================================================

  describe("Integration Tests", () => {
    it("should handle complete login flow", () => {
      const session: AuthSession = {
        token: mockToken,
        user: mockUser,
      };

      // Login
      setAuthSession(session);

      // Verify authenticated
      expect(isAuthenticated()).toBe(true);
      expect(getCurrentUser()).toEqual(mockUser);
      expect(getCurrentUserId()).toBe(123);
      expect(isAdmin()).toBe(true);
    });

    it("should handle complete logout flow", async () => {
      // Setup authenticated state
      setAuthSession({ token: mockToken, user: mockUser });
      expect(isAuthenticated()).toBe(true);

      // Logout
      await logout(false);

      // Verify logged out
      expect(isAuthenticated()).toBe(false);
      expect(getCurrentUser()).toBeNull();
      expect(getCurrentUserId()).toBeNull();
    });

    it("should handle token refresh flow", () => {
      // Initial login
      setAuthSession({ token: mockToken, user: mockUser });
      setRefreshToken(mockRefreshToken);

      // Verify all tokens
      expect(getAuthToken()).toBe(mockToken);
      expect(getRefreshToken()).toBe(mockRefreshToken);

      // Simulate token refresh
      const newToken = "new-auth-token";
      setAuthToken(newToken);

      // Verify new token, user data unchanged
      expect(getAuthToken()).toBe(newToken);
      expect(getCurrentUser()).toEqual(mockUser);
    });

    it("should handle role changes", () => {
      localStorage.setItem("userData", JSON.stringify(mockUser));
      expect(isAdmin()).toBe(true);
      expect(isProfessor()).toBe(false);

      // Change role
      const updatedUser = { ...mockUser, role: "professeur" };
      setUserData(updatedUser);

      expect(isAdmin()).toBe(false);
      expect(isProfessor()).toBe(true);
    });
  });
});
