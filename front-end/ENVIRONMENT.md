# 🔐 Environment Variables Configuration

Documentation complète des variables d'environnement pour ClubManager Front-End.

---

## 📋 Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Variables Requises](#variables-requises)
- [Variables Optionnelles](#variables-optionnelles)
- [Configuration par Environnement](#configuration-par-environnement)
- [Validation et Sécurité](#validation-et-sécurité)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Le projet utilise un **système de configuration centralisé** (`src/core/config/env.ts`) qui :

- ✅ Valide les variables d'environnement avec **Zod**
- ✅ Fournit un accès **type-safe** à toutes les variables
- ✅ Détecte les erreurs de configuration **au démarrage**
- ✅ Supporte plusieurs environnements (dev, prod, test)
- ✅ Évite les clés API hardcodées dans le code

### Usage

```typescript
import { env, isDev, isProd } from '@/core/config/env';

// Accès type-safe aux variables
console.log(env.stripe.publicKey);
console.log(env.api.baseUrl);

// Helpers
if (isDev) {
  console.log('Mode développement');
}
```

---

## 🔑 Variables Requises

Ces variables **DOIVENT** être définies dans votre fichier `.env.local` ou `.env.production`.

### 1. **VITE_STRIPE_PUBLIC_KEY**

**Description :** Clé publique Stripe pour les paiements

**Format :** `pk_test_...` (test) ou `pk_live_...` (production)

**Exemple :**
```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
```

**Où l'obtenir :**
1. Créer un compte sur [stripe.com](https://stripe.com)
2. Aller dans **Developers** → **API Keys**
3. Copier la **Publishable key**

**⚠️ Important :**
- **NE JAMAIS** committer cette clé dans Git
- Utiliser une clé **test** (`pk_test_`) en développement
- Utiliser une clé **live** (`pk_live_`) en production

---

### 2. **VITE_API_BASE_URL**

**Description :** URL de base de l'API GraphQL

**Format :** URL complète avec protocole

**Exemple :**
```bash
# Développement local
VITE_API_BASE_URL=http://localhost:4000

# Production
VITE_API_BASE_URL=https://api.clubmanager.com
```

**Valeur par défaut :** `https://clubmanagment.com/` (si non définie)

---

## 🎨 Variables Optionnelles

Ces variables ont des valeurs par défaut mais peuvent être personnalisées.

### 3. **VITE_APP_NAME**

**Description :** Nom de l'application affiché dans l'interface

**Défaut :** `"ClubManager"`

**Exemple :**
```bash
VITE_APP_NAME=ClubManager Pro
```

---

### 4. **VITE_APP_VERSION**

**Description :** Version de l'application

**Défaut :** `"1.0.0"`

**Exemple :**
```bash
VITE_APP_VERSION=2.1.0
```

---

### 5. **VITE_API_TIMEOUT**

**Description :** Timeout des requêtes API en millisecondes

**Défaut :** `30000` (30 secondes)

**Exemple :**
```bash
VITE_API_TIMEOUT=60000  # 60 secondes
```

---

### 6. **VITE_SENTRY_DSN**

**Description :** DSN Sentry pour le suivi des erreurs (production)

**Format :** URL Sentry

**Exemple :**
```bash
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
```

**Où l'obtenir :**
1. Créer un projet sur [sentry.io](https://sentry.io)
2. Aller dans **Settings** → **Projects** → **Client Keys (DSN)**

---

### 7. **Feature Flags**

#### VITE_USE_MOCKS

**Description :** Activer les mocks API (utile pour le développement sans backend)

**Défaut :** `true` en dev, `false` en prod

**Exemple :**
```bash
VITE_USE_MOCKS=true
```

#### VITE_ENABLE_DEVTOOLS

**Description :** Activer les outils de développement (Redux DevTools, etc.)

**Défaut :** `true` en dev, `false` en prod

**Exemple :**
```bash
VITE_ENABLE_DEVTOOLS=true
```

#### VITE_ENABLE_ANALYTICS

**Description :** Activer Google Analytics / Matomo

**Défaut :** `false` en dev, `true` en prod

**Exemple :**
```bash
VITE_ENABLE_ANALYTICS=true
```

#### VITE_ENABLE_ERROR_TRACKING

**Description :** Activer Sentry error tracking

**Défaut :** `false` en dev, `true` en prod

**Exemple :**
```bash
VITE_ENABLE_ERROR_TRACKING=true
```

---

## 🌍 Configuration par Environnement

### Development (`.env.development`)

```bash
# API
VITE_API_BASE_URL=http://localhost:4000

# Stripe (clé TEST uniquement)
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_test

# Features
VITE_USE_MOCKS=false
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false

# Sentry (optionnel en dev)
# VITE_SENTRY_DSN=
```

---

### Production (`.env.production`)

```bash
# API
VITE_API_BASE_URL=https://api.clubmanager.com

# Stripe (clé LIVE - SENSIBLE !)
VITE_STRIPE_PUBLIC_KEY=pk_live_votre_cle_production

# App
VITE_APP_VERSION=2.1.0

# Features
VITE_USE_MOCKS=false
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Sentry (REQUIS en production)
VITE_SENTRY_DSN=https://abc@o123.ingest.sentry.io/456
```

---

### Test (`.env.test`)

```bash
# API (mock)
VITE_API_BASE_URL=http://localhost:4000

# Stripe (clé de test fictive)
VITE_STRIPE_PUBLIC_KEY=pk_test_mock_key_for_testing

# Features
VITE_USE_MOCKS=true
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

---

## 🔒 Validation et Sécurité

### Validation Automatique

Le fichier `src/core/config/env.ts` valide **automatiquement** toutes les variables au démarrage :

```typescript
// ✅ Validation Zod
const stripeConfigSchema = z.object({
  publicKey: z
    .string()
    .min(1, "VITE_STRIPE_PUBLIC_KEY is required")
    .startsWith("pk_", "Stripe public key must start with pk_"),
  isTestMode: z.boolean(),
  account: z.string().optional(),
});
```

**Si une variable est invalide :**
- ❌ En **production** : l'application **crash** au démarrage
- ⚠️ En **développement** : warning dans la console

---

### Sécurité

#### ✅ Bonnes Pratiques

1. **Ne jamais committer** les fichiers `.env.local` ou `.env.production`
2. Utiliser `.env.example` comme **template**
3. Stocker les clés de production dans un **gestionnaire de secrets** (Vault, AWS Secrets Manager, etc.)
4. Utiliser des **clés test** en développement
5. Rotationner les clés régulièrement

#### ❌ À Éviter

```typescript
// ❌ MAUVAIS : Hardcoder une clé API
const stripeKey = "pk_test_abc123...";

// ✅ BON : Utiliser le système env
const stripeKey = env.stripe.publicKey;
```

---

### Vérification des Clés

Le système vérifie automatiquement :

```typescript
// ⚠️ Warning si clé test en production
if (isProd && env.stripe.isTestMode) {
  logger.warn("WARNING: Using Stripe TEST key in PRODUCTION mode!");
}
```

---

## 🛠️ Troubleshooting

### Erreur : "VITE_STRIPE_PUBLIC_KEY is required"

**Cause :** La variable n'est pas définie dans votre fichier `.env`

**Solution :**
```bash
# 1. Créer un fichier .env.local
cp .env.example .env.local

# 2. Ajouter votre clé Stripe
echo "VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle" >> .env.local

# 3. Redémarrer le serveur
npm run dev
```

---

### Les variables ne se chargent pas

**Vérifications :**

1. Le fichier `.env` est bien à la **racine du projet** (à côté de `package.json`)
2. Les variables commencent par `VITE_` (requis par Vite)
3. Le serveur a été **redémarré** après modification du `.env`

```bash
# Redémarrer le serveur
Ctrl+C
npm run dev
```

---

### Warning "Using Stripe TEST key in PRODUCTION"

**Cause :** Vous utilisez une clé de test (`pk_test_`) alors que `NODE_ENV=production`

**Solution :**
```bash
# Remplacer par une clé LIVE
VITE_STRIPE_PUBLIC_KEY=pk_live_votre_cle_production
```

---

### Les paiements ne fonctionnent pas

**Vérifications :**

1. La clé Stripe est correcte :
```typescript
import { env } from '@/core/config/env';
console.log('Stripe key:', env.stripe.publicKey);
console.log('Test mode:', env.stripe.isTestMode);
```

2. Le compte Stripe est activé (pas en mode "restricted")

3. La clé correspond à l'environnement :
   - `pk_test_` → Développement
   - `pk_live_` → Production

---

### Débugger la configuration

Utiliser le composant `StartupHealthCheck` :

```typescript
import { StartupHealthCheck } from '@/shared/components/debug/StartupHealthCheck';

// Dans votre App.tsx (temporairement)
<StartupHealthCheck />
```

Ou en console :

```typescript
import { env } from '@/core/config/env';

console.log('Environment:', env.app.environment);
console.log('Stripe:', env.stripe);
console.log('API:', env.api);
console.log('Features:', env.features);
```

---

## 📚 Ressources

### Documentation Officielle

- **Vite Env Variables** : https://vitejs.dev/guide/env-and-mode.html
- **Stripe Keys** : https://stripe.com/docs/keys
- **Sentry DSN** : https://docs.sentry.io/product/sentry-basics/dsn-explainer/

### Fichiers Pertinents

```
ClubManager/front-end/
├── .env.example              # Template des variables
├── .env.local                # Variables locales (gitignored)
├── .env.development          # Variables de dev
├── .env.production           # Variables de prod
├── .env.test                 # Variables de test
├── src/core/config/
│   ├── env.ts                # Système de configuration
│   └── index.ts              # Exports
└── ENVIRONMENT.md            # Cette documentation
```

---

## ✅ Checklist de Setup

```markdown
- [ ] Copier `.env.example` vers `.env.local`
- [ ] Obtenir une clé Stripe de test
- [ ] Ajouter `VITE_STRIPE_PUBLIC_KEY` dans `.env.local`
- [ ] Configurer `VITE_API_BASE_URL` (si backend local différent)
- [ ] Vérifier que `.env.local` est dans `.gitignore`
- [ ] Tester : `npm run dev`
- [ ] Vérifier la console pour les warnings de config
- [ ] Tester un paiement de test
```

---

## 🚀 Déploiement

### Netlify / Vercel

Configurer les variables dans l'interface web :

**Netlify :**
1. Site Settings → Build & Deploy → Environment
2. Ajouter chaque variable `VITE_*`

**Vercel :**
1. Project Settings → Environment Variables
2. Ajouter chaque variable `VITE_*`

---

### Docker

Utiliser des arguments de build :

```dockerfile
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_API_BASE_URL

ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

```bash
docker build \
  --build-arg VITE_STRIPE_PUBLIC_KEY=$STRIPE_KEY \
  --build-arg VITE_API_BASE_URL=$API_URL \
  -t clubmanager-frontend .
```

---

## 📞 Support

**Questions ?**
- Consulter `src/core/config/env.ts` pour la liste complète
- Voir `.env.example` pour un template
- Ouvrir une issue GitHub si problème persistant

---

**Dernière mise à jour :** 2024  
**Version :** 2.0.0  
**Maintenu par :** ClubManager Team