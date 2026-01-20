import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Security middleware options
 */
interface SecurityOptions {
  contentSecurityPolicy?: boolean | ContentSecurityPolicyOptions;
  strictTransportSecurity?: boolean | HstsOptions;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  xContentTypeOptions?: boolean;
  xssProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  expectCT?: boolean | ExpectCTOptions;
}

interface ContentSecurityPolicyOptions {
  directives?: Record<string, string[]>;
  reportOnly?: boolean;
}

interface HstsOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

interface ExpectCTOptions {
  maxAge?: number;
  enforce?: boolean;
  reportUri?: string;
}

/**
 * Middleware principal de sécurité (Helmet-style)
 * Configure les headers de sécurité HTTP
 */
export const securityMiddleware = (options?: SecurityOptions) => {
  const {
    contentSecurityPolicy = true,
    strictTransportSecurity = true,
    xFrameOptions = 'DENY',
    xContentTypeOptions = true,
    xssProtection = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy = 'geolocation=(), microphone=(), camera=()',
    expectCT = false,
  } = options || {};

  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    if (contentSecurityPolicy) {
      const cspOptions = typeof contentSecurityPolicy === 'object'
        ? contentSecurityPolicy
        : getDefaultCSP();

      const cspHeader = buildCSPHeader(cspOptions);
      const headerName = cspOptions.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

      res.setHeader(headerName, cspHeader);
    }

    // Strict-Transport-Security (HSTS)
    if (strictTransportSecurity && process.env.NODE_ENV === 'production') {
      const hstsOptions = typeof strictTransportSecurity === 'object'
        ? strictTransportSecurity
        : { maxAge: 31536000, includeSubDomains: true, preload: true };

      let hstsValue = `max-age=${hstsOptions.maxAge || 31536000}`;
      if (hstsOptions.includeSubDomains) hstsValue += '; includeSubDomains';
      if (hstsOptions.preload) hstsValue += '; preload';

      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options (clickjacking protection)
    if (xFrameOptions) {
      res.setHeader('X-Frame-Options', xFrameOptions);
    }

    // X-Content-Type-Options (MIME sniffing protection)
    if (xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection (legacy XSS protection)
    if (xssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Referrer-Policy
    if (referrerPolicy) {
      res.setHeader('Referrer-Policy', referrerPolicy);
    }

    // Permissions-Policy (formerly Feature-Policy)
    if (permissionsPolicy) {
      res.setHeader('Permissions-Policy', permissionsPolicy);
    }

    // Expect-CT
    if (expectCT && process.env.NODE_ENV === 'production') {
      const ctOptions = typeof expectCT === 'object'
        ? expectCT
        : { maxAge: 86400, enforce: true };

      let ctValue = `max-age=${ctOptions.maxAge || 86400}`;
      if (ctOptions.enforce) ctValue += ', enforce';
      if (ctOptions.reportUri) ctValue += `, report-uri="${ctOptions.reportUri}"`;

      res.setHeader('Expect-CT', ctValue);
    }

    // X-Powered-By (supprimer pour ne pas révéler la stack)
    res.removeHeader('X-Powered-By');

    // X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // X-Download-Options (IE8+)
    res.setHeader('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  };
};

/**
 * Configuration CSP par défaut
 */
const getDefaultCSP = (): ContentSecurityPolicyOptions => ({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  },
  reportOnly: false,
});

/**
 * Construction du header CSP à partir des directives
 */
const buildCSPHeader = (options: ContentSecurityPolicyOptions): string => {
  const directives = options.directives || getDefaultCSP().directives!;

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * Middleware pour générer et valider les nonces CSP
 */
export const cspNonce = (req: Request, res: Response, next: NextFunction) => {
  // Générer un nonce unique pour cette requête
  const nonce = crypto.randomBytes(16).toString('base64');

  // Stocker le nonce dans res.locals pour y accéder dans les templates
  res.locals.cspNonce = nonce;

  // Ajouter le nonce au header CSP
  const existingCSP = res.getHeader('Content-Security-Policy') as string;
  if (existingCSP) {
    const updatedCSP = existingCSP.replace(
      /script-src([^;]*)/,
      `script-src$1 'nonce-${nonce}'`
    );
    res.setHeader('Content-Security-Policy', updatedCSP);
  }

  next();
};

/**
 * Middleware de protection contre les attaques par timing
 */
export const timingSafeCompare = (req: Request, res: Response, next: NextFunction) => {
  // Ajouter une fonction helper à req pour comparer des secrets de manière sécurisée
  (req as any).timingSafeEqual = (a: string, b: string): boolean => {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      if (bufA.length !== bufB.length) {
        // Faire quand même une comparaison pour éviter le timing attack
        crypto.timingSafeEqual(
          crypto.createHash('sha256').update(a).digest(),
          crypto.createHash('sha256').update(b).digest()
        );
        return false;
      }

      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  };

  next();
};

/**
 * Middleware de protection CSRF (simple token-based)
 */
export const csrfProtection = (options?: {
  cookieName?: string;
  headerName?: string;
  excludePaths?: string[];
}) => {
  const {
    cookieName = 'csrf-token',
    headerName = 'x-csrf-token',
    excludePaths = [],
  } = options || {};

  return (req: Request, res: Response, next: NextFunction) => {
    // Exclure certains paths (ex: webhooks)
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // GET, HEAD, OPTIONS sont safe
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Générer un token pour les requêtes safe
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 heure
      });
      res.locals.csrfToken = token;
      return next();
    }

    // Pour les autres méthodes, valider le token
    const cookieToken = req.cookies?.[cookieName];
    const headerToken = req.get(headerName) || req.body?._csrf;

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        success: false,
        error: 'ForbiddenError',
        message: 'CSRF token missing',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
    }

    // Comparaison timing-safe
    try {
      const bufCookie = Buffer.from(cookieToken);
      const bufHeader = Buffer.from(headerToken);

      if (bufCookie.length !== bufHeader.length ||
          !crypto.timingSafeEqual(bufCookie, bufHeader)) {
        return res.status(403).json({
          success: false,
          error: 'ForbiddenError',
          message: 'Invalid CSRF token',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      return res.status(403).json({
        success: false,
        error: 'ForbiddenError',
        message: 'Invalid CSRF token',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Middleware pour limiter la taille du body
 */
export const bodyLimit = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'PayloadTooLargeError',
        message: 'Request body too large',
        maxSize,
        actualSize: parseInt(contentLength),
        statusCode: 413,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

/**
 * Middleware pour détecter et bloquer les requêtes suspectes
 */
export const suspiciousRequestDetector = (req: Request, res: Response, next: NextFunction) => {
  // Patterns suspects dans l'URL
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /javascript:/i,  // XSS
    /on\w+=/i,  // Event handlers
    /eval\(/i,  // Code injection
    /base64_decode/i,  // Obfuscation
    /cmd=/i,  // Command injection
    /\0/,  // Null bytes
  ];

  const url = req.url.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    console.warn('Suspicious request detected:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('user-agent'),
    });

    return res.status(400).json({
      success: false,
      error: 'BadRequestError',
      message: 'Invalid request',
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Middleware de sécurité par défaut (recommandé pour production)
 */
export const defaultSecurity = securityMiddleware({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'object-src': ["'none'"],
    },
    reportOnly: false,
  },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=()',
});

/**
 * Sécurité pour développement (plus permissive)
 */
export const devSecurity = securityMiddleware({
  contentSecurityPolicy: false,
  strictTransportSecurity: false,
  xFrameOptions: 'SAMEORIGIN',
});

/**
 * Sécurité adaptative (dev vs prod)
 */
export const adaptiveSecurity = process.env.NODE_ENV === 'production'
  ? defaultSecurity
  : devSecurity;

export default {
  securityMiddleware,
  cspNonce,
  timingSafeCompare,
  csrfProtection,
  bodyLimit,
  suspiciousRequestDetector,
  defaultSecurity,
  devSecurity,
  adaptiveSecurity,
};
