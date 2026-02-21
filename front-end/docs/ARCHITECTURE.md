# 🏗️ ClubManager Front-End - Architecture

## Vue d'ensemble

Application React moderne pour la gestion d'un club sportif, construite avec les dernières technologies web et bonnes pratiques.

---

## 📊 Stack Technique

### **Core**
- **Framework:** React 18.3.1
- **Language:** TypeScript 5.8.3
- **Build Tool:** Vite 6.3.5
- **Package Manager:** npm

### **State Management**
- **Global State:** Zustand 5.0.11 ✅
- **Server State:** Apollo Client 4.1.4 + TanStack Query 5.0.0
- **Form State:** React Hook Form (intégré)
- **URL State:** React Router DOM 7.6.0

### **API & Data**
- **GraphQL:** Apollo Client + GraphQL Code Generator
- **REST:** Fetch API (fallback)
- **Schema:** GraphQL Schema introspection
- **Validation:** Zod 4.3.6

### **UI Framework**
- **Component Library:** PatternFly 6.2.2
- **Icons:** PatternFly Icons + React Icons 4.12.0
- **Tables:** PatternFly Table + TanStack Table 8.19.2
- **Charts:** Recharts 2.15.3

### **Routing**
- **Router:** React Router DOM 7.6.0
- **Guards:** Custom AuthGuard component
- **Lazy Loading:** React.lazy() + Suspense

### **Payment**
- **Provider:** Stripe
- **Integration:** @stripe/react-stripe-js 3.7.0

### **Monitoring & Quality**
- **Error Tracking:** Sentry 10.39.0 ✅
- **Performance:** Sentry Performance Monitoring
- **Linting:** ESLint 9.25.0
- **Formatting:** Prettier 3.2.5
- **Type Checking:** TypeScript strict mode

---

## 📁 Structure du Projet

```
front-end/
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # ← Ce fichier
│   ├── archive/                 # Fichiers archivés
│   └── README.md                # Docs additionnelles
│
├── public/                      # Assets statiques
│   ├── favicon.ico
│   └── images/
│
├── scripts/                     # Scripts utilitaires
│   └── fix-graphql-generated.cjs
│
├── src/
│   ├── app/                     # Configuration application
│   │   ├── App.tsx              # Composant racine
│   │   ├── providers.tsx        # Providers centralisés (Apollo, Query, etc.)
│   │   └── router.tsx           # Configuration routing
│   │
│   ├── assets/                  # Assets du code source
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   │
│   ├── core/                    # Fonctionnalités core
│   │   ├── api/                 # Client API
│   │   │   ├── apollo/          # Apollo Client config
│   │   │   ├── rest/            # REST API clients
│   │   │   └── graphql/         # GraphQL queries/mutations
│   │   │
│   │   ├── monitoring/          # Sentry & monitoring
│   │   │   ├── sentry.ts        # Configuration Sentry
│   │   │   ├── SentryErrorBoundary.tsx
│   │   │   └── README_SENTRY_SETUP.ts
│   │   │
│   │   └── i18n/                # Internationalisation (à venir)
│   │
│   ├── features/                # Features métier (Feature-First)
│   │   ├── auth/                # Authentification
│   │   │   ├── components/      # Composants auth
│   │   │   ├── hooks/           # Hooks auth
│   │   │   ├── services/        # Services auth
│   │   │   └── types/           # Types auth
│   │   │
│   │   ├── shop/                # Boutique
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   ├── users/               # Gestion utilisateurs
│   │   ├── courses/             # Gestion cours
│   │   ├── teachers/            # Gestion professeurs
│   │   ├── messages/            # Messagerie
│   │   ├── orders/              # Commandes
│   │   └── stats/               # Statistiques
│   │
│   ├── lib/                     # Utilitaires & helpers
│   │   ├── utils/               # Fonctions utilitaires
│   │   ├── hooks/               # Hooks réutilisables
│   │   └── constants/           # Constantes globales
│   │
│   ├── pages/                   # Pages (routes)
│   │   ├── DashboardPage.tsx
│   │   ├── ShopPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   │
│   ├── shared/                  # Composants partagés
│   │   ├── components/          # Composants UI réutilisables
│   │   ├── layouts/             # Layouts (MainLayout, AuthLayout)
│   │   └── ui/                  # Composants UI génériques
│   │
│   ├── store/                   # Zustand stores
│   │   ├── index.ts             # Export central + init
│   │   ├── authStore.ts         # Store authentification
│   │   ├── cartStore.ts         # Store panier
│   │   └── uiStore.ts           # Store UI (notifications, thème)
│   │
│   ├── styles/                  # Styles globaux
│   │   ├── index.css            # Point d'entrée styles
│   │   ├── variables.css        # Variables CSS
│   │   └── themes/              # Thèmes
│   │
│   ├── main.tsx                 # Point d'entrée React
│   ├── index.css                # Styles de base
│   └── vite-env.d.ts            # Types Vite
│
├── .gitignore                   # Git ignore
├── index.html                   # HTML racine
├── package.json                 # Dépendances
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
├── eslint.config.js             # ESLint config
├── .prettierrc                  # Prettier config
└── codegen.ts                   # GraphQL Codegen config
```

---

## 🎯 Principes d'Architecture

### **1. Feature-First Organization**

Les fonctionnalités sont organisées par domaine métier dans `src/features/`, chaque feature contenant :
- Composants spécifiques
- Hooks métier
- Services/API
- Types TypeScript
- Tests

**Avantages :**
- Cohésion élevée (tout ce qui concerne une feature est au même endroit)
- Couplage faible (les features sont indépendantes)
- Scalabilité (ajout de features facile)
- Maintenance simplifiée

### **2. Separation of Concerns**

- **`core/`** : Fonctionnalités transverses (API, monitoring)
- **`features/`** : Logique métier
- **`shared/`** : Composants UI réutilisables
- **`lib/`** : Utilitaires purs (sans dépendances React)
- **`store/`** : State management global

### **3. Type Safety First**

- TypeScript strict mode activé
- Types générés automatiquement (GraphQL Codegen)
- Validation runtime avec Zod
- Props typées pour tous les composants

### **4. Performance Optimization**

- Code splitting (React.lazy)
- Memoization (React.memo, useMemo, useCallback)
- Zustand pour éviter re-renders inutiles
- Bundle optimization (Vite tree-shaking)

---

## 🔄 Data Flow

### **Client State (Zustand)**

```
┌─────────────────┐
│  authStore.ts   │  ← User, Token, Login/Logout
├─────────────────┤
│  cartStore.ts   │  ← Panier, Items, Quantités
├─────────────────┤
│  uiStore.ts     │  ← Notifications, Theme, Sidebar
└─────────────────┘
        ↓
   localStorage
   (persist)
```

**Exemple d'utilisation :**
```typescript
import { useCartStore } from '@/store/cartStore';

const MyComponent = () => {
  const items = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  
  return <button onClick={() => addItem(product)}>Add</button>;
};
```

### **Server State (Apollo Client)**

```
┌──────────────┐      ┌─────────────┐      ┌──────────┐
│  Component   │ ───> │ GraphQL     │ ───> │  Server  │
│              │      │ Query/Mut   │      │  (API)   │
└──────────────┘      └─────────────┘      └──────────┘
                             ↓
                      ┌─────────────┐
                      │ Apollo      │
                      │ Cache       │
                      └─────────────┘
```

**Exemple d'utilisation :**
```typescript
import { useGetUsersQuery } from '@/core/api/apollo/generated/graphql';

const UserList = () => {
  const { data, loading, error } = useGetUsersQuery();
  
  if (loading) return <Spinner />;
  return <Table data={data.users} />;
};
```

---

## 🛡️ État des Migrations

### ✅ **Phase 6 - Redux → Zustand (TERMINÉE)**

**Date :** 2024  
**Statut :** 🟢 100% Complète

**Changements :**
- ❌ Supprimé : `@reduxjs/toolkit`, `react-redux`
- ✅ Ajouté : `zustand` (5.0.11)
- ✅ Migré : `cartStore`, `authStore`, `uiStore`
- ✅ Optimisé : Selectors avec shallow comparison
- ✅ Économies : ~30KB bundle size (-66%)

**Fichiers clés :**
- `src/store/index.ts` - Documentation complète
- `src/store/cartStore.ts` - Store panier
- `src/store/authStore.ts` - Store auth
- `src/store/uiStore.ts` - Store UI

**DevTools :**
```javascript
// Dans la console browser
window.__STORES__
```

---

### ✅ **Phase 5 - Sentry Monitoring (PARTIELLE - PRODUCTION READY)**

**Date :** 2024  
**Statut :** 🟡 Intégré (DSN requis pour production)

**Fonctionnalités :**
- ✅ Error tracking automatique
- ✅ Performance monitoring (10% sample rate)
- ✅ Session replay sur erreurs
- ✅ User context tracking
- ✅ Error Boundary UI personnalisée
- ✅ Breadcrumbs pour debugging

**Configuration :**
- `src/core/monitoring/sentry.ts`
- `src/core/monitoring/SentryErrorBoundary.tsx`
- `src/core/monitoring/README_SENTRY_SETUP.ts`

**Setup requis :**
1. Créer compte sur sentry.io
2. Créer projet React
3. Ajouter `VITE_SENTRY_DSN` dans `.env.production`
4. (Optionnel) Configurer upload sourcemaps

**Note :** En développement, Sentry est désactivé (logs console uniquement)

---

### ⏳ **i18n - Internationalisation (À VENIR)**

**Statut :** 🔵 Planifié  
**Recommandation :** `react-i18next` ou `i18next`

---

## 🚀 Scripts Disponibles

```bash
# Développement
npm run dev              # Lance le serveur dev (Vite)
npm run preview          # Preview du build production

# Build
npm run build            # Build production (dist/)

# Code Quality
npm run lint             # Linter ESLint
npm run lint:fix         # Fix automatique ESLint
npm run format           # Formatter avec Prettier
npm run format:check     # Vérifier formatting

# GraphQL
npm run codegen          # Génère types GraphQL
npm run codegen:watch    # Watch mode pour codegen
```

---

## 🧪 Testing Strategy

### **Tests Unitaires**
- **Framework :** Jest (à configurer)
- **Librairie :** React Testing Library
- **Coverage :** >80% objectif

### **Tests E2E**
- **Framework :** Playwright (recommandé)
- **Scénarios :** User flows critiques

### **Tests d'Intégration**
- Apollo Client MockedProvider
- MSW (Mock Service Worker) pour API

---

## 🔐 Authentification & Autorisation

### **Flow d'Authentification**

```
1. User → Login Form
2. Form → GraphQL mutation (login)
3. Server → Return { token, user }
4. authStore.login(user, token)
5. Token → localStorage (persist)
6. Apollo Client → Add token to headers
7. Redirect → Dashboard
```

### **AuthGuard**

Composant qui protège l'application :
```typescript
<AuthGuard>
  <App />
</AuthGuard>
```

**Fonctionnalités :**
- Vérification token au mount
- Redirection vers login si non-authentifié
- Refresh automatique des données user
- Gestion des erreurs d'auth

---

## 🎨 Theming & Styling

### **Approche CSS**

- **PatternFly Base** : Variables CSS PatternFly
- **Custom CSS** : Variables dans `src/styles/variables.css`
- **CSS Modules** : Pour composants spécifiques (optionnel)
- **Inline Styles** : Évités (sauf dynamiques)

### **Variables CSS**

```css
:root {
  --pf-global-primary-color: #0066cc;
  --pf-global-BackgroundColor: #f5f5f5;
  /* ... */
}
```

### **Dark Mode**

Support via `uiStore.theme` :
```typescript
const theme = useUIStore(state => state.theme);
// 'light' | 'dark'
```

---

## 🌐 API Communication

### **GraphQL (Primary)**

**Configuration :**
- Apollo Client dans `src/core/api/apollo/client.ts`
- Queries/Mutations dans `src/core/api/graphql/`
- Types auto-générés par GraphQL Codegen

**Exemple :**
```typescript
// Query
const { data } = useGetUsersQuery();

// Mutation
const [createUser] = useCreateUserMutation();
await createUser({ variables: { input: userData } });
```

### **REST (Fallback)**

Pour endpoints non-GraphQL :
```typescript
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📦 Build & Deployment

### **Production Build**

```bash
npm run build
# → Génère dist/ avec assets optimisés
```

**Optimisations :**
- Tree-shaking
- Code splitting
- Minification
- Source maps (production)

### **Environment Variables**

```env
# .env.development
VITE_API_URL=http://localhost:4000/graphql
VITE_SENTRY_DSN=

# .env.production
VITE_API_URL=https://api.clubmanager.com/graphql
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_APP_VERSION=1.0.0
```

### **Deployment Checklist**

- [ ] Build production (`npm run build`)
- [ ] Vérifier variables d'environnement
- [ ] Tester build localement (`npm run preview`)
- [ ] Configurer Sentry DSN
- [ ] Upload sourcemaps vers Sentry (optionnel)
- [ ] Deploy vers hosting (Vercel, Netlify, etc.)

---

## 🛠️ DevTools

### **Zustand DevTools**

```javascript
// Console browser
window.__STORES__.auth.getState()
window.__STORES__.cart.getState()
window.__STORES__.ui.getState()
```

### **Apollo DevTools**

Extension Chrome : Apollo Client Devtools

### **React Query DevTools**

Automatiquement inclus en développement

### **Sentry**

Dashboard : https://sentry.io

---

## 🔍 Code Quality & Standards

### **ESLint Rules**

- TypeScript strict
- React Hooks rules
- Prettier integration
- No console.log en production

### **Prettier**

- Semi : false
- Quotes : single
- TrailingComma : es5

### **Git Workflow**

```
main (production)
  ↓
develop (staging)
  ↓
feature/xyz (branches)
```

**Commit Convention :**
```
feat: Add user profile page
fix: Resolve cart quantity bug
refactor: Migrate Redux to Zustand
docs: Update architecture docs
```

---

## 🚦 Performance Metrics

### **Objectifs**

- **First Contentful Paint :** < 1.5s
- **Time to Interactive :** < 3.5s
- **Bundle Size :** < 500KB (gzipped)
- **Lighthouse Score :** > 90

### **Monitoring**

- Sentry Performance Monitoring
- Web Vitals tracking
- Bundle analyzer

---

## 📚 Ressources & Documentation

### **Documentation Interne**

- `docs/ARCHITECTURE.md` - Ce fichier
- `src/core/monitoring/README_SENTRY_SETUP.ts` - Guide Sentry
- `src/store/index.ts` - Documentation Zustand

### **Documentation Externe**

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://docs.pmnd.rs/zustand/)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [PatternFly](https://www.patternfly.org/)
- [Sentry](https://docs.sentry.io/)

---

## 🎯 Prochaines Étapes

### **Court Terme**

- [ ] Implémenter i18n (react-i18next)
- [ ] Ajouter tests E2E (Playwright)
- [ ] Configurer CI/CD (GitHub Actions)
- [ ] Optimiser images (lazy loading)

### **Moyen Terme**

- [ ] PWA support (offline mode)
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Performance optimization (code splitting avancé)
- [ ] Documentation Storybook

### **Long Terme**

- [ ] Migration vers React Server Components (si pertinent)
- [ ] Microfrontends architecture (si nécessaire)
- [ ] GraphQL Federation (si multiple services)

---

## 🤝 Contribution

### **Setup Local**

```bash
# 1. Clone
git clone [repository-url]
cd ClubManager/front-end

# 2. Install
npm install

# 3. Configure env
cp .env.example .env.development

# 4. Run
npm run dev
```

### **Avant de Commit**

```bash
npm run lint:fix    # Fix linting
npm run format      # Format code
npm run build       # Vérifier que ça build
```

---

## 📞 Support & Contact

**Équipe :** ClubManager Development Team  
**Documentation :** `docs/`  
**Issues :** GitHub Issues (si configuré)

---

**Dernière mise à jour :** 2024  
**Version :** 1.0.0  
**Auteur :** Odyssée Software