/**
 * Assertions personnalisées et helpers pour les tests du module Paiements
 *
 * Ce fichier contient des fonctions d'assertion réutilisables pour simplifier
 * l'écriture des tests et améliorer leur lisibilité.
 *
 * @example
 * ```typescript
 * const payment = await useCase.execute(input);
 * assertPaymentIsValid(payment);
 * assertPaymentHasStatus(payment, 'VALIDATED');
 * ```
 */

import { Payment } from "../../../../domain/entities/paiements/Payment.js";
import { Money } from "../../../../domain/value-objects/paiements/Money.js";
import { PaymentMethod } from "../../../../domain/value-objects/paiements/PaymentMethod.js";
import { PaymentStatus } from "../../../../domain/value-objects/paiements/PaymentStatus.js";
import { PaymentError } from "../../../../domain/errors/paiements/PaymentError.js";
import { CreatePaymentOutput } from "../../CreatePaymentUseCase.js";

// ============== ASSERTIONS POUR PAYMENT ENTITY ==============

/**
 * Vérifie qu'un Payment est valide et bien formé
 *
 * @param payment Payment à vérifier
 * @throws Si le payment n'est pas valide
 */
export function assertPaymentIsValid(
  payment: Payment | null | undefined,
): asserts payment is Payment {
  expect(payment).toBeDefined();
  expect(payment).not.toBeNull();
  expect(payment).toBeInstanceOf(Payment);
}

/**
 * Vérifie qu'un Payment a un ID assigné
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentHasId(payment: Payment): void {
  expect(payment.id).toBeDefined();
  expect(payment.id).not.toBeNull();
  expect(payment.id).toBeGreaterThan(0);
}

/**
 * Vérifie qu'un Payment a le statut attendu
 *
 * @param payment Payment à vérifier
 * @param expectedStatus Statut attendu
 */
export function assertPaymentHasStatus(
  payment: Payment,
  expectedStatus:
    | "PENDING"
    | "VALIDATED"
    | "REFUSED"
    | "CANCELLED"
    | "REFUNDED",
): void {
  expect(payment.status.toString()).toBe(expectedStatus);
}

/**
 * Vérifie qu'un Payment est en attente
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentIsPending(payment: Payment): void {
  assertPaymentHasStatus(payment, "PENDING");
  expect(payment.isPending()).toBe(true);
  expect(payment.confirmedAt).toBeUndefined();
}

/**
 * Vérifie qu'un Payment est validé
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentIsValidated(payment: Payment): void {
  assertPaymentHasStatus(payment, "VALIDATED");
  expect(payment.isValidated()).toBe(true);
  expect(payment.confirmedAt).toBeDefined();
  expect(payment.confirmedAt).toBeInstanceOf(Date);
}

/**
 * Vérifie qu'un Payment est refusé
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentIsRefused(payment: Payment): void {
  assertPaymentHasStatus(payment, "REFUSED");
  expect(payment.isRefused()).toBe(true);
}

/**
 * Vérifie qu'un Payment est annulé
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentIsCancelled(payment: Payment): void {
  assertPaymentHasStatus(payment, "CANCELLED");
  expect(payment.isCancelled()).toBe(true);
}

/**
 * Vérifie qu'un Payment est remboursé
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentIsRefunded(payment: Payment): void {
  assertPaymentHasStatus(payment, "REFUNDED");
  expect(payment.isRefunded()).toBe(true);
}

/**
 * Vérifie qu'un Payment a le montant attendu
 *
 * @param payment Payment à vérifier
 * @param expectedAmount Montant attendu
 * @param expectedCurrency Devise attendue (défaut: EUR)
 */
export function assertPaymentHasAmount(
  payment: Payment,
  expectedAmount: number,
  expectedCurrency: string = "EUR",
): void {
  expect(payment.amount).toBeDefined();
  expect(payment.amount.getAmount()).toBe(expectedAmount);
  expect(payment.amount.getCurrency()).toBe(expectedCurrency);
}

/**
 * Vérifie qu'un Payment a la méthode de paiement attendue
 *
 * @param payment Payment à vérifier
 * @param expectedMethod Méthode attendue
 */
export function assertPaymentHasMethod(
  payment: Payment,
  expectedMethod: string,
): void {
  expect(payment.method).toBeDefined();
  expect(payment.method.getValue()).toBe(expectedMethod);
}

/**
 * Vérifie qu'un Payment a une référence de transaction
 *
 * @param payment Payment à vérifier
 * @param expectedReference Référence attendue (optionnel)
 */
export function assertPaymentHasTransactionReference(
  payment: Payment,
  expectedReference?: string,
): void {
  expect(payment.transactionRef).toBeDefined();
  expect(payment.transactionRef).not.toBeNull();
  expect(typeof payment.transactionRef).toBe("string");
  expect(payment.transactionRef!.length).toBeGreaterThan(0);

  if (expectedReference) {
    expect(payment.transactionRef).toBe(expectedReference);
  }
}

/**
 * Vérifie qu'un Payment n'a pas de référence de transaction
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentHasNoTransactionReference(payment: Payment): void {
  expect(payment.transactionRef).toBeUndefined();
}

/**
 * Vérifie qu'un Payment appartient à un utilisateur
 *
 * @param payment Payment à vérifier
 * @param expectedUserId ID utilisateur attendu
 */
export function assertPaymentBelongsToUser(
  payment: Payment,
  expectedUserId: number,
): void {
  expect(payment.userId).toBe(expectedUserId);
}

/**
 * Vérifie qu'un Payment est lié à une commande
 *
 * @param payment Payment à vérifier
 * @param expectedOrderId ID commande attendu
 */
export function assertPaymentIsLinkedToOrder(
  payment: Payment,
  expectedOrderId: number,
): void {
  expect(payment.orderId).toBe(expectedOrderId);
}

/**
 * Vérifie qu'un Payment est lié à un abonnement
 *
 * @param payment Payment à vérifier
 * @param expectedSubscriptionId ID abonnement attendu
 */
export function assertPaymentIsLinkedToSubscription(
  payment: Payment,
  expectedSubscriptionId: number,
): void {
  expect(payment.subscriptionId).toBe(expectedSubscriptionId);
}

/**
 * Vérifie qu'un Payment a une période définie
 *
 * @param payment Payment à vérifier
 */
export function assertPaymentHasPeriod(payment: Payment): void {
  expect(payment.periodStart).toBeDefined();
  expect(payment.periodEnd).toBeDefined();
  expect(payment.periodStart).toBeInstanceOf(Date);
  expect(payment.periodEnd).toBeInstanceOf(Date);
  expect(payment.periodStart!.getTime()).toBeLessThan(
    payment.periodEnd!.getTime(),
  );
}

/**
 * Vérifie qu'un Payment a une description
 *
 * @param payment Payment à vérifier
 * @param expectedDescription Description attendue (optionnel)
 */
export function assertPaymentHasDescription(
  payment: Payment,
  expectedDescription?: string,
): void {
  expect(payment.description).toBeDefined();
  expect(typeof payment.description).toBe("string");

  if (expectedDescription) {
    expect(payment.description).toBe(expectedDescription);
  }
}

// ============== ASSERTIONS POUR USE CASE OUTPUTS ==============

/**
 * Vérifie qu'une réponse CreatePaymentOutput est réussie
 *
 * @param output Réponse à vérifier
 */
export function assertCreatePaymentOutputIsSuccess(
  output: CreatePaymentOutput,
): void {
  expect(output).toBeDefined();
  expect(output.success).toBe(true);
  expect(output.message).toBeDefined();
  expect(output.payment).toBeDefined();
}

/**
 * Vérifie qu'une réponse CreatePaymentOutput contient un paiement valide
 *
 * @param output Réponse à vérifier
 */
export function assertCreatePaymentOutputHasValidPayment(
  output: CreatePaymentOutput,
): void {
  assertCreatePaymentOutputIsSuccess(output);

  const payment = output.payment!;
  expect(payment.id).toBeDefined();
  expect(payment.id).toBeGreaterThan(0);
  expect(payment.userId).toBeDefined();
  expect(payment.amount).toBeDefined();
  expect(payment.currency).toBeDefined();
  expect(payment.method).toBeDefined();
  expect(payment.status).toBeDefined();
  expect(payment.createdAt).toBeDefined();
  expect(payment.createdAt).toBeInstanceOf(Date);
}

/**
 * Vérifie qu'une réponse contient un montant spécifique
 *
 * @param output Réponse à vérifier
 * @param expectedAmount Montant attendu
 * @param expectedCurrency Devise attendue
 */
export function assertOutputHasAmount(
  output: CreatePaymentOutput,
  expectedAmount: number,
  expectedCurrency: string = "EUR",
): void {
  assertCreatePaymentOutputHasValidPayment(output);
  expect(output.payment!.amount).toBe(expectedAmount);
  expect(output.payment!.currency).toBe(expectedCurrency);
}

// ============== ASSERTIONS POUR ERREURS ==============

/**
 * Vérifie qu'une erreur est une PaymentError
 *
 * @param error Erreur à vérifier
 */
export function assertIsPaymentError(
  error: unknown,
): asserts error is PaymentError {
  expect(error).toBeInstanceOf(PaymentError);
  expect(PaymentError.isPaymentError(error)).toBe(true);
}

/**
 * Vérifie qu'une erreur a le code attendu
 *
 * @param error Erreur à vérifier
 * @param expectedCode Code attendu
 */
export function assertErrorHasCode(
  error: PaymentError,
  expectedCode: string,
): void {
  expect(error.code).toBe(expectedCode);
}

/**
 * Vérifie qu'une erreur contient un message spécifique
 *
 * @param error Erreur à vérifier
 * @param messagePattern Pattern ou texte attendu
 */
export function assertErrorHasMessage(
  error: PaymentError,
  messagePattern: string | RegExp,
): void {
  if (typeof messagePattern === "string") {
    expect(error.message).toContain(messagePattern);
  } else {
    expect(error.message).toMatch(messagePattern);
  }
}

/**
 * Vérifie qu'une erreur est un champ manquant
 *
 * @param error Erreur à vérifier
 * @param fieldName Nom du champ attendu (optionnel)
 */
export function assertIsMissingFieldError(
  error: PaymentError,
  fieldName?: string,
): void {
  assertIsPaymentError(error);
  assertErrorHasCode(error, "MISSING_FIELD");

  if (fieldName) {
    assertErrorHasMessage(error, fieldName);
  }
}

/**
 * Vérifie qu'une erreur est un montant invalide
 *
 * @param error Erreur à vérifier
 */
export function assertIsInvalidAmountError(error: PaymentError): void {
  assertIsPaymentError(error);
  assertErrorHasCode(error, "INVALID_AMOUNT");
}

/**
 * Vérifie qu'une erreur est une méthode de paiement invalide
 *
 * @param error Erreur à vérifier
 */
export function assertIsInvalidPaymentMethodError(error: PaymentError): void {
  assertIsPaymentError(error);
  assertErrorHasCode(error, "INVALID_PAYMENT_METHOD");
}

/**
 * Vérifie qu'une erreur est un paiement dupliqué
 *
 * @param error Erreur à vérifier
 */
export function assertIsDuplicatePaymentError(error: PaymentError): void {
  assertIsPaymentError(error);
  assertErrorHasCode(error, "DUPLICATE_PAYMENT");
}

/**
 * Vérifie qu'une erreur est un paiement non trouvé
 *
 * @param error Erreur à vérifier
 */
export function assertIsPaymentNotFoundError(error: PaymentError): void {
  assertIsPaymentError(error);
  assertErrorHasCode(error, "PAYMENT_NOT_FOUND");
}

/**
 * Vérifie qu'une erreur est une transition de statut invalide
 *
 * @param error Erreur à vérifier
 */
export function assertIsInvalidStatusTransitionError(
  error: PaymentError,
): void {
  assertIsPaymentError(error);
  assertErrorHasCode(error, "INVALID_STATUS_TRANSITION");
}

// ============== ASSERTIONS POUR MOCKS ==============

/**
 * Vérifie qu'un mock de repository a été appelé pour créer un paiement
 *
 * @param mockRepository Mock du repository
 * @param expectedCallCount Nombre d'appels attendu (défaut: 1)
 */
export function assertRepositoryCreateWasCalled(
  mockRepository: any,
  expectedCallCount: number = 1,
): void {
  expect(mockRepository.create).toHaveBeenCalledTimes(expectedCallCount);
}

/**
 * Vérifie qu'un mock de repository a été appelé avec des données spécifiques
 *
 * @param mockRepository Mock du repository
 * @param expectedData Données attendues (partiel)
 */
export function assertRepositoryCreateWasCalledWith(
  mockRepository: any,
  expectedData: Partial<{
    userId: number;
    amount: Money;
    method: PaymentMethod;
  }>,
): void {
  expect(mockRepository.create).toHaveBeenCalled();

  const callArgs = mockRepository.create.mock.calls[0][0];

  if (expectedData.userId) {
    expect(callArgs.userId).toBe(expectedData.userId);
  }

  if (expectedData.amount) {
    expect(callArgs.amount).toEqual(expectedData.amount);
  }

  if (expectedData.method) {
    expect(callArgs.method).toEqual(expectedData.method);
  }
}

/**
 * Vérifie qu'un mock de gateway a créé une intention de paiement
 *
 * @param mockGateway Mock du gateway
 * @param expectedCallCount Nombre d'appels attendu (défaut: 1)
 */
export function assertGatewayCreatePaymentIntentWasCalled(
  mockGateway: any,
  expectedCallCount: number = 1,
): void {
  expect(mockGateway.createPaymentIntent).toHaveBeenCalledTimes(
    expectedCallCount,
  );
}

/**
 * Vérifie qu'un mock de gateway n'a PAS créé d'intention de paiement
 *
 * @param mockGateway Mock du gateway
 */
export function assertGatewayCreatePaymentIntentWasNotCalled(
  mockGateway: any,
): void {
  expect(mockGateway.createPaymentIntent).not.toHaveBeenCalled();
}

/**
 * Vérifie qu'une transaction d'audit a été enregistrée
 *
 * @param mockRepository Mock du repository
 * @param expectedType Type de transaction attendu
 */
export function assertAuditTransactionWasRecorded(
  mockRepository: any,
  expectedType:
    | "CREATION"
    | "VALIDATION"
    | "REFUND"
    | "CANCELLATION"
    | "REFUSAL",
): void {
  expect(mockRepository.recordTransaction).toHaveBeenCalled();

  const callArgs = mockRepository.recordTransaction.mock.calls[0];
  expect(callArgs[1]).toBe(expectedType);
}

/**
 * Vérifie qu'un paiement a été validé dans le repository
 *
 * @param mockRepository Mock du repository
 * @param expectedPaymentId ID du paiement attendu
 */
export function assertPaymentWasValidated(
  mockRepository: any,
  expectedPaymentId?: number,
): void {
  expect(mockRepository.validate).toHaveBeenCalled();

  if (expectedPaymentId) {
    const callArgs = mockRepository.validate.mock.calls[0];
    expect(callArgs[0]).toBe(expectedPaymentId);
  }
}

/**
 * Vérifie qu'un paiement a été remboursé dans le repository
 *
 * @param mockRepository Mock du repository
 * @param expectedPaymentId ID du paiement attendu
 */
export function assertPaymentWasRefunded(
  mockRepository: any,
  expectedPaymentId?: number,
): void {
  expect(mockRepository.refund).toHaveBeenCalled();

  if (expectedPaymentId) {
    const callArgs = mockRepository.refund.mock.calls[0];
    expect(callArgs[0]).toBe(expectedPaymentId);
  }
}

/**
 * Vérifie qu'un paiement a été annulé dans le repository
 *
 * @param mockRepository Mock du repository
 * @param expectedPaymentId ID du paiement attendu
 */
export function assertPaymentWasCancelled(
  mockRepository: any,
  expectedPaymentId?: number,
): void {
  expect(mockRepository.cancel).toHaveBeenCalled();

  if (expectedPaymentId) {
    const callArgs = mockRepository.cancel.mock.calls[0];
    expect(callArgs[0]).toBe(expectedPaymentId);
  }
}

// ============== ASSERTIONS POUR COLLECTIONS ==============

/**
 * Vérifie qu'une liste de paiements n'est pas vide
 *
 * @param payments Liste de paiements
 */
export function assertPaymentListIsNotEmpty(payments: Payment[]): void {
  expect(payments).toBeDefined();
  expect(Array.isArray(payments)).toBe(true);
  expect(payments.length).toBeGreaterThan(0);
}

/**
 * Vérifie qu'une liste de paiements a une taille spécifique
 *
 * @param payments Liste de paiements
 * @param expectedSize Taille attendue
 */
export function assertPaymentListHasSize(
  payments: Payment[],
  expectedSize: number,
): void {
  expect(payments).toBeDefined();
  expect(Array.isArray(payments)).toBe(true);
  expect(payments.length).toBe(expectedSize);
}

/**
 * Vérifie que tous les paiements d'une liste appartiennent à un utilisateur
 *
 * @param payments Liste de paiements
 * @param expectedUserId ID utilisateur attendu
 */
export function assertAllPaymentsBelongToUser(
  payments: Payment[],
  expectedUserId: number,
): void {
  assertPaymentListIsNotEmpty(payments);

  payments.forEach((payment) => {
    assertPaymentBelongsToUser(payment, expectedUserId);
  });
}

/**
 * Vérifie que tous les paiements d'une liste ont un statut spécifique
 *
 * @param payments Liste de paiements
 * @param expectedStatus Statut attendu
 */
export function assertAllPaymentsHaveStatus(
  payments: Payment[],
  expectedStatus:
    | "PENDING"
    | "VALIDATED"
    | "REFUSED"
    | "CANCELLED"
    | "REFUNDED",
): void {
  assertPaymentListIsNotEmpty(payments);

  payments.forEach((payment) => {
    assertPaymentHasStatus(payment, expectedStatus);
  });
}
