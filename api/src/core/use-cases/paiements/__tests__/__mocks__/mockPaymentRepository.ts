/**
 * Mock réutilisable pour IPaymentRepository
 *
 * Ce mock permet de tester les Use Cases sans dépendance à la base de données.
 * Toutes les méthodes sont mockées avec jest.fn() et peuvent être configurées
 * individuellement dans chaque test.
 *
 * @example
 * ```typescript
 * const mockRepo = createMockPaymentRepository();
 * mockRepo.findById.mockResolvedValue(somePayment);
 * mockRepo.create.mockResolvedValue(createdPayment);
 * ```
 */

import {
  IPaymentRepository,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentFilters,
  PaymentStatistics,
} from "../../../../domain/interfaces/paiements/IPaymentRepository.js";
import { Payment } from "../../../../domain/entities/paiements/Payment.js";
import { Money } from "../../../../domain/value-objects/paiements/Money.js";

/**
 * Crée un mock complet de IPaymentRepository
 *
 * @returns Mock typé de IPaymentRepository avec toutes les méthodes mockées
 */
export const createMockPaymentRepository =
  (): jest.Mocked<IPaymentRepository> => ({
    // Méthodes de création
    create: jest.fn(),

    // Méthodes de recherche
    findById: jest.fn(),
    findByTransactionReference: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findByOrderId: jest.fn(),
    findBySubscriptionId: jest.fn(),
    findLastByUserId: jest.fn(),

    // Méthodes de mise à jour
    update: jest.fn(),
    validate: jest.fn(),
    refuse: jest.fn(),
    cancel: jest.fn(),
    refund: jest.fn(),

    // Méthodes de suppression
    delete: jest.fn(),

    // Méthodes de vérification
    exists: jest.fn(),
    hasPendingPayments: jest.fn(),

    // Méthodes de comptage et statistiques
    count: jest.fn(),
    getTotalAmountByUserId: jest.fn(),
    getTotalAmountByPeriod: jest.fn(),
    getStatistics: jest.fn(),
    getUserStatistics: jest.fn(),
    getPaymentsByStatus: jest.fn(),
    getPaymentsByMethod: jest.fn(),

    // Méthodes de recherche avancée
    findPendingOlderThan: jest.fn(),

    // Méthodes d'audit
    recordTransaction: jest.fn(),
  });

/**
 * Crée un mock pré-configuré avec des comportements par défaut
 *
 * Ce mock retourne des valeurs raisonnables par défaut pour faciliter les tests.
 * Chaque méthode peut toujours être reconfigurée dans les tests individuels.
 *
 * @returns Mock pré-configuré de IPaymentRepository
 */
export const createMockPaymentRepositoryWithDefaults =
  (): jest.Mocked<IPaymentRepository> => {
    const mock = createMockPaymentRepository();

    // Configurations par défaut
    mock.findById.mockResolvedValue(null);
    mock.findByTransactionReference.mockResolvedValue(null);
    mock.findAll.mockResolvedValue({ payments: [], total: 0 });
    mock.findByUserId.mockResolvedValue([]);
    mock.findByOrderId.mockResolvedValue([]);
    mock.findBySubscriptionId.mockResolvedValue([]);
    mock.findLastByUserId.mockResolvedValue(null);
    mock.exists.mockResolvedValue(false);
    mock.hasPendingPayments.mockResolvedValue(false);
    mock.count.mockResolvedValue(0);
    mock.delete.mockResolvedValue(true);
    mock.recordTransaction.mockResolvedValue(undefined);
    mock.findPendingOlderThan.mockResolvedValue([]);

    // Statistiques par défaut
    mock.getTotalAmountByUserId.mockResolvedValue(Money.create(0, "EUR"));
    mock.getTotalAmountByPeriod.mockResolvedValue(Money.create(0, "EUR"));

    mock.getStatistics.mockResolvedValue({
      totalPayments: 0,
      totalAmount: Money.create(0, "EUR"),
      validatedPayments: 0,
      pendingPayments: 0,
      refundedPayments: 0,
      cancelledPayments: 0,
      averageAmount: Money.create(0, "EUR"),
    });

    mock.getUserStatistics.mockResolvedValue({
      totalPayments: 0,
      totalAmount: Money.create(0, "EUR"),
      lastPaymentDate: null,
      averageAmount: Money.create(0, "EUR"),
    });

    mock.getPaymentsByStatus.mockResolvedValue([]);
    mock.getPaymentsByMethod.mockResolvedValue([]);

    // Les méthodes create, update, validate, refuse, cancel, refund
    // doivent être configurées dans chaque test car elles retournent des Payment

    return mock;
  };

/**
 * Helper pour configurer le mock create pour retourner un paiement avec ID
 *
 * @param mock Mock du repository
 * @param startId ID de départ (incrémenté à chaque appel)
 *
 * @example
 * ```typescript
 * const mockRepo = createMockPaymentRepository();
 * configureMockCreateWithAutoId(mockRepo, 1);
 *
 * const payment1 = await useCase.execute(data1); // id: 1
 * const payment2 = await useCase.execute(data2); // id: 2
 * ```
 */
export const configureMockCreateWithAutoId = (
  mock: jest.Mocked<IPaymentRepository>,
  startId: number = 1,
): void => {
  let currentId = startId;

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

    // Simuler l'assignation d'ID par la DB
    (payment as any)._id = currentId++;
    (payment as any)._createdAt = new Date();

    return payment;
  });
};

/**
 * Helper pour configurer les méthodes de transition de statut
 *
 * @param mock Mock du repository
 *
 * @example
 * ```typescript
 * const mockRepo = createMockPaymentRepository();
 * configureMockStatusTransitions(mockRepo);
 * ```
 */
export const configureMockStatusTransitions = (
  mock: jest.Mocked<IPaymentRepository>,
): void => {
  mock.validate.mockImplementation(
    async (id: number, transactionReference?: string) => {
      const payment = await mock.findById(id);
      if (!payment) {
        throw new Error("Payment not found");
      }
      payment.validate(transactionReference);
      return payment;
    },
  );

  mock.refuse.mockImplementation(async (id: number, reason?: string) => {
    const payment = await mock.findById(id);
    if (!payment) {
      throw new Error("Payment not found");
    }
    payment.refuse(reason);
    return payment;
  });

  mock.cancel.mockImplementation(async (id: number, reason?: string) => {
    const payment = await mock.findById(id);
    if (!payment) {
      throw new Error("Payment not found");
    }
    payment.cancel(reason);
    return payment;
  });

  mock.refund.mockImplementation(async (id: number, reason?: string) => {
    const payment = await mock.findById(id);
    if (!payment) {
      throw new Error("Payment not found");
    }
    payment.refund(reason);
    return payment;
  });
};
