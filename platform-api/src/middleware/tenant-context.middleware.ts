import { Request, Response, NextFunction } from "express";
import {
  setCurrentTenantId,
  clearCurrentTenantId,
} from "./prisma/tenant-isolation.middleware.js";
import { tenantCacheService } from "../cache/tenant-cache.service.js";
import { prisma } from "../db/prisma.client.js";

/**
 * Middleware Express pour définir le contexte tenant
 * Ce middleware doit être appliqué AVANT toute requête qui accède à la base de données
 *
 * Il extrait le tenantId depuis:
 * 1. Le sous-domaine (ex: club1.clubmanager.com)
 * 2. Le header X-Tenant-ID
 * 3. Le JWT token du user authentifié
 */
export function setTenantContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Récupérer le tenantId depuis la requête
      const tenantIdentifier = extractTenantIdentifier(req);

      if (!tenantIdentifier) {
        // Nettoyer le contexte si aucun tenant
        clearCurrentTenantId();

        // Pour les routes publiques, continuer sans tenant
        if (isPublicRoute(req.path)) {
          return next();
        }

        return res.status(400).json({
          error: "TENANT_REQUIRED",
          message: "Tenant context is required for this operation",
        });
      }

      // Résoudre le tenant (avec cache)
      const tenant = await resolveTenant(tenantIdentifier);

      if (!tenant) {
        clearCurrentTenantId();
        return res.status(404).json({
          error: "TENANT_NOT_FOUND",
          message: "Tenant not found or inactive",
        });
      }

      // Vérifier le statut du tenant
      if (tenant.status !== "ACTIVE") {
        clearCurrentTenantId();
        return res.status(403).json({
          error: "TENANT_INACTIVE",
          message: "Tenant is not active",
        });
      }

      // Définir le contexte tenant pour cette requête
      setCurrentTenantId(tenant.id);

      // Ajouter les infos tenant à l'objet request pour accès ultérieur
      (req as any).tenantId = tenant.id;
      (req as any).tenant = tenant;

      // Continuer vers le prochain middleware
      next();
    } catch (error: any) {
      console.error("Error in tenant context middleware:", error);
      clearCurrentTenantId();

      return res.status(500).json({
        error: "TENANT_CONTEXT_ERROR",
        message: "Failed to establish tenant context",
      });
    }
  };
}

/**
 * Middleware pour nettoyer le contexte tenant après la requête
 * À utiliser en tant que middleware de fin de chaîne
 */
export function clearTenantContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      clearCurrentTenantId();
    });
    next();
  };
}

/**
 * Extraire l'identifiant tenant (ID ou subdomain) depuis différentes sources
 */
function extractTenantIdentifier(
  req: Request,
): { type: "id" | "slug"; value: string } | null {
  // 1. Depuis le header X-Tenant-ID (utile pour les tests et API)
  const headerTenantId = req.get("X-Tenant-ID") || req.get("x-tenant-id");
  if (headerTenantId) {
    return { type: "id", value: headerTenantId };
  }

  // 2. Depuis le JWT token (si l'utilisateur est authentifié)
  const user = (req as any).user;
  if (user?.tenantId) {
    return { type: "id", value: user.tenantId };
  }

  // 3. Depuis le tenant stocké dans la requête (par d'autres middlewares)
  const tenant = (req as any).tenant;
  if (tenant?.tenantId || tenant?.id) {
    return { type: "id", value: tenant.tenantId || tenant.id };
  }

  // 4. Depuis le sous-domaine (priorité la plus basse)
  const host = req.get("host") || "";
  if (host.includes(".")) {
    const slug = host.split(".")[0];
    // Exclure les sous-domaines réservés
    if (!["www", "api", "admin", "app", "localhost"].includes(slug)) {
      return { type: "slug", value: slug };
    }
  }

  return null;
}

/**
 * Résoudre le tenant depuis l'identifiant (avec cache Redis)
 */
async function resolveTenant(identifier: {
  type: "id" | "slug";
  value: string;
}) {
  try {
    // Si c'est un ID direct, chercher en cache puis en base
    if (identifier.type === "id") {
      return await tenantCacheService.getOrSetTenant(
        identifier.value,
        async () => {
          const tenant = await prisma.tenant.findUnique({
            where: { id: identifier.value },
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          });
          return tenant as any;
        },
      );
    }

    // Si c'est un slug, chercher en cache puis en base
    const cachedBySlug = await tenantCacheService.getTenantBySlug(
      identifier.value,
    );
    if (cachedBySlug) {
      return cachedBySlug;
    }

    // Cache miss - chercher en base
    const tenant = await prisma.tenant.findUnique({
      where: { slug: identifier.value },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    if (tenant) {
      // Mettre en cache
      await tenantCacheService.setTenant(tenant as any);
    }

    return tenant as any;
  } catch (error) {
    console.error("Error resolving tenant:", error);
    return null;
  }
}

/**
 * Routes publiques qui ne nécessitent pas de contexte tenant
 */
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    "/health",
    "/api/health",
    "/webhooks",
    "/api/webhooks",
    "/api/tenant/signup",
    "/api/auth/login",
    "/",
  ];

  return publicRoutes.some((route) => path.startsWith(route));
}

/**
 * Middleware pour les routes admin qui nécessitent d'accéder à plusieurs tenants
 * Désactive temporairement l'isolation tenant
 */
export function allowCrossTenantAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier que l'utilisateur est un super-admin
    const user = (req as any).user;
    if (!user || user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Super admin access required",
      });
    }

    // Nettoyer le contexte tenant pour permettre l'accès cross-tenant
    clearCurrentTenantId();
    next();
  };
}

/**
 * Middleware pour forcer un tenant spécifique (utile pour les tests)
 */
export function forceTenantContext(tenantId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    setCurrentTenantId(tenantId);
    (req as any).tenantId = tenantId;
    next();
  };
}
