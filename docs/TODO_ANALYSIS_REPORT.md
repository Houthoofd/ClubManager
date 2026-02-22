# 📊 RAPPORT D'ANALYSE DES TODOs - Tests Générés

**Date:** 22 février 2026  
**Projet:** ClubManager - Frontend  
**Objectif:** Compléter les TODOs pour atteindre 70-85% de couverture de tests

---

## 📈 STATISTIQUES GLOBALES

### Vue d'Ensemble
- **Total de fichiers de tests:** 239 fichiers
- **Fichiers contenant des TODOs:** 226 fichiers (94.6%)
- **TODOs estimés totaux:** ~3,500-4,000 TODOs
- **Couverture actuelle estimée:** ~50-55%
- **Objectif de couverture:** 70-85%
- **Gap à combler:** ~20-30%

### Distribution des TODOs par Volume
| Rang | Fichier | TODOs | Priorité |
|------|---------|-------|----------|
| 1 | `user-formatters.test.ts` | 110 | ⚡ Haute |
| 2 | `product-formatters.test.ts` | 101 | ⚡ Haute |
| 3 | `message-formatters.test.ts` | 80 | ⚡ Haute |
| 4 | `course-formatters.test.ts` | 72 | ⚡ Haute |
| 5-20 | Composants UI divers | 45 chacun | 🟡 Moyenne |

---

## 🎯 PRIORITÉ 1 - SERVICES CRITIQUES (Impact Business Maximum)

### 1.1 Services d'Authentification & Utilisateurs

#### 📄 `auth.service.test.ts`
**Localisation:** `front-end/src/core/services/__tests__/services/`  
**TODOs Total:** ~12  
**Impact Business:** 🔴 CRITIQUE (Sécurité)

**Catégories de TODOs:**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. MOCKS & SETUP (4 TODOs)                                 │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mock Apollo Client pour GraphQL mutations                │
│ ☐ Mock localStorage/AsyncStorage pour tokens               │
│ ☐ Mock services de chiffrement (JWT, bcrypt)               │
│ ☐ Setup environnement de test (API endpoints)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. TESTS FONCTIONNELS (5 TODOs)                            │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test login() avec credentials valides                    │
│ ☐ Test login() avec credentials invalides                  │
│ ☐ Test logout() et nettoyage du state                      │
│ ☐ Test refreshToken() automatique                          │
│ ☐ Test register() avec validation                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. EDGE CASES & SÉCURITÉ (3 TODOs)                         │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test expiration de token                                 │
│ ☐ Test retry avec network errors                           │
│ ☐ Test protection contre brute force                       │
└─────────────────────────────────────────────────────────────┘
```

**Exemple de Mock à Créer:**
```typescript
// Mock auth mutations
const LOGIN_MUTATION_MOCK = {
  request: {
    query: LOGIN_MUTATION,
    variables: { email: 'test@test.com', password: 'Password123!' }
  },
  result: {
    data: {
      login: {
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@test.com', role: 'ADMIN' }
      }
    }
  }
};
```

---

#### 📄 `user.service.test.ts` (core)
**Localisation:** `front-end/src/core/services/__tests__/services/`  
**TODOs Total:** ~12  
**Impact Business:** 🔴 CRITIQUE

**Catégories de TODOs:**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. MOCKS GraphQL (4 TODOs)                                 │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mock GET_USER query                                      │
│ ☐ Mock UPDATE_USER mutation                                │
│ ☐ Mock DELETE_USER mutation                                │
│ ☐ Mock GET_USERS_LIST query (pagination)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. TESTS CRUD (4 TODOs)                                    │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test fetchUser() retourne utilisateur complet            │
│ ☐ Test updateUser() met à jour les champs                  │
│ ☐ Test deleteUser() supprime et invalide cache             │
│ ☐ Test getUsersList() avec filtres/pagination              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. VALIDATION & ERREURS (4 TODOs)                          │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test validation email format                             │
│ ☐ Test erreur 404 utilisateur non trouvé                   │
│ ☐ Test erreur 403 permissions insuffisantes                │
│ ☐ Test retry sur network error                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### 📄 `order.service.test.ts`
**Localisation:** `front-end/src/features/orders/services/__tests__/services/`  
**TODOs Total:** ~12  
**Impact Business:** 🔴 CRITIQUE (Transactions)

**Catégories de TODOs:**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. MOCKS TRANSACTIONS (5 TODOs)                            │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mock CREATE_ORDER mutation                               │
│ ☐ Mock GET_ORDER_BY_ID query                               │
│ ☐ Mock UPDATE_ORDER_STATUS mutation                        │
│ ☐ Mock CANCEL_ORDER mutation                               │
│ ☐ Mock GET_USER_ORDERS query                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. TESTS BUSINESS LOGIC (4 TODOs)                          │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test création commande avec calcul total correct         │
│ ☐ Test mise à jour statut (PENDING → PAID → COMPLETED)     │
│ ☐ Test annulation commande et remboursement                │
│ ☐ Test historique commandes utilisateur                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. EDGE CASES CRITIQUES (3 TODOs)                          │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test stock insuffisant → échec commande                  │
│ ☐ Test paiement échoué → rollback                          │
│ ☐ Test concurrence (2 users, même produit)                 │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.2 Service Stats Utilisateur

#### 📄 `user-stats.service.test.ts`
**TODOs Total:** ~12  
**Impact Business:** 🟠 ÉLEVÉ (Analytics)

**Actions Requises:**
- Mock queries statistiques (attendances, courses enrolled, etc.)
- Tester agrégations et calculs de moyennes
- Valider formats de dates et périodes

---

## 🔧 PRIORITÉ 2 - FORMATTERS & UTILS (Volume Maximum de TODOs)

### 2.1 User Formatters (110 TODOs)

#### 📄 `user-formatters.test.ts`
**Localisation:** `front-end/src/features/users/utils/__tests__/utils/`  
**Nombre de fonctions à tester:** 25 fonctions

**Breakdown par Fonction:**

| Fonction | TODOs | Catégorie Principale |
|----------|-------|---------------------|
| `formatUserFullName` | 6 | Mocks valides, edge cases null |
| `formatUserInitials` | 6 | Edge cases noms composés |
| `formatUserEmail` | 6 | Validation email, lowercase |
| `formatUserPhone` | 6 | Formats internationaux |
| `getUserRoleLabel` | 6 | i18n, traductions |
| `getUserRoleColor` | 6 | Mapping couleurs valides |
| `formatUserJoinDate` | 6 | Date-fns, formats localisés |
| `calculateUserAge` | 6 | Edge cases dates futures |
| `isUserActive` | 6 | Logique statut combinée |
| `canEditUser` | 6 | Permissions RBAC |
| `canDeleteUser` | 6 | Permissions + contraintes |
| `sortUsersByName` | 6 | Tri alphabétique, accents |
| `filterUsersByRole` | 6 | Filtres multiples |
| ... | ... | ... |

**Pattern de TODO Répétitif:**
```
Pour CHAQUE fonction (×25):
  ☐ TODO: Provide valid input data (ligne ~60)
  ☐ TODO: Add mock data for different types (ligne ~68)
  ☐ TODO: Test null/undefined handling (ligne ~85)
  ☐ TODO: Test invalid input (ligne ~90)
  ☐ TODO: Add actual type assertion (ligne ~107)
  ☐ TODO: Test with realistic data (ligne ~146)
```

**Stratégie de Complétion Recommandée:**
1. **Créer des fixtures réutilisables** (mock data users)
2. **Template de tests par type de fonction:**
   - Formatters (formatUserFullName, formatUserEmail, etc.)
   - Validators (isUserActive, canEditUser, etc.)
   - Transformers (sortUsersByName, filterUsersByRole, etc.)
3. **Utiliser find & replace intelligent** pour patterns répétitifs

**Exemple de Fixture à Créer:**
```typescript
// user-fixtures.ts
export const mockUsers = {
  valid: {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    joinDate: '2024-01-15T10:00:00Z'
  },
  withNullFields: {
    id: '2',
    firstName: null,
    lastName: undefined,
    email: '',
    // ...
  },
  withSpecialChars: {
    firstName: 'Jean-François',
    lastName: "O'Connor",
    // ...
  }
};
```

---

### 2.2 Product Formatters (101 TODOs)

#### 📄 `product-formatters.test.ts`
**Localisation:** `front-end/src/features/shop/utils/__tests__/utils/`  
**Nombre de fonctions:** 23 fonctions

**Fonctions Critiques à Prioriser:**

```
┌─────────────────────────────────────────────────────────────┐
│ PRIORITÉ HAUTE (Business Logic)                            │
├─────────────────────────────────────────────────────────────┤
│ ☐ formatPrice() - Affichage monétaire correct              │
│ ☐ calculateDiscountPercentage() - Calculs promo            │
│ ☐ isValidPrice() - Validation prix positifs                │
│ ☐ getStockStatus() - Logique stock (disponible/rupture)    │
│ ☐ filterProductsByStock() - Filtrage inventaire            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRIORITÉ MOYENNE (UX)                                       │
├─────────────────────────────────────────────────────────────┤
│ ☐ truncateDescription() - Affichage texte tronqué          │
│ ☐ formatCategory() - Labels catégories                     │
│ ☐ sortProductsByPrice() - Tri listing                      │
│ ☐ createProductSearchableString() - Recherche              │
└─────────────────────────────────────────────────────────────┘
```

**Edge Cases Spécifiques:**
- Prix: 0, négatifs, très grands nombres, décimales
- Stock: 0, négatif, null, undefined
- Discounts: 0%, 100%, >100%, valeurs invalides
- Catégories: null, vides, non-existantes

---

### 2.3 Course Formatters (72 TODOs)

#### 📄 `course-formatters.test.ts`
**Fonctions:** 17 fonctions
**Focus:** Gestion dates/heures, jours de semaine, durées

**Fonctions Complexes:**
```
☐ formatTimeRange() - Plages horaires (9h-10h)
☐ calculateDuration() - Calcul durée en minutes
☐ sortDays() - Tri jours semaine (lundi → dimanche)
☐ groupCoursesByDay() - Agrégation par jour
☐ formatInstructorNames() - Noms multiples professeurs
```

**Dépendances Importantes:**
- `date-fns` pour manipulation dates
- i18n pour jours/mois localisés
- Timezone handling (UTC vs local)

---

### 2.4 Message Formatters (80 TODOs)

#### 📄 `message-formatters.test.ts`
**Fonctions:** 19 fonctions
**Focus:** Dates relatives, validation email, sanitization HTML

**Fonctions à Risque (Sécurité):**
```
☐ stripHtml() - Protection XSS
☐ isValidEmail() - Validation RFC 5322
☐ truncateContent() - Prévention injection
```

---

## 🎨 PRIORITÉ 3 - COMPOSANTS UI CRITIQUES

### 3.1 Composants de Paiement

#### 📄 `PaymentForm.test.tsx`
**TODOs:** ~45  
**Impact:** 🔴 CRITIQUE (Stripe intégration)

**Catégories:**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. PROVIDERS & SETUP (8 TODOs)                             │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mock Stripe Elements provider                            │
│ ☐ Mock useStripe hook                                      │
│ ☐ Mock useElements hook                                    │
│ ☐ Mock Apollo mutations (CREATE_PAYMENT_INTENT)            │
│ ☐ Setup i18n pour messages erreur                          │
│ ☐ Mock router pour redirect post-paiement                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. TESTS INTERACTIONS (12 TODOs)                           │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test saisie numéro carte valide                          │
│ ☐ Test saisie date expiration valide                       │
│ ☐ Test saisie CVV valide                                   │
│ ☐ Test validation form complet                             │
│ ☐ Test soumission form → appel Stripe                      │
│ ☐ Test gestion erreur carte refusée                        │
│ ☐ Test gestion erreur réseau                               │
│ ☐ Test loading state pendant paiement                      │
│ ☐ Test succès → redirect confirmation                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. EDGE CASES SÉCURITÉ (5 TODOs)                           │
├─────────────────────────────────────────────────────────────┤
│ ☐ Test double soumission (disabled button)                 │
│ ☐ Test timeout paiement                                    │
│ ☐ Test 3D Secure flow                                      │
│ ☐ Test sauvegarde carte (si feature présente)              │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Composants Layout

#### Fichiers concernés (45 TODOs chacun):
- `MainLayout.test.tsx`
- `Header.test.tsx`
- `Sidebar.test.tsx`

**Pattern commun de TODOs:**
```
Pour chaque composant:
  ☐ Define defaultProps (ligne ~23)
  ☐ Add providers (Apollo, i18n, Router) (ligne ~31)
  ☐ Verify component rendered (ligne ~44)
  ☐ Test custom props (ligne ~57)
  ☐ Test user interactions (click, type, submit) (ligne ~78-110)
  ☐ Test responsive behavior
  ☐ Test accessibility (ARIA, keyboard nav)
```

---

### 3.3 Composants UI Génériques (45 TODOs chacun)

**Fichiers:**
- `Spinner.test.tsx` - Loading states
- `Skeleton.test.tsx` - Loading placeholders
- `Alert.test.tsx` - Messages utilisateur
- `EmptyState.test.tsx` - États vides
- `OptimizedImage.test.tsx` - Images optimisées
- `MultiImageUpload.test.tsx` - Upload fichiers

**Quickwins Possibles:**
Ces composants sont généralement simples et peuvent être complétés rapidement avec des tests de props et de rendu.

---

## 📋 CATÉGORISATION GLOBALE DES TODOs

### Par Type de TODO

| Type | Volume | Effort Estimé | Impact Coverage |
|------|--------|---------------|-----------------|
| **Mocks & Setup** | ~800 | 🟢 Bas | ⭐⭐⭐ Élevé |
| **Assertions basiques** | ~1200 | 🟢 Bas | ⭐⭐⭐ Élevé |
| **Edge cases** | ~600 | 🟡 Moyen | ⭐⭐ Moyen |
| **Intégrations complexes** | ~400 | 🔴 Élevé | ⭐⭐⭐ Élevé |
| **Tests d'accessibilité** | ~300 | 🟡 Moyen | ⭐ Faible |
| **Tests performance** | ~200 | 🔴 Élevé | ⭐ Faible |

### Par Complexité Technique

```
┌─────────────────────────────────────────────────────────────┐
│ NIVEAU 1 - BASIQUE (40% des TODOs) ✅ Facile               │
├─────────────────────────────────────────────────────────────┤
│ • Ajouter données mock simples                             │
│ • Assertions toBeInTheDocument()                           │
│ • Tests de props de base                                   │
│ • Effort: 1-2 min par TODO                                 │
│ • Peut être automatisé/scripté                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ NIVEAU 2 - INTERMÉDIAIRE (35% des TODOs) 🟡 Moyen          │
├─────────────────────────────────────────────────────────────┤
│ • Mocks Apollo/GraphQL                                      │
│ • Tests interactions userEvent                             │
│ • Validation edge cases                                    │
│ • Effort: 3-5 min par TODO                                 │
│ • Nécessite connaissance codebase                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ NIVEAU 3 - AVANCÉ (25% des TODOs) 🔴 Difficile             │
├─────────────────────────────────────────────────────────────┤
│ • Intégration Stripe/paiements                             │
│ • Tests concurrence/race conditions                        │
│ • Mocks services externes complexes                        │
│ • Business logic critique                                  │
│ • Effort: 10-20 min par TODO                               │
│ • Nécessite expertise métier                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 PLAN D'ACTION RECOMMANDÉ

### Phase 1 - Quick Wins (1-2 jours) 🎯 Target: +10% coverage

**Objectif:** Compléter les TODOs basiques pour gain rapide de couverture

**Actions:**
1. ✅ Créer fixtures réutilisables pour chaque domaine:
   - `__fixtures__/user-fixtures.ts`
   - `__fixtures__/product-fixtures.ts`
   - `__fixtures__/course-fixtures.ts`
   - `__fixtures__/message-fixtures.ts`

2. ✅ Script de remplacement automatique pour patterns répétitifs:
   ```bash
   # Exemple: remplacer "TODO: Provide valid input data"
   # par des données fixtures appropriées
   node scripts/fill-basic-todos.js
   ```

3. ✅ Compléter TOUS les formatters (user, product, course, message):
   - Utiliser template de test par type de fonction
   - ~400 TODOs, gain estimé: +8% coverage

**Estimation:** 12-16 heures

---

### Phase 2 - Services Critiques (2-3 jours) 🔥 Target: +8% coverage

**Objectif:** Sécuriser la logique business critique

**Actions:**
1. ✅ Compléter `auth.service.test.ts`:
   - Setup Apollo mocks complets
   - Tests login/logout/refresh
   - Tests sécurité (brute force, token expiration)

2. ✅ Compléter `user.service.test.ts` (core + features):
   - Tests CRUD complets
   - Validation permissions
   - Cache invalidation

3. ✅ Compléter `order.service.test.ts`:
   - Workflow commande complet
   - Tests transactions
   - Tests rollback

4. ✅ Compléter `user-stats.service.test.ts`:
   - Agrégations statistiques
   - Calculs de moyennes

**Estimation:** 16-24 heures

---

### Phase 3 - Composants UI Critiques (2-3 jours) 🎨 Target: +7% coverage

**Objectif:** Tester les composants à haut impact UX

**Actions:**
1. ✅ Compléter `PaymentForm.test.tsx`:
   - Setup Stripe mocks
   - Tests validation formulaire
   - Tests workflow paiement complet
   - ~45 TODOs

2. ✅ Compléter Layout components (3 fichiers):
   - `MainLayout.test.tsx`
   - `Header.test.tsx`
   - `Sidebar.test.tsx`
   - ~135 TODOs total

3. ✅ Compléter UI components génériques (6 fichiers):
   - Spinner, Skeleton, Alert, EmptyState, etc.
   - ~270 TODOs total

**Estimation:** 16-24 heures

---

### Phase 4 - Polissage & Optimisation (1-2 jours) ✨ Target: +5% coverage

**Objectif:** Atteindre objectif final 70-85%

**Actions:**
1. ✅ Identifier fichiers avec couverture <70% via coverage report
2. ✅ Compléter edge cases manquants
3. ✅ Ajouter tests d'intégration entre modules
4. ✅ Optimiser tests lents (mocks, cleanup)
5. ✅ Documentation des patterns de test

**Estimation:** 8-16 heures

---

## 📊 ESTIMATION TEMPS TOTAL

| Phase | Durée | TODOs | Coverage Gain |
|-------|-------|-------|---------------|
| Phase 1 - Quick Wins | 1-2 jours | ~1,400 | +10% |
| Phase 2 - Services | 2-3 jours | ~600 | +8% |
| Phase 3 - UI Critiques | 2-3 jours | ~450 | +7% |
| Phase 4 - Polissage | 1-2 jours | ~300 | +5% |
| **TOTAL** | **6-10 jours** | **~2,750** | **+30%** |

**Coverage finale attendue:** 50% → 80% ✅

---

## 🛠️ OUTILS & HELPERS RECOMMANDÉS

### 1. Fixtures Factory
```typescript
// __test-utils__/factories.ts
import { faker } from '@faker-js/faker';

export const UserFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    joinDate: faker.date.past().toISOString(),
    ...overrides
  })
};
```

### 2. Mock Helpers
```typescript
// __test-utils__/apollo-mocks.ts
export const createMockQuery = (query, variables, data) => ({
  request: { query, variables },
  result: { data }
});

export const createMockMutation = (mutation, variables, data) => ({
  request: { query: mutation, variables },
  result: { data }
});
```

### 3. Render Helpers
```typescript
// __test-utils__/render-with-providers.tsx
export const renderWithProviders = (
  ui: React.ReactElement,
  { apolloMocks = [], i18nResources = {}, ...options } = {}
) => {
  return render(
    <MockedProvider mocks={apolloMocks}>
      <I18nextProvider i18n={i18nMock}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </I18nextProvider>
    </MockedProvider>,
    options
  );
};
```

---

## 📈 MÉTRIQUES DE SUCCÈS

### KPIs à Suivre
- ✅ **Coverage global:** 50% → 80%
- ✅ **Statements:** >70%
- ✅ **Branches:** >60%
- ✅ **Functions:** >75%
- ✅ **Lines:** >70%

### Fichiers Critiques (Target: 90%+)
- `auth.service.ts`
- `user.service.ts`
- `order.service.ts`
- `PaymentForm.tsx`
- Tous les formatters

### Checkpoints
- **Jour 2:** Coverage ≥ 60%
- **Jour 5:** Coverage ≥ 70%
- **Jour 8:** Coverage ≥ 75%
- **Jour 10:** Coverage ≥ 80%

---

## 🎓 PATTERNS DE TEST PAR TYPE

### Pattern: Formatter Function
```typescript
describe('formatUserFullName', () => {
  it('should format full name correctly', () => {
    const user = { firstName: 'John', lastName: 'Doe' };
    expect(formatUserFullName(user)).toBe('John Doe');
  });

  it('should handle null firstName', () => {
    const user = { firstName: null, lastName: 'Doe' };
    expect(formatUserFullName(user)).toBe('Doe');
  });

  it('should handle empty names', () => {
    const user = { firstName: '', lastName: '' };
    expect(formatUserFullName(user)).toBe('');
  });
});
```

### Pattern: Service Method
```typescript
describe('userService.getUser', () => {
  it('should fetch user by id', async () => {
    const mockUser = UserFactory.build();
    const mocks = [
      createMockQuery(GET_USER, { id: '1' }, { user: mockUser })
    ];

    const result = await userService.getUser('1');
    expect(result).toEqual(mockUser);
  });

  it('should throw on network error', async () => {
    const mocks = [
      {
        request: { query: GET_USER, variables: { id: '1' } },
        error: new Error('Network error')
      }
    ];

    await expect(userService.getUser('1')).rejects.toThrow();
  });
});
```

### Pattern: Component with User Interaction
```typescript
describe('PaymentForm', () => {
  it('should submit payment on valid form', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<PaymentForm onSubmit={onSubmit} />);

    const cardInput = screen.getByLabelText(/card number/i);
    await userEvent.type(cardInput, '4242424242424242');

    const submitBtn = screen.getByRole('button', { name: /pay/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ cardNumber: '4242424242424242' })
      );
    });
  });
});
```

---

## 🔗 RESSOURCES & RÉFÉRENCES

### Documentation
- [Vitest Testing Library](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Apollo Client Testing](https://www.apollographql.com/docs/react/development-testing/testing/)
- [Stripe Elements Testing](https://stripe.com/docs/testing)

### Fichiers Importants du Projet
- `scripts/generators/tests/templates/*.template.js` - Templates de tests
- `scripts/generators/tests/analyzer.js` - Analyse code source
- `vitest.config.ts` - Configuration Vitest
- `.storybook/` - Storybook pour tests visuels

---

## 📝 NOTES & RECOMMANDATIONS

### Bonnes Pratiques
1. ✅ **DRY:** Factoriser fixtures et helpers réutilisables
2. ✅ **AAA Pattern:** Arrange, Act, Assert dans chaque test
3. ✅ **Isolation:** Chaque test doit être indépendant
4. ✅ **Descriptif:** Noms de tests clairs et explicites
5. ✅ **Fast:** Optimiser les mocks pour vitesse d'exécution

### Pièges à Éviter
1. ❌ **Over-mocking:** Ne pas mocker ce qui n'a pas besoin de l'être
2. ❌ **Flaky tests:** Tests dépendants de timings ou ordres
3. ❌ **Implementation details:** Tester comportement, pas implémentation
4. ❌ **Snapshot abuse:** Éviter snapshots pour logique métier
5. ❌ **Coverage vanity:** 100% coverage ≠ bons tests

### Optimisations Possibles
- Parallélisation tests avec Vitest workers
- Cache des mocks Apollo entre tests
- Lazy loading des fixtures volumineuses
- Tests E2E complémentaires via Playwright

---

## ✅ CHECKLIST AVANT COMPLÉTION

### Avant de Commencer
- [ ] Lire ce rapport en entier
- [ ] Setup environnement de test local
- [ ] Installer dépendances (`npm install`)
- [ ] Vérifier coverage baseline (`npm run test:coverage`)

### Pendant le Travail
- [ ] Créer branche git `feature/complete-test-todos`
- [ ] Commit réguliers par phase
- [ ] Lancer tests après chaque session (`npm test`)
- [ ] Vérifier couverture intermédiaire

### Avant de Merger
- [ ] Tous les tests passent ✅
- [ ] Coverage global ≥ 70%
- [ ] Aucun test flaky
- [ ] Documentation mise à jour
- [ ] Code review effectuée
- [ ] CI/CD pipeline verte

---

## 📞 CONTACT & SUPPORT

**Questions?** Contactez l'équipe frontend ou consultez:
- `docs/IMPROVEMENTS.txt` - Améliorations récentes
- `docs/CHANGELOG.txt` - Historique des changements
- Slack: #frontend-tests

---

**Dernière mise à jour:** 22 février 2026  
**Auteur:** Assistant IA - Analyse automatisée  
**Version:** 1.0.0

---

🎉 **Bonne chance pour compléter les TODOs et atteindre 80% de couverture !**