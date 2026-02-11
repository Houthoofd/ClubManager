# Guide de Réécriture des Tests - Migration GraphQL Complète

**Date** : 10 février 2025  
**Status** : 📖 Documentation de référence  
**Modules concernés** : 18 modules GraphQL migrés

---

## 🎯 Objectif

Ce guide fournit une méthodologie complète pour réécrire les tests des modules GraphQL suite à la migration architecturale majeure.

## 📊 État Actuel

### Modules Migrés (18)
✅ **Tous migrés vers la nouvelle architecture** :
- auth, messages, alertes, commandes, compte, confirmation, cours, echeances
- informations, inscription, magasin, paiements, professeurs, statistiques
- stocks, upload, utilisateurs, verification

### Tests Actuels
- ⚠️ **Tests restaurés depuis Git** (après suppression accidentelle)
- ⚠️ **Imports corrigés** vers `../core/services` et `../core/resolvers`
- ❌ **Tests ne passent pas** - Nécessitent adaptation à la nouvelle API

---

## 🔄 Changements Architecturaux Majeurs

### 1. **Services : Objet → Fonctions Exportées**

#### Avant (Legacy)
```typescript
// Service exporté en tant qu'objet
export const alertesService = {
  obtenirDashboard: async () => { ... },
  obtenirAlertes: async () => { ... }
};

// Import
import { alertesService } from '../services/alertes.service.js';
alertesService.obtenirDashboard();
```

#### Maintenant (Moderne)
```typescript
// Fonctions exportées individuellement
export async function obtenirDashboardAlertes() { ... }
export async function obtenirAlertesActives() { ... }

// Import
import { obtenirDashboardAlertes, obtenirAlertesActives } from '../core/services/alertes.service.js';
obtenirDashboardAlertes();
```

### 2. **Resolvers : Simple → Wrapped avec Middlewares**

#### Avant (Legacy)
```typescript
export const alertesResolvers = {
  Query: {
    alertesDashboard: async (_parent, _args) => {
      return await alertesService.obtenirDashboard();
    }
  }
};
```

#### Maintenant (Moderne)
```typescript
export const alertesResolvers = {
  Query: {
    alertesDashboard: combineMiddlewares(
      requireAdmin,           // 🔐 Vérification admin
      withSentry,            // 📊 Monitoring Sentry
      withRateLimit(RateLimitPresets.QUERY), // 🚦 Rate limiting
      withAuditLog({ ... })  // 📝 Audit trail
    )(async (_parent, _args, context, info) => {
      return await obtenirDashboardAlertes();
    })
  }
};
```

### 3. **Validators : Locaux → Centralisés**

#### Avant
```typescript
// Dans chaque module
const obtenirAlerteSchema = z.object({ ... });
```

#### Maintenant
```typescript
// Centralisé dans packages/types
import { obtenirAlerteSchema } from '@clubmanager/types/validators';
```

### 4. **Structure des Arguments**

#### Avant
```typescript
// Arguments wrappés dans un objet "input"
resoudreAlerte: async (_parent, { input }) => {
  const { alerteId, effectuePar, commentaire } = input;
  return await alertesService.resoudreAlerte(input);
}
```

#### Maintenant
```typescript
// Arguments directs (pas de wrapper "input")
resoudreAlerte: combineMiddlewares(...)(
  async (_parent, { alerteId, notes }, context) => {
    return await resoudreAlerte(alerteId, notes, context.user?.id);
  }
)
```

---

## 🧪 Méthodologie de Réécriture

### Étape 1 : Analyser le Module

Pour chaque module :

1. **Identifier les resolvers** dans `routes/<module>/core/resolvers/`
2. **Identifier les services** dans `routes/<module>/core/services/`
3. **Lister les middlewares** utilisés (requireAuth, requireAdmin, withValidation, etc.)
4. **Identifier les validators** dans `packages/types/src/validators/<module>.validators.ts`

### Étape 2 : Préparer les Mocks

#### A. Mock des Services (Fonctions)

```typescript
// Créer un mock pour chaque fonction exportée
const mockObtenirDashboardAlertes = jest.fn();
const mockObtenirAlertesActives = jest.fn();
const mockResoudreAlerte = jest.fn();

// Mock du module
jest.mock('../core/services/alertes.service.js', () => ({
  obtenirDashboardAlertes: (...args) => mockObtenirDashboardAlertes(...args),
  obtenirAlertesActives: (...args) => mockObtenirAlertesActives(...args),
  resoudreAlerte: (...args) => mockResoudreAlerte(...args),
}));
```

#### B. Mock des Validators

```typescript
jest.mock('@clubmanager/types/validators', () => ({
  obtenirAlerteSchema: { parse: jest.fn((data) => data) },
  resoudreAlerteSchema: { parse: jest.fn((data) => data) },
  // ... autres validators
}));
```

#### C. Mock du Client DB (si nécessaire)

```typescript
jest.mock('../../../../db/clients/alertes/alertes.js', () => ({
  Alerte: jest.fn().mockImplementation(() => ({
    obtenirDashboard: jest.fn(),
    // ... autres méthodes
  })),
}));
```

### Étape 3 : Créer les Helpers de Contexte

```typescript
/**
 * Contexte admin (accès complet)
 */
function createAdminContext(overrides?: Partial<GraphQLContext>): GraphQLContext {
  return {
    user: {
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
      statut: 'actif',
    },
    isAuthenticated: true,
    req: {} as any,
    res: {} as any,
    ...overrides,
  };
}

/**
 * Contexte utilisateur normal (accès limité)
 */
function createUserContext(): GraphQLContext {
  return {
    user: {
      id: 2,
      email: 'user@test.com',
      role: 'membre',
      statut: 'actif',
    },
    isAuthenticated: true,
    req: {} as any,
    res: {} as any,
  };
}

/**
 * Contexte non-authentifié (aucun accès)
 */
function createUnauthenticatedContext(): GraphQLContext {
  return {
    user: null,
    isAuthenticated: false,
    req: {} as any,
    res: {} as any,
  };
}
```

### Étape 4 : Structure des Tests

#### Template Complet par Resolver

```typescript
describe('Query: nomDuResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.mockClear();
  });

  // ✅ CAS NOMINAL
  it('✅ devrait retourner les données (happy path)', async () => {
    // Arrange
    const mockData = { ... };
    mockService.mockResolvedValue(mockData);
    const context = createAdminContext();

    // Act
    const result = await resolvers.Query.nomDuResolver(
      {},
      { arg1: 'value' },
      context,
      {} as any
    );

    // Assert
    expect(result).toEqual(mockData);
    expect(mockService).toHaveBeenCalledWith('value');
    expect(mockService).toHaveBeenCalledTimes(1);
  });

  // ❌ AUTHENTIFICATION
  it('❌ devrait rejeter si non-authentifié', async () => {
    const context = createUnauthenticatedContext();

    await expect(
      resolvers.Query.nomDuResolver({}, {}, context, {} as any)
    ).rejects.toThrow();
  });

  // ❌ AUTORISATION (si requireAdmin)
  it('❌ devrait rejeter si non-admin', async () => {
    const context = createUserContext();

    await expect(
      resolvers.Query.nomDuResolver({}, {}, context, {} as any)
    ).rejects.toThrow();
  });

  // ❌ VALIDATION (si withValidation)
  it('❌ devrait rejeter si arguments invalides', async () => {
    const context = createAdminContext();

    await expect(
      resolvers.Query.nomDuResolver({}, { arg1: -1 }, context, {} as any)
    ).rejects.toThrow();
  });

  // ❌ ERREURS SERVICE
  it('❌ devrait propager les erreurs du service', async () => {
    mockService.mockRejectedValue(new Error('Erreur DB'));
    const context = createAdminContext();

    await expect(
      resolvers.Query.nomDuResolver({}, {}, context, {} as any)
    ).rejects.toThrow('Erreur DB');
  });

  // ✅ CAS LIMITES
  it('✅ devrait gérer un tableau vide', async () => {
    mockService.mockResolvedValue([]);
    const context = createAdminContext();

    const result = await resolvers.Query.nomDuResolver({}, {}, context, {} as any);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
```

### Étape 5 : Checklist par Resolver

Pour **chaque resolver**, vérifier :

| Test | Query simple | Query avec args | Mutation |
|------|-------------|-----------------|----------|
| ✅ Cas nominal (happy path) | ✓ | ✓ | ✓ |
| ❌ Non-authentifié | ✓ | ✓ | ✓ |
| ❌ Non-admin (si applicable) | ✓ | ✓ | ✓ |
| ❌ Validation args (si applicable) | - | ✓ | ✓ |
| ❌ Erreurs service | ✓ | ✓ | ✓ |
| ✅ Cas limites ([], null, etc.) | ✓ | ✓ | ✓ |
| ✅ Effets de bord (emails, logs) | - | - | ✓ |

---

## 📋 Plan de Migration par Module

### Priorité 1 : Modules Simples (Commencer ici)

| Module | Resolvers | Complexité | Estimation |
|--------|-----------|------------|------------|
| **alertes** | 7 | 🟢 Faible | 2-3h |
| **informations** | 5 | 🟢 Faible | 2h |
| **messages** | 6 | 🟢 Faible | 2h |
| **statistiques** | 8 | 🟡 Moyenne | 3h |

### Priorité 2 : Modules Moyens

| Module | Resolvers | Complexité | Estimation |
|--------|-----------|------------|------------|
| **professeurs** | 10 | 🟡 Moyenne | 3-4h |
| **cours** | 12 | 🟡 Moyenne | 4h |
| **stocks** | 8 | 🟡 Moyenne | 3h |
| **upload** | 5 | 🟡 Moyenne | 2-3h |

### Priorité 3 : Modules Complexes

| Module | Resolvers | Complexité | Estimation |
|--------|-----------|------------|------------|
| **auth** | 8 | 🔴 Haute | 4-5h |
| **paiements** | 15 | 🔴 Haute | 6h |
| **confirmation** | 3 | 🔴 Haute | 4h |
| **echeances** | 12 | 🔴 Haute | 5h |
| **inscription** | 10 | 🔴 Haute | 5h |
| **compte** | 14 | 🔴 Haute | 5h |
| **utilisateurs** | 18 | 🔴 Haute | 6h |
| **commandes** | 10 | 🔴 Haute | 4h |
| **magasin** | 12 | 🔴 Haute | 5h |
| **verification** | 6 | 🟡 Moyenne | 3h |

**Total estimé** : ~70-80 heures

---

## 🎯 Module de Référence : Alertes

Un exemple complet de réécriture est disponible dans :

📄 **`api/src/routes/alertes/__tests__/TESTS_MODERNES_README.md`**

Ce document contient :
- ✅ Templates de tests complets
- ✅ Exemples de mocks
- ✅ Patterns de test pour chaque type de resolver
- ✅ Checklist de migration
- ✅ Liste complète des tests attendus (41 tests pour le module alertes)

---

## 🚧 Problèmes Connus et Solutions

### Problème 1 : `@clubmanager/types` non résolu

**Symptôme** :
```
Configuration error: Could not locate module @clubmanager/types/validators
```

**Solutions** :
```typescript
// Option A : Mock le module
jest.mock('@clubmanager/types/validators', () => ({
  schemaName: { parse: jest.fn((data) => data) },
}));

// Option B : Utiliser le chemin relatif
import { schema } from '../../../../packages/types/src/validators/module.validators.js';
```

### Problème 2 : Client DB non disponible

**Symptôme** :
```
Could not locate module ../../../../db/clients/module/module.js
```

**Solution** :
```typescript
jest.mock('../../../../db/clients/module/module.js', () => ({
  ModuleClient: jest.fn().mockImplementation(() => ({
    methodName: jest.fn(),
  })),
}));
```

### Problème 3 : Middlewares cassent les tests

**Symptôme** :
```
Cannot read property 'user' of undefined
```

**Solution** :
- Toujours passer les 4 arguments au resolver : `(parent, args, context, info)`
- Créer un contexte complet avec `createAdminContext()` ou équivalent

### Problème 4 : Sentry/Monitoring interfère

**Solution** :
```typescript
// Mock Sentry
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
  })),
}));

// Ou supprimer les logs console
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
```

---

## 📚 Ressources et Documentation

### Documentation Projet
- **Migration GraphQL** : `MIGRATION_GRAPHQL_COMPLETE.md`
- **Rapport final** : `RAPPORT_MIGRATION_FINAL.md`
- **Nettoyage** : `NETTOYAGE_COMPLET.md`

### Documentation Externe
- [Jest + ESM](https://jestjs.io/docs/ecmascript-modules)
- [Testing GraphQL resolvers](https://www.apollographql.com/docs/apollo-server/testing/testing/)
- [Zod validation](https://zod.dev/)

### Fichiers Clés
```
ClubManager/
├── api/src/
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts        ← requireAuth, requireAdmin
│   │   │   ├── validation.middleware.ts  ← withValidation
│   │   │   ├── sentry.middleware.ts      ← withSentry
│   │   │   └── rate-limit.middleware.ts  ← withRateLimit
│   │   └── errors/
│   │       └── GraphQLErrors.ts          ← Erreurs standardisées
│   └── routes/<module>/
│       ├── core/
│       │   ├── services/                 ← Fonctions métier
│       │   └── resolvers/                ← Resolvers GraphQL
│       └── __tests__/                    ← Tests à réécrire
└── packages/types/src/
    ├── validators/                       ← Validators Zod centralisés
    └── graphql/                          ← TypeDefs centralisés
```

---

## ✅ Workflow Recommandé

### Pour un module donné :

1. **📖 Lire** le `README` du module (si existant)
2. **🔍 Analyser** les resolvers dans `core/resolvers/<module>.resolvers.ts`
3. **📝 Lister** tous les resolvers (Queries + Mutations)
4. **🎯 Prioriser** les resolvers critiques
5. **🧪 Créer** un nouveau fichier `<module>.modern.test.ts`
6. **✍️ Écrire** les tests avec le template fourni
7. **▶️ Exécuter** les tests : `npm test -- <path>`
8. **🔧 Corriger** les erreurs
9. **📊 Vérifier** la couverture
10. **🗑️ Supprimer** l'ancien fichier de test (optionnel)

---

## 🎓 Conseils Pratiques

### ✅ DO
- ✅ Commencer par les modules simples (alertes, messages, informations)
- ✅ Utiliser les helpers de contexte (`createAdminContext`, etc.)
- ✅ Tester TOUS les middlewares (auth, validation, rate-limit)
- ✅ Tester les cas limites ([], null, undefined, 0, -1, etc.)
- ✅ Mock TOUS les services et dépendances externes
- ✅ Utiliser `beforeEach` pour reset les mocks
- ✅ Nommer les tests clairement : ✅ pour succès, ❌ pour erreurs
- ✅ Grouper les tests par resolver (`describe('Query: nomResolver')`)

### ❌ DON'T
- ❌ Ne pas tester les middlewares internes (ils ont leurs propres tests)
- ❌ Ne pas utiliser de vraie DB dans les tests unitaires
- ❌ Ne pas ignorer les tests d'authentification/autorisation
- ❌ Ne pas dupliquer le code de setup (utiliser helpers)
- ❌ Ne pas oublier de clear les mocks entre les tests
- ❌ Ne pas tester l'implémentation, tester le comportement

---

## 📊 Métriques de Qualité

Pour un module complet, viser :

| Métrique | Objectif |
|----------|----------|
| **Couverture lignes** | > 80% |
| **Couverture branches** | > 75% |
| **Tests par resolver** | 5-7 minimum |
| **Tests auth** | 100% des resolvers protégés |
| **Tests validation** | 100% des resolvers avec input |
| **Temps d'exécution** | < 5s par module |

---

## 🔄 Cycle de Feedback

Après avoir réécrit les tests d'un module :

1. **Documenter** les problèmes rencontrés
2. **Mettre à jour** ce guide avec les solutions
3. **Partager** les patterns découverts
4. **Améliorer** les templates
5. **Optimiser** les helpers

---

## 📅 Planning Suggéré

### Semaine 1 : Setup et Modules Simples
- Jour 1 : Setup, créer helpers, réécrire **alertes**
- Jour 2-3 : **messages**, **informations**
- Jour 4-5 : **statistiques**, **professeurs**

### Semaine 2 : Modules Moyens
- Jour 1-2 : **cours**, **stocks**
- Jour 3-5 : **upload**, **verification**, début complexes

### Semaine 3-4 : Modules Complexes
- **auth**, **paiements**, **confirmation**
- **echeances**, **inscription**, **compte**
- **utilisateurs**, **commandes**, **magasin**

---

## 🎯 Conclusion

Cette migration des tests est une opportunité de :
- ✅ Améliorer la qualité des tests
- ✅ Standardiser les patterns de test
- ✅ Augmenter la couverture de code
- ✅ Documenter les comportements attendus
- ✅ Faciliter la maintenance future

**Ne pas hésiter à** :
- Poser des questions sur les comportements attendus
- Adapter les templates selon les besoins
- Améliorer ce guide au fur et à mesure

---

**Bon courage pour la réécriture ! 🚀**

*Document vivant - À mettre à jour au fur et à mesure de la migration*