# 🚀 Guide de Démarrage Rapide - Tests Module Paiements

Ce guide vous permettra de démarrer rapidement avec les tests du module Paiements.

---

## ⚡ Démarrage en 3 Minutes

### 1️⃣ Installer les dépendances
```bash
cd ClubManager/api
npm install
```

### 2️⃣ Exécuter tous les tests du module Paiements
```bash
npm test -- paiements
```

### 3️⃣ Vérifier la couverture
```bash
npm test -- paiements --coverage
```

**Résultat attendu** : ~436 tests passent ✅ avec ~70% de couverture

---

## 📋 Commandes Principales

### Exécuter des tests spécifiques

```bash
# Tous les tests du module Paiements
npm test -- paiements

# Un Use Case spécifique
npm test -- CancelPaymentUseCase
npm test -- PayScheduleUseCase

# Un Value Object spécifique
npm test -- Money.test
npm test -- PaymentStatus.test

# Une suite de tests spécifique
npm test -- "GetUserPayments"
```

### Mode développement

```bash
# Watch mode (re-exécute automatiquement)
npm test -- paiements --watch

# Watch avec couverture
npm test -- paiements --watch --coverage

# Mode verbose (plus de détails)
npm test -- paiements --verbose
```

### Couverture de code

```bash
# Rapport de couverture complet
npm test -- paiements --coverage

# Rapport HTML interactif
npm test -- paiements --coverage --coverageReporters=html
# Puis ouvrir: coverage/lcov-report/index.html
```

---

## 📁 Structure des Tests

```
api/src/core/
├── use-cases/paiements/__tests__/
│   ├── __mocks__/                    # Mocks réutilisables
│   │   ├── mockPaymentRepository.ts
│   │   ├── mockPaymentGatewayService.ts
│   │   └── mockPaymentScheduleRepository.ts
│   │
│   ├── __helpers__/                  # Helpers et builders
│   │   ├── paymentTestData.ts        # Fixtures et builders
│   │   ├── paymentScheduleTestData.ts
│   │   └── paymentAssertions.ts      # Assertions personnalisées
│   │
│   └── [UseCase].test.ts             # Tests des Use Cases
│
├── domain/value-objects/paiements/__tests__/
│   ├── Money.test.ts
│   ├── PaymentStatus.test.ts
│   ├── PaymentMethod.test.ts
│   └── TransactionReference.test.ts
│
└── domain/entities/paiements/__tests__/
    └── Payment.test.ts
```

---

## 🧪 Écrire de Nouveaux Tests

### Template de base

```typescript
import { VotreUseCase } from '../VotreUseCase.js';
import { createMockPaymentRepository } from './__mocks__/index.js';
import { expectPaymentError } from './__helpers__/index.js';

describe('VotreUseCase', () => {
  let useCase: VotreUseCase;
  let mockRepo: jest.Mocked<IPaymentRepository>;

  beforeEach(() => {
    mockRepo = createMockPaymentRepository();
    useCase = new VotreUseCase(mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('devrait [comportement attendu]', async () => {
      // Arrange
      const input = { /* données de test */ };
      mockRepo.findById.mockResolvedValue(/* mock response */);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepo.findById).toHaveBeenCalledWith(/* expected args */);
    });
  });

  describe('Validation', () => {
    it('devrait rejeter si données invalides', async () => {
      // Arrange
      const invalidInput = { /* données invalides */ };

      // Act & Assert
      await expectPaymentError(
        useCase.execute(invalidInput),
        'MISSING_FIELD'
      );
    });
  });
});
```

### Utiliser les helpers

```typescript
import {
  // Builders
  createTestPayment,
  createTestValidatedPayment,
  createTestPendingPayment,
  
  // Fixtures
  validCreatePaymentInput,
  testAmounts,
  
  // Assertions
  assertPaymentIsValid,
  expectPaymentError,
} from './__helpers__/index.js';

// Créer un paiement de test
const payment = createTestPayment({
  userId: 123,
  amount: testAmounts.normal,
});

// Vérifier qu'un paiement est valide
assertPaymentIsValid(payment);

// Tester une erreur
await expectPaymentError(
  useCase.execute(invalidInput),
  'INVALID_AMOUNT'
);
```

---

## 🔧 Debugging des Tests

### Test qui échoue ?

```bash
# 1. Exécuter seulement ce test
npm test -- "nom du test qui échoue"

# 2. Mode verbose pour plus de détails
npm test -- "nom du test" --verbose

# 3. Voir la stack trace complète
npm test -- "nom du test" --no-coverage
```

### Logs dans les tests

```typescript
it('devrait faire quelque chose', async () => {
  // Activer les logs
  console.log('Debug:', monObjet);
  
  const result = await useCase.execute(input);
  console.log('Result:', result);
  
  expect(result.success).toBe(true);
});
```

### Isoler un test

```typescript
// Exécuter SEULEMENT ce test
it.only('devrait faire quelque chose', async () => {
  // ...
});

// Ignorer ce test temporairement
it.skip('devrait faire quelque chose', async () => {
  // ...
});
```

---

## ✅ Checklist avant Commit

Avant de commiter du code, vérifier que :

```bash
# 1. ✅ Compilation TypeScript OK
cd api && npx tsc --noEmit

# 2. ✅ Tous les tests passent
npm test -- paiements

# 3. ✅ Couverture maintenue (> 70%)
npm test -- paiements --coverage

# 4. ✅ Pas de tests ignorés (.skip) oubliés
grep -r "it.skip\|describe.skip" api/src/core/use-cases/paiements/__tests__/
```

---

## 📚 Ressources Utiles

### Documentation

- **Rapport complet** : `PAYMENT_TESTS_FINAL_REPORT.md`
- **README tests** : `api/src/core/use-cases/paiements/__tests__/README.md`
- **Documentation Jest** : https://jestjs.io/docs/getting-started

### Fichiers importants

- **Mocks** : `__mocks__/index.ts` - Tous les mocks disponibles
- **Helpers** : `__helpers__/index.ts` - Builders et assertions
- **Exemples** : `CancelPaymentUseCase.test.ts` - Test exemple complet

### Patterns à suivre

✅ **AAA Pattern** : Arrange → Act → Assert  
✅ **Un test = un comportement**  
✅ **Noms descriptifs** : "devrait [comportement] si [condition]"  
✅ **Tests isolés** : Pas d'état partagé entre tests  
✅ **Mocks explicites** : Toujours configurer les mocks  

---

## 🐛 Problèmes Fréquents

### "Cannot find module"
```bash
# Solution: Vérifier les imports
# ✅ Bon:  './__mocks__/index.js'
# ❌ Mauvais: './__mocks__/index'
```

### "expect(...).rejects.toThrow is not working with PaymentError"
```typescript
// ❌ NE PAS FAIRE:
await expect(useCase.execute(input)).rejects.toThrow(PaymentError);

// ✅ FAIRE:
await expectPaymentError(useCase.execute(input), 'ERROR_CODE');
```

### "TransactionProvider is not defined"
```typescript
// ❌ NE PAS FAIRE:
TransactionReference.create('ref', 'STRIPE');

// ✅ FAIRE:
import { TransactionProvider } from '...';
TransactionReference.create('ref', TransactionProvider.STRIPE);
```

### Tests lents
```bash
# Exécuter en parallèle (par défaut)
npm test -- paiements

# Limiter les workers si nécessaire
npm test -- paiements --maxWorkers=4
```

---

## 💡 Conseils Pro

### 1. Utiliser les builders
```typescript
// ❌ Verbose
const payment = Payment.create({
  userId: 1,
  amount: Money.create(100, 'EUR'),
  method: PaymentMethod.fromString('CREDIT_CARD'),
  paymentDate: new Date(),
  description: 'Test'
});

// ✅ Concis
const payment = createTestPayment({ userId: 1 });
```

### 2. Réutiliser les fixtures
```typescript
import { validCreatePaymentInput } from './__helpers__/index.js';

const input = {
  ...validCreatePaymentInput,
  userId: 123, // Override seulement ce qui change
};
```

### 3. Grouper logiquement
```typescript
describe('VotreUseCase', () => {
  describe('Happy Path', () => { /* ... */ });
  describe('Validation', () => { /* ... */ });
  describe('Business Rules', () => { /* ... */ });
  describe('Error Handling', () => { /* ... */ });
});
```

---

## 🎯 Objectifs de Qualité

| Métrique | Minimum | Recommandé | Excellent |
|----------|---------|------------|-----------|
| **Couverture globale** | 60% | 70% | 80%+ |
| **Couverture Use Cases critiques** | 80% | 90% | 100% |
| **Tests par Use Case** | 10 | 20 | 30+ |
| **Temps d'exécution** | < 30s | < 20s | < 10s |

---

## 🚀 En Résumé

### Pour démarrer
```bash
cd ClubManager/api
npm install
npm test -- paiements
```

### Pour développer
```bash
npm test -- paiements --watch
```

### Pour vérifier avant commit
```bash
npx tsc --noEmit && npm test -- paiements --coverage
```

**C'est tout ! Vous êtes prêt à travailler avec les tests** 🎉

---

**Besoin d'aide ?** Consultez :
- `PAYMENT_TESTS_FINAL_REPORT.md` - Rapport détaillé
- `CancelPaymentUseCase.test.ts` - Exemple complet
- `__helpers__/index.ts` - Liste des helpers disponibles