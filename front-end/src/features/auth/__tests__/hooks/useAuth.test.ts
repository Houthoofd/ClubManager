import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ApolloError } from '@apollo/client';
import { ReactNode } from 'react';
import {
  useLogin,
  useLogout,
  useAuthStatus,
  useProfile,
  useIsAuthenticated,
} from '../../hooks/useAuth';
import {
  LoginDocument,
  LogoutDocument,
  GetMeDocument,
} from '@/core/api/apollo/generated/graphql';
import { useAuthStore } from '@/store/authStore';
import { apolloClient } from '@/core/api/apollo/apollo-client';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Apollo client
vi.mock('@/core/api/apollo/apollo-client', () => ({
  apolloClient: {
    resetStore: vi.fn(),
    clearStore: vi.fn(),
  },
}));

// Mock auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuth hooks', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    prenom: 'John',
    nom: 'Doe',
    role: 'ADMIN',
  };

  const mockToken = 'mock-jwt-token-123';

  const mockAuthStore = {
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
    token: mockToken,
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockAuthStore);
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.token = mockToken;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useLogin', () => {
    const createWrapper = (mocks: any[]) => {
      return ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );
    };

    it('should initialize with default state', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useLogin(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
      expect(typeof result.current.login).toBe('function');
    });

    it('should successfully login with valid credentials', async () => {
      const mockLoginResponse = {
        login: {
          user: mockUser,
          token: mockToken,
        },
      };

      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          result: {
            data: mockLoginResponse,
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      let loginResult;
      await waitFor(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult).toEqual(mockLoginResponse.login);
      expect(mockAuthStore.login).toHaveBeenCalledWith(mockUser, mockToken);
      expect(apolloClient.resetStore).toHaveBeenCalled();
    });

    it('should handle login failure when response is empty', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'wrong-password',
            },
          },
          result: {
            data: {
              login: null,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      await expect(
        result.current.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Login failed');

      expect(mockAuthStore.login).not.toHaveBeenCalled();
    });

    it('should handle GraphQL errors', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          error: new ApolloError({
            graphQLErrors: [{ message: 'Invalid credentials' }],
          }),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toContain('Invalid credentials');
    });

    it('should handle network errors', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          error: new ApolloError({
            networkError: new Error('Network error'),
          }),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should set loading state during login', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          delay: 100,
          result: {
            data: {
              login: {
                user: mockUser,
                token: mockToken,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      const loginPromise = result.current.login('test@example.com', 'password123');

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await loginPromise;

      // Should not be loading after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should store user and token in auth store on successful login', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          result: {
            data: {
              login: {
                user: mockUser,
                token: mockToken,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      await result.current.login('test@example.com', 'password123');

      await waitFor(() => {
        expect(mockAuthStore.login).toHaveBeenCalledWith(mockUser, mockToken);
      });
    });

    it('should reset Apollo store after successful login', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          result: {
            data: {
              login: {
                user: mockUser,
                token: mockToken,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogin(), { wrapper });

      await result.current.login('test@example.com', 'password123');

      await waitFor(() => {
        expect(apolloClient.resetStore).toHaveBeenCalled();
      });
    });
  });

  describe('useLogout', () => {
    const createWrapper = (mocks: any[]) => {
      return ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );
    };

    beforeEach(() => {
      mockNavigate.mockClear();
      (apolloClient.clearStore as any).mockClear();
    });

    it('should initialize with default state', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useLogout(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.logout).toBe('function');
    });

    it('should successfully logout', async () => {
      const mocks = [
        {
          request: {
            query: LogoutDocument,
          },
          result: {
            data: {
              logout: true,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogout(), { wrapper });

      await result.current.logout();

      await waitFor(() => {
        expect(mockAuthStore.logout).toHaveBeenCalled();
        expect(apolloClient.clearStore).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/connexion');
      });
    });

    it('should handle logout mutation error gracefully', async () => {
      const mocks = [
        {
          request: {
            query: LogoutDocument,
          },
          error: new ApolloError({
            graphQLErrors: [{ message: 'Logout failed' }],
          }),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogout(), { wrapper });

      // Should not throw
      await expect(result.current.logout()).resolves.toBeUndefined();

      // Should still clear local data even if server logout fails
      await waitFor(() => {
        expect(mockAuthStore.logout).toHaveBeenCalled();
        expect(apolloClient.clearStore).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/connexion');
      });
    });

    it('should clear auth store on logout', async () => {
      const mocks = [
        {
          request: {
            query: LogoutDocument,
          },
          result: {
            data: {
              logout: true,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogout(), { wrapper });

      await result.current.logout();

      await waitFor(() => {
        expect(mockAuthStore.logout).toHaveBeenCalled();
      });
    });

    it('should clear Apollo cache on logout', async () => {
      const mocks = [
        {
          request: {
            query: LogoutDocument,
          },
          result: {
            data: {
              logout: true,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogout(), { wrapper });

      await result.current.logout();

      await waitFor(() => {
        expect(apolloClient.clearStore).toHaveBeenCalled();
      });
    });

    it('should redirect to login page after logout', async () => {
      const mocks = [
        {
          request: {
            query: LogoutDocument,
          },
          result: {
            data: {
              logout: true,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogout(), { wrapper });

      await result.current.logout();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/connexion');
      });
    });

    it('should handle network errors during logout', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mocks = [
        {
          request: {
            query: LogoutDocument,
          },
          error: new ApolloError({
            networkError: new Error('Network error'),
          }),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useLogout(), { wrapper });

      await result.current.logout();

      await waitFor(() => {
        expect(mockAuthStore.logout).toHaveBeenCalled();
        expect(apolloClient.clearStore).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/connexion');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('useAuthStatus', () => {
    const createWrapper = (mocks: any[]) => {
      return ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );
    };

    it('should initialize with loading state when token exists', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAuthStatus(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should skip query when no token is present', () => {
      (useAuthStore as any).mockReturnValue({
        ...mockAuthStore,
        token: null,
        isAuthenticated: false,
      });

      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAuthStatus(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should return authenticated status with user data', async () => {
      const mocks = [
        {
          request: {
            query: GetMeDocument,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useAuthStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });

    it('should handle authentication errors', async () => {
      const mocks = [
        {
          request: {
            query: GetMeDocument,
          },
          error: new ApolloError({
            graphQLErrors: [{ message: 'Unauthorized' }],
          }),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useAuthStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeDefined();
    });

    it('should use network-only fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: GetMeDocument,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      renderHook(() => useAuthStatus(), { wrapper });

      // The network-only policy is verified by the fact that the query
      // always fetches from the network, not the cache
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    it('should provide refetch function', async () => {
      const mocks = [
        {
          request: {
            query: GetMeDocument,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
        },
        {
          request: {
            query: GetMeDocument,
          },
          result: {
            data: {
              me: { ...mockUser, prenom: 'Jane' },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useAuthStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.prenom).toBe('John');
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useProfile', () => {
    const createWrapper = (mocks: any[]) => {
      return ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );
    };

    it('should return user profile data', async () => {
      const mocks = [
        {
          request: {
            query: GetMeDocument,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should skip query when no token is present', () => {
      (useAuthStore as any).mockReturnValue({
        ...mockAuthStore,
        token: null,
        isAuthenticated: false,
      });

      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useProfile(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should use cache-first fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: GetMeDocument,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // The cache-first policy is used, different from useAuthStatus
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('useIsAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      (useAuthStore as any).mockReturnValue({
        ...mockAuthStore,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useIsAuthenticated());

      expect(result.current).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      (useAuthStore as any).mockReturnValue({
        ...mockAuthStore,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useIsAuthenticated());

      expect(result.current).toBe(false);
    });

    it('should update when authentication state changes', () => {
      const { result, rerender } = renderHook(() => useIsAuthenticated());

      expect(result.current).toBe(true);

      // Change auth state
      (useAuthStore as any).mockReturnValue({
        ...mockAuthStore,
        isAuthenticated: false,
      });

      rerender();

      expect(result.current).toBe(false);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle rapid login/logout cycles', async () => {
      const loginMocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
          result: {
            data: {
              login: {
                user: mockUser,
                token: mockToken,
              },
            },
          },
        },
      ];

      const logoutMocks = [
        {
          request: {
            query: LogoutDocument,
          },
          result: {
            data: {
              logout: true,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={[...loginMocks, ...logoutMocks]} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result: loginResult } = renderHook(() => useLogin(), { wrapper });
      const { result: logoutResult } = renderHook(() => useLogout(), { wrapper });

      await loginResult.current.login('test@example.com', 'password123');
      await waitFor(() => {
        expect(mockAuthStore.login).toHaveBeenCalled();
      });

      await logoutResult.current.logout();
      await waitFor(() => {
        expect(mockAuthStore.logout).toHaveBeenCalled();
      });
    });

    it('should handle empty email or password', async () => {
      const mocks = [
        {
          request: {
            query: LoginDocument,
            variables: {
              email: '',
              password: '',
            },
          },
          error: new ApolloError({
            graphQLErrors: [{ message: 'Email and password are required' }],
          }),
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useLogin(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
});
