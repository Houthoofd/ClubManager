/**
 * Index des helpers réutilisables pour les tests du module Paiements
 *
 * Ce fichier centralise l'export de tous les helpers pour faciliter les imports.
 *
 * @example
 * ```typescript
 * import {
 *   createTestPayment,
 *   validCreatePaymentInput,
 *   assertPaymentIsValid,
 * } from './__helpers__/index.js';
 * ```
 */

// ============== TEST DATA ==============

export {
  // Données valides
  validCreatePaymentInput,
  validCashPaymentInput,
  validBankTransferInput,
  validCheckPaymentInput,
  validStripePaymentInput,
  validPayPalPaymentInput,
  validSubscriptionPaymentInput,
  validOrderPaymentInput,

  // Données invalides
  invalidMissingUserIdInput,
  invalidNegativeUserIdInput,
  invalidMissingAmountInput,
  invalidNegativeAmountInput,
  invalidZeroAmountInput,
  invalidTooHighAmountInput,
  invalidMissingMethodInput,
  invalidPaymentMethodInput,
  invalidCurrencyInput,
  invalidSubscriptionNoPeriodInput,
  invalidReversedPeriodsInput,

  // Builders
  createTestPaymentInput,
  createTestPayment,
  createTestValidatedPayment,
  createTestPendingPayment,
  createTestRefundedPayment,
  createTestCancelledPayment,
  createTestRefusedPayment,

  // Fixtures
  testAmounts,
  testPaymentMethods,
  testTransactionReferences,
  testDates,
  testIds,
  testMetadata,
} from "./paymentTestData.js";

// ============== ASSERTIONS ==============

export {
  // Assertions pour Payment Entity
  assertPaymentIsValid,
  assertPaymentHasId,
  assertPaymentHasStatus,
  assertPaymentIsPending,
  assertPaymentIsValidated,
  assertPaymentIsRefused,
  assertPaymentIsCancelled,
  assertPaymentIsRefunded,
  assertPaymentHasAmount,
  assertPaymentHasMethod,
  assertPaymentHasTransactionReference,
  assertPaymentHasNoTransactionReference,
  assertPaymentBelongsToUser,
  assertPaymentIsLinkedToOrder,
  assertPaymentIsLinkedToSubscription,
  assertPaymentHasPeriod,
  assertPaymentHasDescription,

  // Assertions pour Use Case Outputs
  assertCreatePaymentOutputIsSuccess,
  assertCreatePaymentOutputHasValidPayment,
  assertOutputHasAmount,

  // Assertions pour Erreurs
  assertIsPaymentError,
  assertErrorHasCode,
  assertErrorHasMessage,
  assertIsMissingFieldError,
  assertIsInvalidAmountError,
  assertIsInvalidPaymentMethodError,
  assertIsDuplicatePaymentError,
  assertIsPaymentNotFoundError,
  assertIsInvalidStatusTransitionError,

  // Assertions pour Mocks
  assertRepositoryCreateWasCalled,
  assertRepositoryCreateWasCalledWith,
  assertGatewayCreatePaymentIntentWasCalled,
  assertGatewayCreatePaymentIntentWasNotCalled,
  assertAuditTransactionWasRecorded,
  assertPaymentWasValidated,
  assertPaymentWasRefunded,
  assertPaymentWasCancelled,

  // Assertions pour Collections
  assertPaymentListIsNotEmpty,
  assertPaymentListHasSize,
  assertAllPaymentsBelongToUser,
  assertAllPaymentsHaveStatus,
} from "./paymentAssertions.js";
