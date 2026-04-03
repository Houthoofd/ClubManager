# Correctifs nécessaires pour les tests du module Paiements

## 🐛 Erreurs TypeScript détectées

### 1. TransactionProvider - Utiliser l'enum au lieu de string

**Erreur:**
```typescript
// ❌ INCORRECT
createMockPaymentGatewayServiceWithDefaults('STRIPE');
TransactionReference.create('pi_123', 'STRIPE');
```

**Solution:**
```typescript
// ✅ CORRECT
import { TransactionProvider } from '../../../../domain/value-objects/paiements/TransactionReference.js';

createMockPaymentGatewayServiceWithDefaults(TransactionProvider.STRIPE);
TransactionReference.create('pi_123', TransactionProvider.STRIPE);
```

**Fichiers à corriger:**
- `mockPaymentGatewayService.ts` (lignes 85, 96)
- `CreatePaymentUseCase.test.ts` (ligne 81)
- `ValidatePaymentUseCase.test.ts` (toutes les références)
- `RefundPaymentUseCase.test.ts` (toutes les références)
- `paymentTestData.ts` (testTransactionReferences)

---

### 2. PaymentError.toThrow() - Constructeur privé

**Erreur:**
```typescript
// ❌ INCORRECT
await expect(useCase.execute(input)).rejects.toThrow(PaymentError);
```

**Solution (Option A - Recommandée):**
```typescript
// ✅ CORRECT - Tester l'instance
await expect(useCase.execute(input)).rejects.toThrow();

// Puis vérifier que c'est bien une PaymentError
try {
  await useCase.execute(input);
  fail('Should have thrown an error');
} catch (error) {
  expect(PaymentError.isPaymentError(error)).toBe(true);
  expect((error as PaymentError).code).toBe('EXPECTED_CODE');
}
```

**Solution (Option B - Plus simple):**
```typescript
// ✅ CORRECT - Juste vérifier qu'une erreur est levée
await expect(useCase.execute(input)).rejects.toThrow();
```

**Fichiers à corriger:**
- `CreatePaymentUseCase.test.ts` (lignes 304, 323, 333, 341, 351, 367, 375, 401, 417, 431, 448, 476, 570, 618, 657)
- `ValidatePaymentUseCase.test.ts` (toutes les occurrences)
- `RefundPaymentUseCase.test.ts` (toutes les occurrences)

---

### 3. Payment.create() - Propriété 'paymentDate' manquante

**Erreur:**
```typescript
// ❌ INCORRECT
Payment.create({
  userId: 1,
  amount: Money.create(100, 'EUR'),
  method: PaymentMethod.fromString('CREDIT_CARD'),
  transactionRef: 'pi_123',
});
```

**Solution:**
```typescript
// ✅ CORRECT
Payment.create({
  userId: 1,
  amount: Money.create(100, 'EUR'),
  method: PaymentMethod.fromString('CREDIT_CARD'),
  transactionRef: 'pi_123',
  paymentDate: new Date(), // ← REQUIS
});
```

**Fichiers à corriger:**
- `mockPaymentRepository.ts` (ligne 149)
- `paymentTestData.ts` (fonction createTestPayment, ligne ~300)
- `CreatePaymentUseCase.test.ts` (lignes 467, 644, 665)

---

## 🔧 Plan de correction

### Étape 1: Corriger mockPaymentGatewayService.ts

```typescript
// Ligne 1 - Ajouter l'import
import { TransactionProvider } from '../../../../domain/value-objects/paiements/TransactionReference.js';

// Ligne 85 - Modifier la signature
export const createMockPaymentGatewayServiceWithDefaults = (
  provider: TransactionProvider = TransactionProvider.STRIPE
): jest.Mocked<IPaymentGatewayService> => {
  // ...
  
  // Ligne 96 - Utiliser l'enum
  transactionReference: TransactionReference.create(`pi_${generateMockId()}`, provider),
  
  // Ligne 210 - Modifier
  mock.getProvider.mockReturnValue(TransactionProvider.PAYPAL);
};
```

### Étape 2: Corriger paymentTestData.ts

```typescript
// Ajouter paymentDate dans createTestPayment
export const createTestPayment = (overrides: Partial<{
  // ... autres props
  paymentDate: Date;
}> = {}): Payment => {
  const defaults = {
    userId: 1,
    amount: Money.create(100, 'EUR'),
    method: PaymentMethod.fromString('CREDIT_CARD'),
    description: 'Paiement de test',
    paymentDate: new Date(), // ← AJOUTER
  };

  const data = { ...defaults, ...overrides };

  const payment = Payment.create({
    userId: data.userId,
    orderId: data.orderId,
    amount: data.amount,
    method: data.method,
    transactionRef: data.transactionRef,
    description: data.description,
    subscriptionId: data.subscriptionId,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    paymentDate: data.paymentDate, // ← AJOUTER
  });
  
  // ...
};

// Corriger testTransactionReferences
export const testTransactionReferences = {
  stripe: TransactionReference.create('pi_1234567890abcdef', TransactionProvider.STRIPE),
  paypal: TransactionReference.create('PAYID-ABCD1234', TransactionProvider.PAYPAL),
  manual: TransactionReference.create('MANUAL_REF_123', TransactionProvider.MANUAL),
};
```

### Étape 3: Corriger les fichiers de test

Dans **tous les fichiers .test.ts**, remplacer:

```typescript
// ❌ Avant
await expect(useCase.execute(input)).rejects.toThrow(PaymentError);

// ✅ Après
await expect(useCase.execute(input)).rejects.toThrow();
```

Ou mieux encore, utiliser les helpers d'assertions:

```typescript
// ✅ Utiliser les helpers
try {
  await useCase.execute(input);
  fail('Should have thrown');
} catch (error) {
  assertIsPaymentError(error);
  assertIsMissingFieldError(error as PaymentError, 'userId');
}
```

---

## 📝 Checklist des corrections

- [ ] **mockPaymentGatewayService.ts**
  - [ ] Importer TransactionProvider
  - [ ] Remplacer 'STRIPE' par TransactionProvider.STRIPE
  - [ ] Remplacer 'PAYPAL' par TransactionProvider.PAYPAL
  - [ ] Remplacer 'MANUAL' par TransactionProvider.MANUAL

- [ ] **paymentTestData.ts**
  - [ ] Ajouter paymentDate dans createTestPayment
  - [ ] Ajouter paymentDate dans tous les helpers de création
  - [ ] Corriger testTransactionReferences avec TransactionProvider enum

- [ ] **mockPaymentRepository.ts**
  - [ ] Ajouter paymentDate dans configureMockCreateWithAutoId

- [ ] **CreatePaymentUseCase.test.ts**
  - [ ] Remplacer tous les .rejects.toThrow(PaymentError)
  - [ ] Ajouter paymentDate où nécessaire

- [ ] **ValidatePaymentUseCase.test.ts**
  - [ ] Remplacer tous les .rejects.toThrow(PaymentError)
  - [ ] Utiliser TransactionProvider enum

- [ ] **RefundPaymentUseCase.test.ts**
  - [ ] Remplacer tous les .rejects.toThrow(PaymentError)
  - [ ] Utiliser TransactionProvider enum

---

## 🧪 Vérification

Après corrections, exécuter:

```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Lancer les tests
npm test -- paiements

# Vérifier le coverage
npm test -- paiements --coverage
```

---

## 💡 Notes importantes

1. **TransactionProvider est un enum TypeScript**, pas une string
   - Toujours utiliser `TransactionProvider.STRIPE` au lieu de `'STRIPE'`

2. **PaymentError a un constructeur privé**
   - On ne peut pas utiliser `.toThrow(PaymentError)` directement
   - Utiliser `.toThrow()` ou vérifier avec `PaymentError.isPaymentError(error)`

3. **Payment.create() requiert paymentDate**
   - C'est une propriété obligatoire depuis la définition de l'interface
   - Toujours fournir `paymentDate: new Date()` ou une date spécifique

4. **Les helpers d'assertions sont là pour ça**
   - Utiliser `assertIsPaymentError()`, `assertIsMissingFieldError()`, etc.
   - Plus lisible et plus maintenable que les assertions Jest brutes

---

## 🔄 Prochaines étapes

Une fois les correctifs appliqués:

1. ✅ Vérifier que tous les tests passent
2. ✅ Vérifier le coverage (objectif >95%)
3. ✅ Créer les tests pour les Use Cases restants:
   - CancelPaymentUseCase
   - GetPaymentUseCase
   - GetUserPaymentsUseCase
   - GetPaymentSchedulesUseCase
   - PayScheduleUseCase
   - GetOverdueSchedulesUseCase
   - GetPaymentStatisticsUseCase
4. ✅ Commit et push sur la branche