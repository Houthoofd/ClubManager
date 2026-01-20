# Guide des Middlewares - ClubManager Platform API

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification & Autorisation](#authentification--autorisation)
3. [Gestion Multi-Tenant](#gestion-multi-tenant)
4. [Validation des requêtes](#validation-des-requêtes)
5. [Gestion des erreurs](#gestion-des-erreurs)
6. [Rate Limiting](#rate-limiting)
7. [CORS](#cors)
8. [Sécurité](#sécurité)
9. [Logging & Performance](#logging--performance)
10. [Audit](#audit)
11. [Chains de middlewares](#chains-de-middlewares)
12. [Exemples d'utilisation](#exemples-dutilisation)

---

## Vue d'ensemble

L'architecture middleware de ClubManager suit une approche modulaire et composable. Chaque middleware a une responsabilité unique et peut être combiné avec d'autres pour créer des pipelines de traitement complexes.

### Architecture en couches

```
Request → Logger → CORS → Security → Auth → Tenant → RateLimit → Validation → Routes → Response
```

### Import

```typescript
// Import individuel
import { verifyToken, tenantResolver, validateBody } from '@/middleware';

// Import du module complet
import middlewares from '@/middleware';
```

---

## Authentification & Autorisation

### `verifyToken`

Vérifie et décode le token JWT fourni dans le header `Authorization` ou les cookies.

**Usage:**
```typescript
import { verifyToken } from '@/middleware';

router.get('/protected', verifyToken, (req, res) => {
  // req.user est maintenant disponible
  res.json({ user: req.user });
});
```

**Données ajoutées à req.user:**
```typescript
{
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  status?: string;
}
```

**Réponse d'erreur:**
```json
{
  "success": false,
  "message": "Token d'accès requis | Token expiré | Token invalide",
  "statusCode": 401 | 403
}
```

---

### `optionalAuth`

Même fonctionnalité que `verifyToken` mais ne bloque pas la requête si aucun token n'est fourni.

**Usage:**
```typescript
import { optionalAuth } from '@/middleware';

router.get('/public-or-private', optionalAuth, (req, res) => {
  if (req.user) {
    // Utilisateur authentifié
    res.json({ data: 'private data' });
  } else {
    // Utilisateur public
    res.json({ data: 'public data' });
  }
});
```

---

### `requireRole`

Vérifie que l'utilisateur authentifié possède l'un des rôles spécifiés.

**Usage:**
```typescript
import { verifyToken, requireRole } from '@/middleware';

router.delete('/admin/users/:id', 
  verifyToken, 
  requireRole(['admin', 'super_admin']),
  deleteUser
);
```

**Réponse d'erreur:**
```json
{
  "success": false,
  "message": "Permissions insuffisantes",
  "statusCode": 403
}
```

---

### `generateToken`

Fonction utilitaire pour générer un JWT.

**Usage:**
```typescript
import { generateToken } from '@/middleware';

const token = generateToken({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role,
});

res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
});
```

---

## Gestion Multi-Tenant

### `tenantResolver`

Identifie le tenant basé sur le sous-domaine, domaine personnalisé ou header.

**Usage:**
```typescript
import { tenantResolver } from '@/middleware';

router.use('/api', tenantResolver, apiRoutes);
```

**Méthodes de résolution (ordre de priorité):**
1. Domaine personnalisé: `myclub.com`
2. Sous-domaine: `myclub.clubmanager.com`
3. Header: `X-Tenant-ID: myclub`

**Données ajoutées à req.tenant:**
```typescript
{
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    maxUsers: number;
    maxStorage: number;
    domain?: string;
  };
}
```

**Réponse d'erreur:**
```json
{
  "error": "Tenant not found | Tenant access suspended",
  "status": "SUSPENDED",
  "statusCode": 404 | 403
}
```

---

### `validateUserTenant`

Vérifie que l'utilisateur authentifié appartient bien au tenant résolu.

**Usage:**
```typescript
import { verifyToken, tenantResolver, validateUserTenant } from '@/middleware';

router.use('/api', 
  verifyToken,
  tenantResolver,
  validateUserTenant,
  apiRoutes
);
```

---

### `checkTenantLimits`

Vérifie les limites du plan du tenant (utilisateurs, stockage).

**Usage:**
```typescript
import { tenantResolver, checkTenantLimits } from '@/middleware';

router.post('/users', 
  tenantResolver,
  checkTenantLimits('users'),
  createUser
);

router.post('/upload', 
  tenantResolver,
  checkTenantLimits('storage'),
  uploadFile
);
```

---

## Validation des requêtes

### `validateBody`

Valide le corps de la requête avec un schéma Zod.

**Usage:**
```typescript
import { validateBody } from '@/middleware';
import { createProductSchema } from '@/validators';

router.post('/products',
  verifyToken,
  validateBody(createProductSchema),
  createProduct
);
```

**Exemple de schéma Zod:**
```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.enum(['EQUIPMENT', 'MEMBERSHIP', 'MERCHANDISE']),
  stock: z.number().int().min(0).optional(),
});
```

**Réponse d'erreur:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "String must contain at least 1 character(s)",
      "code": "too_small"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### `validateQuery`

Valide les query parameters.

**Usage:**
```typescript
import { validateQuery } from '@/middleware';
import { z } from 'zod';

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
});

router.get('/products',
  validateQuery(paginationSchema),
  getProducts
);
```

---

### `validateParams`

Valide les route parameters.

**Usage:**
```typescript
import { validateParams } from '@/middleware';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().uuid(),
});

router.get('/products/:id',
  validateParams(idParamSchema),
  getProduct
);
```

---

### `validateRequest`

Valide body, query et params en une seule fois.

**Usage:**
```typescript
import { validateRequest } from '@/middleware';
import { z } from 'zod';

router.put('/products/:id',
  validateRequest({
    params: z.object({ id: z.string().uuid() }),
    body: updateProductSchema,
    query: z.object({ force: z.string().optional() }),
  }),
  updateProduct
);
```

---

### `validateFile`

Valide les fichiers uploadés.

**Usage:**
```typescript
import { validateFile } from '@/middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

router.post('/products/:id/image',
  upload.single('image'),
  validateFile({
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fieldName: 'image',
  }),
  uploadProductImage
);
```

---

### `sanitizeInput`

Nettoie les inputs pour prévenir XSS basique.

**Usage:**
```typescript
import { sanitizeInput } from '@/middleware';

router.use('/api', sanitizeInput, apiRoutes);
```

---

## Gestion des erreurs

### `errorHandler`

Middleware de gestion globale des erreurs. **Doit être ajouté en dernier**.

**Usage:**
```typescript
import express from 'express';
import { errorHandler, notFoundHandler } from '@/middleware';

const app = express();

// Routes...
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (TOUJOURS EN DERNIER)
app.use(errorHandler);
```

**Erreurs gérées:**
- `AppError` (erreurs personnalisées)
- `Prisma.PrismaClientKnownRequestError`
- `ZodError`
- `JsonWebTokenError`
- `SyntaxError` (JSON invalide)
- Erreurs génériques

**Format de réponse:**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid data provided",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/products",
  "details": {},
  "stack": "..." // Seulement en développement
}
```

---

### `notFoundHandler`

Gère les routes non trouvées (404).

**Usage:**
```typescript
import { notFoundHandler, errorHandler } from '@/middleware';

app.use(notFoundHandler);
app.use(errorHandler);
```

---

### `asyncHandler`

Wrapper pour éviter les try/catch dans les routes async.

**Usage:**
```typescript
import { asyncHandler } from '@/middleware';

router.get('/products', asyncHandler(async (req, res) => {
  const products = await productService.getAll(req.tenant!.tenantId);
  res.json({ success: true, data: products });
}));
```

---

### `setupGlobalErrorHandlers`

Configure les handlers d'erreurs non capturées au niveau process.

**Usage:**
```typescript
import { setupGlobalErrorHandlers } from '@/middleware';

// Dans server.ts ou index.ts
setupGlobalErrorHandlers();
```

---

## Rate Limiting

### `tenantRateLimiter`

Rate limiting basé sur le plan du tenant.

**Limites par plan:**
- FREE: 100 requêtes/heure
- BASIC: 1000 requêtes/heure
- PRO: 10000 requêtes/heure
- ENTERPRISE: 100000 requêtes/heure
- ANONYMOUS: 10 requêtes/heure

**Usage:**
```typescript
import { tenantRateLimiter } from '@/middleware';

router.use('/api', tenantResolver, tenantRateLimiter, apiRoutes);
```

**Headers de réponse:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705320600000
```

**Réponse d'erreur (429):**
```json
{
  "error": "Rate limit exceeded for your plan",
  "retryAfter": 3600,
  "limit": 1000,
  "plan": "BASIC"
}
```

---

### `apiRateLimiter`

Rate limiting pour API publique (plus strict).

**Usage:**
```typescript
import { apiRateLimiter } from '@/middleware';

router.use('/public-api', apiRateLimiter, publicApiRoutes);
```

---

## CORS

### `corsMiddleware`

Middleware CORS configurable avec support multi-tenant.

**Usage:**
```typescript
import { corsMiddleware } from '@/middleware';

const cors = corsMiddleware({
  allowedOrigins: ['https://app.example.com', 'https://*.example.com'],
  allowCredentials: true,
  maxAge: 86400,
  exposedHeaders: ['X-Total-Count', 'X-Page'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
});

app.use(cors);
```

---

### `adaptiveCors`

CORS adaptatif selon l'environnement (permissif en dev, strict en prod).

**Usage:**
```typescript
import { adaptiveCors } from '@/middleware';

app.use(adaptiveCors);
```

---

### `apiCors`

CORS pour API publique (sans credentials).

**Usage:**
```typescript
import { apiCors } from '@/middleware';

app.use('/public-api', apiCors, publicApiRoutes);
```

---

## Sécurité

### `securityMiddleware`

Configure les headers de sécurité HTTP (Helmet-style).

**Usage:**
```typescript
import { securityMiddleware } from '@/middleware';

app.use(securityMiddleware({
  contentSecurityPolicy: true,
  strictTransportSecurity: true,
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
}));
```

**Headers configurés:**
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Permissions-Policy`
- `Expect-CT`

---

### `adaptiveSecurity`

Sécurité adaptative (stricte en prod, permissive en dev).

**Usage:**
```typescript
import { adaptiveSecurity } from '@/middleware';

app.use(adaptiveSecurity);
```

---

### `csrfProtection`

Protection CSRF token-based.

**Usage:**
```typescript
import { csrfProtection } from '@/middleware';

app.use(csrfProtection({
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  excludePaths: ['/api/webhooks'],
}));
```

**Dans le frontend:**
```javascript
// Le token est dans le cookie, l'envoyer dans le header
fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCookie('csrf-token'),
  },
  body: JSON.stringify(data),
});
```

---

### `bodyLimit`

Limite la taille du body des requêtes.

**Usage:**
```typescript
import { bodyLimit } from '@/middleware';

app.use(bodyLimit(10 * 1024 * 1024)); // 10MB max
```

---

### `suspiciousRequestDetector`

Détecte et bloque les requêtes suspectes (XSS, SQL injection, etc.).

**Usage:**
```typescript
import { suspiciousRequestDetector } from '@/middleware';

app.use(suspiciousRequestDetector);
```

---

## Logging & Performance

### `requestLogger`

Log toutes les requêtes avec détails et métriques de performance.

**Usage:**
```typescript
import { requestLogger } from '@/middleware';

app.use(requestLogger({
  logLevel: 'standard', // 'minimal' | 'standard' | 'verbose'
  includeBody: false,
  includeQuery: true,
  includeHeaders: false,
}));
```

**Log output:**
```
✓ [abc123] GET /api/products → 200 (45ms)
{
  requestId: 'abc123',
  method: 'GET',
  path: '/api/products',
  statusCode: 200,
  duration: '45ms',
  size: '1.2 KB → 15.6 KB',
  userId: 42,
  tenantId: 'club-alpha'
}
```

---

### `adaptiveLogger`

Logger adaptatif (minimal en prod, standard en dev).

**Usage:**
```typescript
import { adaptiveLogger } from '@/middleware';

app.use(adaptiveLogger);
```

---

### `performanceLogger`

Ajoute des métriques de performance aux headers de réponse.

**Usage:**
```typescript
import { performanceLogger } from '@/middleware';

app.use(performanceLogger);

router.get('/products', async (req, res) => {
  const products = await productRepo.findAll();
  req.markPerformance!('db-query'); // Marquer un point de performance
  
  const enriched = await enrichProducts(products);
  req.markPerformance!('enrichment');
  
  res.json(enriched);
  // Headers: Server-Timing: db-query;dur=45, enrichment;dur=123
});
```

---

### `sensitiveResourceLogger`

Log les accès à des ressources sensibles.

**Usage:**
```typescript
import { sensitiveResourceLogger } from '@/middleware';

router.get('/admin/users/:id/payment-methods',
  verifyToken,
  requireRole(['admin']),
  sensitiveResourceLogger('payment-methods'),
  getPaymentMethods
);
```

---

## Audit

### `auditLogger`

Log automatiquement les actions dans la table audit.

**Usage:**
```typescript
import { auditLogger } from '@/middleware';
import { AuditAction } from '@/services/auditService';

router.post('/products',
  verifyToken,
  tenantResolver,
  validateBody(createProductSchema),
  auditLogger(AuditAction.CREATE, 'product'),
  createProduct
);
```

---

### `auditUpdate`

Log spécifiquement les mises à jour (avant/après).

**Usage:**
```typescript
import { auditUpdate } from '@/middleware';

router.put('/products/:id',
  verifyToken,
  auditUpdate('product'),
  updateProduct
);
```

---

### `auditDelete`

Log les suppressions.

**Usage:**
```typescript
import { auditDelete } from '@/middleware';

router.delete('/products/:id',
  verifyToken,
  auditDelete('product'),
  deleteProduct
);
```

---

## Chains de middlewares

Des chaînes pré-configurées pour usage commun.

### `requireAuthAndTenant`

Auth + Tenant + Validation + Sanitization.

**Usage:**
```typescript
import { requireAuthAndTenant } from '@/middleware';

router.use('/api/protected', requireAuthAndTenant, protectedRoutes);
```

**Équivalent à:**
```typescript
router.use('/api/protected', [
  verifyToken,
  tenantResolver,
  validateUserTenant,
  sanitizeInput,
], protectedRoutes);
```

---

### `requireTenant`

Tenant + Sanitization (pas d'auth requise).

**Usage:**
```typescript
import { requireTenant } from '@/middleware';

router.use('/api/public', requireTenant, publicRoutes);
```

---

### `requireAuthTenantRateLimit`

Auth + Tenant + RateLimit + Sanitization.

**Usage:**
```typescript
import { requireAuthTenantRateLimit } from '@/middleware';

router.use('/api/intensive', requireAuthTenantRateLimit, intensiveRoutes);
```

---

### `publicApiChain`

Pour API publique avec rate limiting strict.

**Usage:**
```typescript
import { publicApiChain } from '@/middleware';

app.use('/public-api', publicApiChain, publicApiRoutes);
```

**Équivalent à:**
```typescript
app.use('/public-api', [
  adaptiveCors,
  tenantResolver,
  apiRateLimiter,
  sanitizeInput,
], publicApiRoutes);
```

---

### `fullAppChain`

Chaîne complète pour app Express (logging + CORS + security).

**Usage:**
```typescript
import express from 'express';
import { fullAppChain, errorHandler } from '@/middleware';

const app = express();

// Middlewares globaux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fullAppChain);

// Routes...
app.use('/api', routes);

// Error handling
app.use(errorHandler);
```

---

## Exemples d'utilisation

### Configuration complète d'une app Express

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import {
  fullAppChain,
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
  csrfProtection,
} from '@/middleware';

const app = express();

// Setup global error handlers
setupGlobalErrorHandlers();

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Middlewares globaux
app.use(fullAppChain); // Logger + CORS + Security + Sanitization

// CSRF protection (optionnel)
app.use(csrfProtection({
  excludePaths: ['/api/webhooks', '/api/stripe/webhook'],
}));

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

---

### Route CRUD complète avec validation et audit

```typescript
import { Router } from 'express';
import {
  requireAuthAndTenant,
  validateBody,
  validateParams,
  auditLogger,
  auditUpdate,
  auditDelete,
  requireRole,
} from '@/middleware';
import { AuditAction } from '@/services/auditService';
import {
  createProductSchema,
  updateProductSchema,
  idParamSchema,
} from '@/validators';
import * as productController from '@/controllers/product.controller';

const router = Router();

// Appliquer auth + tenant à toutes les routes
router.use(requireAuthAndTenant);

// GET /products - Liste
router.get('/', productController.getAll);

// GET /products/:id - Détail
router.get('/:id',
  validateParams(idParamSchema),
  productController.getOne
);

// POST /products - Création
router.post('/',
  requireRole(['admin', 'manager']),
  validateBody(createProductSchema),
  auditLogger(AuditAction.CREATE, 'product'),
  productController.create
);

// PUT /products/:id - Mise à jour
router.put('/:id',
  requireRole(['admin', 'manager']),
  validateParams(idParamSchema),
  validateBody(updateProductSchema),
  auditUpdate('product'),
  productController.update
);

// DELETE /products/:id - Suppression
router.delete('/:id',
  requireRole(['admin']),
  validateParams(idParamSchema),
  auditDelete('product'),
  productController.remove
);

export default router;
```

---

### API publique avec rate limiting

```typescript
import { Router } from 'express';
import {
  publicApiChain,
  validateQuery,
  optionalAuth,
} from '@/middleware';
import { z } from 'zod';

const router = Router();

// Appliquer la chain publique
router.use(publicApiChain);

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Route publique avec auth optionnelle
router.get('/products/search',
  optionalAuth, // User peut être connecté ou non
  validateQuery(searchSchema),
  async (req, res) => {
    const { q, page = 1, limit = 20 } = req.query;
    const tenantId = req.tenant!.tenantId;
    
    // Résultats différents si connecté
    const includePrivate = !!req.user;
    
    const results = await productService.search(
      tenantId,
      q as string,
      { page, limit, includePrivate }
    );
    
    res.json({
      success: true,
      data: results,
      meta: { page, limit },
    });
  }
);

export default router;
```

---

### Webhook endpoint (sans CSRF, avec validation signature)

```typescript
import { Router } from 'express';
import { asyncHandler, webhookCors } from '@/middleware';
import crypto from 'crypto';

const router = Router();

// CORS spécifique webhooks
router.use(webhookCors);

// Middleware de validation signature Stripe
const validateStripeSignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  try {
    const payload = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    if (!req.timingSafeEqual!(signature!, expectedSignature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
  } catch (error) {
    res.status(400).json({ error: 'Signature validation failed' });
  }
};

router.post('/stripe',
  express.raw({ type: 'application/json' }), // Raw body for signature
  validateStripeSignature,
  asyncHandler(async (req, res) => {
    const event = req.body;
    
    await stripeWebhookService.handle(event);
    
    res.json({ received: true });
  })
);

export default router;
```

---

### Upload de fichiers avec validation

```typescript
import { Router } from 'express';
import multer from 'multer';
import {
  requireAuthAndTenant,
  validateParams,
  validateFile,
  checkTenantLimits,
} from '@/middleware';

const router = Router();

// Configuration multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/products/:id/image',
  requireAuthAndTenant,
  checkTenantLimits('storage'),
  upload.single('image'),
  validateParams(z.object({ id: z.string().uuid() })),
  validateFile({
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fieldName: 'image',
  }),
  async (req, res) => {
    const { id } = req.params;
    const file = req.file!;
    
    const url = await storageService.upload(
      req.tenant!.tenantId,
      file,
      `products/${id}`
    );
    
    await productRepo.update(id, { imageUrl: url });
    
    res.json({ success: true, data: { url } });
  }
);

export default router;
```

---

## Variables d'environnement

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
API_ALLOWED_ORIGINS=*

# Security
NODE_ENV=production
BASE_DOMAIN=clubmanager.com

# Rate Limiting
REDIS_URL=redis://localhost:6379

# Logging
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=info

# Stripe (pour webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Bonnes pratiques

### 1. Ordre des middlewares

```typescript
app.use(adaptiveLogger);        // 1. Logging en premier
app.use(adaptiveCors);          // 2. CORS
app.use(adaptiveSecurity);      // 3. Security headers
app.use(bodyLimit());           // 4. Body size limit
app.use(express.json());        // 5. Body parsing
app.use(sanitizeInput);         // 6. Input sanitization
app.use(verifyToken);           // 7. Authentication
app.use(tenantResolver);        // 8. Tenant resolution
app.use(tenantRateLimiter);     // 9. Rate limiting
// Routes...
app.use(notFoundHandler);       // N-1. 404 handler
app.use(errorHandler);          // N. Error handler (DERNIER)
```

### 2. Utiliser asyncHandler pour éviter try/catch

❌ **Mauvais:**
```typescript
router.get('/products', async (req, res) => {
  try {
    const products = await productService.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

✅ **Bon:**
```typescript
import { asyncHandler } from '@/middleware';

router.get('/products', asyncHandler(async (req, res) => {
  const products = await productService.getAll();
  res.json(products);
}));
```

### 3. Valider TOUTES les entrées utilisateur

```typescript
router.post('/products',
  validateBody(createProductSchema),    // Body
  validateQuery(paginationSchema),      // Query params
  validateParams(idParamSchema),        // Route params
  createProduct
);
```

### 4. Audit sur les opérations sensibles

```typescript
router.delete('/users/:id',
  verifyToken,
  requireRole(['admin']),
  auditDelete('user'),  // ✅ Toujours auditer les suppressions
  deleteUser
);
```

### 5. Rate limiting adapté au type de route

```typescript
// Routes normales: rate limiting tenant
router.use('/api', tenantRateLimiter);

// API publique: rate limiting strict
router.use('/public-api', apiRateLimiter);

// Routes intensives: rate limiting custom
router.post('/bulk-import',
  customRateLimiter(10, '1h'), // 10 requêtes par heure
  bulkImport
);
```

---

## Troubleshooting

### Erreur: "Token d'accès requis"

**Cause:** Token JWT manquant ou malformé.

**Solution:**
```typescript
// Vérifier que le token est bien envoyé
headers: {
  'Authorization': `Bearer ${token}`,
}
// OU dans les cookies
credentials: 'include',
```

### Erreur: "Tenant not found"

**Cause:** Impossible de résoudre le tenant depuis l'URL.

**Solution:**
- Vérifier que le sous-domaine ou domaine est correct
- Ajouter le header `X-Tenant-ID` si nécessaire
- Vérifier que le tenant existe en base

### Erreur: "Rate limit exceeded"

**Cause:** Limite de requêtes dépassée pour le plan.

**Solution:**
- Attendre `retryAfter` secondes
- Upgrader le plan du tenant
- Implémenter un cache côté client

### CORS errors en développement

**Solution:**
```typescript
// Utiliser devCors en développement
import { devCors } from '@/middleware';
app.use(devCors);

// Ou configurer ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Migration depuis le legacy

Si vous migrez depuis l'ancien système:

```typescript
// Ancien
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';

// Nouveau
import { verifyToken, tenantResolver } from '@/middleware';

// OU utiliser les chains
import { requireAuthAndTenant } from '@/middleware';
```

---

## Références

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Zod Documentation](https://zod.dev/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)

---

**Last updated:** 2024-01-15  
**Version:** 1.0.0