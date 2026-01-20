/**
 * Tenant Utility Functions
 * Helper functions for multi-tenant operations
 */

import { Request } from "express";

export const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "1";

/**
 * Extract tenant ID from request
 * Priority: JWT token > header > subdomain > default
 * Returns string to match Prisma schema where tenantId is cuid()
 */
export function getTenantId(req: Request): string {
  // 1. Try to get from JWT token (if user is authenticated)
  if (req.user && typeof req.user === "object" && "tenantId" in req.user) {
    const tenantId = (req.user as any).tenantId;
    if (tenantId && typeof tenantId === "string") {
      return tenantId;
    }
  }

  // 2. Try to get from tenant middleware (req.tenant)
  if (
    req.tenant &&
    typeof req.tenant === "object" &&
    "tenantId" in req.tenant
  ) {
    const tenantId = (req.tenant as any).tenantId;
    if (tenantId && typeof tenantId === "string") {
      return tenantId;
    }
  }

  // 3. Try to get from header
  const headerTenantId = req.headers["x-tenant-id"];
  if (headerTenantId && typeof headerTenantId === "string") {
    return headerTenantId;
  }

  // 4. Try to extract from subdomain
  const host = req.headers.host || "";
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    const tenantId = mapSubdomainToTenantId(subdomain);
    if (tenantId) {
      return tenantId;
    }
  }

  // 5. Return default tenant ID
  return DEFAULT_TENANT_ID;
}

/**
 * Extract subdomain from host
 */
export function extractSubdomain(host: string): string | null {
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(":")[0];

  // Split by dots
  const parts = hostname.split(".");

  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length < 3) return null;

  // Return first part as subdomain (ignore www)
  const subdomain = parts[0];
  if (subdomain === "www" || subdomain === "api") return null;

  return subdomain;
}

/**
 * Map subdomain to tenant ID
 */
export function mapSubdomainToTenantId(subdomain: string): string | null {
  // TODO: Implement actual subdomain to tenant mapping via database lookup
  // For now, return default for known subdomains
  const mapping: Record<string, string> = {
    demo: "demo-tenant-id",
    test: "test-tenant-id",
    staging: "staging-tenant-id",
  };

  return mapping[subdomain] || null;
}

/**
 * Validate tenant ID format
 */
export function isValidTenantId(tenantId: any): tenantId is string {
  return typeof tenantId === "string" && tenantId.length > 0;
}

/**
 * Add tenant filter to query
 */
export function addTenantFilter<T extends Record<string, any>>(
  filter: T,
  tenantId: string,
): T & { tenantId: string } {
  return {
    ...filter,
    tenantId,
  };
}

/**
 * Check if user has access to tenant
 */
export function hasAccessToTenant(
  userTenantId: string,
  requestedTenantId: string,
): boolean {
  return userTenantId === requestedTenantId;
}

/**
 * Get tenant from JWT payload
 */
export function getTenantFromToken(payload: any): string | null {
  if (payload && typeof payload === "object" && "tenantId" in payload) {
    const tenantId = payload.tenantId;
    if (isValidTenantId(tenantId)) {
      return tenantId;
    }
  }
  return null;
}

/**
 * Validate tenant access
 * Throws error if user doesn't have access to requested tenant
 */
export function validateTenantAccess(
  userTenantId: string,
  requestedTenantId: string,
): void {
  if (!hasAccessToTenant(userTenantId, requestedTenantId)) {
    throw new Error("Access denied: Invalid tenant");
  }
}

/**
 * Get full tenant context from request
 */
export function getTenantContext(req: Request): {
  tenantId: string;
  subdomain: string | null;
  source: "token" | "header" | "subdomain" | "default";
} {
  let tenantId = DEFAULT_TENANT_ID;
  let source: "token" | "header" | "subdomain" | "default" = "default";

  // Check token
  if (req.user && typeof req.user === "object" && "tenantId" in req.user) {
    const tokenTenantId = (req.user as any).tenantId;
    if (isValidTenantId(tokenTenantId)) {
      tenantId = tokenTenantId;
      source = "token";
    }
  }

  // Check tenant middleware
  if (
    source === "default" &&
    req.tenant &&
    typeof req.tenant === "object" &&
    "tenantId" in req.tenant
  ) {
    const middlewareTenantId = (req.tenant as any).tenantId;
    if (isValidTenantId(middlewareTenantId)) {
      tenantId = middlewareTenantId;
      source = "token";
    }
  }

  // Check header
  if (source === "default") {
    const headerTenantId = req.headers["x-tenant-id"];
    if (headerTenantId && typeof headerTenantId === "string") {
      tenantId = headerTenantId;
      source = "header";
    }
  }

  // Check subdomain
  const host = req.headers.host || "";
  const subdomain = extractSubdomain(host);
  if (source === "default" && subdomain) {
    const subdomainTenantId = mapSubdomainToTenantId(subdomain);
    if (subdomainTenantId) {
      tenantId = subdomainTenantId;
      source = "subdomain";
    }
  }

  return {
    tenantId,
    subdomain,
    source,
  };
}

/**
 * Extract tenant slug from subdomain or path
 */
export function extractTenantSlug(req: Request): string | null {
  // Try subdomain first
  const host = req.headers.host || "";
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    return subdomain;
  }

  // Try path-based tenant (e.g., /tenant/slug/...)
  const pathParts = req.path.split("/");
  if (pathParts[1] === "tenant" && pathParts[2]) {
    return pathParts[2];
  }

  return null;
}

/**
 * Format error message with tenant context
 */
export function formatTenantError(message: string, tenantId?: string): string {
  if (tenantId) {
    return `[Tenant: ${tenantId}] ${message}`;
  }
  return message;
}
