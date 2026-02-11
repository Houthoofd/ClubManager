# Guide de Réécriture des Tests - Module Alertes

## 📋 Contexte

Ce document sert de **référence complète** pour réécrire les tests du module Alertes avec la nouvelle architecture GraphQL.

## ✅ Ce qui a changé dans l'architecture

### Avant (Legacy)
```typescript
// Service en tant qu'objet
import { alertesService } from '../services/alertes.service.js';

// Resolver simple sans middleware
const resolver = async (parent, args) => {
  return await alertesService.obtenirDashboard();
};
```

### Maintenant (Moderne)
```typescript
// Services exportés en tant que fonctions
import { 
  obtenirDashboardAlertes,
  obtenirAlertesActives 
} from '../core/services/alertes.service.js';

// Resolver wrappé avec middlewares
const resolver = combineMiddlewares(
  requireAdmin,
  withSentry,
  withRateLimit(RateLimitPresets.QUERY)
)(async (parent, args, context) => {
  return await obtenirDashboardAlertes();
});
```

## 🎯 Principes de Test Modernes

### 1. **Mock des Fonctions Exportées**
```typescript
// ❌ Ancien style
jest.spyOn(alertesService, 'obtenirDashboard').mockResolvedValue(data);

// ✅ Nouveau style
const mockObtenirDashboardAlertes = jest.fn();
jest.mock('../core/services/alertes.service.js', () => ({
  obtenirDashboardAlertes: (...args) => mockObtenirDashboardAlertes(...args),
}));
```

### 2. **Test des Middlewares**
Les resolvers sont maintenant wrappés avec des middlewares d'auth et de sécurité :

```typescript
// Test que l'admin peut accéder
it('✅ admin peut accéder au dashboard', async () => {
  const context = {
    user: { id: 1, role: 'admin' },
    isAuthenticated: true,
  };
  
  mockObtenirDashboardAlertes.mockResolvedValue(dashboard);
  
  const result = await alertesResolvers.Query.alertesDashboard(
    {},
    {},
    context,
    {} as any
  );
  
  expect(result).toEqual(dashboard);
});

// Test que l'utilisateur normal ne peut PAS accéder
it('❌ utilisateur normal ne peut pas accéder', async () => {
  const context = {
    user: { id: 2, role: 'membre' },
    isAuthenticated: true,
  };
  
  await expect(
    alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any)
  ).rejects.toThrow();
});

// Test que l'utilisateur non-authentifié ne peut PAS accéder
it('❌ utilisateur non-authentifié ne peut pas accéder', async () => {
  const context = {
    user: null,
    isAuthenticated: false,
  };
  
  await expect(
    alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any)
  ).rejects.toThrow();
});
```

### 3. **Structure des Tests par Resolver**

Chaque resolver doit avoir :
- ✅ Test du cas nominal (happy path)
- ✅ Test de l'authentification (requireAuth)
- ✅ Test de l'autorisation (requireAdmin si applicable)
- ✅ Test de la validation des inputs (si applicable)
- ✅ Test de la propagation des erreurs

### 4. **Helpers de Contexte**

Créer des helpers pour générer les contextes :

```typescript
function createAdminContext(): GraphQLContext {
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
  };
}

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

function createUnauthenticatedContext(): GraphQLContext {
  return {
    user: null,
    isAuthenticated: false,
    req: {} as any,
    res: {} as any,
  };
}
```

## 📝 Template de Test Complet

Voici un exemple complet pour un resolver Query :

```typescript
describe('Query: alertesDashboard', () => {
  it('✅ devrait retourner le dashboard (admin)', async () => {
    // Arrange
    const mockDashboard = {
      totalAlertes: 15,
      alertesCritiques: 3,
      alertesEnAttente: 7,
      alertesResolues: 5,
      alertesParType: {
        INSCRIPTION_INCOMPLETE: 5,
        PAIEMENT_RETARD: 3,
      },
      tendances: {},
    };
    
    mockObtenirDashboardAlertes.mockResolvedValue(mockDashboard);
    const context = createAdminContext();
    
    // Act
    const result = await alertesResolvers.Query.alertesDashboard(
      {},
      {},
      context,
      {} as any
    );
    
    // Assert
    expect(result).toEqual(mockDashboard);
    expect(mockObtenirDashboardAlertes).toHaveBeenCalledTimes(1);
  });
  
  it('❌ devrait rejeter si non-authentifié', async () => {
    const context = createUnauthenticatedContext();
    
    await expect(
      alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any)
    ).rejects.toThrow();
  });
  
  it('❌ devrait rejeter si non-admin', async () => {
    const context = createUserContext();
    
    await expect(
      alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any)
    ).rejects.toThrow();
  });
  
  it('❌ devrait propager les erreurs du service', async () => {
    mockObtenirDashboardAlertes.mockRejectedValue(
      new Error('Erreur DB')
    );
    const context = createAdminContext();
    
    await expect(
      alertesResolvers.Query.alertesDashboard({}, {}, context, {} as any)
    ).rejects.toThrow('Erreur DB');
  });
});
```

## 📊 Checklist de Migration par Module

Pour chaque fichier de test à migrer :

### Phase 1 : Setup
- [ ] Créer les mocks des fonctions de service (pas d'objet service)
- [ ] Créer les helpers de contexte (admin, user, unauthenticated)
- [ ] Importer les resolvers à tester

### Phase 2 : Tests des Queries
Pour chaque Query :
- [ ] Test du cas nominal (admin)
- [ ] Test rejet si non-authentifié
- [ ] Test rejet si non-admin (si applicable)
- [ ] Test de validation des inputs (si applicable)
- [ ] Test de propagation des erreurs

### Phase 3 : Tests des Mutations
Pour chaque Mutation :
- [ ] Test du cas nominal (admin)
- [ ] Test rejet si non-authentifié
- [ ] Test rejet si non-admin (si applicable)
- [ ] Test de validation des inputs
- [ ] Test de propagation des erreurs
- [ ] Test des effets de bord (emails envoyés, logs créés, etc.)

### Phase 4 : Tests d'Intégration
- [ ] Test d'un workflow complet (ex: dashboard → détection → résolution)
- [ ] Test des cas limites (données vides, valeurs nulles)
- [ ] Test de la cohérence des données

## 🎯 Exemple Complet : Module Alertes

### Structure des Fichiers
```
alertes/
├── __tests__/
│   ├── alertes.modern.test.ts          ← Tests modernes (à créer)
│   ├── alertes.test.ts                 ← Tests legacy (à adapter)
│   └── TESTS_MODERNES_README.md        ← Ce fichier
├── core/
│   ├── services/
│   │   └── alertes.service.ts          ← Fonctions exportées
│   └── resolvers/
│       └── alertes.resolvers.ts        ← Resolvers avec middlewares
```

### Liste des Resolvers à Tester

#### Queries (Admin uniquement)
1. `alertesDashboard` - Récupère le dashboard
2. `alertesActives` - Liste des alertes actives
3. `alertesUtilisateur` - Alertes d'un utilisateur
4. `alerte` - Une alerte par ID

#### Mutations (Admin uniquement)
1. `detecterAlertes` - Déclenche la détection
2. `resoudreAlerte` - Résout une alerte
3. `ignorerAlerte` - Ignore une alerte

### Nombre de Tests Minimum Requis

| Resolver | Tests Auth | Tests Validation | Tests Business | Total |
|----------|-----------|------------------|----------------|-------|
| alertesDashboard | 3 | 0 | 2 | 5 |
| alertesActives | 3 | 0 | 2 | 5 |
| alertesUtilisateur | 3 | 1 | 2 | 6 |
| alerte | 3 | 1 | 2 | 6 |
| detecterAlertes | 3 | 0 | 2 | 5 |
| resoudreAlerte | 3 | 1 | 3 | 7 |
| ignorerAlerte | 3 | 1 | 3 | 7 |
| **TOTAL** | | | | **41 tests** |

## 🚧 Problèmes Connus

### 1. Configuration Jest
Le module `@clubmanager/types` n'est pas toujours résolu correctement par Jest.

**Solution temporaire** : Mock le module dans les tests
```typescript
jest.mock('@clubmanager/types/validators', () => ({
  obtenirAlerteSchema: { parse: jest.fn((data) => data) },
  // ... autres validators
}));
```

### 2. Client DB non disponible
Le client `Alerte` de la DB n'existe pas encore.

**Solution** : Mock le client
```typescript
jest.mock('../../../../db/clients/alertes/alertes.js', () => ({
  Alerte: jest.fn().mockImplementation(() => ({
    obtenirDashboardAlertes: jest.fn(),
    // ... autres méthodes
  })),
}));
```

### 3. Middlewares Sentry
Les middlewares Sentry peuvent causer des problèmes dans les tests.

**Solution** : Mock Sentry
```typescript
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));
```

## 📚 Ressources

### Fichiers de Référence
- `api/src/routes/alertes/core/resolvers/alertes.resolvers.ts` - Nouveaux resolvers
- `api/src/routes/alertes/core/services/alertes.service.ts` - Nouveaux services
- `packages/types/src/validators/alertes.validators.ts` - Validators Zod

### Documentation
- Pattern de migration : `MIGRATION_GRAPHQL_COMPLETE.md` (racine du projet)
- Tests Jest avec ESM : https://jestjs.io/docs/ecmascript-modules
- Testing GraphQL resolvers : https://www.apollographql.com/docs/apollo-server/testing/testing/

## 🎓 Prochaines Étapes

### Option A : Adapter les Tests Existants
1. Ouvrir `alertes.test.ts`
2. Remplacer les imports de `alertesService` par les fonctions individuelles
3. Adapter les appels de resolvers pour inclure le contexte GraphQL
4. Ajouter les tests d'authentification/autorisation

### Option B : Réécrire from Scratch
1. Créer `alertes.modern.test.ts`
2. Copier le template ci-dessus
3. Implémenter les tests un par un
4. Supprimer l'ancien fichier une fois terminé

### Recommandation
**Option B** est recommandée car :
- ✅ Tests propres dès le départ
- ✅ Couvre tous les nouveaux middlewares
- ✅ Meilleure lisibilité
- ✅ Plus facile à maintenir

---

**Créé le** : 10 février 2025  
**Auteur** : Migration GraphQL Team  
**Status** : 📖 Documentation de référence