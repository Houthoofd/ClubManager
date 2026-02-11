/**
 * @file stripe.webhook-handlers.test.ts
 * @description Tests unitaires pour les handlers de Payment Intent et autres handlers Stripe
 *
 * PRIORITÉ 1 - CRITIQUE ⚠️
 *
 * Couvre:
 * - handlePaymentIntentSucceeded
 * - handlePaymentIntentFailed
 * - handlePaymentIntentCreated
 * - handlePaymentIntentCanceled
 * - handlePaymentIntentProcessing
 * - handleChargeRefunded
 * - handlePaymentMethodAttached/Detached
 *
 * Focus sur:
 * - Logique métier correcte
 * - Gestion des erreurs
 * - Mise à jour de la DB
 * - Envoi d'emails
 * - Upgrade de statut utilisateur
 * - Idempotence
 */

import { WebhookService } from '../WebhookService';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { sendEmail } from '../../../utils/email';
import * as Sentry from '@sentry/node';

// Mocks
jest.mock('@prisma/client');
jest.mock('stripe');
jest.mock('../../../utils/email');
jest.mock('@sentry/node');

describe('Stripe Webhook Handlers - Payment Intent', () => {
  let webhookService: WebhookService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      webhookLog: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      paymentSchedule: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    } as any;

    // Mock Stripe
    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn(),
        confirm: jest.fn(),
        cancel: jest.fn(),
      },
      customers: {
        retrieve: jest.fn(),
      },
      invoices: {
        retrieve: jest.fn(),
      },
    } as any;

    webhookService = new WebhookService(mockPrisma as any, mockStripe as any);
  });

  describe('handlePaymentIntentSucceeded', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      stripeCustomerId: 'cus_123',
      membershipStatus: 'PENDING',
      stripePaymentIntentId: 'pi_123',
    };

    const mockPaymentIntent: Stripe.PaymentIntent = {
      id: 'pi_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'eur',
      status: 'succeeded',
      customer: 'cus_123',
      metadata: {
        userId: '1',
        membershipType: 'PREMIUM',
        upgradeTo: 'PREMIUM',
      },
      payment_method: 'pm_123',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait créer un paiement et upgrader le statut utilisateur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, membershipStatus: 'PREMIUM' } as any);

      await webhookService.handlePaymentIntentSucceeded(mockPaymentIntent);

      // Vérifie création du paiement
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          stripePaymentIntentId: 'pi_123',
          amount: 50.00,
          currency: 'EUR',
          status: 'SUCCEEDED',
          paymentMethod: 'pm_123',
        }),
      });

      // Vérifie upgrade du statut
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          membershipStatus: 'PREMIUM',
        }),
      });

      // Vérifie envoi d'email
      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('Paiement confirmé'),
        expect.any(String)
      );
    });

    it('devrait gérer le cas où l\'utilisateur n\'existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockPaymentIntent)
      ).rejects.toThrow('User not found');

      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait être idempotent (ne pas créer de doublon)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1, status: 'SUCCEEDED' } as any);

      await webhookService.handlePaymentIntentSucceeded(mockPaymentIntent);

      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('devrait gérer différents types de membership', async () => {
      const premiumIntent = { ...mockPaymentIntent, metadata: { userId: '1', upgradeTo: 'PREMIUM' } };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, membershipStatus: 'PREMIUM' } as any);

      await webhookService.handlePaymentIntentSucceeded(premiumIntent as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          membershipStatus: 'PREMIUM',
        }),
      });
    });

    it('devrait convertir correctement les montants (centimes vers euros)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const intentWith9999 = { ...mockPaymentIntent, amount: 9999 };
      await webhookService.handlePaymentIntentSucceeded(intentWith9999 as any);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 99.99,
        }),
      });
    });

    it('devrait mettre à jour stripePaymentIntentId sur l\'utilisateur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await webhookService.handlePaymentIntentSucceeded(mockPaymentIntent);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          stripePaymentIntentId: 'pi_123',
        }),
      });
    });

    it('devrait créer un paiement schedule pour les abonnements', async () => {
      const subscriptionIntent = {
        ...mockPaymentIntent,
        metadata: {
          userId: '1',
          upgradeTo: 'PREMIUM',
          subscriptionId: 'sub_123',
          isSubscription: 'true',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);
      mockPrisma.paymentSchedule.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentSucceeded(subscriptionIntent as any);

      expect(mockPrisma.paymentSchedule.create).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la création du paiement', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockPaymentIntent)
      ).rejects.toThrow('DB Error');

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait envoyer un email avec le bon template', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await webhookService.handlePaymentIntentSucceeded(mockPaymentIntent);

      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.stringContaining('John')
      );
    });

    it('devrait gérer les paiements sans metadata userId', async () => {
      const intentNoMetadata = { ...mockPaymentIntent, metadata: {} };

      await expect(
        webhookService.handlePaymentIntentSucceeded(intentNoMetadata as any)
      ).rejects.toThrow();

      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentFailed', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      membershipStatus: 'PENDING',
    };

    const mockFailedIntent: Stripe.PaymentIntent = {
      id: 'pi_failed_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'eur',
      status: 'failed',
      customer: 'cus_123',
      metadata: { userId: '1' },
      last_payment_error: {
        message: 'Insufficient funds',
        type: 'card_error',
      } as any,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait créer un paiement avec statut FAILED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentFailed(mockFailedIntent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'FAILED',
          stripePaymentIntentId: 'pi_failed_123',
        }),
      });
    });

    it('devrait enregistrer le message d\'erreur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentFailed(mockFailedIntent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          errorMessage: 'Insufficient funds',
        }),
      });
    });

    it('devrait envoyer un email de notification d\'échec', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentFailed(mockFailedIntent);

      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('échec'),
        expect.stringContaining('Insufficient funds')
      );
    });

    it('ne devrait PAS upgrader le statut utilisateur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentFailed(mockFailedIntent);

      expect(mockPrisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ membershipStatus: expect.anything() }),
        })
      );
    });

    it('devrait être idempotent pour les échecs', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1, status: 'FAILED' } as any);

      await webhookService.handlePaymentIntentFailed(mockFailedIntent);

      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('devrait capturer l\'erreur dans Sentry', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentFailed(mockFailedIntent);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Insufficient funds'),
        })
      );
    });

    it('devrait gérer les erreurs sans message', async () => {
      const intentNoError = { ...mockFailedIntent, last_payment_error: null };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentFailed(intentNoError as any);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          errorMessage: expect.any(String),
        }),
      });
    });
  });

  describe('handlePaymentIntentCreated', () => {
    const mockPaymentIntent: Stripe.PaymentIntent = {
      id: 'pi_new_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'eur',
      status: 'requires_payment_method',
      customer: 'cus_123',
      metadata: { userId: '1' },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait créer un paiement avec statut PENDING', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentCreated(mockPaymentIntent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'PENDING',
          stripePaymentIntentId: 'pi_new_123',
        }),
      });
    });

    it('devrait logger la création dans webhookLog', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentCreated(mockPaymentIntent);

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'payment_intent.created',
          status: 'SUCCESS',
        }),
      });
    });

    it('ne devrait PAS envoyer d\'email pour une création', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentCreated(mockPaymentIntent);

      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentCanceled', () => {
    const mockCanceledIntent: Stripe.PaymentIntent = {
      id: 'pi_canceled_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'eur',
      status: 'canceled',
      customer: 'cus_123',
      metadata: { userId: '1' },
      cancellation_reason: 'requested_by_customer',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait mettre à jour le paiement existant à CANCELED', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockPayment = { id: 1, status: 'PENDING' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment as any);
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'CANCELED' } as any);

      await webhookService.handlePaymentIntentCanceled(mockCanceledIntent);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'CANCELED',
        }),
      });
    });

    it('devrait enregistrer la raison d\'annulation', async () => {
      const mockUser = { id: 1 };
      const mockPayment = { id: 1 };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment as any);
      mockPrisma.payment.update.mockResolvedValue(mockPayment as any);

      await webhookService.handlePaymentIntentCanceled(mockCanceledIntent);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          cancellationReason: 'requested_by_customer',
        }),
      });
    });

    it('devrait créer un paiement si aucun n\'existe', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 2 } as any);

      await webhookService.handlePaymentIntentCanceled(mockCanceledIntent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'CANCELED',
        }),
      });
    });
  });

  describe('handlePaymentIntentProcessing', () => {
    const mockProcessingIntent: Stripe.PaymentIntent = {
      id: 'pi_processing_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'eur',
      status: 'processing',
      customer: 'cus_123',
      metadata: { userId: '1' },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait mettre à jour le statut à PROCESSING', async () => {
      const mockUser = { id: 1 };
      const mockPayment = { id: 1, status: 'PENDING' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment as any);
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'PROCESSING' } as any);

      await webhookService.handlePaymentIntentProcessing(mockProcessingIntent);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'PROCESSING',
        }),
      });
    });

    it('ne devrait PAS envoyer d\'email pendant le traitement', async () => {
      const mockUser = { id: 1 };
      const mockPayment = { id: 1 };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment as any);
      mockPrisma.payment.update.mockResolvedValue(mockPayment as any);

      await webhookService.handlePaymentIntentProcessing(mockProcessingIntent);

      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleChargeRefunded', () => {
    const mockCharge: Stripe.Charge = {
      id: 'ch_123',
      object: 'charge',
      amount: 5000,
      amount_refunded: 5000,
      currency: 'eur',
      refunded: true,
      payment_intent: 'pi_123',
      customer: 'cus_123',
      metadata: { userId: '1' },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait créer un paiement REFUNDED', async () => {
      const mockUser = { id: 1, email: 'test@example.com', firstName: 'John' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handleChargeRefunded(mockCharge);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'REFUNDED',
          amount: -50.00, // Montant négatif pour remboursement
        }),
      });
    });

    it('devrait envoyer un email de confirmation de remboursement', async () => {
      const mockUser = { id: 1, email: 'test@example.com', firstName: 'John' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handleChargeRefunded(mockCharge);

      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('Remboursement'),
        expect.stringContaining('John')
      );
    });

    it('devrait gérer les remboursements partiels', async () => {
      const partialRefund = { ...mockCharge, amount_refunded: 2500 };
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handleChargeRefunded(partialRefund as any);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -25.00,
        }),
      });
    });
  });

  describe('handlePaymentMethodAttached', () => {
    const mockPaymentMethod: Stripe.PaymentMethod = {
      id: 'pm_123',
      object: 'payment_method',
      type: 'card',
      customer: 'cus_123',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      } as any,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait mettre à jour les infos de paiement de l\'utilisateur', async () => {
      const mockUser = { id: 1, stripeCustomerId: 'cus_123' };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await webhookService.handlePaymentMethodAttached(mockPaymentMethod);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          stripePaymentMethodId: 'pm_123',
        }),
      });
    });

    it('devrait gérer le cas où le customer n\'existe pas en DB', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await webhookService.handlePaymentMethodAttached(mockPaymentMethod);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Customer not found')
      );
    });
  });

  describe('handlePaymentMethodDetached', () => {
    const mockPaymentMethod: Stripe.PaymentMethod = {
      id: 'pm_123',
      object: 'payment_method',
      type: 'card',
      customer: null,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    } as any;

    it('devrait supprimer le payment method de l\'utilisateur', async () => {
      const mockUser = { id: 1, stripePaymentMethodId: 'pm_123' };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, stripePaymentMethodId: null } as any);

      await webhookService.handlePaymentMethodDetached(mockPaymentMethod);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stripePaymentMethodId: null,
        },
      });
    });
  });

  describe('Edge Cases et Scénarios Complexes', () => {
    it('devrait gérer les transactions avec rollback en cas d\'erreur', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        customer: 'cus_123',
        metadata: { userId: '1', upgradeTo: 'PREMIUM' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      const mockUser = { id: 1, email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockRejectedValue(new Error('DB Error'));

      // Mock transaction pour simuler rollback
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction rolled back'));

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow();

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait gérer les devises non-EUR correctement', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_usd_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        customer: 'cus_123',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      const mockUser = { id: 1, email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentSucceeded(mockIntent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: 'USD',
        }),
      });
    });

    it('devrait gérer les montants zéro ou négatifs', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_zero_123',
        object: 'payment_intent',
        amount: 0,
        currency: 'eur',
        status: 'succeeded',
        customer: 'cus_123',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow('Invalid amount');
    });
  });
});
