import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authService } from './auth.service';

describe('authService', () => {
  

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  
  describe('setAuthToken', () => {
    it('should execute without errors', async () => {
      expect(authService.setAuthToken())..toBeDefined();
    });
  });

  describe('getAuthToken', () => {
    it('should execute without errors', async () => {
      expect(authService.getAuthToken())..toBeDefined();
    });
  });

  describe('removeAuthToken', () => {
    it('should execute without errors', async () => {
      expect(authService.removeAuthToken())..toBeDefined();
    });
  });

  describe('setRefreshToken', () => {
    it('should execute without errors', async () => {
      expect(authService.setRefreshToken())..toBeDefined();
    });
  });

  describe('getRefreshToken', () => {
    it('should execute without errors', async () => {
      expect(authService.getRefreshToken())..toBeDefined();
    });
  });

  describe('removeRefreshToken', () => {
    it('should execute without errors', async () => {
      expect(authService.removeRefreshToken())..toBeDefined();
    });
  });

  describe('setUserData', () => {
    it('should execute without errors', async () => {
      expect(authService.setUserData())..toBeDefined();
    });
  });

  describe('getUserData', () => {
    it('should execute without errors', async () => {
      expect(authService.getUserData())..toBeDefined();
    });
  });

  describe('removeUserData', () => {
    it('should execute without errors', async () => {
      expect(authService.removeUserData())..toBeDefined();
    });
  });

  describe('setAuthSession', () => {
    it('should execute without errors', async () => {
      expect(authService.setAuthSession())..toBeDefined();
    });
  });

  describe('getAuthSession', () => {
    it('should execute without errors', async () => {
      expect(authService.getAuthSession())..toBeDefined();
    });
  });

  describe('clearAuthSession', () => {
    it('should execute without errors', async () => {
      expect(authService.clearAuthSession())..toBeDefined();
    });
  });

  describe('isAuthenticated', () => {
    it('should execute without errors', async () => {
      expect(authService.isAuthenticated())..toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should execute without errors', async () => {
      expect(authService.getCurrentUser())..toBeDefined();
    });
  });

  describe('getCurrentUserId', () => {
    it('should execute without errors', async () => {
      expect(authService.getCurrentUserId())..toBeDefined();
    });
  });

  describe('hasRole', () => {
    it('should execute without errors', async () => {
      expect(authService.hasRole())..toBeDefined();
    });
  });

  describe('isAdmin', () => {
    it('should execute without errors', async () => {
      expect(authService.isAdmin())..toBeDefined();
    });
  });

  describe('isProfessor', () => {
    it('should execute without errors', async () => {
      expect(authService.isProfessor())..toBeDefined();
    });
  });

  describe('logout', () => {
    it('should execute without errors', async () => {
      expect(authService.logout())..toBeDefined();
    });
  });

  describe('getRedirectPath', () => {
    it('should execute without errors', async () => {
      expect(authService.getRedirectPath())..toBeDefined();
    });
  });

  describe('isTokenExpired', () => {
    it('should execute without errors', async () => {
      expect(authService.isTokenExpired())..toBeDefined();
    });
  });
});
