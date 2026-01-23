import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from 'express';
import {
  setTenantContext,
  clearTenantContext,
  allowCrossTenantAccess,
  forceTenantContext,
} from '../tenant-context.middleware.js';
import {
  getCurrentTenantId,
  clearCurrentTenantId,
} from '../prisma/tenant-isolation.middleware.js';
import { tenantCacheService } from '../../cache/tenant-cache.service.js';
import { prisma } from '../../db/prisma.client.js';

jest.mock('../../cache/tenant-cache.service.js');
jest.mock('../../db/prisma.client.js');

describe('Tenant Context Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    clearCurrentTenantId();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      get: jest.fn(),
      path: '/api/users',
      cookies: {},
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      on: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearCurrentTenantId();
  });

  describe('setTenantContext - Tenant Extraction', () => {
    it('should extract tenant from X-Tenant-ID header', async () => {
      const middleware = setTenantContext();
      const tenantId = 'tenant-header-123';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID' || header === 'x-tenant-id') {
          return tenantId;
        }
        return undefined;
      });

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: tenantId,
        name: 'Test Tenant',
        slug: 'test',
        status: 'ACTIVE',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).tenantId).toBe(tenantId);
      expect(getCurrentTenantId()).toBe(tenantId);
    });

    it('should extract tenant from JWT user in request', async () => {
      const middleware = setTenantContext();
      const tenantId = 'tenant-jwt-456';

      (mockRequest as any).user = { tenantId };
      (mockRequest.get as any).mockReturnValue(undefined);

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: tenantId,
        name: 'JWT Tenant',
        slug: 'jwt',
        status: 'ACTIVE',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).tenantId).toBe(tenantId);
      expect(getCurrentTenantId()).toBe(tenantId);
    });

    it('should extract tenant from subdomain', async () => {
      const middleware = setTenantContext();
      const slug = 'myclub';
      const tenantId = 'tenant-subdomain-789';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'host') {
          return `${slug}.clubmanager.com`;
        }
        return undefined;
      });

      jest.mocked(tenantCacheService.getTenantBySlug).mockResolvedValue({
        id: tenantId,
        name: 'My Club',
        slug,
        status: 'ACTIVE',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).tenantId).toBe(tenantId);
      expect(getCurrentTenantId()).toBe(tenantId);
    });

    it('should ignore reserved subdomains (www, api, admin)', async () => {
      const middleware = setTenantContext();

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'host') {
          return 'www.clubmanager.com';
        }
        return undefined;
      });

      mockRequest.path = '/health';

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should prioritize X-Tenant-ID header over other methods', async () => {
      const middleware = setTenantContext();
      const headerTenantId = 'tenant-header';
      const jwtTenantId = 'tenant-jwt';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return headerTenantId;
        if (header === 'host') return 'subdomain.clubmanager.com';
        return undefined;
      });

      (mockRequest as any).user = { tenantId: jwtTenantId };

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: headerTenantId,
        name: 'Header Tenant',
        slug: 'header',
        status: 'ACTIVE',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe(headerTenantId);
      expect(getCurrentTenantId()).toBe(headerTenantId);
    });
  });

  describe('setTenantContext - Public Routes', () => {
    const publicRoutes = [
      '/health',
      '/api/health',
      '/webhooks/stripe',
      '/api/webhooks/stripe',
      '/api/tenant/signup',
      '/api/auth/login',
      '/',
    ];

    publicRoutes.forEach((route) => {
      it(`should allow public route ${route} without tenant context`, async () => {
        const middleware = setTenantContext();
        mockRequest.path = route;
        (mockRequest.get as any).mockReturnValue(undefined);

        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
      });
    });

    it('should require tenant for non-public routes', async () => {
      const middleware = setTenantContext();
      mockRequest.path = '/api/users/profile';
      (mockRequest.get as any).mockReturnValue(undefined);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'TENANT_REQUIRED',
        message: 'Tenant context is required for this operation',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('setTenantContext - Tenant Resolution', () => {
    it('should resolve tenant by ID from cache', async () => {
      const middleware = setTenantContext();
      const tenantId = 'cached-tenant-123';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return tenantId;
        return undefined;
      });

      const cachedTenant = {
        id: tenantId,
        name: 'Cached Tenant',
        slug: 'cached',
        status: 'ACTIVE',
      };

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue(cachedTenant as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tenantCacheService.getOrSetTenant).toHaveBeenCalledWith(
        tenantId,
        expect.any(Function)
      );
      expect((mockRequest as any).tenant).toEqual(cachedTenant);
    });

    it('should resolve tenant by slug from cache', async () => {
      const middleware = setTenantContext();
      const slug = 'myclub';
      const tenantId = 'tenant-slug-123';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'host') return `${slug}.clubmanager.com`;
        return undefined;
      });

      const tenant = {
        id: tenantId,
        name: 'My Club',
        slug,
        status: 'ACTIVE',
      };

      jest.mocked(tenantCacheService.getTenantBySlug).mockResolvedValue(tenant as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(tenantCacheService.getTenantBySlug).toHaveBeenCalledWith(slug);
      expect((mockRequest as any).tenant).toEqual(tenant);
    });

    it('should query database if not in cache (slug)', async () => {
      const middleware = setTenantContext();
      const slug = 'newclub';
      const tenantId = 'tenant-db-123';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'host') return `${slug}.clubmanager.com`;
        return undefined;
      });

      const tenant = {
        id: tenantId,
        name: 'New Club',
        slug,
        status: 'ACTIVE',
      };

      jest.mocked(tenantCacheService.getTenantBySlug).mockResolvedValue(null);
      jest.mocked(prisma.tenant.findUnique).mockResolvedValue(tenant as any);
      jest.mocked(tenantCacheService.setTenant).mockResolvedValue();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      });

      expect(tenantCacheService.setTenant).toHaveBeenCalledWith(tenant);
    });

    it('should return 404 if tenant not found', async () => {
      const middleware = setTenantContext();

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'host') return 'nonexistent.clubmanager.com';
        return undefined;
      });

      jest.mocked(tenantCacheService.getTenantBySlug).mockResolvedValue(null);
      jest.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant not found or inactive',
      });
    });
  });

  describe('setTenantContext - Tenant Status Validation', () => {
    it('should reject SUSPENDED tenant', async () => {
      const middleware = setTenantContext();
      const tenantId = 'suspended-tenant';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return tenantId;
        return undefined;
      });

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: tenantId,
        name: 'Suspended Tenant',
        slug: 'suspended',
        status: 'SUSPENDED',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'TENANT_INACTIVE',
        message: 'Tenant is not active',
      });
    });

    it('should allow ACTIVE tenant', async () => {
      const middleware = setTenantContext();
      const tenantId = 'active-tenant';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return tenantId;
        return undefined;
      });

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: tenantId,
        name: 'Active Tenant',
        slug: 'active',
        status: 'ACTIVE',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject INACTIVE tenant', async () => {
      const middleware = setTenantContext();
      const tenantId = 'inactive-tenant';

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return tenantId;
        return undefined;
      });

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: tenantId,
        name: 'Inactive Tenant',
        slug: 'inactive',
        status: 'INACTIVE',
      } as any);

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('setTenantContext - Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const middleware = setTenantContext();

      (mockRequest.get as any).mockImplementation(() => {
        throw new Error('Network error');
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'TENANT_CONTEXT_ERROR',
        message: 'Failed to establish tenant context',
      });
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should clear tenant context on error', async () => {
      const middleware = setTenantContext();

      jest.mocked(tenantCacheService.getOrSetTenant).mockRejectedValue(
        new Error('Database error')
      );

      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return 'error-tenant';
        return undefined;
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getCurrentTenantId()).toBeNull();
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('clearTenantContext', () => {
    it('should register cleanup on response finish', () => {
      const middleware = clearTenantContext();
      const onMock = jest.fn();
      mockResponse.on = onMock;

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(onMock).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should clear tenant context when response finishes', () => {
      const middleware = clearTenantContext();
      let finishCallback: Function;

      mockResponse.on = jest.fn((event: string, callback: Function) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      // Set a tenant context first
      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: 'test-tenant',
        name: 'Test',
        slug: 'test',
        status: 'ACTIVE',
      } as any);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Manually call the finish callback
      finishCallback!();

      expect(getCurrentTenantId()).toBeNull();
    });
  });

  describe('allowCrossTenantAccess', () => {
    it('should allow super admin to access cross-tenant data', () => {
      const middleware = allowCrossTenantAccess();

      (mockRequest as any).user = { role: 'SUPER_ADMIN', tenantId: 'admin-tenant' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should reject non-super-admin users', () => {
      const middleware = allowCrossTenantAccess();

      (mockRequest as any).user = { role: 'ADMIN', tenantId: 'tenant-123' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Super admin access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      const middleware = allowCrossTenantAccess();

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject users without role', () => {
      const middleware = allowCrossTenantAccess();

      (mockRequest as any).user = { tenantId: 'tenant-123' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('forceTenantContext', () => {
    it('should force specific tenant context', () => {
      const tenantId = 'forced-tenant-123';
      const middleware = forceTenantContext(tenantId);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getCurrentTenantId()).toBe(tenantId);
      expect((mockRequest as any).tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should override existing tenant context', () => {
      const originalTenantId = 'original-tenant';
      const forcedTenantId = 'forced-tenant';

      (mockRequest as any).tenantId = originalTenantId;

      const middleware = forceTenantContext(forcedTenantId);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getCurrentTenantId()).toBe(forcedTenantId);
      expect((mockRequest as any).tenantId).toBe(forcedTenantId);
    });
  });

  describe('Integration - Full Request Lifecycle', () => {
    it('should handle complete tenant context lifecycle', async () => {
      const setMiddleware = setTenantContext();
      const clearMiddleware = clearTenantContext();
      const tenantId = 'lifecycle-tenant';

      // Setup
      (mockRequest.get as any).mockImplementation((header: string) => {
        if (header === 'X-Tenant-ID') return tenantId;
        return undefined;
      });

      jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
        id: tenantId,
        name: 'Lifecycle Tenant',
        slug: 'lifecycle',
        status: 'ACTIVE',
      } as any);

      let finishCallback: Function;
      mockResponse.on = jest.fn((event: string, callback: Function) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      // Set context
      await setMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(getCurrentTenantId()).toBe(tenantId);

      // Register cleanup
      clearMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response finish
      finishCallback!();
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should handle multiple concurrent requests with different tenants', async () => {
      const middleware = setTenantContext();

      const requests = ['tenant-1', 'tenant-2', 'tenant-3'].map((tenantId) => {
        const req = {
          get: jest.fn().mockImplementation((header: string) => {
            if (header === 'X-Tenant-ID') return tenantId;
            return undefined;
          }),
          path: '/api/users',
          cookies: {},
          headers: {},
          socket: { remoteAddress: '127.0.0.1' } as any,
        };

        jest.mocked(tenantCacheService.getOrSetTenant).mockResolvedValue({
          id: tenantId,
          name: `Tenant ${tenantId}`,
          slug: tenantId,
          status: 'ACTIVE',
        } as any);

        return middleware(req as Request, mockResponse as Response, mockNext);
      });

      await Promise.all(requests);

      // Each request should have been processed
      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });
});
