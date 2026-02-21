import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAllAuthData } from "@/shared/utils/authCleaner";

// ============================================================================
// Types
// ============================================================================

type UseAuthRedirectOptions = {
  autoRedirectDelay?: number;
  checkInterval?: number;
  customMessage?: string;
};

type UseAuthRedirectReturn = {
  showAuthModal: boolean;
  redirectToLogin: () => void;
  triggerAuthRequired: (message?: string) => void;
  checkAuthStatus: () => boolean;
  customMessage: string;
  autoRedirectDelay: number;
};

type JWTPayload = {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
};

type UserData = {
  id: number;
  email: string;
  [key: string]: unknown;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for authentication state management and automatic redirection
 *
 * Monitors authentication status and handles session expiration by:
 * - Periodically checking token validity
 * - Displaying authentication modal when session expires
 * - Redirecting to login page when needed
 * - Cleaning up expired authentication data
 *
 * @param options - Configuration options for auth redirect behavior
 * @returns Auth redirect utilities and state
 */
export const useAuthRedirect = (options: UseAuthRedirectOptions = {}): UseAuthRedirectReturn => {
  const {
    autoRedirectDelay = 5,
    checkInterval = 30000, // Check every 30 seconds
    customMessage,
  } = options;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  /**
   * Check if user is currently authenticated
   *
   * Validates:
   * - Token existence
   * - User data existence
   * - JWT token expiration (if applicable)
   *
   * @returns true if authenticated, false otherwise
   */
  const checkAuthStatus = (): boolean => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    // Check token and user data existence
    if (!token || !userData) {
      return false;
    }

    try {
      const userDataParsed: UserData = JSON.parse(userData);
      if (!userDataParsed.id || !userDataParsed.email) {
        return false;
      }

      // Check JWT token expiration if it's a JWT
      if (token.startsWith("eyJ")) {
        const payload: JWTPayload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          return false; // Token expired
        }
      }

      return true;
    } catch (error) {
      // Invalid token or user data format
      return false;
    }
  };

  /**
   * Trigger authentication required modal
   *
   * Cleans up expired/corrupted authentication data and shows modal
   *
   * @param message - Optional custom message to display
   */
  const triggerAuthRequired = (message?: string): void => {
    clearAllAuthData();
    setShowAuthModal(true);
  };

  /**
   * Redirect user to login page
   *
   * Cleans up all authentication data and navigates to login
   */
  const redirectToLogin = (): void => {
    setShowAuthModal(false);
    clearAllAuthData();
    navigate("/pages/connexion");
  };

  // Periodic authentication status check
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!checkAuthStatus()) {
        triggerAuthRequired();
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkInterval]);

  // Check authentication status on component mount
  useEffect(() => {
    if (!checkAuthStatus()) {
      triggerAuthRequired();
    }
  }, []);

  // Listen for auth-cleared events
  useEffect(() => {
    const handleAuthCleared = (): void => {
      triggerAuthRequired("Votre session a été fermée.");
    };

    window.addEventListener("auth-cleared", handleAuthCleared);
    return () => window.removeEventListener("auth-cleared", handleAuthCleared);
  }, []);

  return {
    showAuthModal,
    redirectToLogin,
    triggerAuthRequired,
    checkAuthStatus,
    customMessage: customMessage || "Votre session a expiré ou vous n'êtes pas connecté.",
    autoRedirectDelay,
  };
};
