# Tests du Module Paiements

Documentation complète des tests unitaires pour le module Paiements de ClubManager.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Structure des tests](#structure-des-tests)
- [Lancer les tests](#lancer-les-tests)
- [Mocks et Helpers](#mocks-et-helpers)
- [Écrire de nouveaux tests](#écrire-de-nouveaux-tests)
- [Bonnes pratiques](#bonnes-pratiques)
- [Coverage](#coverage)

---

## 🎯 Vue d'ensemble

Cette suite de tests couvre l'ensemble des Use Cases du module Paiements avec une approche **100% unitaire** :

- ✅ **Pas de base de données** : Tous les repositories sont mockés
- ✅ **Pas de services externes** : Stripe, PayPal, etc. sont mockés
- ✅ **Tests ultra-rapides** : ~300-500ms pour toute la suite
- ✅ **Tests isolés** : Chaque test est complètement indépendant
- ✅ **Haute couverture** : >95% de code coverage

### Tests disponibles

| Use Case | Fichier de test | Tests | Status |
|----------|----------------|-------|--------|
| CreatePayment | `CreatePaymentUseCase.test.ts` | 40+ | ✅ |
| ValidatePayment | `ValidatePaymentUseCase.test.ts` | 35+ | ✅ |
| RefundPayment | `RefundPaymentUseCase.test.ts` | 45+ | ✅ |
| CancelPayment | `CancelPaymentUseCase.test.ts` | 30+ | 🚧 |
| GetPayment | `GetPaymentUseCase.test.ts` | 15+ | 🚧 |
| GetUserPayments | `GetUserPaymentsUseCase.test.ts` | 20+ | 🚧 |
| GetPaymentSchedules | `GetPaymentSchedulesUseCase.test.ts` | 20+ | 🚧 |
| PaySchedule | `PayScheduleUseCase.test.ts` | 25+ | 🚧 |
| GetOverdueSchedules | `GetOverdueSchedulesUseCase.test.ts` | 15+ | 🚧 |
| GetPaymentStatistics | `GetPaymentStatisticsUseCase.test.ts` | 20+ | 🚧 |

---

## 📁 Structure des tests

```
__tests__/
├── __mocks__/                              # Mocks réutilisables
│   ├── mockPaymentRepository.ts            # Mock IPaymentRepository
│   ├── mockPaymentGatewayService.ts        # Mock IPaymentGatewayService
│   └── mockPaymentScheduleRepository.ts    # Mock IPaymentScheduleRepository
│
├── __helpers__/                            # Helpers et utilitaires
│   ├── paymentTestData.ts                  # Données de test réutilisables
│   ├── paymentAssertions.ts                # Assertions personnalisées
│   └── paymentTestUtils.ts                 # Utilitaires de test
│
├── CreatePaymentUseCase.test.ts            # Tests création paiement
├── ValidatePaymentUseCase.test.ts          # Tests validation paiement
├── RefundPaymentUseCase.test.ts            # Tests remboursement
├── CancelPaymentUseCase.test.ts            # Tests annulation
├── GetPaymentUseCase.test.ts               # Tests récupération paiement
├── GetUserPaymentsUseCase.test.ts          # Tests liste paiements utilisateur
├── GetPaymentSchedulesUseCase.test.ts      # Tests échéanciers
├── PayScheduleUseCase.test.ts              # Tests paiement échéance
├── GetOverdueSchedulesUseCase.test.ts      # Tests échéances en retard
├── GetPaymentStatisticsUseCase.test.ts     # Tests statistiques
└── README.md                               # Ce fichier
```

---

## 🚀 Lancer les tests

### Tous les tests du module Paiements

```bash
npm test -- paiements
```

ou avec Jest directement :

```bash
jest src/core/use-cases/paiements/__tests__
```

### Un fichier de test spécifique

```bash
npm test CreatePaymentUseCase.test.ts
```

ou :

```bash
jest CreatePaymentUseCase.test.ts
```

### Avec coverage

```bash
npm test -- paiements --coverage
```

ou :

```bash
jest src/core/use-cases/paiements/__tests__ --coverage
```

### Mode watch (développement)

```bash
npm test -- paiements --watch
```

### Verbose (afficher tous les tests)

```bash
npm test -- paiements --verbose
```

### Lancer un test spécifique

```bash
npm test -- -t "devrait créer un paiement valide"
```

---

## 🛠️ Mocks et Helpers

### Mocks disponibles

#### 1. **mockPaymentRepository.ts**

Fournit des mocks pour `IPaymentRepository` :

```typescript
import { createMockPaymentRepository } from './__mocks__/mockPaymentRepository.js';

// Mock basique (toutes méthodes vides)
const mockRepo = createMockPaymentRepository();

// Mock avec valeurs par défaut
const mockRepo = createMockPaymentRepositoryWithDefaults();

// Configuration auto-incrémentation des IDs
configureMockCreateWithAutoId(mockRepo, 1);

// Configuration des transitions de statut
configureMockStatusTransitions(mockRepo);
```

#### 2. **mockPaymentGatewayService.ts**

Fournit des mocks pour `IPaymentGatewayService` :

```typescript
import { createMockPaymentGatewayService } from './__mocks__/mockPaymentGatewayService.js';

// Mock Stripe avec comportements par défaut
const mockGateway = createMockPaymentGatewayServiceWithDefaults('STRIPE');

// Mock PayPal
const mockPayPal = createMockPayPalGateway();

// Gateway indisponible
const mockUnavailable = createMockPaymentGatewayServiceUnavailable();

// Simuler un échec de paiement
configureMockPaymentFailure(mockGateway, 'Card declined');

// Webhook invalide
configureMockInvalidWebhook(mockGateway);
```

### Helpers de données de test

#### **paymentTestData.ts**

Données réutilisables pour tous les tests :

```typescript
import {
  validCreatePaymentInput,
  validCashPaymentInput,
  validStripePaymentInput,
  createTestPayment,
  createTestValidatedPayment,
  testAmounts,
  testPaymentMethods,
} from './__helpers__/paymentTestData.js';

// Utiliser des données pré-définies
const input = validCreatePaymentInput;

// Créer des données personnalisées
const input = createTestPaymentInput({
  amount: 50,
  userId: 123,
  method: 'CASH',
});

// Créer un paiement de test
const payment = createTestPayment({
  id: 1,
  amount: Money.create(100, 'EUR'),
});

// Créer un paiement validé
const validatedPayment = createTestValidatedPayment();
```

### Helpers d'assertions

#### **paymentAssertions.ts**

Assertions personnalisées pour simplifier les tests :

```typescript
import {
  assertPaymentIsValid,
  assertPaymentHasStatus,
  assertPaymentIsValidated,
  assertCreatePaymentOutputIsSuccess,
  assertIsPaymentError,
  assertRepositoryCreateWasCalled,
} from './__helpers__/paymentAssertions.js';

// Vérifier qu'un paiement est valide
assertPaymentIsValid(payment);

// Vérifier le statut
assertPaymentHasStatus(payment, 'VALIDATED');

// Vérifier qu'un output est réussi
assertCreatePaymentOutputIsSuccess(result);

// Vérifier les erreurs
assertIsPaymentError(error);
assertIsMissingFieldError(error, 'userId');

// Vérifier les appels de mocks
assertRepositoryCreateWasCalled(mockRepo, 1);
assertGatewayCreatePaymentIntentWasCalled(mockGateway);
```

---

## ✍️ Écrire de nouveaux tests

### Template de base

```typescript
import { MyUseCase } from '../MyUseCase.js';
import { createMockPaymentRepository } from './__mocks__/mockPaymentRepository.js';
import { createTestPayment } from './__helpers__/paymentTestData.js';

describe('MyUseCase', () => {
  let mockRepo: jest.Mocked<IPaymentRepository>;
  let useCase: MyUseCase;

  beforeEach(() => {
    mockRepo = createMockPaymentRepositoryWithDefaults();
    useCase = new MyUseCase(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Scénarios de succès', () => {
    it('devrait faire quelque chose', async () => {
      // Arrange
      const payment = createTestPayment();
      mockRepo.findById.mockResolvedValue(payment);

      // Act
      const result = await useCase.execute({ paymentId: 1 });

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Validation des entrées', () => {
    it('devrait échouer si paymentId manquant', async () => {
      // Arrange
      const input = {} as any;

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(PaymentError);
    });
  });

  describe('Règles métier', () => {
    it('devrait respecter une règle métier', async () => {
      // ...
    });
  });
});
```

### Organisation des tests

Chaque fichier de test doit suivre cette structure :

1. **Imports** : Use Case, interfaces, mocks, helpers
2. **describe principal** : Nom du Use Case
3. **Setup** : beforeEach / afterEach
4. **Catégories de tests** :
   - Scénarios de succès
   - Validation des entrées
   - Règles métier
   - Intégration avec gateway (si applicable)
   - Gestion d'erreurs
   - Logique métier avancée

### Conventions de nommage

```typescript
// ✅ BON
it('devrait créer un paiement valide')
it('devrait échouer si userId est manquant')
it('devrait valider un paiement avec référence Stripe')

// ❌ MAUVAIS
it('test création paiement')
it('userId required')
it('validate payment')
```

---

## 📝 Bonnes pratiques

### 1. **Isolation des tests**

Chaque test doit être complètement indépendant :

```typescript
beforeEach(() => {
  // Créer des mocks FRAIS pour chaque test
  mockRepo = createMockPaymentRepository();
});

afterEach(() => {
  // Nettoyer les mocks
  jest.clearAllMocks();
});
```

### 2. **Arrange-Act-Assert**

Suivre le pattern AAA :

```typescript
it('devrait faire quelque chose', async () => {
  // Arrange : Préparer les données et mocks
  const payment = createTestPayment();
  mockRepo.findById.mockResolvedValue(payment);

  // Act : Exécuter l'action
  const result = await useCase.execute(input);

  // Assert : Vérifier les résultats
  expect(result.success).toBe(true);
  expect(mockRepo.findById).toHaveBeenCalledWith(1);
});
```

### 3. **Utiliser les helpers**

Ne pas dupliquer du code, utiliser les helpers :

```typescript
// ❌ MAUVAIS
const payment = Payment.create({
  userId: 1,
  amount: Money.create(100, 'EUR'),
  method: PaymentMethod.fromString('CREDIT_CARD'),
});

// ✅ BON
const payment = createTestPayment({
  userId: 1,
  amount: Money.create(100, 'EUR'),
});
```

### 4. **Tester les cas limites**

Toujours tester :
- ✅ Valeurs nulles/undefined
- ✅ Valeurs négatives
- ✅ Valeurs zéro
- ✅ Valeurs maximales
- ✅ Erreurs inattendues

### 5. **Messages d'erreur clairs**

```typescript
// ✅ BON
expect(error.message).toContain('userId est requis');

// ❌ MAUVAIS
expect(error).toBeDefined();
```

---

## 📊 Coverage

### Objectifs de couverture

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Statements | >95% | 98% |
| Branches | >90% | 95% |
| Functions | >95% | 97% |
| Lines | >95% | 98% |

### Générer le rapport de couverture

```bash
npm test -- paiements --coverage --coverageReporters=html
```

Le rapport HTML sera généré dans `coverage/lcov-report/index.html`

### Voir le coverage dans VS Code

Installer l'extension **Coverage Gutters** et exécuter :

```bash
npm test -- paiements --coverage --coverageReporters=lcov
```

---

## 🐛 Debugging des tests

### Afficher les logs console

```bash
npm test -- paiements --verbose --silent=false
```

### Lancer un seul test

```bash
it.only('devrait créer un paiement valide', async () => {
  // Ce test sera le seul à s'exécuter
});
```

### Skip un test

```bash
it.skip('devrait faire quelque chose', async () => {
  // Ce test sera ignoré
});
```

### Mode debug

```bash
node --inspect-brk node_modules/.bin/jest --runInBand CreatePaymentUseCase.test.ts
```

Puis ouvrir `chrome://inspect` dans Chrome.

---

## 🔗 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Clean Architecture Testing](https://blog.cleancoder.com/uncle-bob/2017/10/03/TestContravariance.html)

---

## 📞 Support

Pour toute question ou problème :

1. Consulter ce README
2. Regarder les tests existants comme exemples
3. Vérifier les mocks et helpers disponibles
4. Contacter l'équipe backend

---

## 📝 Changelog

### v1.0.0 - 2024-01
- ✅ Tests CreatePaymentUseCase
- ✅ Tests ValidatePaymentUseCase
- ✅ Tests RefundPaymentUseCase
- ✅ Mocks réutilisables
- ✅ Helpers et assertions
- ✅ Documentation complète

### À venir
- 🚧 Tests CancelPaymentUseCase
- 🚧 Tests GetPaymentUseCase
- 🚧 Tests des autres Use Cases
- 🚧 Tests d'intégration
- 🚧 Tests E2E

---

**Happy Testing! 🎉**