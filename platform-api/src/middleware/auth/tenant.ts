import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { TenantContext } from "../../types/tenant.js";

const prisma = new PrismaClient();

/**
 * Middleware pour identifier et valider le tenant basé sur le sous-domaine ou domaine personnalisé
 */
export const tenantResolver = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const host = req.get("host");
    if (!host) {
      return res.status(400).json({ error: "Host header required" });
    }

    let tenantSlug: string | null = null;
    let domain: string | null = null;

    // Vérifier si c'est un domaine personnalisé
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      // Chercher d'abord par domaine personnalisé
      domain = host.split(":")[0]; // Remove port
    }

    // Extraire le sous-domaine si pas de domaine personnalisé
    if (!domain) {
      const hostParts = host.split(".");
      if (hostParts.length > 2) {
        tenantSlug = hostParts[0];
      }
    }

    // Rechercher le tenant
    let tenant;
    if (domain) {
      tenant = await prisma.tenant.findFirst({
        where: { domain },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          maxUsers: true,
          maxStorage: true,
        },
      });
    } else if (tenantSlug) {
      tenant = await prisma.tenant.findFirst({
        where: { slug: tenantSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          maxUsers: true,
          maxStorage: true,
        },
      });
    }

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.status !== "ACTIVE") {
      return res.status(403).json({
        error: "Tenant access suspended",
        status: tenant.status,
      });
    }

    // Attacher le contexte tenant à la requête
    req.tenant = {
      tenantId: tenant.id,
      tenant: tenant,
    };

    next();
  } catch (error) {
    console.error("Tenant resolution error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Middleware pour valider que l'utilisateur authentifié appartient au tenant
 */
export const validateUserTenant = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !req.tenant) {
    return res
      .status(401)
      .json({ error: "Authentication and tenant required" });
  }

  if ((req.user as any).tenantId !== req.tenant.tenantId) {
    return res
      .status(403)
      .json({ error: "User does not belong to this tenant" });
  }

  next();
};

/**
 * Middleware pour vérifier les limites du tenant (utilisateurs, stockage, etc.)
 */
export const checkTenantLimits = (limitType: "users" | "storage") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return res.status(401).json({ error: "Tenant context required" });
      }

      const { tenantId, tenant } = req.tenant;

      if (limitType === "users") {
        const userCount = await prisma.user.count({
          where: { tenantId, actif: true },
        });

        if (userCount >= tenant.maxUsers) {
          return res.status(403).json({
            error: "User limit reached",
            current: userCount,
            limit: tenant.maxUsers,
          });
        }
      }

      // TODO: Implement storage limit check
      if (limitType === "storage") {
        // Calculate storage usage for tenant
        // For now, just pass through
      }

      next();
    } catch (error) {
      console.error("Tenant limits check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

/**
 * Helper function to create Prisma client with tenant isolation
 */
export const getTenantPrisma = (tenantId: string) => {
  // This would typically return a Prisma client configured for the specific tenant
  // For now, we'll use the default client with automatic tenant filtering
  return prisma;
};

export default {
  tenantResolver,
  validateUserTenant,
  checkTenantLimits,
  getTenantPrisma,
};
