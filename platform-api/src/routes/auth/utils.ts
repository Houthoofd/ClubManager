import { Request } from "express";

/**
 * Extract tenantId from request
 * In production, this would come from:
 * - Subdomain: tenant1.clubmanager.com
 * - Custom domain mapping
 * - JWT token after login
 * For now, we'll use a header or default
 */
export function getTenantId(req: Request): string {
  // Priority: JWT token > Header > Default
  const user = (req as any).user;
  if (user?.tenantId) {
    return user.tenantId;
  }

  // From header (for testing)
  const headerTenant = req.headers["x-tenant-id"] as string;
  if (headerTenant) {
    return headerTenant;
  }

  // From subdomain (e.g., tenant1.clubmanager.com)
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];

  // For development, use a default tenant
  // In production, this should be required
  return process.env.DEFAULT_TENANT_ID || subdomain || "default-tenant";
}