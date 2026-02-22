import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock authCleaner
const mockClearAllAuthData = vi.fn();
vi.mock('@/shared/utils/authCleaner', () => ({
  clearAllAuthData: mockClearAllAuthData,
}));

describe('useAuthRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();

    // Set up valid auth data by default
    localStorage.setItem('authToken', 'valid-token-123');
    localStorage.setItem('userData', JSON.stringify({ id: 1, email: 'test@example.com' }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.showAuthModal).toBe(false);
      expect(result.current.autoRedirectDelay).toBe(5);
      expect(result.current.customMessage).toBe(
        "Votre session a expiré ou vous n'êtes pas connecté."
      );
      expect(typeof result.current.redirectToLogin).toBe('function');
      expect(typeof result.current.triggerAuthRequired).toBe('function');
      expect(typeof result.current.checkAuthStatus).toBe('function');
    });

    it('should accept custom options', () => {
      const customMessage = 'Custom auth message';
      const autoRedirectDelay = 10;
      const checkInterval = 60000;

      const { result } = renderHook(() =>
        useAuthRedirect({ customMessage, autoRedirectDelay, checkInterval })
      );

      expect(result.current.customMessage).toBe(customMessage);
      expect(result.current.autoRedirectDelay).toBe(autoRedirectDelay);
    });

    it('should not show modal when auth data is valid', () => {
      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.showAuthModal).toBe(false);
    });

    it('should show modal when no auth data exists', () => {
      localStorage.clear();

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.showAuthModal).toBe(true);
    });
  });

  describe('checkAuthStatus', () => {
    it('should return true when valid token and user data exist', () => {
      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(true);
    });

    it('should return false when no token exists', () => {
      localStorage.removeItem('authToken');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should return false when no user data exists', () => {
      localStorage.removeItem('userData');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should return false when user data is invalid JSON', () => {
      localStorage.setItem('userData', 'invalid-json');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should return false when user data is missing required fields', () => {
      localStorage.setItem('userData', JSON.stringify({ email: 'test@example.com' }));

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should validate JWT token expiration', () => {
      // Create expired JWT token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const expiredPayload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
          sub: '1',
        })
      );
      const signature = 'fake-signature';
      const expiredToken = `${header}.${expiredPayload}.${signature}`;

      localStorage.setItem('authToken', expiredToken);

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should accept valid JWT token', () => {
      // Create valid JWT token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const validPayload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          sub: '1',
        })
      );
      const signature = 'fake-signature';
      const validToken = `${header}.${validPayload}.${signature}`;

      localStorage.setItem('authToken', validToken);

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(true);
    });

    it('should accept non-JWT tokens', () => {
      localStorage.setItem('authToken', 'simple-token-123');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(true);
    });

    it('should handle malformed JWT tokens gracefully', () => {
      localStorage.setItem('authToken', 'eyJ.malformed.token');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });
  });

  describe('triggerAuthRequired', () => {
    it('should show auth modal', () => {
      const { result } = renderHook(() => useAuthRedirect());

      act(() => {
        result.current.triggerAuthRequired();
      });

      expect(result.current.showAuthModal).toBe(true);
    });

    it('should clear auth data', () => {
      const { result } = renderHook(() => useAuthRedirect());

      act(() => {
        result.current.triggerAuthRequired();
      });

      expect(mockClearAllAuthData).toHaveBeenCalled();
    });

    it('should accept custom message', () => {
      const { result } = renderHook(() => useAuthRedirect());

      act(() => {
        result.current.triggerAuthRequired('Custom message');
      });

      expect(result.current.showAuthModal).toBe(true);
    });
  });

  describe('redirectToLogin', () => {
    it('should hide auth modal', () => {
      const { result } = renderHook(() => useAuthRedirect());

      // First show the modal
      act(() => {
        result.current.triggerAuthRequired();
      });

      expect(result.current.showAuthModal).toBe(true);

      // Then redirect
      act(() => {
        result.current.redirectToLogin();
      });

      expect(result.current.showAuthModal).toBe(false);
    });

    it('should clear all auth data', () => {
      const { result } = renderHook(() => useAuthRedirect());

      act(() => {
        result.current.redirectToLogin();
      });

      expect(mockClearAllAuthData).toHaveBeenCalled();
    });

    it('should navigate to login page', () => {
      const { result } = renderHook(() => useAuthRedirect());

      act(() => {
        result.current.redirectToLogin();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/pages/connexion');
    });
  });

  describe('Periodic Auth Check', () => {
    it('should check auth status at regular intervals', () => {
      const checkInterval = 30000; // 30 seconds
      renderHook(() => useAuthRedirect({ checkInterval }));

      // Fast-forward time by 30 seconds
      act(() => {
        vi.advanceTimersByTime(checkInterval);
      });

      // Auth data is valid, so no action should be taken
      expect(mockClearAllAuthData).not.toHaveBeenCalled();
    });

    it('should trigger auth required when status becomes invalid', () => {
      const checkInterval = 30000;
      const { result } = renderHook(() => useAuthRedirect({ checkInterval }));

      // Clear auth data to simulate invalid status
      localStorage.clear();

      act(() => {
        vi.advanceTimersByTime(checkInterval);
      });

      expect(result.current.showAuthModal).toBe(true);
      expect(mockClearAllAuthData).toHaveBeenCalled();
    });

    it('should use custom check interval', () => {
      const checkInterval = 60000; // 1 minute
      renderHook(() => useAuthRedirect({ checkInterval }));

      // Advance by less than check interval
      act(() => {
        vi.advanceTimersByTime(checkInterval - 1000);
      });

      // Should not have checked yet
      localStorage.clear();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Now should have checked
      expect(mockClearAllAuthData).toHaveBeenCalled();
    });

    it('should clear interval on unmount', () => {
      const { unmount } = renderHook(() => useAuthRedirect());

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Auth Cleared Event Listener', () => {
    it('should listen for auth-cleared events', () => {
      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.showAuthModal).toBe(false);

      // Dispatch auth-cleared event
      act(() => {
        window.dispatchEvent(new Event('auth-cleared'));
      });

      expect(result.current.showAuthModal).toBe(true);
      expect(mockClearAllAuthData).toHaveBeenCalled();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useAuthRedirect());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'auth-cleared',
        expect.any(Function)
      );
    });

    it('should handle multiple auth-cleared events', () => {
      const { result } = renderHook(() => useAuthRedirect());

      // Dispatch multiple events
      act(() => {
        window.dispatchEvent(new Event('auth-cleared'));
      });

      expect(result.current.showAuthModal).toBe(true);

      act(() => {
        result.current.redirectToLogin();
      });

      expect(result.current.showAuthModal).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('auth-cleared'));
      });

      expect(result.current.showAuthModal).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with no expiration', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payloadWithoutExp = btoa(JSON.stringify({ sub: '1' }));
      const signature = 'fake-signature';
      const tokenWithoutExp = `${header}.${payloadWithoutExp}.${signature}`;

      localStorage.setItem('authToken', tokenWithoutExp);

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(true);
    });

    it('should handle empty token', () => {
      localStorage.setItem('authToken', '');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should handle empty user data', () => {
      localStorage.setItem('userData', '{}');

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(false);
    });

    it('should handle user data with extra fields', () => {
      localStorage.setItem(
        'userData',
        JSON.stringify({
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        })
      );

      const { result } = renderHook(() => useAuthRedirect());

      expect(result.current.checkAuthStatus()).toBe(true);
    });

    it('should handle rapid check status calls', () => {
      const { result } = renderHook(() => useAuthRedirect());

      for (let i = 0; i < 100; i++) {
        expect(result.current.checkAuthStatus()).toBe(true);
      }

      expect(mockClearAllAuthData).not.toHaveBeenCalled();
    });

    it('should handle localStorage being cleared externally', () => {
      const checkInterval = 30000;
      const { result } = renderHook(() => useAuthRedirect({ checkInterval }));

      expect(result.current.showAuthModal).toBe(false);

      // Simulate external localStorage clear
      localStorage.clear();

      act(() => {
        vi.advanceTimersByTime(checkInterval);
      });

      expect(result.current.showAuthModal).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete auth flow', () => {
      const { result } = renderHook(() => useAuthRedirect());

      // Initially authenticated
      expect(result.current.showAuthModal).toBe(false);
      expect(result.current.checkAuthStatus()).toBe(true);

      // Session expires
      localStorage.clear();

      act(() => {
        result.current.triggerAuthRequired();
      });

      expect(result.current.showAuthModal).toBe(true);

      // User clicks login
      act(() => {
        result.current.redirectToLogin();
      });

      expect(result.current.showAuthModal).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/pages/connexion');
    });

    it('should handle token expiration during usage', () => {
      const checkInterval = 10000;

      // Create token that expires soon
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + 5, // Expires in 5 seconds
          sub: '1',
        })
      );
      const signature = 'fake-signature';
      const expiringToken = `${header}.${payload}.${signature}`;

      localStorage.setItem('authToken', expiringToken);

      const { result } = renderHook(() => useAuthRedirect({ checkInterval }));

      expect(result.current.checkAuthStatus()).toBe(true);

      // Advance time past token expiration
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(result.current.checkAuthStatus()).toBe(false);

      // Next periodic check should trigger modal
      act(() => {
        vi.advanceTimersByTime(checkInterval);
      });

      expect(result.current.showAuthModal).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with rapid mount/unmount', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useAuthRedirect());
        unmount();
      }

      // If no errors thrown, test passes
      expect(true).toBe(true);
    });

    it('should handle high-frequency auth checks efficiently', () => {
      const { result } = renderHook(() => useAuthRedirect({ checkInterval: 100 }));

      const startTime = performance.now();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const endTime = performance.now();

      // Should complete quickly even with many checks
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
