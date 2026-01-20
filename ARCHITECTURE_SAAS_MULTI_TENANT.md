# 🏢 Architecture SaaS Multi-Tenant - ClubManager

**Objectif :** Transformer ClubManager en plateforme SaaS pour servir plusieurs clubs  
**Modèle :** Un déploiement → Plusieurs clubs (multi-tenant)  
**Coût cible :** $50-100/mois pour 10-50 clubs  
**Scalabilité :** Jusqu'à 1000+ clubs sur la même infrastructure

---

## 🎯 Pourquoi S3 est Parfait pour un SaaS

✅ **Un seul frontend** qui sert tous les clubs  
✅ **Personnalisation dynamique** (logo, couleurs par club)  
✅ **CDN global** → Performance mondiale  
✅ **Coût fixe** → Pas de surcoût par club  
✅ **Zéro maintenance** → Pas de serveur frontend

---

## 🏗️ Architecture SaaS Recommandée

```
┌─────────────────────────────────────────────────────────┐
│  👥 UTILISATEURS (Plusieurs Clubs)                      │
│  club1.votreplateforme.com                              │
│  club2.votreplateforme.com                              │
│  club3.votreplateforme.com                              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  🌐 CloudFront (CDN Global)                             │
│  - Un seul frontend pour tous                           │
│  - Routing par sous-domaine                             │
│  - SSL wildcard (*.votreplateforme.com)                 │
│  Coût: $5-10/mois (tous clubs confondus)               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  📦 S3 - Frontend Unique                                │
│  - Build React avec branding dynamique                  │
│  - Chargement config club au démarrage                  │
│  Coût: $1-3/mois                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  🚀 Backend API (Multi-Tenant)                          │
│  - Lambda OU EC2 unique                                 │
│  - Middleware tenant_id extraction                      │
│  - Isolation données par club                           │
│  Coût: $10-30/mois (Lambda) ou $12-20/mois (EC2)       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  🗄️ RDS MySQL - Multi-Tenant                           │
│  - Une seule base de données                            │
│  - tenant_id dans chaque table                          │
│  - Row-Level Security                                   │
│  Coût: $15-40/mois selon taille                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  📸 S3 Fichiers - Partitionnés                          │
│  - clubmanager-files/club-1/...                         │
│  - clubmanager-files/club-2/...                         │
│  - Isolation par préfixe                                │
│  Coût: $3-10/mois                                       │
└─────────────────────────────────────────────────────────┘

💰 COÛT TOTAL: $40-85/mois pour 10-100 clubs
💰 COÛT PAR CLUB: $0.40-8.50/mois (économie d'échelle)
```

---

## 📊 Stratégies Multi-Tenant

### **Option 1 : Shared Database (Recommandé) - Le Plus Économique**

**Architecture :**
- ✅ Une seule base de données MySQL
- ✅ Toutes les tables ont un champ `tenant_id` (ou `club_id`)
- ✅ Middleware automatique qui filtre par club

**Avantages :**
- 💰 Très économique ($15-30/mois pour tous les clubs)
- 🚀 Facile à maintenir (une seule DB)
- ⚡ Performance excellente avec bons index
- 🔄 Backups simples

**Inconvénients :**
- ⚠️ Risque théorique de fuite de données (nécessite bonne isolation)
- ⚠️ Requêtes doivent TOUJOURS filtrer par tenant_id

**Implémentation :**

```sql
-- Modification des tables existantes
ALTER TABLE utilisateurs ADD COLUMN tenant_id INT NOT NULL;
ALTER TABLE cours ADD COLUMN tenant_id INT NOT NULL;
ALTER TABLE inscriptions ADD COLUMN tenant_id INT NOT NULL;
ALTER TABLE paiements ADD COLUMN tenant_id INT NOT NULL;

-- Index pour performance
CREATE INDEX idx_utilisateurs_tenant ON utilisateurs(tenant_id);
CREATE INDEX idx_cours_tenant ON cours(tenant_id);

-- Table des tenants (clubs)
CREATE TABLE tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- club-jjb-paris
  nom VARCHAR(255) NOT NULL,
  domaine VARCHAR(255),                -- club-jjb-paris.votreplateforme.com
  logo_url VARCHAR(500),
  couleur_primaire VARCHAR(7),         -- #FF5733
  couleur_secondaire VARCHAR(7),
  stripe_account_id VARCHAR(100),      -- Connect pour paiements isolés
  plan VARCHAR(50) DEFAULT 'free',     -- free, basic, premium
  status ENUM('active', 'suspended', 'trial') DEFAULT 'trial',
  max_membres INT DEFAULT 50,
  expire_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contraintes de foreign key
ALTER TABLE utilisateurs 
  ADD CONSTRAINT fk_users_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
```

```javascript
// Middleware Express pour extraire tenant_id
// api/src/middleware/tenantMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { getTenantByDomain, getTenantBySlug } from '../services/TenantService';

declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
      tenant?: any;
    }
  }
}

export async function extractTenant(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Méthode 1: Par sous-domaine (club1.votreplateforme.com)
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    
    // Méthode 2: Par header custom (mobile app)
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    
    // Méthode 3: Par JWT (user déjà authentifié)
    const userTenantId = req.user?.tenant_id;

    let tenant;

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenant = await getTenantByDomain(host);
    } else if (tenantSlug) {
      tenant = await getTenantBySlug(tenantSlug);
    } else if (userTenantId) {
      tenant = await getTenantById(userTenantId);
    }

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        message: 'Club non trouvé ou inactif'
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ 
        error: 'Tenant suspended',
        message: 'Ce club est suspendu. Contactez le support.'
      });
    }

    // Attacher au request
    req.tenantId = tenant.id;
    req.tenant = tenant;
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Wrapper pour requêtes DB avec isolation automatique
export function withTenant(query: string, tenantId: number): string {
  // Ajouter automatiquement WHERE tenant_id = ?
  if (query.toLowerCase().includes('where')) {
    return query.replace(/WHERE/i, `WHERE tenant_id = ${tenantId} AND`);
  } else {
    return query + ` WHERE tenant_id = ${tenantId}`;
  }
}
```

```javascript
// Utilisation dans les routes
// api/src/routes/cours.ts

import { Router } from 'express';
import { extractTenant } from '../middleware/tenantMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Appliquer middleware tenant sur toutes les routes
router.use(extractTenant);
router.use(authenticateToken);

// Les cours sont automatiquement filtrés par tenant_id
router.get('/cours', async (req, res) => {
  const tenantId = req.tenantId!;
  
  // Requête automatiquement isolée
  const cours = await db.query(
    'SELECT * FROM cours WHERE tenant_id = ? AND actif = 1',
    [tenantId]
  );
  
  res.json(cours);
});

router.post('/cours', async (req, res) => {
  const tenantId = req.tenantId!;
  const { nom, description, capacite_max } = req.body;
  
  // Insertion avec tenant_id automatique
  const result = await db.query(
    'INSERT INTO cours (tenant_id, nom, description, capacite_max) VALUES (?, ?, ?, ?)',
    [tenantId, nom, description, capacite_max]
  );
  
  res.json({ id: result.insertId });
});

export default router;
```

---

### **Option 2 : Database per Tenant - Plus Sécurisé mais Coûteux**

**Architecture :**
- Une base de données RDS par club
- Isolation totale des données
- Connexion dynamique selon le tenant

**Coût :** $15/mois × nombre de clubs = **$150/mois pour 10 clubs** ❌

**Non recommandé** pour débuter, mais utile pour très gros clients.

---

### **Option 3 : Schema per Tenant - Compromis**

**Architecture :**
- Une seule instance RDS MySQL
- Un schéma PostgreSQL par club (ou plusieurs DB MySQL)
- Bonne isolation avec coût raisonnable

```sql
-- Créer un schéma par club
CREATE DATABASE club_jjb_paris;
CREATE DATABASE club_judo_lyon;

-- Connexion dynamique
const connection = await mysql.createConnection({
  host: RDS_ENDPOINT,
  user: 'admin',
  password: DB_PASSWORD,
  database: `club_${tenantSlug.replace('-', '_')}`
});
```

**Coût :** $15-40/mois pour 10-50 clubs (selon taille instance)

---

## 🎨 Frontend Multi-Tenant avec S3

### **Approche 1 : Build Unique avec Branding Dynamique (Recommandé)**

```typescript
// front-end/src/config/tenant.ts

interface TenantConfig {
  id: number;
  slug: string;
  nom: string;
  logo: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  features: string[];
}

let cachedTenant: TenantConfig | null = null;

export async function loadTenantConfig(): Promise<TenantConfig> {
  if (cachedTenant) return cachedTenant;

  // Extraire le sous-domaine
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];

  // Charger config depuis API
  const response = await fetch(`${API_URL}/api/tenant/${subdomain}`);
  
  if (!response.ok) {
    throw new Error('Tenant non trouvé');
  }

  cachedTenant = await response.json();
  
  // Appliquer le thème
  applyTheme(cachedTenant);
  
  return cachedTenant;
}

function applyTheme(tenant: TenantConfig) {
  document.documentElement.style.setProperty('--color-primary', tenant.couleurPrimaire);
  document.documentElement.style.setProperty('--color-secondary', tenant.couleurSecondaire);
  
  // Changer le titre et favicon
  document.title = tenant.nom;
  
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    favicon.href = tenant.logo;
  }
}
```

```typescript
// front-end/src/App.tsx

import { useEffect, useState } from 'react';
import { loadTenantConfig } from './config/tenant';

function App() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenantConfig()
      .then(setTenant)
      .catch(error => {
        console.error('Erreur chargement tenant:', error);
        // Rediriger vers page d'erreur
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="app">
      <header>
        <img src={tenant.logo} alt={tenant.nom} />
        <h1>{tenant.nom}</h1>
      </header>
      {/* Reste de l'app */}
    </div>
  );
}
```

**Avantages :**
- ✅ Un seul build S3 → économique
- ✅ Déploiement instantané pour tous les clubs
- ✅ Maintenance simplifiée

---

### **Approche 2 : Build Séparé par Club (Non Recommandé)**

```bash
# Build pour chaque club
npm run build -- --mode club-paris
npm run build -- --mode club-lyon

# Upload sur S3 séparés
aws s3 sync dist/ s3://clubmanager-frontend-paris/
aws s3 sync dist/ s3://clubmanager-frontend-lyon/
```

**Inconvénients :**
- ❌ Coût × nombre de clubs
- ❌ Maintenance complexe (déployer 50 fois)

---

## 💳 Monétisation & Plans

### Table des Plans

```sql
CREATE TABLE subscription_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  prix_mensuel DECIMAL(10,2),
  max_membres INT,
  max_cours INT,
  features JSON,  -- ["paiements_en_ligne", "boutique", "notifications"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (nom, slug, prix_mensuel, max_membres, features) VALUES
('Free', 'free', 0, 20, '["base"]'),
('Basic', 'basic', 29, 100, '["paiements", "notifications"]'),
('Pro', 'pro', 79, 500, '["paiements", "boutique", "notifications", "analytics"]'),
('Enterprise', 'enterprise', 199, 99999, '["tout"]');

-- Associer à un tenant
ALTER TABLE tenants ADD COLUMN plan_id INT;
ALTER TABLE tenants ADD CONSTRAINT fk_tenant_plan 
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
```

### Middleware de Limitation

```javascript
// api/src/middleware/planLimitMiddleware.ts

export function checkPlanLimit(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenant = req.tenant;
    
    // Vérifier si feature disponible dans le plan
    if (!tenant.features.includes(feature)) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `Cette fonctionnalité n'est pas disponible dans votre plan ${tenant.plan}`,
        upgrade_url: '/upgrade'
      });
    }

    // Vérifier limite de membres
    if (feature === 'add_member') {
      const currentMembers = await getMemberCount(tenant.id);
      if (currentMembers >= tenant.max_membres) {
        return res.status(403).json({
          error: 'Member limit reached',
          message: `Limite de ${tenant.max_membres} membres atteinte. Passez au plan supérieur.`,
          upgrade_url: '/upgrade'
        });
      }
    }

    next();
  };
}

// Utilisation
router.post('/membres', 
  extractTenant,
  checkPlanLimit('add_member'),
  async (req, res) => {
    // Ajouter membre
  }
);
```

---

## 🔐 Sécurité Multi-Tenant

### 1. Isolation des Données

```javascript
// TOUJOURS filtrer par tenant_id
// ❌ DANGEREUX
const user = await db.query('SELECT * FROM utilisateurs WHERE id = ?', [userId]);

// ✅ SÉCURISÉ
const user = await db.query(
  'SELECT * FROM utilisateurs WHERE id = ? AND tenant_id = ?', 
  [userId, req.tenantId]
);
```

### 2. Tests d'Isolation

```javascript
// tests/security/tenant-isolation.test.ts

describe('Tenant Isolation', () => {
  it('should not allow access to other tenant data', async () => {
    const tenant1User = await createUser({ tenant_id: 1 });
    const tenant2User = await createUser({ tenant_id: 2 });

    // Tenant 1 essaie d'accéder aux données de Tenant 2
    const response = await request(app)
      .get(`/api/utilisateurs/${tenant2User.id}`)
      .set('Authorization', `Bearer ${tenant1User.token}`)
      .set('Host', 'club1.votreplateforme.com');

    expect(response.status).toBe(404); // Pas 403, pour ne pas révéler l'existence
  });
});
```

### 3. Rate Limiting par Tenant

```javascript
import rateLimit from 'express-rate-limit';

const createTenantRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyGenerator: (req) => {
      return `${req.tenantId}:${req.ip}`; // Limiter par tenant ET IP
    },
    message: 'Trop de requêtes de ce club. Réessayez plus tard.'
  });
};

app.use('/api', createTenantRateLimiter());
```

---

## 📈 Scalabilité

### Coûts Estimés par Nombre de Clubs

| Clubs | Frontend S3 | Backend | Database | Fichiers S3 | **Total/mois** | **$/club** |
|-------|-------------|---------|----------|-------------|----------------|------------|
| 1 | $2 | $7 | $15 | $2 | **$26** | $26 |
| 10 | $3 | $12 | $20 | $5 | **$40** | $4 |
| 50 | $5 | $20 | $40 | $15 | **$80** | $1.60 |
| 100 | $8 | $30 | $80 | $25 | **$143** | $1.43 |
| 500 | $15 | $100 | $200 | $80 | **$395** | $0.79 |

**Économie d'échelle impressionnante !** 🚀

### Quand Scaler ?

```javascript
// Monitoring automatique
// api/src/services/ScalingService.ts

export class ScalingService {
  async checkAndScale() {
    const metrics = await this.getMetrics();

    // CPU > 80% pendant 5 min → Scaler
    if (metrics.cpu > 80 && metrics.duration > 300) {
      await this.scaleUp();
    }

    // Connexions DB > 80% → Upgrade RDS
    if (metrics.dbConnections / metrics.maxConnections > 0.8) {
      await this.notifyAdmin('Upgrade RDS recommandé');
    }

    // Plus de 100 clubs → Considérer sharding
    const tenantCount = await this.getTenantCount();
    if (tenantCount > 100) {
      await this.considerSharding();
    }
  }
}
```

---

## 🚀 Déploiement SaaS

### Configuration DNS Wildcard

```bash
# Route 53 - Enregistrement wildcard
*.votreplateforme.com → CloudFront Distribution

# Certificat SSL wildcard
aws acm request-certificate \
  --domain-name "*.votreplateforme.com" \
  --validation-method DNS \
  --region us-east-1
```

### Onboarding Nouveau Club

```javascript
// api/src/routes/onboarding.ts

router.post('/signup', async (req, res) => {
  const { nom_club, email, slug } = req.body;

  try {
    // 1. Créer le tenant
    const tenant = await db.query(
      `INSERT INTO tenants (slug, nom, status, plan_id, expire_at) 
       VALUES (?, ?, 'trial', 1, DATE_ADD(NOW(), INTERVAL 14 DAY))`,
      [slug, nom_club]
    );

    // 2. Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    await db.query(
      `INSERT INTO utilisateurs (tenant_id, email, password, role) 
       VALUES (?, ?, ?, 'admin')`,
      [tenant.insertId, email, hashedPassword]
    );

    // 3. Créer structure S3
    await s3.putObject({
      Bucket: 'clubmanager-files',
      Key: `club-${tenant.insertId}/.keep`,
      Body: ''
    });

    // 4. Envoyer email de bienvenue
    await sendWelcomeEmail(email, {
      club_url: `https://${slug}.votreplateforme.com`,
      password: randomPassword
    });

    res.json({
      success: true,
      tenant_id: tenant.insertId,
      url: `https://${slug}.votreplateforme.com`,
      trial_days: 14
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur création compte' });
  }
});
```

---

## 📊 Analytics & Monitoring Multi-Tenant

```javascript
// Dashboard admin - Métriques globales
router.get('/admin/metrics', isAdmin, async (req, res) => {
  const metrics = {
    total_tenants: await db.query('SELECT COUNT(*) FROM tenants'),
    active_tenants: await db.query('SELECT COUNT(*) FROM tenants WHERE status = "active"'),
    trial_tenants: await db.query('SELECT COUNT(*) FROM tenants WHERE status = "trial"'),
    revenue_monthly: await db.query(`
      SELECT SUM(sp.prix_mensuel) as total
      FROM tenants t
      JOIN subscription_plans sp ON t.plan_id = sp.id
      WHERE t.status = 'active'
    `),
    top_tenants: await db.query(`
      SELECT t.nom, COUNT(u.id) as membres
      FROM tenants t
      LEFT JOIN utilisateurs u ON t.id = u.tenant_id
      GROUP BY t.id
      ORDER BY membres DESC
      LIMIT 10
    `)
  };

  res.json(metrics);
});
```

---

## 💰 Modèle de Prix Recommandé

### Pour Vos Clients (Clubs)

| Plan | Prix/mois | Membres | Features |
|------|-----------|---------|----------|
| **Free** | 0€ | 20 | Base |
| **Basic** | 29€ | 100 | Paiements + Email |
| **Pro** | 79€ | 500 | + Boutique + SMS |
| **Enterprise** | 199€ | Illimité | + Support prioritaire |

### Votre Revenu

- 10 clubs × 29€ = **290€/mois** (coût infra: 40€) = **250€ profit**
- 50 clubs × 29€ = **1,450€/mois** (coût infra: 80€) = **1,370€ profit**
- 100 clubs × 50€ avg = **5,000€/mois** (coût infra: 150€) = **4,850€ profit**

**ROI : 95%+ de marge brute !** 🤑

---

## ✅ Checklist Lancement SaaS

- [ ] Architecture multi-tenant implémentée
- [ ] Middleware tenant_id sur toutes les routes
- [ ] Tests d'isolation sécurité
- [ ] Frontend S3 avec branding dynamique
- [ ] DNS wildcard configuré
- [ ] SSL wildcard actif
- [ ] Système de plans/abonnements
- [ ] Onboarding automatisé
- [ ] Stripe Connect pour paiements isolés
- [ ] Monitoring CloudWatch
- [ ] Dashboard admin
- [ ] Documentation API
- [ ] Page landing commerciale
- [ ] Support client (email/chat)

---

## 🎉 Résumé

**Architecture SaaS S3 :**
- ✅ **1 frontend S3** → tous les clubs ($3/mois)
- ✅ **1 backend** → multi-tenant ($10-30/mois)
- ✅ **1 base de données** → avec tenant_id ($15-40/mois)
- ✅ **S3 fichiers** → partitionnés par club ($5-20/mois)

**Total : $40-90/mois pour 10-100 clubs**

**Revenu potentiel : 1,000-5,000€/mois**

**Marge : 95%+ 🚀**

---

**Prêt à lancer votre SaaS ?** 💪