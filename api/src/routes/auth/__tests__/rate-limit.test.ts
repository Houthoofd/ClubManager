/**
 * Tests for Rate Limiting Service and Middleware
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  RateLimitService,
  getRateLimitService,
  resetRateLimitService,
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
} from '../core/services/rate-limit.service.js';
import {
  withRateLimit,
  withLoginRateLimit,
  withPasswordResetRateLimit,
  RateLimitMiddleware,
} from '../core/middleware/rate-limit.middleware.js';
import { RateLimitError } from '../core/errors/auth.errors.js';
import { RATE_LIMIT_CONFIG } from '../core/config/auth.config.js';

// ============================================================================
// Test Setup
// ============================================================================

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    // Créer une nouvelle instance pour chaque test
    service = new RateLimitService('memory');
  });

  afterEach(() => {
    // Nettoyer après chaque test
    service.destroy();
    resetRateLimitService();
  });

  // ==========================================================================
  // Basic Functionality
  // ==========================================================================

  describe('checkLimit', () => {
    it('should allow first request', async () => {
      const result = await service.checkLimit('user123', 'login');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMIT_CONFIG.login.maxAttempts - 1);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should track multiple requests', async () => {
      // Première requête
      const result1 = await service.checkLimit('user123', 'login');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4); // 5 max - 1

      // Deuxième requête
      const result2 = await service.checkLimit('user123', 'login');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3); // 5 max - 2
    });

    it('should block after exceeding limit', async () => {
      const maxAttempts = RATE_LIMIT_CONFIG.login.maxAttempts;

      // Faire le nombre maximum de requêtes
      for (let i = 0; i < maxAttempts; i++) {
        const result = await service.checkLimit('user123', 'login');
        expect(result.allowed).toBe(true);
      }

      // La prochaine devrait être bloquée
      const blockedResult = await service.checkLimit('user123', 'login');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.blockedUntil).toBeInstanceOf(Date);
    });

    it('should isolate different identifiers', async () => {
      // User1 fait 5 requêtes
      for (let i = 0; i < 5; i++) {
        await service.checkLimit('user1', 'login');
      }

      // User1 est bloqué
      const result1 = await service.checkLimit('user1', 'login');
      expect(result1.allowed).toBe(false);

      // User2 devrait toujours pouvoir faire des requêtes
      const result2 = await service.checkLimit('user2', 'login');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });

    it('should isolate different actions', async () => {
      // Faire 5 login attempts
      for (let i = 0; i < 5; i++) {
        await service.checkLimit('user123', 'login');
      }

      // Login bloqué
      const loginResult = await service.checkLimit('user123', 'login');
      expect(loginResult.allowed).toBe(false);

      // Password reset devrait toujours être permis
      const resetResult = await service.checkLimit('user123', 'passwordReset');
      expect(resetResult.allowed).toBe(true);
    });

    it('should reset after window expires', async () => {
      // Utiliser une règle personnalisée avec une petite fenêtre pour tester
      const customRule = {
        windowMs: 100, // 100ms
        maxAttempts: 2,
      };

      // Faire 2 requêtes
      await service.checkLimit('user123', 'login', customRule);
      await service.checkLimit('user123', 'login', customRule);

      // La 3ème est bloquée
      const blocked = await service.checkLimit('user123', 'login', customRule);
      expect(blocked.allowed).toBe(false);

      // Attendre que la fenêtre expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Devrait être autorisé maintenant
      const allowed = await service.checkLimit('user123', 'login', customRule);
      expect(allowed.allowed).toBe(true);
      expect(allowed.remaining).toBe(1);
    });
  });

  // ==========================================================================
  // Reset and Management
  // ==========================================================================

  describe('reset', () => {
    it('should reset counter for identifier', async () => {
      // Faire plusieurs requêtes
      await service.checkLimit('user123', 'login');
      await service.checkLimit('user123', 'login');
      await service.checkLimit('user123', 'login');

      // Vérifier qu'il reste 2
      const before = await service.checkLimit('user123', 'login');
      expect(before.remaining).toBe(1);

      // Reset
      await service.reset('user123', 'login');

      // Devrait repartir de zéro
      const after = await service.checkLimit('user123', 'login');
      expect(after.remaining).toBe(4);
    });
  });

  describe('getStatus', () => {
    it('should return null if no entry exists', async () => {
      const status = await service.getStatus('user123', 'login');
      expect(status).toBeNull();
    });

    it('should return current status without incrementing', async () => {
      // Faire une requête
      await service.checkLimit('user123', 'login');

      // Obtenir le statut plusieurs fois
      const status1 = await service.getStatus('user123', 'login');
      const status2 = await service.getStatus('user123', 'login');

      expect(status1?.remaining).toBe(4);
      expect(status2?.remaining).toBe(4); // Pas changé

      // Vérifier qu'une vraie requête incrémente
      const check = await service.checkLimit('user123', 'login');
      expect(check.remaining).toBe(3);
    });

    it('should show blocked status', async () => {
      // Bloquer l'utilisateur
      for (let i = 0; i < 6; i++) {
        await service.checkLimit('user123', 'login');
      }

      const status = await service.getStatus('user123', 'login');
      expect(status?.allowed).toBe(false);
      expect(status?.blockedUntil).toBeInstanceOf(Date);
    });
  });

  describe('block and unblock', () => {
    it('should manually block an identifier', async () => {
      // Bloquer pour 1 seconde
      await service.block('user123', 'login', 1000);

      // Vérifier que c'est bloqué
      const result = await service.checkLimit('user123', 'login');
      expect(result.allowed).toBe(false);
      expect(result.blockedUntil).toBeInstanceOf(Date);
    });

    it('should manually unblock an identifier', async () => {
      // Bloquer
      await service.block('user123', 'login', 5000);

      // Vérifier bloqué
      const blocked = await service.checkLimit('user123', 'login');
      expect(blocked.allowed).toBe(false);

      // Débloquer
      await service.unblock('user123', 'login');

      // Vérifier débloqué
      const unblocked = await service.checkLimit('user123', 'login');
      expect(unblocked.allowed).toBe(true);
    });
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  describe('Helper functions', () => {
    beforeEach(() => {
      resetRateLimitService();
    });

    it('checkLoginRateLimit should work', async () => {
      const result = await checkLoginRateLimit('test@example.com');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('checkPasswordResetRateLimit should work', async () => {
      const result = await checkPasswordResetRateLimit('test@example.com');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // passwordReset a max 3
    });

    it('should use singleton instance', () => {
      const instance1 = getRateLimitService();
      const instance2 = getRateLimitService();
      expect(instance1).toBe(instance2);
    });
  });
});

// ============================================================================
// Rate Limit Middleware Tests
// ============================================================================

describe('RateLimitMiddleware', () => {
  let mockResolver: jest.Mock;

  beforeEach(() => {
    resetRateLimitService();
    mockResolver = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    resetRateLimitService();
  });

  // ==========================================================================
  // withRateLimit
  // ==========================================================================

  describe('withRateLimit', () => {
    it('should allow request within limit', async () => {
      const wrappedResolver = withRateLimit({
        action: 'login',
        identifierStrategy: 'email',
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      const result = await wrappedResolver(
        {},
        { email: 'test@example.com' },
        context,
        {}
      );

      expect(result).toEqual({ success: true });
      expect(mockResolver).toHaveBeenCalledTimes(1);
    });

    it('should block request after exceeding limit', async () => {
      const wrappedResolver = withRateLimit({
        action: 'login',
        identifierStrategy: 'email',
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };
      const args = { email: 'test@example.com' };

      // Faire le maximum de requêtes
      for (let i = 0; i < RATE_LIMIT_CONFIG.login.maxAttempts; i++) {
        await wrappedResolver({}, args, context, {});
      }

      // La prochaine devrait être bloquée
      await expect(wrappedResolver({}, args, context, {})).rejects.toThrow(
        RateLimitError
      );

      // Le resolver original ne devrait pas avoir été appelé la dernière fois
      expect(mockResolver).toHaveBeenCalledTimes(
        RATE_LIMIT_CONFIG.login.maxAttempts
      );
    });

    it('should extract identifier from email in args', async () => {
      const wrappedResolver = withRateLimit({
        action: 'passwordReset',
        identifierStrategy: 'email',
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await wrappedResolver({}, { email: 'user@test.com' }, context, {});
      await wrappedResolver({}, { email: 'user@test.com' }, context, {});

      const result = await getRateLimitService().getStatus(
        'email:user@test.com',
        'passwordReset'
      );

      expect(result?.remaining).toBe(1); // 3 max, 2 utilisés
    });

    it('should extract identifier from nested input.email', async () => {
      const wrappedResolver = withRateLimit({
        action: 'login',
        identifierStrategy: 'email',
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await wrappedResolver(
        {},
        { input: { email: 'nested@test.com' } },
        context,
        {}
      );

      const result = await getRateLimitService().getStatus(
        'email:nested@test.com',
        'login'
      );

      expect(result?.remaining).toBe(4);
    });

    it('should extract identifier from IP', async () => {
      const wrappedResolver = withRateLimit({
        action: 'registration',
        identifierStrategy: 'ip',
      })(mockResolver);

      const context = {
        req: { ip: '192.168.1.100' },
      };

      await wrappedResolver({}, {}, context, {});

      const result = await getRateLimitService().getStatus(
        'ip:192.168.1.100',
        'registration'
      );

      expect(result?.remaining).toBe(2); // registration max 3
    });

    it('should extract identifier from userId', async () => {
      const wrappedResolver = withRateLimit({
        action: 'refreshToken',
        identifierStrategy: 'userId',
      })(mockResolver);

      const context = {
        user: { id: 42, email: 'user@test.com' },
        req: { ip: '127.0.0.1' },
      };

      await wrappedResolver({}, {}, context, {});

      const result = await getRateLimitService().getStatus(
        'user:42',
        'refreshToken'
      );

      expect(result?.remaining).toBe(19); // refreshToken max 20
    });

    it('should use custom identifier function', async () => {
      const wrappedResolver = withRateLimit({
        action: 'general',
        identifierStrategy: 'custom',
        getIdentifier: async (parent, args, context) => {
          return `custom:${args.customId}`;
        },
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await wrappedResolver({}, { customId: 'special123' }, context, {});

      const result = await getRateLimitService().getStatus(
        'custom:special123',
        'general'
      );

      expect(result?.remaining).toBe(99); // general max 100
    });

    it('should handle X-Forwarded-For header', async () => {
      const wrappedResolver = withRateLimit({
        action: 'login',
        identifierStrategy: 'ip',
      })(mockResolver);

      const context = {
        req: {
          ip: '10.0.0.1',
          headers: {
            'x-forwarded-for': '203.0.113.45, 198.51.100.178',
          },
        },
      };

      await wrappedResolver({}, {}, context, {});

      // Devrait utiliser la première IP de X-Forwarded-For
      const result = await getRateLimitService().getStatus(
        'ip:203.0.113.45',
        'login'
      );

      expect(result?.remaining).toBe(4);
    });
  });

  // ==========================================================================
  // Preconfigured Middleware
  // ==========================================================================

  describe('Preconfigured middleware', () => {
    it('withLoginRateLimit should work', async () => {
      const wrappedResolver = withLoginRateLimit()(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await wrappedResolver({}, { email: 'test@example.com' }, context, {});
      expect(mockResolver).toHaveBeenCalled();
    });

    it('withPasswordResetRateLimit should work', async () => {
      const wrappedResolver = withPasswordResetRateLimit()(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await wrappedResolver({}, { email: 'test@example.com' }, context, {});
      expect(mockResolver).toHaveBeenCalled();
    });

    it('should throw RateLimitError with proper details', async () => {
      const wrappedResolver = withLoginRateLimit()(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };
      const args = { email: 'test@example.com' };

      // Épuiser les tentatives
      for (let i = 0; i < RATE_LIMIT_CONFIG.login.maxAttempts; i++) {
        await wrappedResolver({}, args, context, {});
      }

      // Tenter une fois de plus
      try {
        await wrappedResolver({}, args, context, {});
        fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.extensions.code).toBe('RATE_LIMIT_EXCEEDED');
          expect(error.extensions.identifier).toBe('email:test@example.com');
          expect(error.extensions.action).toBe('login');
          expect(error.extensions.resetAt).toBeInstanceOf(Date);
        }
      }
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error handling', () => {
    it('should throw if email not provided for email strategy', async () => {
      const wrappedResolver = withRateLimit({
        action: 'login',
        identifierStrategy: 'email',
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await expect(wrappedResolver({}, {}, context, {})).rejects.toThrow(
        'Email not provided'
      );
    });

    it('should throw if user not authenticated for userId strategy', async () => {
      const wrappedResolver = withRateLimit({
        action: 'refreshToken',
        identifierStrategy: 'userId',
      })(mockResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await expect(wrappedResolver({}, {}, context, {})).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should propagate non-RateLimitError errors', async () => {
      const errorResolver = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const wrappedResolver = withLoginRateLimit()(errorResolver);

      const context = {
        req: { ip: '127.0.0.1' },
      };

      await expect(
        wrappedResolver({}, { email: 'test@example.com' }, context, {})
      ).rejects.toThrow('Database error');
    });
  });
});
