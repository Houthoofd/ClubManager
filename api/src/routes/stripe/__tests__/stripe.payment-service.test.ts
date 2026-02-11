/**
 * @file stripe.payment-service.test.ts
 * @description Tests unitaires pour le PaymentService
 *
 * PRIORITÉ 2 - IMPORTANT ⭐
 *
 * Couvre:
 * - Création de Payment Intent
 * - Confirmation de paiement
 * - Annulation de paiement
 * - Récupération de paiement
 * - Liste des paiements
 * - Gestion des erreurs Stripe
 * - Retry et fallback
 * - Validation des données
 *
 * Focus sur:
 * - Logique métier du service de paiement
 * - Intégration avec Stripe SDK
 * - Gestion des erreurs et edge cases
 * - Validation des montants et devises
 */

import { PaymentService } from '../PaymentService';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import * as Sentry from '@sentry/node';

// Mocks
jest.mock('@prisma/client');
jest.mock('stripe');
jest.mock('@sentry/node');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    } as any;

    // Mock Stripe
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
        cancel: jest.fn(),
        update: jest.fn(),
        list: jest.fn(),
      },
      customers: {
        retrieve: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    paymentService = new PaymentService(mockPrisma as any, mockStripe as any);
  });

  describe('createPaymentIntent', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      stripeCustomerId: 'cus_123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('devrait créer un Payment Intent avec succès', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const mockPaymentIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'requires_payment_method',
        client_secret: 'pi_123_secret_456',
        customer: 'cus_123',
        metadata: {
          userId: '1',
          membershipType: 'PREMIUM',
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      mockPrisma.payment.create.mockResolvedValue({
        id: 1,
        userId: 1,
        stripePaymentIntentId: 'pi_123',
        amount: 50.00,
        status: 'PENDING',
      } as any);

      const result = await paymentService.createPaymentIntent({
        userId: 1,
        amount: 5000,
        currency: 'eur',
        metadata: { membershipType: 'PREMIUM' },
      });

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'eur',
        customer: 'cus_123',
        metadata: expect.objectContaining({
          userId: '1',
          membershipType: 'PREMIUM',
        }),
        automatic_payment_methods: {
          enabled: true,
        },
      });
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          stripePaymentIntentId: 'pi_123',
          amount: 50.00,
          currency: 'EUR',
          status: 'PENDING',
        }),
      });
    });

    it('devrait créer un customer Stripe si non existant', async () => {
      const userWithoutStripeId = {
        ...mockUser,
        stripeCustomerId: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(userWithoutStripeId as any);
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new_123',
      } as any);
      mockPrisma.user.update.mockResolvedValue({
        ...userWithoutStripeId,
        stripeCustomerId: 'cus_new_123',
      } as any);

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        customer: 'cus_new_123',
      } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await paymentService.createPaymentIntent({
        userId: 1,
        amount: 5000,
        currency: 'eur',
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'John Doe',
        metadata: { userId: '1' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stripeCustomerId: 'cus_new_123' },
      });
    });

    it('devrait rejeter les montants négatifs', async () => {
      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: -5000,
          currency: 'eur',
        })
      ).rejects.toThrow('Amount must be positive');

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('devrait rejeter les montants nuls', async () => {
      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 0,
          currency: 'eur',
        })
      ).rejects.toThrow('Amount must be positive');
    });

    it('devrait rejeter les devises non supportées', async () => {
      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 5000,
          currency: 'xxx',
        })
      ).rejects.toThrow('Unsupported currency');
    });

    it('devrait gérer les erreurs Stripe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API Error')
      );

      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 5000,
          currency: 'eur',
        })
      ).rejects.toThrow('Stripe API Error');

      expect(Sentry.captureException).toHaveBeenCalled();
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('devrait gérer les utilisateurs inexistants', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.createPaymentIntent({
          userId: 999,
          amount: 5000,
          currency: 'eur',
        })
      ).rejects.toThrow('User not found');
    });

    it('devrait appliquer les limites de montant maximum', async () => {
      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 100000000, // 1 million euros
          currency: 'eur',
        })
      ).rejects.toThrow('Amount exceeds maximum');
    });

    it('devrait appliquer les limites de montant minimum', async () => {
      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 10, // 0.10 EUR (trop petit pour Stripe)
          currency: 'eur',
        })
      ).rejects.toThrow('Amount below minimum');
    });
  });

  describe('confirmPayment', () => {
    it('devrait confirmer un paiement avec succès', async () => {
      const mockConfirmedIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        customer: 'cus_123',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockConfirmedIntent);
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'PENDING',
      } as any);
      mockPrisma.payment.update.mockResolvedValue({
        id: 1,
        status: 'SUCCEEDED',
      } as any);

      const result = await paymentService.confirmPayment('pi_123', 'pm_123');

      expect(result).toEqual(mockConfirmedIntent);
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
      });
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'SUCCEEDED',
          paymentMethod: 'pm_123',
        }),
      });
    });

    it('devrait gérer les échecs de confirmation', async () => {
      const mockFailedIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        status: 'requires_payment_method',
        last_payment_error: {
          message: 'Card declined',
          type: 'card_error',
        } as any,
      } as any;

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockFailedIntent);
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.update.mockResolvedValue({ id: 1 } as any);

      const result = await paymentService.confirmPayment('pi_123', 'pm_123');

      expect(result.status).toBe('requires_payment_method');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Card declined',
        }),
      });
    });

    it('devrait gérer les Payment Intent inexistants', async () => {
      mockStripe.paymentIntents.confirm.mockRejectedValue({
        type: 'StripeInvalidRequestError',
        message: 'No such payment_intent',
      });

      await expect(
        paymentService.confirmPayment('pi_invalid', 'pm_123')
      ).rejects.toThrow('No such payment_intent');

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait créer le paiement en DB si non existant', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'eur',
        customer: 'cus_123',
        metadata: { userId: '1' },
      } as any;

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockIntent);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await paymentService.confirmPayment('pi_123', 'pm_123');

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          stripePaymentIntentId: 'pi_123',
          status: 'SUCCEEDED',
        }),
      });
    });
  });

  describe('cancelPayment', () => {
    it('devrait annuler un paiement avec succès', async () => {
      const mockCanceledIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        status: 'canceled',
        cancellation_reason: 'requested_by_customer',
      } as any;

      mockStripe.paymentIntents.cancel.mockResolvedValue(mockCanceledIntent);
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'PENDING',
      } as any);
      mockPrisma.payment.update.mockResolvedValue({
        id: 1,
        status: 'CANCELED',
      } as any);

      const result = await paymentService.cancelPayment('pi_123', 'requested_by_customer');

      expect(result).toEqual(mockCanceledIntent);
      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_123', {
        cancellation_reason: 'requested_by_customer',
      });
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'CANCELED',
          cancellationReason: 'requested_by_customer',
        }),
      });
    });

    it('devrait rejeter l\'annulation d\'un paiement déjà réussi', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'SUCCEEDED',
      } as any);

      await expect(
        paymentService.cancelPayment('pi_123')
      ).rejects.toThrow('Cannot cancel succeeded payment');

      expect(mockStripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d\'annulation Stripe', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'PENDING',
      } as any);
      mockStripe.paymentIntents.cancel.mockRejectedValue(
        new Error('Payment already captured')
      );

      await expect(
        paymentService.cancelPayment('pi_123')
      ).rejects.toThrow('Payment already captured');

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('retrievePayment', () => {
    it('devrait récupérer un paiement existant', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
      } as any;

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockIntent);

      const result = await paymentService.retrievePayment('pi_123');

      expect(result).toEqual(mockIntent);
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
    });

    it('devrait gérer les paiements inexistants', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue({
        type: 'StripeInvalidRequestError',
        message: 'No such payment_intent',
      });

      await expect(
        paymentService.retrievePayment('pi_invalid')
      ).rejects.toThrow('No such payment_intent');
    });

    it('devrait récupérer avec expand options', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        customer: {
          id: 'cus_123',
          email: 'test@example.com',
        } as any,
      } as any;

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockIntent);

      const result = await paymentService.retrievePayment('pi_123', ['customer']);

      expect(result.customer).toBeDefined();
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(
        'pi_123',
        { expand: ['customer'] }
      );
    });
  });

  describe('listPayments', () => {
    it('devrait lister les paiements d\'un utilisateur', async () => {
      const mockUser = { id: 1, stripeCustomerId: 'cus_123' };
      const mockPayments = [
        { id: 1, stripePaymentIntentId: 'pi_1', amount: 50.00, status: 'SUCCEEDED' },
        { id: 2, stripePaymentIntentId: 'pi_2', amount: 30.00, status: 'PENDING' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments as any);

      const result = await paymentService.listPayments(1);

      expect(result).toEqual(mockPayments);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('devrait filtrer les paiements par statut', async () => {
      const mockUser = { id: 1 };
      const mockPayments = [
        { id: 1, status: 'SUCCEEDED' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments as any);

      await paymentService.listPayments(1, { status: 'SUCCEEDED' });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: 'SUCCEEDED',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('devrait paginer les résultats', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findMany.mockResolvedValue([]);

      await paymentService.listPayments(1, { limit: 10, offset: 20 });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('updatePaymentMetadata', () => {
    it('devrait mettre à jour les métadonnées', async () => {
      const mockUpdatedIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        metadata: {
          orderId: 'order_123',
          customField: 'value',
        },
      } as any;

      mockStripe.paymentIntents.update.mockResolvedValue(mockUpdatedIntent);

      const result = await paymentService.updatePaymentMetadata('pi_123', {
        orderId: 'order_123',
        customField: 'value',
      });

      expect(result).toEqual(mockUpdatedIntent);
      expect(mockStripe.paymentIntents.update).toHaveBeenCalledWith('pi_123', {
        metadata: {
          orderId: 'order_123',
          customField: 'value',
        },
      });
    });

    it('devrait valider les clés de métadonnées', async () => {
      await expect(
        paymentService.updatePaymentMetadata('pi_123', {
          '__proto__': 'malicious',
        } as any)
      ).rejects.toThrow('Invalid metadata key');

      expect(mockStripe.paymentIntents.update).not.toHaveBeenCalled();
    });
  });

  describe('calculateFees', () => {
    it('devrait calculer les frais Stripe correctement', () => {
      const fees = paymentService.calculateFees(5000, 'eur');

      expect(fees).toEqual({
        amount: 5000,
        stripeFee: 175, // 2.9% + 0.25 EUR = 145 + 25 = 170 (arrondi 175)
        netAmount: 4825,
        currency: 'eur',
      });
    });

    it('devrait gérer les différentes devises', () => {
      const feesUSD = paymentService.calculateFees(5000, 'usd');
      const feesEUR = paymentService.calculateFees(5000, 'eur');

      expect(feesUSD.stripeFee).toBeDefined();
      expect(feesEUR.stripeFee).toBeDefined();
    });

    it('devrait gérer les petits montants', () => {
      const fees = paymentService.calculateFees(100, 'eur');

      expect(fees.netAmount).toBeGreaterThan(0);
      expect(fees.stripeFee).toBeLessThan(100);
    });
  });

  describe('refundPayment', () => {
    it('devrait créer un remboursement complet', async () => {
      const mockRefund: Stripe.Refund = {
        id: 're_123',
        object: 'refund',
        amount: 5000,
        charge: 'ch_123',
        status: 'succeeded',
        payment_intent: 'pi_123',
      } as any;

      mockStripe.refunds = {
        create: jest.fn().mockResolvedValue(mockRefund),
      } as any;

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'SUCCEEDED',
        amount: 50.00,
      } as any);
      mockPrisma.payment.create.mockResolvedValue({
        id: 2,
        amount: -50.00,
        status: 'REFUNDED',
      } as any);

      const result = await paymentService.refundPayment('pi_123');

      expect(result).toEqual(mockRefund);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -50.00,
          status: 'REFUNDED',
        }),
      });
    });

    it('devrait créer un remboursement partiel', async () => {
      const mockRefund: Stripe.Refund = {
        id: 're_123',
        amount: 2500,
      } as any;

      mockStripe.refunds = {
        create: jest.fn().mockResolvedValue(mockRefund),
      } as any;

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'SUCCEEDED',
        amount: 50.00,
      } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 2 } as any);

      await paymentService.refundPayment('pi_123', 2500);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -25.00,
        }),
      });
    });

    it('devrait rejeter le remboursement de paiements non réussis', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'PENDING',
      } as any);

      await expect(
        paymentService.refundPayment('pi_123')
      ).rejects.toThrow('Cannot refund non-succeeded payment');
    });
  });

  describe('Error Handling', () => {
    it('devrait gérer les erreurs réseau', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, stripeCustomerId: 'cus_123' } as any);
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 5000,
          currency: 'eur',
        })
      ).rejects.toThrow('Network error');

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de rate limit Stripe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, stripeCustomerId: 'cus_123' } as any);
      mockStripe.paymentIntents.create.mockRejectedValue({
        type: 'StripeRateLimitError',
        message: 'Too many requests',
      });

      await expect(
        paymentService.createPaymentIntent({
          userId: 1,
          amount: 5000,
          currency: 'eur',
        })
      ).rejects.toThrow('Too many requests');

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'StripeRateLimitError',
        })
      );
    });

    it('devrait gérer les erreurs de carte', async () => {
      mockStripe.paymentIntents.confirm.mockRejectedValue({
        type: 'StripeCardError',
        message: 'Your card was declined',
        decline_code: 'insufficient_funds',
      });

      await expect(
        paymentService.confirmPayment('pi_123', 'pm_123')
      ).rejects.toThrow('Your card was declined');
    });
  });

  describe('Validation', () => {
    it('devrait valider le format des IDs Stripe', () => {
      expect(() => {
        paymentService.validateStripeId('pi_123');
      }).not.toThrow();

      expect(() => {
        paymentService.validateStripeId('invalid_id');
      }).toThrow('Invalid Stripe ID format');
    });

    it('devrait valider les montants', () => {
      expect(() => {
        paymentService.validateAmount(5000);
      }).not.toThrow();

      expect(() => {
        paymentService.validateAmount(-100);
      }).toThrow('Amount must be positive');

      expect(() => {
        paymentService.validateAmount(100000000);
      }).toThrow('Amount exceeds maximum');
    });

    it('devrait valider les devises', () => {
      expect(() => {
        paymentService.validateCurrency('eur');
      }).not.toThrow();

      expect(() => {
        paymentService.validateCurrency('usd');
      }).not.toThrow();

      expect(() => {
        paymentService.validateCurrency('xxx');
      }).toThrow('Unsupported currency');
    });
  });

  describe('Retry Logic', () => {
    it('devrait retry après une erreur temporaire', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, stripeCustomerId: 'cus_123' } as any);
      mockStripe.paymentIntents.create
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ id: 'pi_123' } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const result = await paymentService.createPaymentIntentWithRetry({
        userId: 1,
        amount: 5000,
        currency: 'eur',
      });

      expect(result.id).toBe('pi_123');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(2);
    });

    it('devrait arrêter après max retries', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, stripeCustomerId: 'cus_123' } as any);
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Persistent error')
      );

      await expect(
        paymentService.createPaymentIntentWithRetry({
          userId: 1,
          amount: 5000,
          currency: 'eur',
        }, { maxRetries: 3 })
      ).rejects.toThrow('Persistent error');

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(3);
    });
  });
});
