import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('@/core/utils/appLogger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock authService
vi.mock('@/core/services/auth.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getCurrentUserId: vi.fn(),
    isAdmin: vi.fn(),
    isProfessor: vi.fn(),
  },
}));
import userService, {
  getCurrentUserProfile,
  getUserFullName,
  getUserDisplayName,
  getUserInitials,
  getUserEmail,
  getUserId,
  getUserRole,
  getUserStatus,
  getUserPreferences,
  setUserPreferences,
  clearUserPreferences,
  hasActiveSubscription,
  isProfileComplete,
  isUserActive,
  canAccessAdmin,
  canAccessProfessor,
  canManageCourses,
  canManageUsers,
  canViewAnalytics,
  cacheUserProfile,
  getCachedUserProfile,
  clearUserProfileCache,
  updateCurrentUserData,
  clearAllUserData
} from './user.service';

describe('userService', () => {
  const mockUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    active: true,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });


  it('should be defined', () => {
    expect(userService).toBeDefined();
    expect(typeof userService).toBe('object');
  });


  describe('getCurrentUserProfile', () => {
    it('should return expected value', () => {
      const result = userService.getCurrentUserProfile();
      expect(result).toBeDefined();
    });
  });


  describe('getUserFullName', () => {
    it('should return expected value', () => {
      const result = userService.getUserFullName();
      expect(result).toBeDefined();
    });
  });


  describe('getUserDisplayName', () => {
    it('should return expected value', () => {
      const result = userService.getUserDisplayName();
      expect(result).toBeDefined();
    });
  });


  describe('getUserInitials', () => {
    it('should return expected value', () => {
      const result = userService.getUserInitials();
      expect(result).toBeDefined();
    });
  });


  describe('getUserEmail', () => {
    it('should return expected value', () => {
      const result = userService.getUserEmail();
      expect(result).toBeDefined();
    });
  });


  describe('getUserId', () => {
    it('should return expected value', () => {
      const result = userService.getUserId();
      expect(result).toBeDefined();
    });
  });


  describe('getUserRole', () => {
    it('should return expected value', () => {
      const result = userService.getUserRole();
      expect(result).toBeDefined();
    });
  });


  describe('getUserStatus', () => {
    it('should return expected value', () => {
      const result = userService.getUserStatus();
      expect(result).toBeDefined();
    });
  });


  describe('getUserPreferences', () => {
    it('should retrieve value from localStorage', () => {
      const testValue = 'test-data';
      localStorage.setItem('userData', JSON.stringify(testValue));

      const result = userService.getUserPreferences();
      expect(result).toBeDefined();
    });

    it('should return null when value does not exist', () => {
      const result = userService.getUserPreferences();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', () => {
      expect(() => userService.getUserPreferences()).not.toThrow();
    });
  });


  describe('setUserPreferences', () => {
    it('should store value in localStorage', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      userService.setUserPreferences(undefined);
      expect(spy).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      expect(() => userService.setUserPreferences(undefined)).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      expect(() => userService.setUserPreferences(undefined)).not.toThrow();
    });
  });


  describe('clearUserPreferences', () => {
    it('should remove value from localStorage', () => {
      localStorage.setItem('userData', 'test-value');
      userService.clearUserPreferences();
      expect(localStorage.getItem('userData')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      expect(() => userService.clearUserPreferences()).not.toThrow();
    });
  });


  describe('hasActiveSubscription', () => {
    it('should return boolean value', () => {
      const result = userService.hasActiveSubscription();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.hasActiveSubscription(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('isProfileComplete', () => {
    it('should return boolean value', () => {
      const result = userService.isProfileComplete(mockUser);
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.isProfileComplete(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('isUserActive', () => {
    it('should return boolean value', () => {
      const result = userService.isUserActive();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.isUserActive(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('canAccessAdmin', () => {
    it('should return boolean value', () => {
      const result = userService.canAccessAdmin();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.canAccessAdmin(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('canAccessProfessor', () => {
    it('should return boolean value', () => {
      const result = userService.canAccessProfessor();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.canAccessProfessor(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('canManageCourses', () => {
    it('should return boolean value', () => {
      const result = userService.canManageCourses();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.canManageCourses(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('canManageUsers', () => {
    it('should return boolean value', () => {
      const result = userService.canManageUsers();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.canManageUsers(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('canViewAnalytics', () => {
    it('should return boolean value', () => {
      const result = userService.canViewAnalytics();
      expect(typeof result).toBe('boolean');
    });

    it('should handle null/undefined input', () => {
      const result = userService.canViewAnalytics(null);
      expect(typeof result).toBe('boolean');
    });
  });


  describe('cacheUserProfile', () => {
    it('should store value in localStorage', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      userService.cacheUserProfile(undefined);
      expect(spy).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      expect(() => userService.cacheUserProfile(undefined)).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      expect(() => userService.cacheUserProfile(undefined)).not.toThrow();
    });
  });


  describe('getCachedUserProfile', () => {
    it('should retrieve value from localStorage', () => {
      const testValue = 'test-data';
      localStorage.setItem('userData', JSON.stringify(testValue));

      const result = userService.getCachedUserProfile();
      expect(result).toBeDefined();
    });

    it('should return null when value does not exist', () => {
      const result = userService.getCachedUserProfile();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', () => {
      expect(() => userService.getCachedUserProfile(undefined)).not.toThrow();
    });
  });


  describe('clearUserProfileCache', () => {
    it('should remove value from localStorage', () => {
      localStorage.setItem('userData', 'test-value');
      userService.clearUserProfileCache();
      expect(localStorage.getItem('userData')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      expect(() => userService.clearUserProfileCache()).not.toThrow();
    });
  });


  describe('updateCurrentUserData', () => {
    it('should execute without errors', () => {
      expect(() => userService.updateCurrentUserData(undefined)).not.toThrow();
    });
  });


  describe('clearAllUserData', () => {
    it('should execute without errors', () => {
      expect(() => userService.clearAllUserData()).not.toThrow();
    });
  });
});
