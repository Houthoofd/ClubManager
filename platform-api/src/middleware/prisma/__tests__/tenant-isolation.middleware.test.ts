import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  tenantIsolationMiddleware,
  setCurrentTenantId,
  getCurrentTenantId,
  clearCurrentTenantId,
  withTenantContext,
  withoutTenantIsolation,
} from '../tenant-isolation.middleware.js';

describe('Tenant Isolation Middleware', () => {
  beforeEach(() => {
    clearCurrentTenantId();
  });

  afterEach(() => {
    clearCurrentTenantId();
  });

  describe('Tenant Context Management', () => {
    it('should set and get current tenant ID', () => {
      const tenantId = 'tenant-123';
      setCurrentTenantId(tenantId);
      expect(getCurrentTenantId()).toBe(tenantId);
    });

    it('should clear current tenant ID', () => {
      setCurrentTenantId('tenant-123');
      expect(getCurrentTenantId()).toBe('tenant-123');
      clearCurrentTenantId();
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should return null when no tenant ID is set', () => {
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should override previous tenant ID', () => {
      setCurrentTenantId('tenant-1');
      expect(getCurrentTenantId()).toBe('tenant-1');
      setCurrentTenantId('tenant-2');
      expect(getCurrentTenantId()).toBe('tenant-2');
    });
  });

  describe('Middleware - Security Validation', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
    });

    it('should block queries on tenant-isolated models without tenant context', async () => {
      clearCurrentTenantId();

      const params = {
        model: 'User',
        action: 'findMany',
        args: { where: {} },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to access User without tenant context'
      );
    });

    it('should allow queries on non-isolated models without tenant context', async () => {
      clearCurrentTenantId();

      const params = {
        model: 'Genre',
        action: 'findMany',
        args: { where: {} },
      };

      await middleware(params, mockNext);
      expect(mockNext).toHaveBeenCalledWith(params);
    });

    it('should allow queries without model specified', async () => {
      clearCurrentTenantId();

      const params = {
        model: null,
        action: 'executeRaw',
        args: {},
      };

      await middleware(params, mockNext);
      expect(mockNext).toHaveBeenCalledWith(params);
    });
  });

  describe('Middleware - READ Operations (findMany, findFirst, findUnique)', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    it('should add tenantId filter to findMany query', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: { where: {} },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'findMany',
        args: {
          where: { tenantId: 'tenant-123' },
        },
      });
    });

    it('should add tenantId filter to findFirst query', async () => {
      const params = {
        model: 'User',
        action: 'findFirst',
        args: { where: { email: 'test@example.com' } },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'findFirst',
        args: {
          where: { email: 'test@example.com', tenantId: 'tenant-123' },
        },
      });
    });

    it('should add tenantId filter to findUnique query', async () => {
      const params = {
        model: 'User',
        action: 'findUnique',
        args: { where: { id: 1 } },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'findUnique',
        args: {
          where: { id: 1, tenantId: 'tenant-123' },
        },
      });
    });

    it('should add tenantId filter to count query', async () => {
      const params = {
        model: 'User',
        action: 'count',
        args: { where: {} },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'count',
        args: {
          where: { tenantId: 'tenant-123' },
        },
      });
    });

    it('should add tenantId filter to aggregate query', async () => {
      const params = {
        model: 'Paiement',
        action: 'aggregate',
        args: { where: {}, _sum: { montant: true } },
      };

      await middleware(params, mockNext);

      expect(params.args.where.tenantId).toBe('tenant-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should add tenantId filter to groupBy query', async () => {
      const params = {
        model: 'User',
        action: 'groupBy',
        args: { by: ['statusId'], where: {} },
      };

      await middleware(params, mockNext);

      expect(params.args.where.tenantId).toBe('tenant-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should preserve existing where conditions when adding tenantId', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: {
          where: {
            actif: true,
            email: { contains: '@example.com' },
          },
        },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'findMany',
        args: {
          where: {
            actif: true,
            email: { contains: '@example.com' },
            tenantId: 'tenant-123',
          },
        },
      });
    });

    it('should throw error if trying to access different tenant data', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: { where: { tenantId: 'different-tenant' } },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to access User from tenant different-tenant while authenticated as tenant tenant-123'
      );
    });
  });

  describe('Middleware - CREATE Operations', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    it('should add tenantId to create data', async () => {
      const params = {
        model: 'User',
        action: 'create',
        args: {
          data: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'create',
        args: {
          data: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            tenantId: 'tenant-123',
          },
        },
      });
    });

    it('should throw error if trying to create for different tenant', async () => {
      const params = {
        model: 'User',
        action: 'create',
        args: {
          data: {
            email: 'test@example.com',
            tenantId: 'different-tenant',
          },
        },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to create User for tenant different-tenant while authenticated as tenant tenant-123'
      );
    });

    it('should add tenantId to createMany data', async () => {
      const params = {
        model: 'User',
        action: 'createMany',
        args: {
          data: [
            { email: 'user1@example.com', firstName: 'User', lastName: 'One' },
            { email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
          ],
        },
      };

      await middleware(params, mockNext);

      expect(params.args.data[0].tenantId).toBe('tenant-123');
      expect(params.args.data[1].tenantId).toBe('tenant-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if createMany contains different tenant', async () => {
      const params = {
        model: 'User',
        action: 'createMany',
        args: {
          data: [
            { email: 'user1@example.com', tenantId: 'tenant-123' },
            { email: 'user2@example.com', tenantId: 'different-tenant' },
          ],
        },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to create User for tenant different-tenant while authenticated as tenant tenant-123'
      );
    });
  });

  describe('Middleware - UPDATE Operations', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    it('should add tenantId filter to update where clause', async () => {
      const params = {
        model: 'User',
        action: 'update',
        args: {
          where: { id: 1 },
          data: { actif: false },
        },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'update',
        args: {
          where: { id: 1, tenantId: 'tenant-123' },
          data: { actif: false },
        },
      });
    });

    it('should add tenantId filter to updateMany where clause', async () => {
      const params = {
        model: 'User',
        action: 'updateMany',
        args: {
          where: { actif: true },
          data: { statusId: 2 },
        },
      };

      await middleware(params, mockNext);

      expect(params.args.where.tenantId).toBe('tenant-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if trying to update different tenant data', async () => {
      const params = {
        model: 'User',
        action: 'update',
        args: {
          where: { id: 1, tenantId: 'different-tenant' },
          data: { actif: false },
        },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to update User from tenant different-tenant while authenticated as tenant tenant-123'
      );
    });

    it('should prevent changing tenantId in update data', async () => {
      const params = {
        model: 'User',
        action: 'update',
        args: {
          where: { id: 1 },
          data: { tenantId: 'different-tenant' },
        },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to change tenantId on User. This is not allowed.'
      );
    });
  });

  describe('Middleware - DELETE Operations', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    it('should add tenantId filter to delete where clause', async () => {
      const params = {
        model: 'User',
        action: 'delete',
        args: { where: { id: 1 } },
      };

      await middleware(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith({
        model: 'User',
        action: 'delete',
        args: {
          where: { id: 1, tenantId: 'tenant-123' },
        },
      });
    });

    it('should add tenantId filter to deleteMany where clause', async () => {
      const params = {
        model: 'User',
        action: 'deleteMany',
        args: { where: { actif: false } },
      };

      await middleware(params, mockNext);

      expect(params.args.where.tenantId).toBe('tenant-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if trying to delete different tenant data', async () => {
      const params = {
        model: 'User',
        action: 'delete',
        args: { where: { id: 1, tenantId: 'different-tenant' } },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to delete User from tenant different-tenant while authenticated as tenant tenant-123'
      );
    });
  });

  describe('Middleware - UPSERT Operations', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    it('should add tenantId to upsert where, create, and validate update', async () => {
      const params = {
        model: 'User',
        action: 'upsert',
        args: {
          where: { email: 'test@example.com' },
          create: { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
          update: { actif: true },
        },
      };

      await middleware(params, mockNext);

      expect(params.args.where.tenantId).toBe('tenant-123');
      expect(params.args.create.tenantId).toBe('tenant-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if trying to create for different tenant in upsert', async () => {
      const params = {
        model: 'User',
        action: 'upsert',
        args: {
          where: { email: 'test@example.com' },
          create: { email: 'test@example.com', tenantId: 'different-tenant' },
          update: { actif: true },
        },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to upsert User for tenant different-tenant while authenticated as tenant tenant-123'
      );
    });

    it('should throw error if trying to change tenantId in upsert update', async () => {
      const params = {
        model: 'User',
        action: 'upsert',
        args: {
          where: { email: 'test@example.com' },
          create: { email: 'test@example.com' },
          update: { tenantId: 'different-tenant' },
        },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow(
        'SECURITY: Attempted to change tenantId on User during upsert. This is not allowed.'
      );
    });
  });

  describe('Middleware - Tenant Isolated Models', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    const isolatedModels = [
      'User',
      'Cours',
      'Paiement',
      'EcheancePaiement',
      'Article',
      'Commande',
      'Message',
      'Notification',
      'Groupe',
      'AlerteUtilisateur',
      'AuditLog',
    ];

    isolatedModels.forEach((model) => {
      it(`should enforce tenant isolation for ${model}`, async () => {
        const params = {
          model,
          action: 'findMany',
          args: { where: {} },
        };

        await middleware(params, mockNext);

        expect(params.args.where.tenantId).toBe('tenant-123');
      });
    });

    const sharedModels = ['Genre', 'Status', 'Grade', 'PlanTarifaire', 'Taille', 'AlerteType'];

    sharedModels.forEach((model) => {
      it(`should NOT enforce tenant isolation for ${model}`, async () => {
        const params = {
          model,
          action: 'findMany',
          args: { where: {} },
        };

        await middleware(params, mockNext);

        expect(params.args.where.tenantId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('withTenantContext - Context Wrapper', () => {
    it('should execute function with tenant context', async () => {
      const result = await withTenantContext('tenant-456', async () => {
        expect(getCurrentTenantId()).toBe('tenant-456');
        return 'success';
      });

      expect(result).toBe('success');
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should restore previous tenant context after execution', async () => {
      setCurrentTenantId('tenant-123');

      await withTenantContext('tenant-456', async () => {
        expect(getCurrentTenantId()).toBe('tenant-456');
      });

      expect(getCurrentTenantId()).toBe('tenant-123');
    });

    it('should restore context even if function throws', async () => {
      setCurrentTenantId('tenant-123');

      await expect(
        withTenantContext('tenant-456', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(getCurrentTenantId()).toBe('tenant-123');
    });

    it('should handle nested tenant contexts', async () => {
      const result = await withTenantContext('tenant-1', async () => {
        expect(getCurrentTenantId()).toBe('tenant-1');

        return await withTenantContext('tenant-2', async () => {
          expect(getCurrentTenantId()).toBe('tenant-2');
          return 'nested';
        });
      });

      expect(result).toBe('nested');
      expect(getCurrentTenantId()).toBeNull();
    });
  });

  describe('withoutTenantIsolation - Bypass Wrapper', () => {
    it('should execute function without tenant context', async () => {
      setCurrentTenantId('tenant-123');

      const result = await withoutTenantIsolation(async () => {
        expect(getCurrentTenantId()).toBeNull();
        return 'bypassed';
      });

      expect(result).toBe('bypassed');
      expect(getCurrentTenantId()).toBe('tenant-123');
    });

    it('should restore tenant context after execution', async () => {
      setCurrentTenantId('tenant-123');

      await withoutTenantIsolation(async () => {
        expect(getCurrentTenantId()).toBeNull();
      });

      expect(getCurrentTenantId()).toBe('tenant-123');
    });

    it('should restore context even if function throws', async () => {
      setCurrentTenantId('tenant-123');

      await expect(
        withoutTenantIsolation(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(getCurrentTenantId()).toBe('tenant-123');
    });

    it('should clear context if no previous context existed', async () => {
      clearCurrentTenantId();

      await withoutTenantIsolation(async () => {
        expect(getCurrentTenantId()).toBeNull();
      });

      expect(getCurrentTenantId()).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const middleware = tenantIsolationMiddleware();
    const mockNext = jest.fn((params: any) => Promise.resolve({ result: 'success' }));

    beforeEach(() => {
      mockNext.mockClear();
      setCurrentTenantId('tenant-123');
    });

    it('should handle empty args object', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: undefined,
      };

      await middleware(params, mockNext);

      expect(params.args).toBeDefined();
      expect(params.args.where.tenantId).toBe('tenant-123');
    });

    it('should handle empty where clause', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: { where: undefined },
      };

      await middleware(params, mockNext);

      expect(params.args.where).toBeDefined();
      expect(params.args.where.tenantId).toBe('tenant-123');
    });

    it('should handle null tenantId in where (not explicitly different)', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: { where: { tenantId: null } },
      };

      await expect(middleware(params, mockNext)).rejects.toThrow('SECURITY');
    });

    it('should handle complex nested where conditions', async () => {
      const params = {
        model: 'User',
        action: 'findMany',
        args: {
          where: {
            OR: [{ email: { contains: 'test' } }, { firstName: { contains: 'john' } }],
            AND: [{ actif: true }],
          },
        },
      };

      await middleware(params, mockNext);

      expect(params.args.where.tenantId).toBe('tenant-123');
      expect(params.args.where.OR).toBeDefined();
      expect(params.args.where.AND).toBeDefined();
    });

    it('should handle empty array in createMany', async () => {
      const params = {
        model: 'User',
        action: 'createMany',
        args: { data: [] },
      };

      await middleware(params, mockNext);

      expect(params.args.data).toEqual([]);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Performance and Consistency', () => {
    it('should maintain tenant context across multiple operations', async () => {
      setCurrentTenantId('tenant-999');

      for (let i = 0; i < 100; i++) {
        expect(getCurrentTenantId()).toBe('tenant-999');
      }
    });

    it('should handle rapid tenant context changes', async () => {
      for (let i = 0; i < 100; i++) {
        setCurrentTenantId(`tenant-${i}`);
        expect(getCurrentTenantId()).toBe(`tenant-${i}`);
      }
    });

    it('should not leak tenant context between async operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        withTenantContext(`tenant-${i}`, async () => {
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
          return getCurrentTenantId();
        })
      );

      const results = await Promise.all(operations);

      // After all operations, context should be cleared
      expect(getCurrentTenantId()).toBeNull();
    });
  });
});
