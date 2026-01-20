# 🚀 Roadmap d'Améliorations - ClubManager SaaS Multi-Tenant

**Version:** 1.0  
**Date:** Janvier 2025  
**Objectif:** Transformer ClubManager en plateforme SaaS robuste, sécurisée et scalable

---

## 📊 État Actuel du Projet

### ✅ **Déjà Implémenté**
- Architecture multi-tenant avec Prisma
- Base de données MySQL avec isolation par `tenant_id`
- Middleware de résolution de tenant (sous-domaines/domaines personnalisés)
- Système d'authentification par tenant
- Plans tarifaires (Basic, Premium)
- Frontend React + Backend Express
- Docker + Docker Compose
- Migration S3 documentée

### ⚠️ **Points d'Attention**
- Monitoring et observabilité manquants
- Système de facturation non automatisé
- Pas d'audit logging
- Cache non implémenté
- Tests d'isolation incomplets
- Pas de rate limiting
- Backups non automatisés

---

## 🎯 Roadmap par Phase

## **PHASE 1 : Sécurité & Stabilité** 🔒
**Durée estimée :** 4-6 semaines  
**Priorité :** CRITIQUE

### 1.1 Health Checks & Monitoring Basique
**Fichiers à créer :**
```
platform-api/src/routes/health.ts
platform-api/src/services/healthCheckService.ts
```

**Fonctionnalités :**
- `GET /health` - Status basique
- `GET /health/ready` - Readiness probe (K8s)
- `GET /health/live` - Liveness probe
- Checks : Database, S3, Redis (future), services externes

**Exemple de réponse :**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "database": "ok",
    "s3": "ok",
    "redis": "ok"
  },
  "uptime": 86400
}
```

### 1.2 Audit Logging (RGPD Obligatoire)
**Fichiers à créer :**
```
platform-api/src/services/auditService.ts
platform-api/src/middleware/auditLogger.ts
platform-api/prisma/migrations/xxx_add_audit_logs.sql
```

**Schema Prisma à ajouter :**
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  userId      Int?     @map("user_id")
  action      String   @db.VarChar(100)  // CREATE, UPDATE, DELETE, LOGIN
  resource    String   @db.VarChar(100)  // users, payments, courses
  resourceId  String?  @map("resource_id")
  changes     Json?    // Avant/Après pour UPDATE
  ipAddress   String   @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.Text
  timestamp   DateTime @default(now())
  
  @@index([tenantId, timestamp])
  @@index([userId, timestamp])
  @@index([action, timestamp])
  @@map("audit_logs")
}
```

**Actions à logger :**
- Authentification (login/logout/failed attempts)
- CRUD utilisateurs
- Modifications paiements
- Changements configuration tenant
- Accès données sensibles
- Export de données

### 1.3 Rate Limiting par Tenant
**Fichiers à créer :**
```
platform-api/src/middleware/rateLimiter.ts
platform-api/src/services/rateLimitService.ts
```

**Technologies :** Redis + express-rate-limit

**Limites suggérées :**
```typescript
const RATE_LIMITS = {
  FREE: { requests: 100, window: 900000 },      // 100 req/15min
  BASIC: { requests: 500, window: 900000 },     // 500 req/15min
  PREMIUM: { requests: 2000, window: 900000 },  // 2000 req/15min
  ENTERPRISE: { requests: 10000, window: 900000 } // 10k req/15min
};
```

**Implémentation :**
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const createTenantRateLimiter = (tenant: Tenant) => {
  const limits = RATE_LIMITS[tenant.plan];
  
  return rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: limits.window,
    max: limits.requests,
    keyGenerator: (req) => `${tenant.id}:${req.ip}`,
    message: 'Rate limit exceeded for your plan'
  });
};
```

### 1.4 Tests d'Isolation Multi-Tenant
**Fichiers à créer :**
```
platform-api/src/__tests__/isolation/tenant-isolation.test.ts
platform-api/src/__tests__/isolation/cross-tenant-access.test.ts
```

**Tests critiques :**
- ✅ Vérifier qu'un tenant ne peut pas accéder aux données d'un autre
- ✅ Test middleware tenant avec différents domaines
- ✅ Test authentification cross-tenant (doit échouer)
- ✅ Test queries sans tenant_id (doit échouer)
- ✅ Test token JWT avec mauvais tenantId

### 1.5 Backup Automatisés
**Fichiers à créer :**
```
scripts/backup-database.sh
scripts/restore-database.sh
infrastructure/backup-config.yml
```

**Stratégie de backup :**
- **Quotidien :** Full backup RDS à 2h du matin
- **Retention :** 30 jours
- **Point-in-time recovery :** Activé
- **Tests de restauration :** Mensuel
- **S3 Backup :** Versioning activé
- **Backup tenant spécifique :** Script d'export JSON

**Coût estimé :** $10-20/mois (backups RDS)

---

## **PHASE 2 : Monétisation & Facturation** 💰
**Durée estimée :** 6-8 semaines  
**Priorité :** HAUTE

### 2.1 Intégration Stripe Complète
**Fichiers à créer :**
```
platform-api/src/services/stripeService.ts
platform-api/src/services/billingService.ts
platform-api/src/routes/billing.ts
platform-api/src/webhooks/stripe.ts
```

**Fonctionnalités :**

#### a) **Souscriptions Automatiques**
```typescript
interface SubscriptionConfig {
  plans: {
    BASIC: { priceId: 'price_xxx', price: 19.99 },
    PREMIUM: { priceId: 'price_yyy', price: 49.99 },
    ENTERPRISE: { priceId: 'price_zzz', price: 199.99 }
  }
}

// Création souscription
async function createSubscription(tenantId: string, planId: string) {
  const customer = await stripe.customers.create({
    email: tenant.email,
    metadata: { tenantId }
  });
  
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: PLANS[planId].priceId }],
    trial_period_days: 14
  });
  
  return subscription;
}
```

#### b) **Webhooks Stripe**
```typescript
// Événements à gérer
const STRIPE_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.upcoming' // Alerte 3 jours avant
];

// Handler webhook
app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body, sig, STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      // ... autres cas
    }
  }
);
```

#### c) **Gestion des Échecs de Paiement (Dunning)**
```typescript
async function handlePaymentFailed(invoice: Invoice) {
  const tenant = await getTenantByStripeCustomer(invoice.customer);
  
  // Relance 1 : Email immédiat
  await sendEmail(tenant.email, 'payment-failed');
  
  // Relance 2 : Email J+3
  await scheduleEmail(tenant.email, 'payment-reminder', 3);
  
  // Suspension J+7
  await scheduleTenantSuspension(tenant.id, 7);
  
  // Suppression J+30
  await scheduleTenantDeletion(tenant.id, 30);
}
```

### 2.2 Schema Prisma - Extensions Billing
```prisma
model StripeCustomer {
  id                String   @id @default(cuid())
  tenantId          String   @unique @map("tenant_id")
  stripeCustomerId  String   @unique @map("stripe_customer_id")
  stripeSubscriptionId String? @map("stripe_subscription_id")
  createdAt         DateTime @default(now()) @map("created_at")
  
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@map("stripe_customers")
}

model Invoice {
  id              String   @id @default(cuid())
  tenantId        String   @map("tenant_id")
  stripeInvoiceId String   @unique @map("stripe_invoice_id")
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("EUR")
  status          InvoiceStatus
  paidAt          DateTime? @map("paid_at")
  dueDate         DateTime  @map("due_date")
  pdfUrl          String?   @map("pdf_url")
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@index([tenantId, createdAt])
  @@map("invoices")
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}
```

### 2.3 Portail Client Self-Service
**Fichiers à créer :**
```
platform-webapp/src/pages/settings/billing.tsx
platform-webapp/src/components/billing/PlanSelector.tsx
platform-webapp/src/components/billing/InvoiceHistory.tsx
platform-webapp/src/components/billing/PaymentMethod.tsx
```

**Fonctionnalités :**
- Voir plan actuel et limites
- Changer de plan (upgrade/downgrade)
- Gérer méthodes de paiement
- Historique factures (télécharger PDF)
- Usage actuel (utilisateurs, stockage)
- Annuler abonnement

### 2.4 Portail Super Admin
**Fichiers à créer :**
```
platform-webapp/src/pages/admin/dashboard.tsx
platform-webapp/src/pages/admin/tenants.tsx
platform-webapp/src/pages/admin/metrics.tsx
```

**Fonctionnalités :**
- Vue globale tous tenants
- Métriques : MRR, Churn, LTV
- Créer/Suspendre/Supprimer tenants
- Support : voir logs/données tenant
- Statistiques globales
- Health status infrastructure

---

## **PHASE 3 : Performance & Scalabilité** ⚡
**Durée estimée :** 6-8 semaines  
**Priorité :** MOYENNE

### 3.1 Caching avec Redis
**Fichiers à créer :**
```
platform-api/src/services/cacheService.ts
platform-api/src/middleware/cache.ts
docker-compose.yml (ajouter Redis)
```

**Architecture Cache :**
```
┌─────────────────────────────────────────┐
│  Client Request                         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Cache Middleware                       │
│  - Check Redis Cache                    │
│  - Return if hit                        │
└─────────────────┬───────────────────────┘
                  │ Cache Miss
                  ▼
┌─────────────────────────────────────────┐
│  Database Query                         │
│  - Fetch from MySQL                     │
│  - Store in Redis (TTL)                 │
└─────────────────────────────────────────┘
```

**Données à cacher :**
```typescript
const CACHE_STRATEGIES = {
  TENANT_CONFIG: { ttl: 3600, key: 'tenant:config:{id}' },
  USER_PROFILE: { ttl: 1800, key: 'user:profile:{id}' },
  COURSE_LIST: { ttl: 300, key: 'tenant:{id}:courses' },
  STATS: { ttl: 600, key: 'tenant:{id}:stats' },
  PLAN_FEATURES: { ttl: 7200, key: 'plan:features:{plan}' }
};

// Invalidation cache
async function invalidateTenantCache(tenantId: string) {
  await redis.del(`tenant:config:${tenantId}`);
  await redis.del(`tenant:${tenantId}:courses`);
  await redis.del(`tenant:${tenantId}:stats`);
}
```

**Coût estimé :** $10-15/mois (Redis ElastiCache)

### 3.2 Optimisation Base de Données
**Fichiers à créer :**
```
scripts/analyze-slow-queries.sql
scripts/optimize-indexes.sql
platform-api/src/db/connection-pool.ts
```

**Optimisations :**

#### a) **Indexes Critiques**
```sql
-- Indexes sur tenant_id (CRITIQUE)
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_cours_tenant_id ON cours(tenant_id);
CREATE INDEX idx_paiements_tenant_id ON paiements(tenant_id);

-- Indexes composites
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_inscriptions_user_course ON inscriptions(utilisateur_id, cours_id);

-- Indexes pour recherches fréquentes
CREATE INDEX idx_cours_date_type ON cours(date_cours, type_cours);
CREATE INDEX idx_paiements_status_date ON paiements(statut, date_paiement);
```

#### b) **Connection Pooling**
```typescript
const poolConfig = {
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idle: 10000, // Close idle after 10s
  acquire: 30000 // Max wait time
};
```

#### c) **Read Replicas** (Pour scale)
```typescript
// Configuration Prisma avec replicas
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Master (write)
    },
    replica: {
      url: process.env.DATABASE_REPLICA_URL, // Replica (read)
    }
  }
});

// Queries lecture sur replica
const users = await prisma.user.findMany({
  where: { tenantId },
  // Directive pour forcer replica
  __prisma_replica: true
});
```

### 3.3 CDN & Assets Optimization
**Configuration CloudFront :**
```yaml
# infrastructure/cloudfront-config.yml
Origins:
  - Id: s3-origin
    DomainName: clubmanager-frontend.s3.amazonaws.com
    S3OriginConfig:
      OriginAccessIdentity: !Ref CloudFrontOAI

CacheBehaviors:
  - PathPattern: /static/*
    CachePolicyId: CachingOptimized
    Compress: true
    
  - PathPattern: /assets/*
    CachePolicyId: CachingOptimized
    Compress: true
    
  - PathPattern: /api/*
    CachePolicyId: CachingDisabled
```

**Optimisations Images :**
- WebP pour navigateurs modernes
- Lazy loading
- Responsive images (srcset)
- Compression avec Sharp ou ImageOptim

### 3.4 Monitoring & APM
**Services recommandés :**

#### Option 1 : **DataDog** (Recommandé)
```typescript
// platform-api/src/monitoring/datadog.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'clubmanager-api',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  tags: {
    'tenant.id': () => req.tenant?.id
  }
});

// Métriques custom
import { StatsD } from 'node-dogstatsd';
const metrics = new StatsD();

// Tracker requêtes par tenant
metrics.increment('api.requests', 1, [`tenant:${tenantId}`]);
metrics.histogram('api.response_time', duration, [`tenant:${tenantId}`]);
```

**Coût estimé :** $15-50/mois

#### Option 2 : **Prometheus + Grafana** (Open Source)
```typescript
// platform-api/src/monitoring/prometheus.ts
import client from 'prom-client';

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status', 'tenant_id']
});

const activeTenants = new client.Gauge({
  name: 'active_tenants_count',
  help: 'Number of active tenants'
});

// Endpoint métriques
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

**Coût estimé :** $0 (self-hosted) ou $10-20/mois (Grafana Cloud)

### 3.5 Error Tracking avec Sentry
```typescript
// platform-api/src/app.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% des transactions
  
  beforeSend(event, hint) {
    // Ajouter contexte tenant
    if (hint.originalException?.tenant) {
      event.tags = {
        ...event.tags,
        tenant_id: hint.originalException.tenant.id,
        tenant_plan: hint.originalException.tenant.plan
      };
    }
    return event;
  }
});

// Capture erreurs avec contexte
app.use((err, req, res, next) => {
  Sentry.captureException(err, {
    user: req.user,
    tags: {
      tenant_id: req.tenant?.id,
      tenant_plan: req.tenant?.plan
    }
  });
  next(err);
});
```

**Coût estimé :** $0 (plan gratuit 5k events/mois) ou $26/mois (50k events)

---

## **PHASE 4 : Features Avancées** 🚀
**Durée estimée :** 8-12 semaines  
**Priorité :** BASSE (après stabilité)

### 4.1 API Publique REST
**Fichiers à créer :**
```
platform-api/src/routes/public-api/v1/
platform-api/docs/openapi.yml
platform-api/src/middleware/apiKey.ts
```

**Endpoints à exposer :**
```yaml
openapi: 3.0.0
info:
  title: ClubManager API
  version: 1.0.0
  
paths:
  /api/v1/users:
    get:
      summary: List users
      security:
        - ApiKeyAuth: []
      parameters:
        - in: query
          name: page
          schema:
            type: integer
      responses:
        200:
          description: Success
          
  /api/v1/courses:
    get:
      summary: List courses
    post:
      summary: Create course
      
  /api/v1/payments:
    get:
      summary: List payments
      
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

**Gestion API Keys :**
```prisma
model ApiKey {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  name        String   @db.VarChar(100)
  key         String   @unique @db.VarChar(64) // Hash SHA-256
  permissions Json     // ["users:read", "courses:write"]
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@index([tenantId])
  @@map("api_keys")
}
```

**Rate Limiting API :**
- Plus strict que UI : 100 req/15min par défaut
- Upgrade plan pour limites plus élevées

### 4.2 Webhooks Sortants
**Fichiers à créer :**
```
platform-api/src/services/webhookService.ts
platform-api/src/workers/webhookWorker.ts
```

**Événements disponibles :**
```typescript
enum WebhookEvent {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  COURSE_CREATED = 'course.created',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  SUBSCRIPTION_STARTED = 'subscription.started',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled'
}
```

**Schema Prisma :**
```prisma
model WebhookEndpoint {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  url         String   @db.VarChar(500)
  events      Json     // ["user.created", "payment.succeeded"]
  secret      String   @db.VarChar(64) // Pour signature HMAC
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  
  deliveries WebhookDelivery[]
  
  @@index([tenantId])
  @@map("webhook_endpoints")
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  endpointId  String   @map("endpoint_id")
  event       String   @db.VarChar(100)
  payload     Json
  status      WebhookStatus
  attempts    Int      @default(0)
  lastError   String?  @map("last_error") @db.Text
  deliveredAt DateTime? @map("delivered_at")
  createdAt   DateTime @default(now()) @map("created_at")
  
  endpoint WebhookEndpoint @relation(fields: [endpointId], references: [id])
  
  @@index([endpointId, createdAt])
  @@map("webhook_deliveries")
}

enum WebhookStatus {
  PENDING
  DELIVERED
  FAILED
}
```

**Retry Logic :**
```typescript
async function deliverWebhook(delivery: WebhookDelivery) {
  const maxAttempts = 5;
  const backoff = [0, 60, 300, 1800, 3600]; // 0s, 1min, 5min, 30min, 1h
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const signature = createHmacSignature(delivery.payload, endpoint.secret);
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event
        },
        body: JSON.stringify(delivery.payload),
        timeout: 5000
      });
      
      if (response.ok) {
        await markDelivered(delivery.id);
        return;
      }
    } catch (error) {
      if (attempt < maxAttempts - 1) {
        await sleep(backoff[attempt + 1] * 1000);
      }
    }
  }
  
  await markFailed(delivery.id);
}
```

### 4.3 Intégrations Tierces
**Fichiers à créer :**
```
platform-api/src/integrations/google-calendar.ts
platform-api/src/integrations/mailchimp.ts
platform-api/src/integrations/zapier.ts
```

**Intégrations prioritaires :**

#### a) **Google Calendar Sync**
```typescript
// Sync cours vers Google Calendar
async function syncCourseToGoogleCalendar(course: Cours, tenant: Tenant) {
  const oauth2Client = await getTenantGoogleAuth(tenant.id);
  
  const event = {
    summary: course.typeCours,
    description: course.description,
    start: {
      dateTime: course.heureDebut.toISOString(),
      timeZone: tenant.timezone || 'Europe/Paris'
    },
    end: {
      dateTime: course.heureFin.toISOString(),
      timeZone: tenant.timezone || 'Europe/Paris'
    },
    attendees: course.inscriptions.map(i => ({
      email: i.utilisateur.email
    }))
  };
  
  await calendar.events.insert({
    calendarId: tenant.googleCalendarId,
    resource: event
  });
}
```

#### b) **Mailchimp/SendGrid**
```typescript
// Sync membres vers Mailchimp
async function syncMembersToMailchimp(tenantId: string) {
  const users = await prisma.user.findMany({
    where: { tenantId, actif: true }
  });
  
  const listId = await getTenantMailchimpList(tenantId);
  
  for (const user of users) {
    await mailchimp.lists.addListMember(listId, {
      email_address: user.email,
      status: 'subscribed',
      merge_fields: {
        FNAME: user.firstName,
        LNAME: user.lastName
      }
    });
  }
}
```

#### c) **Zapier Integration**
- Exposer API publique (déjà fait ci-dessus)
- Créer triggers Zapier
- Documentation pour utilisateurs

### 4.4 Mobile PWA
**Fichiers à créer :**
```
platform-webapp/public/manifest.json
platform-webapp/src/service-worker.ts
platform-webapp/src/hooks/useInstallPrompt.ts
```

**manifest.json :**
```json
{
  "name": "ClubManager",
  "short_name": "ClubManager",
  "description": "Gestion complète de votre club sportif",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker (Cache-First) :**
```typescript
// Service worker pour mode offline
const CACHE_NAME = 'clubmanager-v1';
const OFFLINE_URL = '/offline.html';

const CACHED_URLS = [
  '/',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_URLS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
```

**Push Notifications :**
```typescript
// Demander permission
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    
    await savePushSubscription(subscription);
  }
}
```

### 4.5 Analytics Avancées
**Fichiers à créer :**
```
platform-webapp/src/analytics/tracker.ts
platform-api/src/services/analyticsService.ts
```

**Métriques à tracker :**

#### Côté Tenant (Dashboard Club)
```typescript
interface TenantMetrics {
  // Membres
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  churnRate: number;
  
  // Financier
  monthlyRevenue: number;
  pendingPayments: number;
  averageRevenuePerMember: number;
  
  // Engagement
  courseAttendanceRate: number;
  averageCoursesPerMember: number;
  messagesSent: number;
  
  // Boutique
  ordersThisMonth: number;
  totalSales: number;
  topProducts: Product[];
}
```

#### Côté Admin (Dashboard Plateforme)
```typescript
interface PlatformMetrics {
  // Business
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  ltv: number; // Lifetime Value
  
  // Tenants
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  
  // Technique
  apiRequestsPerDay: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}
```

**Stockage Analytics :**
```prisma
model MetricSnapshot {
  id          String   @id @default(cuid())
  tenantId    String?  @map("tenant_id") // Null pour métriques globales
  metricType  String   @map("metric_type") @db.VarChar(100)
  value       Json     // Flexible pour différents types
  timestamp   DateTime @default(now())
  
  @@index([tenantId, metricType, timestamp])
  @@map("metric_snapshots")
}
```

---

## **PHASE 5 : Migration AWS S3** ☁️
**Durée estimée :** 2-3 semaines  
**Priorité :** HAUTE (selon infrastructure actuelle)

### 5.1 Configuration S3
**Buckets à créer :**
```
clubmanager-frontend/          # Frontend statique
├── index.html
├── static/
└── assets/

clubmanager-files-{env}/       # Fichiers utilisateurs
├── tenant-{id}/
│   ├── profiles/
│   ├── courses/
│   └── shop/

clubmanager-backups/           # Backups DB
└── {date}/
    └── clubmanager-backup.sql
```

**Politique S3 - Fichiers Users :**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TenantIsolation",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::clubmanager-files/tenant-*/*",
      "Condition": {
        "StringLike": {
          "aws:userid": "tenant-${aws:principalTag/tenantId}/*"
        }
      }
    }
  ]
}
```

### 5.2 Upload Service
**Fichiers à créer :**
```
platform-api/src/services/s3Service.ts
platform-api/src/routes/uploads.ts
```

**Implémentation :**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3Service {
  private s3: S3Client;
  
  constructor() {
    this.s3 = new S3Client({ region: process.env.AWS_REGION });
  }
  
  // Upload direct avec streaming
  async uploadFile(
    tenantId: string,
    category: string,
    file: Express.Multer.File
  ): Promise<string> {
    const key = `tenant-${tenantId}/${category}/${Date.now()}-${file.originalname}`;
    
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_FILES_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        tenantId,
        uploadedBy: req.user.id.toString()
      }
    }));
    
    return key;
  }
  
  // Génération URL signée pour upload client
  async getUploadUrl(
    tenantId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    const key = `tenant-${tenantId}/temp/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_FILES_BUCKET,
      Key: key,
      ContentType: contentType
    });
    
    return getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5min
  }
  
  // Obtenir URL publique (avec CloudFront)
  getPublicUrl(key: string): string {
    return `${process.env.CLOUDFRONT_URL}/${key}`;
  }
}
```

### 5.3 CloudFront Configuration
```yaml
# infrastructure/cloudfront-files.yml
Origins:
  - Id: s3-files
    DomainName: clubmanager-files.s3.amazonaws.com
    S3OriginConfig:
      OriginAccessIdentity: !Ref CloudFrontOAI

DefaultCacheBehavior:
  TargetOriginId: s3-files
  ViewerProtocolPolicy: redirect-to-https
  CachePolicyId: Managed-CachingOptimized
  
  # Headers pour CORS
  ResponseHeadersPolicyId: !Ref CorsHeadersPolicy

CorsHeadersPolicy:
  CustomHeadersConfig:
    Items:
      - Header: Access-Control-Allow-Origin
        Value: '*'
      - Header: Access-Control-Allow-Methods
        Value: 'GET,HEAD,OPTIONS'
```

**Coûts S3 estimés :**
- Stockage : $0.023/GB/mois
- Transfert : $0.09/GB sortant
- Requêtes : $0.0004/1000 GET
- **Total estimé pour 50 clubs :** $10-30/mois

---

## **PHASE 6 : Internationalisation** 🌍
**Durée estimée :** 3-4 semaines  
**Priorité :** BASSE

### 6.1 Configuration i18n
**Fichiers à créer :**
```
platform-webapp/src/i18n/
├── config.ts
├── locales/
│   ├── fr.json
│   ├── en.json
│   ├── es.json
│   └── de.json
```

**Configuration :**
```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

**Fichier de traduction :**
```json
// locales/fr.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier"
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "email": "Adresse email",
    "password": "Mot de passe"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "welcome": "Bienvenue {{name}}"
  }
}
```

**Utilisation :**
```typescript
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation();
  
  return (
    <form>
      <label>{t('auth.email')}</label>
      <input type="email" />
      
      <button>{t('auth.login')}</button>
    </form>
  );
}
```

### 6.2 Multi-Currency
**Schema Prisma :**
```prisma
model Tenant {
  // ... champs existants
  currency    String   @default("EUR") @db.VarChar(3)
  locale      String   @default("fr-FR") @db.VarChar(10)
  timezone    String   @default("Europe/Paris") @db.VarChar(50)
}
```

**Formatage devises :**
```typescript
function formatCurrency(amount: number, tenant: Tenant): string {
  return new Intl.NumberFormat(tenant.locale, {
    style: 'currency',
    currency: tenant.currency
  }).format(amount);
}

// Usage
formatCurrency(49.99, tenant) // "49,99 €" (FR) ou "$49.99" (US)
```

---

## 📊 Estimations Globales

### **Coûts Infrastructure par Phase**

| Phase | AWS Services | Coût Mensuel Estimé |
|-------|-------------|---------------------|
| **Phase 1** | RDS + S3 + CloudFront | $40-70 |
| **Phase 2** | + Stripe fees (2.9% + $0.30) | Variable |
| **Phase 3** | + Redis + Monitoring | $65-120 |
| **Phase 4** | + API Gateway + Lambda | $80-150 |
| **Phase 5** | S3 files + CloudFront | $90-180 |
| **Total Production** | Tous services | **$90-180/mois** |

**Pour 50 clubs @ $29.99/mois = $1,499/mois**  
**Marge brute : ~85-90%**

### **Temps de Développement**

| Phase | Durée | Développeurs |
|-------|-------|--------------|
| Phase 1 - Sécurité | 6 semaines | 1-2 devs |
| Phase 2 - Billing | 8 semaines | 1-2 devs |
| Phase 3 - Performance | 8 semaines | 1 dev |
| Phase 4 - Features | 12 semaines | 2 devs |
| Phase 5 - Migration S3 | 3 semaines | 1 dev |
| Phase 6 - i18n | 4 semaines | 1 dev |
| **TOTAL** | **~9 mois** | **1-2 devs** |

---

## ✅ Checklist de Lancement

### **Avant Lancement Bêta**
- [ ] Health checks implémentés
- [ ] Audit logging fonctionnel
- [ ] Rate limiting actif
- [ ] Tests d'isolation passent à 100%
- [ ] Backups automatiques configurés
- [ ] Monitoring basique (logs + métriques)
- [ ] Error tracking (Sentry)
- [ ] Documentation API de base

### **Avant Lancement Production**
- [ ] Stripe intégration complète
- [ ] Webhooks Stripe testés
- [ ] Portail client fonctionnel
- [ ] Super admin dashboard opérationnel
- [ ] Redis caching déployé
- [ ] CDN CloudFront configuré
- [ ] Load testing effectué (>100 req/s)
- [ ] Plan de disaster recovery documenté
- [ ] Uptime monitoring (UptimeRobot/Pingdom)
- [ ] Support client mis en place

### **Pour Scale (>100 tenants)**
- [ ] Read replicas activées
- [ ] APM professionnel (DataDog)
- [ ] Database query optimization
- [ ] Auto-scaling configuré
- [ ] Multi-region deployment
- [ ] Advanced analytics
- [ ] 24/7 monitoring
- [ ] SLA définis

---

## 🎯 Recommandations Prioritaires

### **À Faire MAINTENANT (Avant tout client payant)**
1. ✅ **Health Checks** - 1-2 jours
2. ✅ **Audit Logging** - 3-4 jours
3. ✅ **Rate Limiting** - 2-3 jours
4. ✅ **Backups automatiques** - 2 jours
5. ✅ **Error tracking (Sentry)** - 1 jour

**Temps total : ~2 semaines**

### **À Faire RAPIDEMENT (Premier mois)**
1. ✅ **Monitoring basique** (logs structurés)
2. ✅ **Tests d'isolation**
3. ✅ **Intégration Stripe MVP**
4. ✅ **Portail billing basique**

**Temps total : ~6 semaines**

### **Peut Attendre (Après premiers clients)**
- API publique
- Webhooks sortants
- Intégrations tierces
- Mobile PWA
- Multi-langues

---

## 📚 Ressources & Documentation

### **Technologies Recommandées**
- **Monitoring :** DataDog, Grafana Cloud, New Relic
- **Error Tracking :** Sentry
- **Caching :** Redis (AWS ElastiCache)
- **CDN :** CloudFront, Cloudflare
- **Billing :** Stripe, Paddle
- **Email :** SendGrid, AWS SES
- **SMS :** Twilio
- **Analytics :** Mixpanel, Amplitude
- **Documentation API :** Swagger/OpenAPI, Postman

### **Lectures Essentielles**
- [Stripe SaaS Best Practices](https://stripe.com/docs/billing/subscriptions/overview)
- [Multi-Tenancy Database Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)
- [AWS SaaS Architecture](https://aws.amazon.com/saas/)
- [The Twelve-Factor App](https://12factor.net/)

---

## 🚀 Prochaines Actions

1. **Revoir ce roadmap** avec l'équipe technique
2. **Prioriser** selon ressources disponibles
3. **Créer tickets** dans gestionnaire de projet
4. **Définir sprints** (recommandé : sprints 2 semaines)
5. **Commencer Phase 1** (Sécurité & Stabilité)

---

**Questions ? Besoin d'aide sur une phase spécifique ?**

Ce roadmap est un guide évolutif. Ajustez selon vos besoins business et ressources.

**Bonne chance avec ClubManager ! 🎉**