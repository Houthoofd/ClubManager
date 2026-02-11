# État des Tests - Migration GraphQL

**Date de mise à jour** : 10 février 2025  
**Status global** : ⚠️ Tests restaurés, nécessitent réécriture

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 MIGRATION GRAPHQL : COMPLÈTE ✅                         │
│  🧪 TESTS : NÉCESSITENT RÉÉCRITURE ⚠️                       │
│  📚 DOCUMENTATION : COMPLÈTE ✅                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Historique Récent

### ✅ Ce qui a été fait

1. **Migration GraphQL complète** (18 modules)
   - Resolvers modernisés avec `combineMiddlewares`
   - Services refactorisés (objet → fonctions exportées)
   - Validators centralisés dans `@clubmanager/types`
   - TypeDefs centralisés
   - Middleware standardisés (auth, validation, rate-limit, Sentry)

2. **Tests restaurés depuis Git**
   - Tests accidentellement supprimés
   - ✅ Récupération réussie avec `git checkout HEAD`
   - ✅ Imports corrigés vers `../core/services` et `../core/resolvers`

3. **Documentation créée**
   - ✅ `GUIDE_REECRITURE_TESTS.md` - Guide complet (ce document)
   - ✅ `api/src/routes/alertes/__tests__/TESTS_MODERNES_README.md` - Exemple détaillé
   - ✅ `TESTS_STATUS.md` - Ce fichier (état actuel)

---

## ⚠️ Problème Actuel

### Les tests ne passent pas (3 raisons principales)

#### 1️⃣ **Changement de Signature des Services**

**Avant** :
```typescript
import { alertesService } from '../services/alertes.service.js';
jest.spyOn(alertesService, 'obtenirDashboard').mockResolvedValue(data);
```

**Maintenant** :
```typescript
import { obtenirDashboardAlertes } from '../core/services/alertes.service.js';
const mockObtenirDashboardAlertes = jest.fn();
jest.mock('../core/services/alertes.service.js', () => ({
  obtenirDashboardAlertes: (...args) => mockObtenirDashboardAlertes(...args),
}));
```

#### 2️⃣ **Resolvers Wrappés avec Middlewares**

**Avant** :
```typescript
const result = await alertesResolvers.Query.dashboardAlertes();
```

**Maintenant** :
```typescript
// Doit inclure le contexte GraphQL
const context = { user: { role: 'admin' }, isAuthenticated: true, ... };
const result = await alertesResolvers.Query.alertesDashboard(
  {},           // parent
  {},           // args
  context,      // context GraphQL
  {} as any     // info
);
```

#### 3️⃣ **Structure des Arguments Changée**

**Avant** :
```typescript
resoudreAlerte({}, { input: { alerteId: 1, effectuePar: 10, commentaire: 'OK' } })
```

**Maintenant** :
```typescript
resoudreAlerte({}, { alerteId: 1, notes: 'OK' }, context, {})
```

---

## 📋 État des Tests par Module

| Module | Tests existants | Status | Priorité | Estimation |
|--------|----------------|--------|----------|------------|
| **alertes** | 9 fichiers | ⚠️ À réécrire | 🟢 P1 | 2-3h |
| **auth** | 10 fichiers | ⚠️ À réécrire | 🔴 P3 | 4-5h |
| **commandes** | 8 fichiers | ⚠️ À réécrire | 🔴 P3 | 4h |
| **compte** | 12 fichiers | ⚠️ À réécrire | 🔴 P3 | 5h |
| **confirmation** | 10 fichiers | ⚠️ À réécrire | 🔴 P3 | 4h |
| **cours** | 8 fichiers | ⚠️ À réécrire | 🟡 P2 | 4h |
| **echeances** | 11 fichiers | ⚠️ À réécrire | 🔴 P3 | 5h |
| **informations** | 12 fichiers | ⚠️ À réécrire | 🟢 P1 | 2h |
| **inscription** | 9 fichiers | ⚠️ À réécrire | 🔴 P3 | 5h |
| **magasin** | 10 fichiers | ⚠️ À réécrire | 🔴 P3 | 5h |
| **messages** | 9 fichiers | ⚠️ À réécrire | 🟢 P1 | 2h |
| **paiements** | 11 fichiers | ⚠️ À réécrire | 🔴 P3 | 6h |
| **professeurs** | 8 fichiers | ⚠️ À réécrire | 🟡 P2 | 3-4h |
| **statistiques** | 9 fichiers | ⚠️ À réécrire | 🟢 P1 | 3h |
| **stocks** | 8 fichiers | ⚠️ À réécrire | 🟡 P2 | 3h |
| **upload** | 6 fichiers | ⚠️ À réécrire | 🟡 P2 | 2-3h |
| **utilisateurs** | 12 fichiers | ⚠️ À réécrire | 🔴 P3 | 6h |
| **verification** | 7 fichiers | ⚠️ À réécrire | 🟡 P2 | 3h |

**Total** : ~165 fichiers de tests | Estimation totale : **70-80 heures**

---

## 🎯 Recommandation : Approche Progressive

### Option A : Commencer par le plus petit module ✅ **RECOMMANDÉ**

**Module suggéré** : `alertes` (7 resolvers, logique simple)

#### Avantages :
- ✅ Permet de tester la méthodologie
- ✅ Crée un modèle pour les autres modules
- ✅ Résultats rapides (2-3h)
- ✅ Documentation détaillée déjà créée

#### Démarrage rapide :
```bash
# 1. Consulter le guide
cat api/src/routes/alertes/__tests__/TESTS_MODERNES_README.md

# 2. Créer le nouveau fichier de test
touch api/src/routes/alertes/__tests__/alertes.modern.test.ts

# 3. Suivre le template du guide
# (Copier/adapter les exemples)

# 4. Lancer les tests
npm test -- src/routes/alertes/__tests__/alertes.modern.test.ts
```

### Option B : Garder les tests comme référence

#### Avantages :
- ✅ Garde l'historique des comportements attendus
- ✅ Permet de comparer avant/après
- ✅ Utile pour comprendre la logique métier

#### Inconvénients :
- ❌ Tests ne passent pas actuellement
- ❌ Peuvent prêter à confusion
- ❌ Nécessitent adaptation manuelle

---

## 📚 Documentation Disponible

### 1. **Guide Complet de Réécriture** 
📄 `GUIDE_REECRITURE_TESTS.md` (à la racine)

**Contenu** :
- ✅ Méthodologie complète
- ✅ Templates de tests
- ✅ Helpers de contexte
- ✅ Patterns de mocks
- ✅ Checklist par resolver
- ✅ Planning suggéré
- ✅ Problèmes connus et solutions

### 2. **Exemple Détaillé : Module Alertes**
📄 `api/src/routes/alertes/__tests__/TESTS_MODERNES_README.md`

**Contenu** :
- ✅ Comparaison avant/après
- ✅ Template complet de test
- ✅ Liste des 41 tests attendus
- ✅ Configuration des mocks
- ✅ Helpers de contexte

### 3. **Tests Modernes (Exemple)**
📄 `api/src/routes/alertes/__tests__/alertes.modern.test.ts`

**Contenu** :
- ✅ Fichier de test complet (585 lignes)
- ✅ Mocks configurés
- ✅ Tests pour 7 resolvers
- ⚠️ Ne s'exécute pas encore (problème config Jest)

---

## 🚀 Prochaines Étapes Suggérées

### Immédiat (Aujourd'hui)

1. **Lire la documentation**
   ```bash
   cat GUIDE_REECRITURE_TESTS.md
   cat api/src/routes/alertes/__tests__/TESTS_MODERNES_README.md
   ```

2. **Décider de l'approche**
   - Option 1 : Réécrire module alertes (2-3h)
   - Option 2 : Garder tests actuels comme référence
   - Option 3 : Réécrire progressivement (1 module/jour)

### Court terme (Cette semaine)

1. **Module alertes** → Tests modernes complets
2. **Modules simples** → messages, informations, statistiques
3. **Valider la méthodologie** → S'assurer que les patterns fonctionnent

### Moyen terme (2-4 semaines)

1. **Modules moyens** → professeurs, cours, stocks, upload
2. **Modules complexes** → auth, paiements, confirmation, echeances
3. **Finalisation** → inscription, compte, utilisateurs, commandes, magasin

---

## 💡 Conseil Final

### Pour commencer MAINTENANT :

```bash
# 1. Ouvrir le guide de référence
code GUIDE_REECRITURE_TESTS.md

# 2. Ouvrir l'exemple détaillé
code api/src/routes/alertes/__tests__/TESTS_MODERNES_README.md

# 3. Créer un nouveau fichier de test
code api/src/routes/alertes/__tests__/alertes.v2.test.ts

# 4. Copier le template depuis le README
# 5. Adapter pour les 7 resolvers du module alertes
# 6. Lancer les tests et itérer
```

### Aide-mémoire rapide :

```typescript
// 1. Mock des services (fonctions)
const mockService = jest.fn();
jest.mock('../core/services/module.service.js', () => ({
  functionName: (...args) => mockService(...args),
}));

// 2. Helper de contexte
const createAdminContext = () => ({
  user: { id: 1, role: 'admin' },
  isAuthenticated: true,
  req: {}, res: {}
});

// 3. Test d'un resolver
it('✅ should work', async () => {
  mockService.mockResolvedValue(data);
  const result = await resolver.Query.name({}, {}, createAdminContext(), {});
  expect(result).toEqual(data);
});
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Consulter** `GUIDE_REECRITURE_TESTS.md` → Section "Problèmes Connus"
2. **Vérifier** les exemples dans `alertes/__tests__/TESTS_MODERNES_README.md`
3. **Documenter** les nouveaux problèmes rencontrés
4. **Mettre à jour** ce guide avec les solutions trouvées

---

## 🎯 Objectif Final

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ✅ 18 modules migrés vers nouvelle architecture          │
│  ✅ ~181 resolvers modernisés                             │
│  ✅ Tests réecrits avec nouveaux patterns                 │
│  ✅ Couverture de tests > 80%                             │
│  ✅ CI/CD validant tous les tests                         │
│  ✅ Documentation complète à jour                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

**Status** : 📖 Prêt à commencer la réécriture  
**Documentation** : ✅ Complète  
**Recommandation** : 🎯 Commencer par le module **alertes**

Bon courage ! 🚀