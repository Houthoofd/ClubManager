import { Request, Response, NextFunction } from 'express';

/**
 * Options de configuration CORS
 */
interface CorsOptions {
  allowedOrigins?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  exposedHeaders?: string[];
  allowedHeaders?: string[];
  allowedMethods?: string[];
}

/**
 * Middleware CORS avec support multi-tenant
 * Permet de configurer CORS dynamiquement basé sur le tenant
 */
export const corsMiddleware = (options?: CorsOptions) => {
  const {
    allowedOrigins = [],
    allowCredentials = true,
    maxAge = 86400, // 24 heures
    exposedHeaders = [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Total-Count',
      'X-Page',
      'X-Per-Page',
    ],
    allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-API-Key',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  } = options || {};

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    const host = req.get('host') || '';

    // Déterminer si l'origine est autorisée
    let isAllowedOrigin = false;

    // 1. Vérifier les origines explicitement autorisées
    if (origin && allowedOrigins.length > 0) {
      isAllowedOrigin = allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed.startsWith('*.')) {
          // Support wildcard subdomain: *.example.com
          const domain = allowed.substring(2);
          return origin.endsWith(domain);
        }
        return origin === allowed;
      });
    }

    // 2. Autoriser les requêtes same-origin
    if (!isAllowedOrigin && origin) {
      const originHost = new URL(origin).host;
      isAllowedOrigin = originHost === host;
    }

    // 3. En développement, autoriser localhost
    if (!isAllowedOrigin && process.env.NODE_ENV === 'development' && origin) {
      isAllowedOrigin = origin.includes('localhost') || origin.includes('127.0.0.1');
    }

    // 4. Autoriser les origines des variables d'environnement
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (!isAllowedOrigin && origin && envOrigins.length > 0) {
      isAllowedOrigin = envOrigins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed.includes('*')) {
          const regex = new RegExp(allowed.replace(/\*/g, '.*'));
          return regex.test(origin);
        }
        return origin === allowed.trim();
      });
    }

    // 5. Support pour tenant-specific origins
    if (!isAllowedOrigin && req.tenant && origin) {
      const tenant = req.tenant.tenant;
      // Vérifier le domaine personnalisé du tenant
      if (tenant.domain && origin.includes(tenant.domain)) {
        isAllowedOrigin = true;
      }
      // Vérifier le sous-domaine du tenant
      const tenantSubdomain = `${tenant.slug}.${process.env.BASE_DOMAIN || 'example.com'}`;
      if (origin.includes(tenantSubdomain)) {
        isAllowedOrigin = true;
      }
    }

    // Définir les headers CORS
    if (isAllowedOrigin && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Credentials (cookies, authorization headers)
    if (allowCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Headers exposés au client
    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    // Gérer les requêtes preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      res.setHeader('Access-Control-Max-Age', maxAge.toString());
      return res.status(204).send();
    }

    next();
  };
};

/**
 * Configuration CORS par défaut pour développement
 */
export const devCors = corsMiddleware({
  allowedOrigins: ['*'],
  allowCredentials: true,
});

/**
 * Configuration CORS stricte pour production
 */
export const prodCors = corsMiddleware({
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  allowCredentials: true,
  maxAge: 86400,
});

/**
 * Middleware CORS adaptatif (dev vs prod)
 */
export const adaptiveCors = process.env.NODE_ENV === 'production' ? prodCors : devCors;

/**
 * CORS pour API publique (plus restrictif)
 */
export const apiCors = corsMiddleware({
  allowedOrigins: process.env.API_ALLOWED_ORIGINS?.split(',') || ['*'],
  allowCredentials: false,
  maxAge: 3600, // 1 heure
  allowedMethods: ['GET', 'POST'],
});

/**
 * CORS pour webhooks (très restrictif)
 */
export const webhookCors = corsMiddleware({
  allowedOrigins: [], // Pas d'origine browser autorisée
  allowCredentials: false,
  allowedMethods: ['POST'],
});

export default {
  corsMiddleware,
  devCors,
  prodCors,
  adaptiveCors,
  apiCors,
  webhookCors,
};
