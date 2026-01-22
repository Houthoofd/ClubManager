import { Request, Response } from 'express';
import { prisma } from '../db/prisma.client.js';
import { getCurrentTenantId } from '../middleware/prisma/tenant-isolation.middleware.js';

/**
 * Helper utilities for tenant-aware controllers and routes
 */

/**
 * Get current tenant ID from request or context
 */
export function getTenantId(req: Request): string {
  // Try from request object first
  const tenantId = (req as any).tenantId;
  if (tenantId) return tenantId;

  // Try from context
  const contextTenantId = getCurrentTenantId();
  if (contextTenantId) return contextTenantId;

  throw new Error('No tenant context available');
}

/**
 * Get tenant information
 */
export async function getTenant(req: Request) {
  const tenantId = getTenantId(req);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  return tenant;
}

/**
 * Check if tenant has access to a specific feature
 */
export async function hasFeature(req: Request, feature: string): Promise<boolean> {
  const tenant = await getTenant(req);
  const settings = tenant.settings as any;

  if (!settings?.features) return false;

  // Check for wildcard (all features)
  if (settings.features.includes('*')) return true;

  // Check specific feature
  return settings.features.includes(feature);
}

/**
 * Check if tenant is within resource limits
 */
export async function checkLimit(
  req: Request,
  resource: 'users' | 'courses' | 'storage'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const tenant = await getTenant(req);
  const tenantId = tenant.id;

  let current = 0;
  let limit = 0;

  switch (resource) {
    case 'users':
      current = await prisma.user.count({ where: { tenantId } });
      limit = tenant.maxUsers;
      break;

    case 'courses':
      current = await prisma.cours.count({ where: { tenantId } });
      limit = 100; // Default, should come from plan
      break;

    case 'storage':
      current = 0; // TODO: Calculate storage usage
      limit = tenant.maxStorage;
      break;
  }

  return {
    allowed: limit === -1 || current < limit,
    current,
    limit,
  };
}

/**
 * Require feature middleware wrapper
 */
export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const hasAccess = await hasFeature(req, feature);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'FEATURE_NOT_AVAILABLE',
          message: `Feature '${feature}' is not available in your plan`,
          feature,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        error: 'FEATURE_CHECK_FAILED',
        message: error.message,
      });
    }
  };
}

/**
 * Require limit check middleware wrapper
 */
export function requireLimit(resource: 'users' | 'courses' | 'storage') {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const result = await checkLimit(req, resource);

      if (!result.allowed) {
        return res.status(403).json({
          error: 'LIMIT_EXCEEDED',
          message: `${resource} limit exceeded`,
          resource,
          current: result.current,
          limit: result.limit,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        error: 'LIMIT_CHECK_FAILED',
        message: error.message,
      });
    }
  };
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(req: Request) {
  const tenantId = getTenantId(req);

  const [userCount, courseCount, messageCount, commandeCount] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.cours.count({ where: { tenantId } }),
    prisma.message.count({ where: { tenantId } }),
    prisma.commande.count({ where: { tenantId } }),
  ]);

  return {
    users: userCount,
    courses: courseCount,
    messages: messageCount,
    orders: commandeCount,
  };
}

/**
 * Verify tenant is active
 */
export async function verifyTenantActive(req: Request): Promise<void> {
  const tenant = await getTenant(req);

  if (tenant.status === 'SUSPENDED') {
    throw new Error('Tenant is suspended. Please update payment method.');
  }

  if (tenant.status === 'INACTIVE') {
    throw new Error('Tenant is inactive. Please contact support.');
  }
}

/**
 * Middleware to verify tenant is active
 */
export function requireActiveTenant() {
  return async (req: Request, res: Response, next: Function) => {
    try {
      await verifyTenantActive(req);
      next();
    } catch (error: any) {
      return res.status(403).json({
        error: 'TENANT_NOT_ACTIVE',
        message: error.message,
      });
    }
  };
}

/**
 * Get user with tenant verification
 */
export async function getUserWithTenantCheck(req: Request, userId: number) {
  const tenantId = getTenantId(req);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
  });

  if (!user) {
    throw new Error('User not found or access denied');
  }

  return user;
}

/**
 * Format tenant response (remove sensitive data)
 */
export function formatTenantResponse(tenant: any) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    status: tenant.status,
    maxUsers: tenant.maxUsers,
    maxStorage: tenant.maxStorage,
    createdAt: tenant.createdAt,
  };
}
