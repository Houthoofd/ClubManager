# 🏀 ClubManager - Front-End

Application React moderne pour la gestion d'un club sportif.

---

## 🚀 Quick Start

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

**Application disponible sur :** http://localhost:5173

---

## 📊 Stack Technique

- **React** 18.3.1 - UI Framework
- **TypeScript** 5.8.3 - Type Safety
- **Vite** 6.3.5 - Build Tool
- **Zustand** 5.0.11 - State Management
- **Apollo Client** 4.1.4 - GraphQL Client
- **PatternFly** 6.2.2 - UI Components
- **Sentry** 10.39.0 - Error Tracking
- **React Router** 7.6.0 - Routing

---

## 📁 Structure

```
src/
├── app/           # Configuration app (providers, router)
├── core/          # Fonctionnalités core (API, monitoring)
├── features/      # Features métier (auth, shop, users, etc.)
├── pages/         # Pages routes
├── shared/        # Composants partagés
├── store/         # Zustand stores (state global)
└── styles/        # Styles globaux
```

**Documentation complète :** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🎯 Features

### ✅ Implémenté

- ✅ **Authentification** - Login/Logout avec JWT
- ✅ **Boutique** - Panier, Produits, Checkout (Stripe)
- ✅ **Gestion Utilisateurs** - CRUD utilisateurs
- ✅ **Messagerie** - Messages internes
- ✅ **Cours** - Gestion des cours et inscriptions
- ✅ **Statistiques** - Dashboard avec graphiques
- ✅ **State Management** - Zustand (migration Redux terminée)
- ✅ **Error Tracking** - Sentry intégré

### 🔄 En Cours

- 🔄 **Tests E2E** - Playwright
- 🔄 **i18n** - Internationalisation

---

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run dev              # Lance serveur dev
npm run preview          # Preview du build

# Build
npm run build            # Build production

# Code Quality
npm run lint             # Linter ESLint
npm run lint:fix         # Fix automatique
npm run format           # Formatter Prettier
npm run format:check     # Vérifier formatting

# GraphQL
npm run codegen          # Génère types GraphQL
npm run codegen:watch    # Watch mode codegen
```

---

## ⚙️ Configuration

### Variables d'Environnement

Créer un fichier `.env.development` :

```env
# API GraphQL
VITE_API_URL=http://localhost:4000/graphql

# Sentry (optionnel en dev)
VITE_SENTRY_DSN=

# Stripe (paiements)
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

**Production :** Créer `.env.production` avec les vraies valeurs

---

## 🏗️ Architecture

### State Management (Zustand)

```typescript
import { useCartStore } from '@/store/cartStore';

const MyComponent = () => {
  const items = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  
  return <button onClick={() => addItem(product)}>Ajouter</button>;
};
```

**Stores disponibles :**
- `authStore` - Authentification (user, token)
- `cartStore` - Panier (items, quantités)
- `uiStore` - UI (notifications, thème)

### GraphQL (Apollo Client)

```typescript
import { useGetUsersQuery } from '@/core/api/apollo/generated/graphql';

const UserList = () => {
  const { data, loading } = useGetUsersQuery();
  
  if (loading) return <Spinner />;
  return <Table data={data.users} />;
};
```

**Codegen :** Types générés automatiquement depuis le schéma GraphQL

---

## 🐛 Monitoring (Sentry)

**Configuration :** [src/core/monitoring/README_SENTRY_SETUP.ts](src/core/monitoring/README_SENTRY_SETUP.ts)

En développement, Sentry est désactivé (logs console uniquement).

Pour activer en production :
1. Créer compte sur [sentry.io](https://sentry.io)
2. Ajouter `VITE_SENTRY_DSN` dans `.env.production`

---

## 🧪 Testing

```bash
# Tests unitaires (à configurer)
npm run test

# Tests E2E (à venir)
npm run test:e2e
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture complète
- **[Sentry Setup](src/core/monitoring/README_SENTRY_SETUP.ts)** - Configuration Sentry
- **[Zustand Migration](src/store/index.ts)** - Documentation migration Redux

---

## 🚦 Workflow Git

```
main (production)
  ↓
develop (staging)
  ↓
feature/xyz (branches)
```

**Commits conventionnels :**
```
feat: Add user profile page
fix: Resolve cart quantity bug
refactor: Migrate Redux to Zustand
docs: Update README
```

---

## 📦 Build & Deployment

### Build Production

```bash
npm run build
# → Génère dist/ avec assets optimisés
```

### Checklist Deployment

- [ ] Variables d'environnement configurées
- [ ] Build testé localement (`npm run preview`)
- [ ] Sentry DSN configuré (si production)
- [ ] Tests passent
- [ ] Linter sans erreurs

---

## 🤝 Contribution

### Setup Local

```bash
# 1. Clone
git clone [repository-url]
cd ClubManager/front-end

# 2. Install
npm install

# 3. Configure
cp .env.example .env.development

# 4. Run
npm run dev
```

### Avant de Commit

```bash
npm run lint:fix    # Fix linting
npm run format      # Format code
npm run build       # Vérifier build
```

---

## 🎉 Migrations Récentes

### ✅ Redux → Zustand (Phase 6)

- Migration 100% terminée
- ~30KB économisés (-66% bundle size)
- Performance améliorée
- Code simplifié

**Détails :** [src/store/index.ts](src/store/index.ts)

### ✅ Sentry Integration (Phase 5)

- Error tracking automatique
- Performance monitoring
- User context tracking
- Production ready

**Détails :** [src/core/monitoring/README_SENTRY_SETUP.ts](src/core/monitoring/README_SENTRY_SETUP.ts)

---

## 📞 Support

- **Documentation :** `docs/`
- **Issues :** GitHub Issues
- **Équipe :** ClubManager Development Team

---

## 📄 License

MIT © 2024 Odyssée Software

---

**Version :** 1.0.0  
**Dernière mise à jour :** 2024