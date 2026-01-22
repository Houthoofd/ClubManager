import { Request, Response, NextFunction } from 'express';
import { setCurrentTenantId, clearCurrentTenantId } from './prisma/tenant-isolation.middleware.js';

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
      const tenantId = extractTenantId(req);

      if (!tenantId) {
        // Nettoyer le contexte si aucun tenant
        clearCurrentTenantId();

        // Pour les routes publiques, continuer sans tenant
        if (isPublicRoute(req.path)) {
          return next();
        }

        return res.status(400).json({
          error: 'TENANT_REQUIRED',
          message: 'Tenant context is required for this operation',
        });
      }

      // Définir le contexte tenant pour cette requête
      setCurrentTenantId(tenantId);

      // Ajouter le tenantId à l'objet request pour accès ultérieur
      (req as any).tenantId = tenantId;

      // Continuer vers le prochain middleware
      next();
    } catch (error: any) {
      console.error('Error in tenant context middleware:', error);
      clearCurrentTenantId();

      return res.status(500).json({
        error: 'TENANT_CONTEXT_ERROR',
        message: 'Failed to establish tenant context',
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
    res.on('finish', () => {
      clearCurrentTenantId();
    });
    next();
  };
}

/**
 * Extraire le tenant ID depuis différentes sources
 */
function extractTenantId(req: Request): string | null {
  // 1. Depuis le sous-domaine
  const host = req.get('host') || '';
  if (host.includes('.')) {
    const subdomain = host.split('.')[0];
    // Exclure les sous-domaines réservés
    if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
      // Dans un vrai système, on devrait chercher le tenant en BD par subdomain
      // Pour l'instant, on retourne le subdomain comme tenantId
      return subdomain;
    }
  }

  // 2. Depuis le header X-Tenant-ID (utile pour les tests et API)
  const headerTenantId = req.get('X-Tenant-ID') || req.get('x-tenant-id');
  if (headerTenantId) {
    return headerTenantId;
  }

  // 3. Depuis le JWT token (si l'utilisateur est authentifié)
  const user = (req as any).user;
  if (user?.tenantId) {
    return user.tenantId;
  }

  // 4. Depuis le tenant stocké dans la requête (par d'autres middlewares)
  const tenant = (req as any).tenant;
  if (tenant?.tenantId || tenant?.id) {
    return tenant.tenantId || tenant.id;
  }

  return null;
}

/**
 * Routes publiques qui ne nécessitent pas de contexte tenant
 */
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/health',
    '/api/health',
    '/webhooks',
    '/api/webhooks',
    '/api/tenant/signup',
    '/api/auth/login',
    '/',
  ];

  return publicRoutes.some(route => path.startsWith(route));
}

/**
 * Middleware pour les routes admin qui nécessitent d'accéder à plusieurs tenants
 * Désactive temporairement l'isolation tenant
 */
export function allowCrossTenantAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier que l'utilisateur est un super-admin
    const user = (req as any).user;
    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Super admin access required',
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
