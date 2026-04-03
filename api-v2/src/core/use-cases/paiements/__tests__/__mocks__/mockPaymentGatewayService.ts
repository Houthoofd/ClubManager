/**
 * Mock réutilisable pour IPaymentGatewayService
 *
 * Ce mock permet de tester les Use Cases sans dépendance à Stripe/PayPal.
 * Toutes les méthodes sont mockées avec jest.fn() et peuvent être configurées
 * individuellement dans chaque test.
 *
 * @example
 * ```typescript
 * const mockGateway = createMockPaymentGatewayService();
 * mockGateway.createPaymentIntent.mockResolvedValue(paymentIntent);
 * mockGateway.isAvailable.mockResolvedValue(true);
 * ```
 */

import {
  IPaymentGatewayService,
  CreatePaymentIntentData,
  PaymentIntentResult,
  CapturePaymentData,
  PaymentCaptureResult,
  RefundPaymentData,
  PaymentRefundResult,
  PaymentStatusResult,
  WebhookVerificationResult,
  CustomerData,
  CreateCustomerResult,
  PaymentMethodData,
  CreatePaymentMethodResult,
} from "../../../../domain/interfaces/paiements/IPaymentGatewayService.js";
import {
  TransactionReference,
  TransactionProvider,
} from "../../../../domain/value-objects/paiements/TransactionReference.js";
import { Money } from "../../../../domain/value-objects/paiements/Money.js";

/**
 * Crée un mock complet de IPaymentGatewayService
 *
 * @returns Mock typé de IPaymentGatewayService avec toutes les méthodes mockées
 */
export const createMockPaymentGatewayService =
  (): jest.Mocked<IPaymentGatewayService> => ({
    // Informations du provider
    getProvider: jest.fn(),
    isAvailable: jest.fn(),

    // Gestion des intentions de paiement
    createPaymentIntent: jest.fn(),
    confirmPaymentIntent: jest.fn(),
    capturePayment: jest.fn(),
    cancelPaymentIntent: jest.fn(),

    // Remboursements
    refundPayment: jest.fn(),

    // Statut et webhooks
    getPaymentStatus: jest.fn(),
    verifyWebhook: jest.fn(),

    // Gestion des clients
    createCustomer: jest.fn(),
    getCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),

    // Gestion des méthodes de paiement
    createPaymentMethod: jest.fn(),
    attachPaymentMethod: jest.fn(),
    detachPaymentMethod: jest.fn(),
    listPaymentMethods: jest.fn(),

    // Utilitaires
    calculateFees: jest.fn(),
    supportsPartialRefunds: jest.fn(),
    supportsPartialCaptures: jest.fn(),
    getPaymentIntentExpiryHours: jest.fn(),
    getMaxRefundDays: jest.fn(),
  });

/**
 * Crée un mock pré-configuré avec des comportements par défaut (Stripe)
 *
 * @param provider Provider à simuler (défaut: STRIPE)
 * @returns Mock pré-configuré de IPaymentGatewayService
 */
export const createMockPaymentGatewayServiceWithDefaults = (
  provider: TransactionProvider = 'STRIPE'
): jest.Mocked<IPaymentGatewayService> => {
  const mock = createMockPaymentGatewayService();

  // Configurations par défaut
  mock.getProvider.mockReturnValue(provider);
  mock.isAvailable.mockResolvedValue(true);

  // Comportements par défaut pour les paiements
  mock.createPaymentIntent.mockImplementation(async (data: CreatePaymentIntentData) => ({
    id: `pi_${generateMockId()}`,
    transactionReference: TransactionReference.create(`pi_${generateMockId()}`, provider),
    status: 'requires_payment_method',
    amount: data.amount,
    clientSecret: `pi_${generateMockId()}_secret_${generateMockId()}`,
    metadata: data.metadata,
  }));

  mock.confirmPaymentIntent.mockImplementation(
    async (ref: TransactionReference) => ({
      id: ref.getValue(),
      transactionReference: ref,
      status: "succeeded",
      amount: Money.create(100, "EUR"),
    }),
  );

  mock.capturePayment.mockImplementation(async (data: CapturePaymentData) => ({
    success: true,
    transactionReference: data.transactionReference,
    amount: data.amount || Money.create(100, "EUR"),
    capturedAt: new Date(),
  }));

  mock.cancelPaymentIntent.mockResolvedValue(true);

  mock.refundPayment.mockImplementation(async (data: RefundPaymentData) => ({
    success: true,
    refundId: `re_${generateMockId()}`,
    transactionReference: data.transactionReference,
    amount: data.amount || Money.create(100, "EUR"),
    refundedAt: new Date(),
    status: "succeeded",
    reason: data.reason,
  }));

  mock.getPaymentStatus.mockImplementation(
    async (ref: TransactionReference) => ({
      transactionReference: ref,
      status: "succeeded",
      amount: Money.create(100, "EUR"),
      createdAt: new Date(),
    }),
  );

  mock.verifyWebhook.mockResolvedValue({
    isValid: true,
    event: {
      id: `evt_${generateMockId()}`,
      type: "payment_intent.succeeded",
      data: {},
      createdAt: new Date(),
    },
  });

  // Gestion des clients
  mock.createCustomer.mockImplementation(async (data: CustomerData) => ({
    customerId: `cus_${generateMockId()}`,
    email: data.email,
    createdAt: new Date(),
  }));

  mock.getCustomer.mockResolvedValue(null);
  mock.updateCustomer.mockResolvedValue(true);
  mock.deleteCustomer.mockResolvedValue(true);

  // Gestion des méthodes de paiement
  mock.createPaymentMethod.mockImplementation(
    async (data: PaymentMethodData) => ({
      paymentMethodId: `pm_${generateMockId()}`,
      type: data.type,
      last4: data.cardNumber?.slice(-4),
      brand: "visa",
      expiryMonth: data.cardExpMonth,
      expiryYear: data.cardExpYear,
    }),
  );

  mock.attachPaymentMethod.mockResolvedValue(true);
  mock.detachPaymentMethod.mockResolvedValue(true);
  mock.listPaymentMethods.mockResolvedValue([]);

  // Utilitaires
  mock.calculateFees.mockImplementation((amount: Money) => {
    // Stripe: 1.4% + 0.25€
    const percentage = amount.getAmount() * 0.014;
    const fixed = 0.25;
    return Money.create(percentage + fixed, amount.getCurrency());
  });

  mock.supportsPartialRefunds.mockReturnValue(true);
  mock.supportsPartialCaptures.mockReturnValue(true);
  mock.getPaymentIntentExpiryHours.mockReturnValue(24);
  mock.getMaxRefundDays.mockReturnValue(90);

  return mock;
};

/**
 * Crée un mock simulant une gateway indisponible
 *
 * @returns Mock configuré comme indisponible
 */
export const createMockPaymentGatewayServiceUnavailable =
  (): jest.Mocked<IPaymentGatewayService> => {
    const mock = createMockPaymentGatewayService();

  mock.getProvider.mockReturnValue('STRIPE');
  mock.isAvailable.mockResolvedValue(false);

    // Toutes les autres méthodes échouent
    const error = new Error("Payment gateway unavailable");
    mock.createPaymentIntent.mockRejectedValue(error);
    mock.confirmPaymentIntent.mockRejectedValue(error);
    mock.capturePayment.mockRejectedValue(error);
    mock.cancelPaymentIntent.mockRejectedValue(error);
    mock.refundPayment.mockRejectedValue(error);
    mock.getPaymentStatus.mockRejectedValue(error);

    return mock;
  };

/**
 * Crée un mock simulant PayPal
 *
 * @returns Mock configuré pour PayPal
 */
export const createMockPayPalGateway = (): jest.Mocked<IPaymentGatewayService> => {
  const mock = createMockPaymentGatewayServiceWithDefaults('PAYPAL');

    // PayPal ne supporte pas les captures partielles
    mock.supportsPartialCaptures.mockReturnValue(false);

    // PayPal a un délai de remboursement de 180 jours
    mock.getMaxRefundDays.mockReturnValue(180);

    // Frais PayPal: 2.9% + 0.30€
    mock.calculateFees.mockImplementation((amount: Money) => {
      const percentage = amount.getAmount() * 0.029;
      const fixed = 0.3;
      return Money.create(percentage + fixed, amount.getCurrency());
    });

    return mock;
  };

/**
 * Helper pour configurer un mock qui simule un échec de paiement
 *
 * @param mock Mock du gateway
 * @param errorMessage Message d'erreur
 */
export const configureMockPaymentFailure = (
  mock: jest.Mocked<IPaymentGatewayService>,
  errorMessage: string = "Card declined",
): void => {
  mock.createPaymentIntent.mockResolvedValue({
    id: `pi_${generateMockId()}`,
    transactionReference: TransactionReference.create(`pi_${generateMockId()}`, 'STRIPE'),
    status: 'requires_payment_method',
    amount: Money.create(100, 'EUR'),
  });

  mock.confirmPaymentIntent.mockRejectedValue(new Error(errorMessage));

  mock.getPaymentStatus.mockResolvedValue({
    transactionReference: TransactionReference.create(`pi_${generateMockId()}`, 'STRIPE'),
    status: 'failed',
    amount: Money.create(100, 'EUR'),
    createdAt: new Date(),
  });
};

/**
 * Helper pour configurer un mock qui simule un webhook invalide
 *
 * @param mock Mock du gateway
 */
export const configureMockInvalidWebhook = (
  mock: jest.Mocked<IPaymentGatewayService>,
): void => {
  mock.verifyWebhook.mockResolvedValue({
    isValid: false,
    error: "Invalid signature",
  });
};

/**
 * Génère un ID mocké aléatoire
 */
function generateMockId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Helper pour simuler une série de statuts de paiement
 *
 * @param mock Mock du gateway
 * @param statuses Série de statuts à retourner dans l'ordre
 *
 * @example
 * ```typescript
 * configureMockPaymentStatusSequence(mockGateway, [
 *   'processing',
 *   'processing',
 *   'succeeded'
 * ]);
 * ```
 */
export const configureMockPaymentStatusSequence = (
  mock: jest.Mocked<IPaymentGatewayService>,
  statuses: Array<
    "pending" | "processing" | "succeeded" | "failed" | "canceled" | "refunded"
  >,
): void => {
  let callCount = 0;

  mock.getPaymentStatus.mockImplementation(
    async (ref: TransactionReference) => {
      const status = statuses[Math.min(callCount, statuses.length - 1)];
      callCount++;

      return {
        transactionReference: ref,
        status,
        amount: Money.create(100, "EUR"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  );
};
