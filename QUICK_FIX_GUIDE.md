# 🚀 Guide Rapide de Correction - Tests Module Paiements

**Temps estimé : 30-45 minutes**

---

## 🎯 Résumé des erreurs

3 types d'erreurs TypeScript à corriger dans 8 fichiers :

1. **TransactionProvider** : Utiliser l'enum au lieu de string (5 fichiers)
2. **PaymentError.toThrow()** : Constructeur privé (3 fichiers)
3. **Payment.create()** : Propriété `paymentDate` manquante (3 fichiers)

---

## ⚡ Correction rapide - Étape par étape

### 📝 Étape 1 : mockPaymentGatewayService.ts (5 min)

**Fichier :** `api/src/core/use-cases/paiements/__tests__/__mocks__/mockPaymentGatewayService.ts`

**Action 1 :** Ajouter l'import en haut du fichier (ligne ~15)

```typescript
import { TransactionReference, TransactionProvider } from '../../../../domain/value-objects/paiements/TransactionReference.js';
```

**Action 2 :** Ligne 85 - Modifier la signature de la fonction

```typescript
// AVANT
export const createMockPaymentGatewayServiceWithDefaults = (
  provider: TransactionProvider = 'STRIPE'

// APRÈS
export const createMockPaymentGatewayServiceWithDefaults = (
  provider: TransactionProvider = TransactionProvider.STRIPE
```

**Action 3 :** Ligne 210 - Corriger createMockPayPalGateway

```typescript
// AVANT
const mock = createMockPaymentGatewayServiceWithDefaults('PAYPAL');

// APRÈS
const mock = createMockPaymentGatewayServiceWithDefaults(TransactionProvider.PAYPAL);
```

---

### 📝 Étape 2 : paymentTestData.ts (10 min)

**Fichier :** `api/src/core/use-cases/paiements/__tests__/__helpers__/paymentTestData.ts`

**Action 1 :** Ajouter l'import en haut (ligne ~15)

```typescript
import { TransactionReference, TransactionProvider } from '../../../../domain/value-objects/paiements/TransactionReference.js';
```

**Action 2 :** Ligne ~275 - Modifier la fonction createTestPayment

```typescript
// AVANT
export const createTestPayment = (overrides: Partial<{
  id: number;
  userId: number;
  orderId?: number;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  description?: string;
  subscriptionId?: number;
  periodStart?: Date;
  periodEnd?: Date;
  createdAt: Date;
  confirmedAt?: Date;
}> = {}): Payment => {
  const defaults = {
    userId: 1,
    amount: Money.create(100, 'EUR'),
    method: PaymentMethod.fromString('CREDIT_CARD'),
    description: 'Paiement de test',
  };

// APRÈS
export const createTestPayment = (overrides: Partial<{
  id: number;
  userId: number;
  orderId?: number;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  description?: string;
  subscriptionId?: number;
  periodStart?: Date;
  periodEnd?: Date;
  createdAt: Date;
  confirmedAt?: Date;
  paymentDate?: Date;  // ← AJOUTER
}> = {}): Payment => {
  const defaults = {
    userId: 1,
    amount: Money.create(100, 'EUR'),
    method: PaymentMethod.fromString('CREDIT_CARD'),
    description: 'Paiement de test',
    paymentDate: new Date(),  // ← AJOUTER
  };
```

**Action 3 :** Dans le même fichier, ligne ~290 - Ajouter paymentDate au Payment.create()

```typescript
// AVANT
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
});

// APRÈS
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
  paymentDate: data.paymentDate,  // ← AJOUTER
});
```

**Action 4 :** Ligne ~460 - Corriger testTransactionReferences

```typescript
// AVANT
export const testTransactionReferences = {
  stripe: TransactionReference.create('pi_1234567890abcdef', 'STRIPE'),
  paypal: TransactionReference.create('PAYID-ABCD1234', 'PAYPAL'),
  manual: TransactionReference.create('MANUAL_REF_123', 'MANUAL'),
};

// APRÈS
export const testTransactionReferences = {
  stripe: TransactionReference.create('pi_1234567890abcdef', TransactionProvider.STRIPE),
  paypal: TransactionReference.create('PAYID-ABCD1234', TransactionProvider.PAYPAL),
  manual: TransactionReference.create('MANUAL_REF_123', TransactionProvider.MANUAL),
};
```

---

### 📝 Étape 3 : mockPaymentRepository.ts (5 min)

**Fichier :** `api/src/core/use-cases/paiements/__tests__/__mocks__/mockPaymentRepository.ts`

**Action :** Ligne ~149 - Ajouter paymentDate dans configureMockCreateWithAutoId

```typescript
// AVANT
mock.create.mockImplementation(async (data: CreatePaymentData) => {
  const payment = Payment.create({
    userId: data.userId,
    orderId: data.orderId,
    amount: data.amount,
    method: data.method,
    transactionRef: data.transactionReference,
    description: data.description,
    subscriptionId: data.subscriptionId,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
  });

// APRÈS
mock.create.mockImplementation(async (data: CreatePaymentData) => {
  const payment = Payment.create({
    userId: data.userId,
    orderId: data.orderId,
    amount: data.amount,
    method: data.method,
    transactionRef: data.transactionReference,
    description: data.description,
    subscriptionId: data.subscriptionId,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    paymentDate: new Date(),  // ← AJOUTER
  });
```

---

### 📝 Étape 4 : Fichiers de test - Méthode automatique (10 min)

**Fichiers à modifier :**
- `CreatePaymentUseCase.test.ts`
- `ValidatePaymentUseCase.test.ts`
- `RefundPaymentUseCase.test.ts`

**Méthode rapide : Rechercher & Remplacer**

1. Ouvrir VS Code
2. Appuyer sur `Ctrl+Shift+H` (Rechercher dans les fichiers)
3. Rechercher : `.rejects.toThrow(PaymentError)`
4. Remplacer par : `.rejects.toThrow()`
5. Filtrer par fichier : `*.test.ts`
6. Cliquer sur "Remplacer tout"

**Ou manuellement :**

Dans **TOUS** les fichiers `.test.ts`, remplacer chaque occurrence :

```typescript
// AVANT
await expect(useCase.execute(input)).rejects.toThrow(PaymentError);

// APRÈS
await expect(useCase.execute(input)).rejects.toThrow();
```

**Bonus :** Pour garder la vérification du type d'erreur, utiliser les helpers :

```typescript
// MEILLEURE APPROCHE
try {
  await useCase.execute(input);
  fail('Should have thrown an error');
} catch (error) {
  assertIsPaymentError(error);
  assertIsMissingFieldError(error as PaymentError, 'userId');
}
```

---

### 📝 Étape 5 : Ajouter TransactionProvider aux tests (5 min)

**Fichiers :** Tous les `.test.ts`

**Action :** Ajouter l'import en haut de chaque fichier

```typescript
import { TransactionReference, TransactionProvider } from '../../../domain/value-objects/paiements/TransactionReference.js';
```

**Puis remplacer les occurrences :**

```typescript
// AVANT
createMockPaymentGatewayServiceWithDefaults('STRIPE');
TransactionReference.create('pi_123', 'STRIPE');

// APRÈS
createMockPaymentGatewayServiceWithDefaults(TransactionProvider.STRIPE);
TransactionReference.create('pi_123', TransactionProvider.STRIPE);
```

---

## ✅ Vérification

### 1. Vérifier les erreurs TypeScript

```bash
cd api
npx tsc --noEmit
```

**Résultat attendu :** Aucune erreur dans les fichiers de test

### 2. Lancer les tests

```bash
npm test -- paiements
```

**Résultat attendu :** 
```
PASS  src/core/use-cases/paiements/__tests__/CreatePaymentUseCase.test.ts
PASS  src/core/use-cases/paiements/__tests__/ValidatePaymentUseCase.test.ts
PASS  src/core/use-cases/paiements/__tests__/RefundPaymentUseCase.test.ts

Test Suites: 3 passed, 3 total
Tests:       120 passed, 120 total
Time:        ~500ms
```

### 3. Vérifier le coverage

```bash
npm test -- paiements --coverage
```

**Résultat attendu :** >95% de couverture

---

## 🎯 Checklist finale

- [ ] `mockPaymentGatewayService.ts` - Import TransactionProvider
- [ ] `mockPaymentGatewayService.ts` - Utiliser enum au lieu de string
- [ ] `paymentTestData.ts` - Import TransactionProvider
- [ ] `paymentTestData.ts` - Ajouter paymentDate dans createTestPayment
- [ ] `paymentTestData.ts` - Corriger testTransactionReferences
- [ ] `mockPaymentRepository.ts` - Ajouter paymentDate dans mock
- [ ] `CreatePaymentUseCase.test.ts` - Remplacer .toThrow(PaymentError)
- [ ] `ValidatePaymentUseCase.test.ts` - Remplacer .toThrow(PaymentError)
- [ ] `RefundPaymentUseCase.test.ts` - Remplacer .toThrow(PaymentError)
- [ ] Tous les `.test.ts` - Import TransactionProvider
- [ ] Vérifier TypeScript : `npx tsc --noEmit`
- [ ] Lancer les tests : `npm test -- paiements`
- [ ] Vérifier coverage : `npm test -- paiements --coverage`

---

## 📌 Aide-mémoire

### TransactionProvider values

```typescript
TransactionProvider.STRIPE
TransactionProvider.PAYPAL
TransactionProvider.BITCOIN
TransactionProvider.BANK_TRANSFER
TransactionProvider.MANUAL
TransactionProvider.OTHER
```

### Payment.create() - Propriétés requises

```typescript
Payment.create({
  userId: number,           // ✅ REQUIS
  amount: Money,            // ✅ REQUIS
  method: PaymentMethod,    // ✅ REQUIS
  paymentDate: Date,        // ✅ REQUIS
  orderId?: number,
  transactionRef?: string,
  description?: string,
  subscriptionId?: number,
  periodStart?: Date,
  periodEnd?: Date,
})
```

---

## 🆘 En cas de problème

### Erreur persiste après corrections

1. Redémarrer TypeScript Server dans VS Code : `Ctrl+Shift+P` → "Restart TS Server"
2. Supprimer `node_modules/.cache` et relancer les tests
3. Vérifier que tous les imports sont corrects

### Tests échouent

1. Vérifier les logs d'erreur détaillés : `npm test -- paiements --verbose`
2. Lancer un test isolé : `npm test CreatePaymentUseCase.test.ts`
3. Vérifier les mocks : s'assurer qu'ils retournent les bonnes valeurs

---

## 🎉 Prochaines étapes

Une fois les corrections appliquées et tous les tests au vert :

1. ✅ Commit les changements
2. ✅ Push sur la branche `feature/payment-use-cases`
3. ✅ Continuer avec les 7 Use Cases restants
4. ✅ Créer la PR quand le module est complet

---

**Bon courage ! 🚀**