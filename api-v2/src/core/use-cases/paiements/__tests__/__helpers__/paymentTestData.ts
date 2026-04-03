/**
 * Données de test et helpers réutilisables pour les tests du module Paiements
 *
 * Ce fichier contient :
 * - Données de test valides et invalides
 * - Builders pour créer facilement des objets de test
 * - Fixtures communes
 *
 * @example
 * ```typescript
 * const payment = createTestPayment({ amount: 50.00 });
 * const input = validCreatePaymentInput({ userId: 123 });
 * ```
 */

import { Payment } from "../../../../domain/entities/paiements/Payment.js";
import { Money } from "../../../../domain/value-objects/paiements/Money.js";
import { PaymentMethod } from "../../../../domain/value-objects/paiements/PaymentMethod.js";
import { PaymentStatus } from "../../../../domain/value-objects/paiements/PaymentStatus.js";
import { TransactionReference } from "../../../../domain/value-objects/paiements/TransactionReference.js";
import { CreatePaymentInput } from "../../CreatePaymentUseCase.js";

// ============== DONNÉES DE TEST VALIDES ==============

/**
 * Données valides pour créer un paiement par carte bancaire
 */
export const validCreatePaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 100.0,
  currency: "EUR",
  method: "CREDIT_CARD",
  description: "Paiement de test",
  metadata: {
    source: "test",
  },
};

/**
 * Données valides pour un paiement en espèces
 */
export const validCashPaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 50.0,
  currency: "EUR",
  method: "CASH",
  description: "Paiement en espèces",
};

/**
 * Données valides pour un paiement par virement
 */
export const validBankTransferInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 200.0,
  currency: "EUR",
  method: "BANK_TRANSFER",
  description: "Paiement par virement",
  transactionReference: "TRANSFER_123456",
  transactionProvider: 'MANUAL',
};

/**
 * Données valides pour un paiement par chèque
 */
export const validCheckPaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 75.0,
  currency: "EUR",
  method: "CHECK",
  description: "Paiement par chèque",
  transactionReference: "CHQ_987654",
  transactionProvider: 'MANUAL',
};

/**
 * Données valides pour un paiement Stripe
 */
export const validStripePaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 150.0,
  currency: "EUR",
  method: "CREDIT_CARD",
  description: "Paiement Stripe",
  transactionReference: "pi_1234567890abcdef",
  transactionProvider: 'STRIPE',
};

/**
 * Données valides pour un paiement PayPal
 */
export const validPayPalPaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 120.0,
  currency: "EUR",
  method: "PAYPAL",
  description: "Paiement PayPal",
  transactionReference: "PAYID-123456789",
  transactionProvider: 'PAYPAL',
};

/**
 * Données valides pour un paiement d'abonnement
 */
export const validSubscriptionPaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 99.99,
  currency: "EUR",
  method: "CREDIT_CARD",
  description: "Paiement abonnement mensuel",
  subscriptionId: 1,
  periodStart: new Date("2024-01-01"),
  periodEnd: new Date("2024-01-31"),
  transactionReference: "pi_subscription_123",
  transactionProvider: 'STRIPE',
};

/**
 * Données valides pour un paiement de commande
 */
export const validOrderPaymentInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 250.0,
  currency: "EUR",
  method: "CREDIT_CARD",
  description: "Paiement commande #42",
  orderId: 42,
  transactionReference: "pi_order_42_123",
  transactionProvider: 'STRIPE',
};

// ============== DONNÉES DE TEST INVALIDES ==============

/**
 * Données invalides : userId manquant
 */
export const invalidMissingUserIdInput: Partial<CreatePaymentInput> = {
  amount: 100.0,
  currency: "EUR",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : userId invalide (négatif)
 */
export const invalidNegativeUserIdInput: Partial<CreatePaymentInput> = {
  userId: -1,
  amount: 100.0,
  currency: "EUR",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : montant manquant
 */
export const invalidMissingAmountInput: Partial<CreatePaymentInput> = {
  userId: 1,
  currency: "EUR",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : montant négatif
 */
export const invalidNegativeAmountInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: -50.0,
  currency: "EUR",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : montant zéro
 */
export const invalidZeroAmountInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 0,
  currency: "EUR",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : montant trop élevé
 */
export const invalidTooHighAmountInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 1000000.0,
  currency: "EUR",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : méthode de paiement manquante
 */
export const invalidMissingMethodInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 100.0,
  currency: "EUR",
};

/**
 * Données invalides : méthode de paiement invalide
 */
export const invalidPaymentMethodInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 100.0,
  currency: "EUR",
  method: "INVALID_METHOD",
};

/**
 * Données invalides : devise invalide
 */
export const invalidCurrencyInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 100.0,
  currency: "INVALID",
  method: "CREDIT_CARD",
};

/**
 * Données invalides : abonnement sans périodes
 */
export const invalidSubscriptionNoPeriodInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 99.99,
  currency: "EUR",
  method: "CREDIT_CARD",
  subscriptionId: 1,
  // periodStart et periodEnd manquants
};

/**
 * Données invalides : périodes inversées
 */
export const invalidReversedPeriodsInput: Partial<CreatePaymentInput> = {
  userId: 1,
  amount: 99.99,
  currency: "EUR",
  method: "CREDIT_CARD",
  subscriptionId: 1,
  periodStart: new Date("2024-01-31"),
  periodEnd: new Date("2024-01-01"),
};

// ============== BUILDERS ==============

/**
 * Crée des données de test pour CreatePaymentInput avec personnalisation
 *
 * @param overrides Propriétés à personnaliser
 * @returns Données de test complètes
 *
 * @example
 * ```typescript
 * const input = createTestPaymentInput({ amount: 50, userId: 123 });
 * ```
 */
export const createTestPaymentInput = (
  overrides: Partial<CreatePaymentInput> = {},
): CreatePaymentInput => {
  return {
    ...validCreatePaymentInput,
    ...overrides,
  } as CreatePaymentInput;
};

/**
 * Crée un objet Payment de test
 *
 * @param overrides Propriétés à personnaliser
 * @returns Payment de test
 *
 * @example
 * ```typescript
 * const payment = createTestPayment({ userId: 123, amount: Money.create(50, 'EUR') });
 * ```
 */
export const createTestPayment = (
  overrides: Partial<{
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
  }> = {},
): Payment => {
  const defaults = {
    userId: 1,
    amount: Money.create(100, "EUR"),
    method: PaymentMethod.fromString("CREDIT_CARD"),
    description: "Paiement de test",
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
  });

  // Simuler l'assignation d'ID et dates par la DB
  if (data.id) {
    (payment as any)._id = data.id;
  }
  if (data.createdAt) {
    (payment as any)._createdAt = data.createdAt;
  }
  if (data.status) {
    (payment as any)._status = data.status;
  }
  if (data.confirmedAt) {
    (payment as any)._confirmedAt = data.confirmedAt;
  }

  return payment;
};

/**
 * Crée un paiement validé de test
 *
 * @param overrides Propriétés à personnaliser
 * @returns Payment validé
 */
export const createTestValidatedPayment = (
  overrides: Partial<{
    id: number;
    userId: number;
    amount: Money;
    transactionRef: string;
  }> = {},
): Payment => {
  const payment = createTestPayment({
    id: overrides.id || 1,
    userId: overrides.userId || 1,
    amount: overrides.amount || Money.create(100, "EUR"),
    transactionRef: overrides.transactionRef || "pi_validated_123",
    createdAt: new Date("2024-01-01T10:00:00Z"),
  });

  payment.validate(overrides.transactionRef || "pi_validated_123");
  (payment as any)._confirmedAt = new Date("2024-01-01T10:05:00Z");

  return payment;
};

/**
 * Crée un paiement en attente de test
 *
 * @param overrides Propriétés à personnaliser
 * @returns Payment en attente
 */
export const createTestPendingPayment = (
  overrides: Partial<{
    id: number;
    userId: number;
    amount: Money;
  }> = {},
): Payment => {
  return createTestPayment({
    id: overrides.id || 1,
    userId: overrides.userId || 1,
    amount: overrides.amount || Money.create(100, "EUR"),
    createdAt: new Date(),
  });
};

/**
 * Crée un paiement remboursé de test
 *
 * @param overrides Propriétés à personnaliser
 * @returns Payment remboursé
 */
export const createTestRefundedPayment = (
  overrides: Partial<{
    id: number;
    userId: number;
    amount: Money;
  }> = {},
): Payment => {
  const payment = createTestValidatedPayment(overrides);
  payment.refund("Test refund");
  return payment;
};

/**
 * Crée un paiement annulé de test
 *
 * @param overrides Propriétés à personnaliser
 * @returns Payment annulé
 */
export const createTestCancelledPayment = (
  overrides: Partial<{
    id: number;
    userId: number;
    amount: Money;
  }> = {},
): Payment => {
  const payment = createTestPendingPayment(overrides);
  payment.cancel("Test cancellation");
  return payment;
};

/**
 * Crée un paiement refusé de test
 *
 * @param overrides Propriétés à personnaliser
 * @returns Payment refusé
 */
export const createTestRefusedPayment = (
  overrides: Partial<{
    id: number;
    userId: number;
    amount: Money;
  }> = {},
): Payment => {
  const payment = createTestPendingPayment(overrides);
  payment.refuse("Test refusal");
  return payment;
};

// ============== FIXTURES DE MONTANTS ==============

/**
 * Montants de test courants
 */
export const testAmounts = {
  zero: Money.create(0, "EUR"),
  small: Money.create(10, "EUR"),
  normal: Money.create(100, "EUR"),
  large: Money.create(1000, "EUR"),
  veryLarge: Money.create(50000, "EUR"),
  maximum: Money.create(999999.99, "EUR"),
  tooHigh: Money.create(1000000, "EUR"),

  // Montants avec centimes
  withCents: Money.create(99.99, "EUR"),
  oneCent: Money.create(0.01, "EUR"),

  // Devises différentes
  usd: Money.create(100, "USD"),
  gbp: Money.create(100, "GBP"),
};

/**
 * Méthodes de paiement de test
 */
export const testPaymentMethods = {
  creditCard: PaymentMethod.fromString("CREDIT_CARD"),
  cash: PaymentMethod.fromString("CASH"),
  bankTransfer: PaymentMethod.fromString("BANK_TRANSFER"),
  check: PaymentMethod.fromString("CHECK"),
  paypal: PaymentMethod.fromString("PAYPAL"),
};

/**
 * Références de transaction de test
 */
export const testTransactionReferences = {
  stripe: TransactionReference.create('pi_1234567890abcdef', 'STRIPE'),
  paypal: TransactionReference.create('PAYID-ABCD1234', 'PAYPAL'),
  manual: TransactionReference.create('MANUAL_REF_123', 'MANUAL'),
};

/**
 * Dates de test
 */
export const testDates = {
  past: new Date("2023-01-01T00:00:00Z"),
  recent: new Date("2024-01-01T00:00:00Z"),
  now: new Date(),
  future: new Date("2025-01-01T00:00:00Z"),

  // Périodes d'abonnement
  subscriptionPeriod: {
    start: new Date("2024-01-01T00:00:00Z"),
    end: new Date("2024-01-31T23:59:59Z"),
  },

  invalidPeriod: {
    start: new Date("2024-01-31T23:59:59Z"),
    end: new Date("2024-01-01T00:00:00Z"),
  },
};

/**
 * IDs de test
 */
export const testIds = {
  user: 1,
  user2: 2,
  order: 42,
  subscription: 1,
  payment: 1,
  payment2: 2,
};

/**
 * Métadonnées de test
 */
export const testMetadata = {
  simple: { source: "test" },
  detailed: {
    source: "test",
    environment: "testing",
    version: "1.0.0",
  },
  withCustomer: {
    customerId: "cus_test123",
    customerEmail: "test@example.com",
  },
};
