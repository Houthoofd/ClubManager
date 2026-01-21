import { Request, Response, NextFunction } from 'express';
import { multiTenantService } from '../../services/tenant/multi-tenant.service.js';

// Interface simplifiée pour éviter les conflits
export interface TenantRequest extends Request {
  tenant?: any;
  tenantId?: string;
  user?: any;
}

/**
 * Middleware for multi-tenant context extraction and validation
 */
export class TenantMiddleware {
  
  /**
   * Extract tenant context from request (subdomain, domain, header, or JWT)
   */
  extractTenant() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let tenantId: string | null = null;
        const host = req.get('host') || '';

        // 1. From subdomain (primary method)
        if (host.includes('.')) {
          const subdomain = host.split('.')[0];
          if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
            const tenant = await multiTenantService.getTenantBySubdomain(subdomain);
            if (tenant) {
              tenantId = (tenant as any).tenantId || (tenant as any).tenant?.id || (tenant as any).id;
              (req as TenantRequest).tenant = tenant;
            }
          }
        }

        if (!tenantId) {
          tenantId = req.get('X-Tenant-ID') || req.get('x-tenant-id') || null;
          if (tenantId) {
            // Mock tenant context for development
            (req as TenantRequest).tenant = {
              tenantId: tenantId,
              tenant: {
                id: tenantId,
                name: 'Development Tenant',
                subdomain: 'dev',
                plan: 'FREE'
              }
            };
          }
        }

        // 3. From JWT token (authenticated users)
        if (!tenantId && (req as any).user?.tenantId) {
          tenantId = (req as any).user.tenantId;
          (req as TenantRequest).tenant = {
            tenantId: tenantId,
            tenant: {
              id: tenantId,
              name: 'Token Tenant',
              subdomain: 'token',
              plan: 'FREE'
            }
          };
        }

        if (!tenantId || !(req as TenantRequest).tenant) {
          return res.status(400).json({
            error: 'TENANT_NOT_FOUND',
            message: 'Tenant context is required',
          });
        }

        // Check tenant status
        const tenant = (req as TenantRequest).tenant;
        if (tenant?.tenant?.status === 'SUSPENDED') {
          return res.status(403).json({
            error: 'TENANT_SUSPENDED',
            message: 'This account has been suspended',
          });
        }

        if (tenant?.tenant?.status === 'EXPIRED') {
          return res.status(403).json({
            error: 'TENANT_EXPIRED',
            message: 'This account has expired',
          });
        }

        (req as TenantRequest).tenantId = tenantId;
        next();
      } catch (error) {
        console.error('Tenant extraction error:', error);
        return res.status(500).json({
          error: 'TENANT_ERROR',
          message: 'Failed to extract tenant context',
        });
      }
    };
  }

  /**
   * Require specific feature availability for tenant plan
   */
  requireFeature(feature: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const tenant = (req as TenantRequest).tenant;
      if (!tenant) {
        return res.status(400).json({
          error: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        });
      }

      // Check if feature is available in tenant plan
      // TODO: Implement feature checking logic based on plan
      next();
    };
  }

  /**
   * Require specific role for the user
   */
  requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as TenantRequest).user;
      if (!user || !user.role) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (user.role !== role) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: `Role ${role} required`,
        });
      }

      next();
    };
  }

  /**
   * Check resource limits for tenant plan
   */
  checkResourceLimit(resource: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenant = (req as TenantRequest).tenant;
        if (!tenant) {
          return res.status(400).json({
            error: 'TENANT_REQUIRED',
            message: 'Tenant context is required',
          });
        }

        // Check resource usage and limits
        const usage = await multiTenantService.getTenantUsage(tenant.tenantId);
        const limits = multiTenantService.getPlanLimits(tenant.tenant.plan);

        if (usage.userCount >= limits.users && resource === 'users') {
          return res.status(403).json({
            error: 'LIMIT_EXCEEDED',
            message: `User limit exceeded for plan ${tenant.tenant.plan}`,
          });
        }

        next();
      } catch (error) {
        console.error('Resource limit check error:', error);
        next();
      }
    };
  }
}

export const tenantMiddleware = new TenantMiddleware();