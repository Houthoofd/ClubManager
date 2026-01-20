/**
 * Tenant Utilities
 * Helper functions for multi-tenant operations
 */

import { Request } from 'express';

export const DEFAULT_TENANT_ID = parseInt(process.env.DEFAULT_TENANT_ID || '1', 10);

/**
 * Extract tenant ID from request
 * Priority: JWT token > header > subdomain > default
 */
export function getTenantId(req: Request): number {
  // 1. Try to get from JWT token (if user is authenticated)
  if (req.user && typeof req.user === 'object' && 'tenantId' in req.user) {
    const tenantId = (req.user as any).tenantId;
    if (tenantId && Number.isInteger(tenantId) && tenantId > 0) {
      return tenantId;
    }
  }

  // 2. Try to get from header
  const headerTenantId = req.headers['x-tenant-id'];
  if (headerTenantId) {
    const parsed = parseInt(headerTenantId as string, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // 3. Try to extract from subdomain
  const host = req.headers.host || '';
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    const tenantId = mapSubdomainToTenantId(subdomain);
    if (tenantId > 0) {
      return tenantId;
    }
  }

  // 4. Return default tenant ID
  return DEFAULT_TENANT_ID;
}

/**
 * Extract subdomain from host
 */
export function extractSubdomain(host: string): string | null {
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(':')[0];

  // Split by dots
  const parts = hostname.split('.');

  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length < 3) return null;

  // Return first part as subdomain (ignore www)
  const subdomain = parts[0];
  if (subdomain === 'www' || subdomain === 'api') return null;

  return subdomain;
}

/**
 * Map subdomain to tenant ID
 * This is a placeholder - in production, you would query a database
 */
export function mapSubdomainToTenantId(subdomain: string): number {
  // TODO: Implement actual subdomain to tenant mapping
  // For now, return default
  const mapping: Record<string, number> = {
    'demo': 1,
    'test': 2,
    'staging': 3
  };

  return mapping[subdomain] || DEFAULT_TENANT_ID;
}

/**
 * Validate tenant ID
 */
export function isValidTenantId(tenantId: any): tenantId is number {
  return typeof tenantId === 'number' && Number.isInteger(tenantId) && tenantId > 0;
}

/**
 * Ensure tenant isolation in query
 */
export function addTenantFilter<T extends Record<string, any>>(
  filter: T,
  tenantId: number
): T & { tenantId: number } {
  return {
    ...filter,
    tenantId
  };
}

/**
 * Check if user has access to tenant
 */
export function hasAccessToTenant(userTenantId: number, requestedTenantId: number): boolean {
  return userTenantId === requestedTenantId;
}

/**
 * Get tenant from JWT payload
 */
export function getTenantFromToken(payload: any): number {
  if (payload && typeof payload === 'object' && 'tenantId' in payload) {
    const tenantId = payload.tenantId;
    if (isValidTenantId(tenantId)) {
      return tenantId;
    }
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Validate tenant access
 * Throws error if user doesn't have access to requested tenant
 */
export function validateTenantAccess(userTenantId: number, requestedTenantId: number): void {
  if (!hasAccessToTenant(userTenantId, requestedTenantId)) {
    throw new Error('Access denied: Invalid tenant');
  }
}

/**
 * Get tenant context from request for logging
 */
export function getTenantContext(req: Request): {
  tenantId: number;
  subdomain: string | null;
  source: 'token' | 'header' | 'subdomain' | 'default';
} {
  let tenantId = DEFAULT_TENANT_ID;
  let source: 'token' | 'header' | 'subdomain' | 'default' = 'default';

  // Check token
  if (req.user && typeof req.user === 'object' && 'tenantId' in req.user) {
    const tokenTenantId = (req.user as any).tenantId;
    if (isValidTenantId(tokenTenantId)) {
      tenantId = tokenTenantId;
      source = 'token';
    }
  }

  // Check header
  if (source === 'default') {
    const headerTenantId = req.headers['x-tenant-id'];
    if (headerTenantId) {
      const parsed = parseInt(headerTenantId as string, 10);
      if (!isNaN(parsed) && parsed > 0) {
        tenantId = parsed;
        source = 'header';
      }
    }
  }

  // Check subdomain
  const host = req.headers.host || '';
  const subdomain = extractSubdomain(host);
  if (source === 'default' && subdomain) {
    const subdomainTenantId = mapSubdomainToTenantId(subdomain);
    if (subdomainTenantId > 0) {
      tenantId = subdomainTenantId;
      source = 'subdomain';
    }
  }

  return {
    tenantId,
    subdomain,
    source
  };
}
