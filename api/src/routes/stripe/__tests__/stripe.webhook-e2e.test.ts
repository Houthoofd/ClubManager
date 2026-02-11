/**
 * @file stripe.webhook-e2e.test.ts
 * @description Tests E2E complets pour les flux Stripe webhooks
 *
 * PRIORITÉ 1 - CRITIQUE ⚠️
 *
 * Couvre:
 * - Flux complet de paiement (création → confirmation → webhook → DB → email)
 * - Flux d'abonnement (création → paiement → renouvellement → annulation)
 * - Flux de remboursement
 * - Flux d'échec de paiement et retry
 * - Flux d'upgrade de statut utilisateur
 * - Intégration complète avec tous les composants
 *
 * Focus sur:
 * - Validation du comportement bout-en-bout
 * - Intégration des services
 * - Cohérence des données à travers le système
 * - Scénarios utilisateur réels
 */

import request from 'supertest';
import express, { Express } from 'express';
import Stripe from 'stripe';
import { WebhookService } from '../WebhookService';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../../utils/email';
import * as Sentry from '@sentry/node';
import { pubsub } from '../../../graphql/pubsub';

// Mocks
jest.mock('@prisma/client');
jest.mock('stripe');
jest.mock('../../../utils/email');
jest.mock('@sentry/node');
jest.mock('../../../graphql/pubsub', () => ({
  pubsub: {
    publish: jest.fn(),
  },
}));

describe('Stripe Webhook E2E Flows', () => {
  let app: Express;
  let webhookService: WebhookService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;

  const WEBHOOK_SECRET = 'whsec_test_secret';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
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
        deleteMany: jest.fn(),
      },
      paymentSchedule: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    } as any;

    // Mock Stripe
    mockStripe = {
      webhooks: {
        constructEvent: jest.fn(),
      },
      paymentIntents: {
        retrieve: jest.fn(),
        confirm: jest.fn(),
        create: jest.fn(),
        cancel: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      customers: {
        retrieve: jest.fn(),
      },
      invoices: {
        retrieve: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
    } as any;

    webhookService = new WebhookService(mockPrisma as any, mockStripe as any);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: 'application/json' }));

    // Webhook endpoint
    app.post('/webhooks/stripe', async (req, res) => {
      try {
        const signature = req.headers['stripe-signature'] as string;
        const event = mockStripe.webhooks.constructEvent(
          req.body,
          signature,
          WEBHOOK_SECRET
        );

        await webhookService.handleWebhookEvent(event);
        res.status(200).json({ received: true });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    // Payment Intent endpoint
    app.post('/api/payment-intents', async (req, res) => {
      try {
        const { amount, currency, userId } = req.body;
        const paymentIntent = await mockStripe.paymentIntents.create({
          amount,
          currency,
          metadata: { userId },
        });
        res.json(paymentIntent);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });
  });

  describe('Flux Complet: Paiement Unique', () => {
    it('devrait compléter le flux complet d\'un paiement réussi', async () => {
      const userId = 1;
      const userEmail = 'test@example.com';
      const amount = 5000; // 50 EUR

      // 1. Utilisateur initial
      const mockUser = {
        id: userId,
        email: userEmail,
        firstName: 'John',
        lastName: 'Doe',
        membershipStatus: 'PENDING',
        stripeCustomerId: 'cus_123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      // 2. Création du Payment Intent
      const paymentIntentId = 'pi_test_123';
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: paymentIntentId,
        amount,
        currency: 'eur',
        status: 'requires_payment_method',
        client_secret: 'pi_123_secret_456',
        metadata: { userId: String(userId) },
      } as any);

      const createResponse = await request(app)
        .post('/api/payment-intents')
        .send({ amount, currency: 'eur', userId });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.id).toBe(paymentIntentId);

      // 3. Webhook: payment_intent.created
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const createdEvent: Stripe.Event = {
        id: 'evt_created_123',
        object: 'event',
        type: 'payment_intent.created',
        data: {
          object: {
            id: paymentIntentId,
            amount,
            currency: 'eur',
            status: 'requires_payment_method',
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(createdEvent);

      const createdWebhookResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(createdEvent));

      expect(createdWebhookResponse.status).toBe(200);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          stripePaymentIntentId: paymentIntentId,
          status: 'PENDING',
          amount: 50.00,
        }),
      });

      // 4. Webhook: payment_intent.processing
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1, status: 'PENDING' } as any);
      mockPrisma.payment.update.mockResolvedValue({ id: 1, status: 'PROCESSING' } as any);

      const processingEvent: Stripe.Event = {
        ...createdEvent,
        id: 'evt_processing_123',
        type: 'payment_intent.processing',
        data: {
          object: {
            ...createdEvent.data.object,
            status: 'processing',
          } as any,
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(processingEvent);

      const processingWebhookResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=124,v1=sig')
        .send(JSON.stringify(processingEvent));

      expect(processingWebhookResponse.status).toBe(200);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'PROCESSING',
        }),
      });

      // 5. Webhook: payment_intent.succeeded
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1, status: 'PROCESSING' } as any);
      mockPrisma.payment.update.mockResolvedValue({ id: 1, status: 'SUCCEEDED' } as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        membershipStatus: 'ACTIVE',
        stripePaymentIntentId: paymentIntentId,
      } as any);

      const succeededEvent: Stripe.Event = {
        ...createdEvent,
        id: 'evt_succeeded_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...createdEvent.data.object,
            status: 'succeeded',
            payment_method: 'pm_123',
          } as any,
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(succeededEvent);

      const succeededWebhookResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=125,v1=sig')
        .send(JSON.stringify(succeededEvent));

      expect(succeededWebhookResponse.status).toBe(200);

      // 6. Vérifications finales
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          membershipStatus: 'ACTIVE',
          stripePaymentIntentId: paymentIntentId,
        }),
      });

      expect(sendEmail).toHaveBeenCalledWith(
        userEmail,
        expect.stringContaining('Paiement confirmé'),
        expect.any(String)
      );

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledTimes(3);
      expect(pubsub.publish).toHaveBeenCalledWith('PAYMENT_UPDATED', expect.any(Object));
    });

    it('devrait gérer le flux complet d\'un paiement échoué avec retry', async () => {
      const userId = 1;
      const userEmail = 'test@example.com';
      const paymentIntentId = 'pi_failed_123';

      const mockUser = {
        id: userId,
        email: userEmail,
        firstName: 'John',
        membershipStatus: 'PENDING',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      // 1. Premier échec
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const failedEvent: Stripe.Event = {
        id: 'evt_failed_123',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: paymentIntentId,
            amount: 5000,
            currency: 'eur',
            status: 'requires_payment_method',
            metadata: { userId: String(userId) },
            last_payment_error: {
              message: 'Your card was declined',
              type: 'card_error',
              code: 'card_declined',
            },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(failedEvent);

      const failedResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(failedEvent));

      expect(failedResponse.status).toBe(200);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: 'Your card was declined',
        }),
      });

      expect(sendEmail).toHaveBeenCalledWith(
        userEmail,
        expect.stringContaining('échec'),
        expect.stringContaining('Your card was declined')
      );

      // 2. Retry réussi
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1, status: 'FAILED' } as any);
      mockPrisma.payment.update.mockResolvedValue({ id: 1, status: 'SUCCEEDED' } as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        membershipStatus: 'ACTIVE',
      } as any);

      const retrySucceededEvent: Stripe.Event = {
        ...failedEvent,
        id: 'evt_retry_succeeded_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...failedEvent.data.object,
            status: 'succeeded',
          } as any,
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(retrySucceededEvent);

      const retryResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=124,v1=sig')
        .send(JSON.stringify(retrySucceededEvent));

      expect(retryResponse.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          membershipStatus: 'ACTIVE',
        }),
      });
    });
  });

  describe('Flux Complet: Abonnement', () => {
    it('devrait gérer le cycle de vie complet d\'un abonnement', async () => {
      const userId = 1;
      const userEmail = 'subscriber@example.com';
      const subscriptionId = 'sub_123';
      const customerId = 'cus_123';

      const mockUser = {
        id: userId,
        email: userEmail,
        firstName: 'Jane',
        lastName: 'Doe',
        membershipStatus: 'PENDING',
        stripeCustomerId: customerId,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);

      // 1. Création de l'abonnement
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscription.create.mockResolvedValue({
        id: 1,
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
      } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        membershipStatus: 'PREMIUM',
      } as any);

      const subscriptionCreatedEvent: Stripe.Event = {
        id: 'evt_sub_created_123',
        object: 'event',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: subscriptionId,
            customer: customerId,
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 jours
            plan: {
              id: 'plan_premium',
              amount: 2999,
              currency: 'eur',
              interval: 'month',
            },
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(subscriptionCreatedEvent);

      const createdResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(subscriptionCreatedEvent));

      expect(createdResponse.status).toBe(200);
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          stripeSubscriptionId: subscriptionId,
          status: 'ACTIVE',
        }),
      });

      // 2. Premier paiement de l'abonnement
      const invoiceId = 'in_123';
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.invoice.create.mockResolvedValue({ id: 1 } as any);

      const invoicePaidEvent: Stripe.Event = {
        id: 'evt_invoice_paid_123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: {
            id: invoiceId,
            customer: customerId,
            subscription: subscriptionId,
            amount_paid: 2999,
            currency: 'eur',
            status: 'paid',
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(invoicePaidEvent);

      const paidResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=124,v1=sig')
        .send(JSON.stringify(invoicePaidEvent));

      expect(paidResponse.status).toBe(200);
      expect(sendEmail).toHaveBeenCalledWith(
        userEmail,
        expect.stringContaining('facture'),
        expect.any(String)
      );

      // 3. Renouvellement de l'abonnement
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 1,
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
      } as any);
      mockPrisma.subscription.update.mockResolvedValue({
        id: 1,
        status: 'ACTIVE',
      } as any);

      const subscriptionUpdatedEvent: Stripe.Event = {
        id: 'evt_sub_updated_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            ...subscriptionCreatedEvent.data.object,
            current_period_start: Math.floor(Date.now() / 1000) + 2592000,
            current_period_end: Math.floor(Date.now() / 1000) + 5184000,
          } as any,
        },
        created: Math.floor(Date.now() / 1000) + 2592000,
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(subscriptionUpdatedEvent);

      const updatedResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=125,v1=sig')
        .send(JSON.stringify(subscriptionUpdatedEvent));

      expect(updatedResponse.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalled();

      // 4. Annulation de l'abonnement
      mockPrisma.subscription.update.mockResolvedValue({
        id: 1,
        status: 'CANCELED',
      } as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        membershipStatus: 'INACTIVE',
      } as any);

      const subscriptionDeletedEvent: Stripe.Event = {
        id: 'evt_sub_deleted_123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            ...subscriptionCreatedEvent.data.object,
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000),
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(subscriptionDeletedEvent);

      const deletedResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=126,v1=sig')
        .send(JSON.stringify(subscriptionDeletedEvent));

      expect(deletedResponse.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          status: 'CANCELED',
        }),
      });

      expect(sendEmail).toHaveBeenCalledWith(
        userEmail,
        expect.stringContaining('annulé'),
        expect.any(String)
      );
    });

    it('devrait gérer un échec de paiement d\'abonnement', async () => {
      const userId = 1;
      const subscriptionId = 'sub_payment_failed_123';
      const invoiceId = 'in_failed_123';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        membershipStatus: 'PREMIUM',
        stripeCustomerId: 'cus_123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 1,
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
      } as any);

      // 1. Échec de paiement de facture
      mockPrisma.invoice.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const invoiceFailedEvent: Stripe.Event = {
        id: 'evt_invoice_failed_123',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: invoiceId,
            customer: 'cus_123',
            subscription: subscriptionId,
            amount_due: 2999,
            currency: 'eur',
            status: 'open',
            attempt_count: 1,
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(invoiceFailedEvent);

      const failedResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(invoiceFailedEvent));

      expect(failedResponse.status).toBe(200);
      expect(sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.stringContaining('échec'),
        expect.any(String)
      );

      // 2. Abonnement past_due après échecs multiples
      mockPrisma.subscription.update.mockResolvedValue({
        id: 1,
        status: 'PAST_DUE',
      } as any);

      const subscriptionPastDueEvent: Stripe.Event = {
        id: 'evt_sub_past_due_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: subscriptionId,
            customer: 'cus_123',
            status: 'past_due',
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(subscriptionPastDueEvent);

      const pastDueResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=124,v1=sig')
        .send(JSON.stringify(subscriptionPastDueEvent));

      expect(pastDueResponse.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          status: 'PAST_DUE',
        }),
      });
    });
  });

  describe('Flux Complet: Remboursement', () => {
    it('devrait gérer le flux complet de remboursement', async () => {
      const userId = 1;
      const paymentIntentId = 'pi_refund_123';
      const chargeId = 'ch_123';

      const mockUser = {
        id: userId,
        email: 'refund@example.com',
        firstName: 'Refund',
        lastName: 'User',
        membershipStatus: 'ACTIVE',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      // 1. Paiement original existe
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        userId,
        stripePaymentIntentId: paymentIntentId,
        amount: 50.00,
        status: 'SUCCEEDED',
      } as any);

      // 2. Charge refunded
      mockPrisma.payment.create.mockResolvedValue({
        id: 2,
        amount: -50.00,
        status: 'REFUNDED',
      } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const chargeRefundedEvent: Stripe.Event = {
        id: 'evt_refund_123',
        object: 'event',
        type: 'charge.refunded',
        data: {
          object: {
            id: chargeId,
            amount: 5000,
            amount_refunded: 5000,
            currency: 'eur',
            refunded: true,
            payment_intent: paymentIntentId,
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(chargeRefundedEvent);

      const refundResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(chargeRefundedEvent));

      expect(refundResponse.status).toBe(200);

      // 3. Vérifications
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          amount: -50.00,
          status: 'REFUNDED',
        }),
      });

      expect(sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.stringContaining('Remboursement'),
        expect.stringContaining('Refund')
      );

      expect(pubsub.publish).toHaveBeenCalledWith('PAYMENT_REFUNDED', expect.any(Object));
    });

    it('devrait gérer un remboursement partiel', async () => {
      const userId = 1;
      const chargeId = 'ch_partial_refund_123';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
      } as any);

      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        amount: 100.00,
        status: 'SUCCEEDED',
      } as any);

      mockPrisma.payment.create.mockResolvedValue({
        id: 2,
        amount: -25.00,
        status: 'REFUNDED',
      } as any);

      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const partialRefundEvent: Stripe.Event = {
        id: 'evt_partial_refund_123',
        object: 'event',
        type: 'charge.refunded',
        data: {
          object: {
            id: chargeId,
            amount: 10000,
            amount_refunded: 2500, // Remboursement partiel de 25 EUR
            currency: 'eur',
            refunded: false, // Partiellement remboursé
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(partialRefundEvent);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(partialRefundEvent));

      expect(response.status).toBe(200);
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: -25.00,
        }),
      });
    });
  });

  describe('Flux Complet: Upgrade de Statut', () => {
    it('devrait upgrader PENDING → ACTIVE → PREMIUM → VIP', async () => {
      const userId = 1;
      const userEmail = 'upgrade@example.com';

      let currentStatus = 'PENDING';
      const mockUser = {
        id: userId,
        email: userEmail,
        firstName: 'Upgrade',
        lastName: 'Test',
        get membershipStatus() {
          return currentStatus;
        },
      };

      mockPrisma.user.findUnique.mockImplementation(() =>
        Promise.resolve({ ...mockUser, membershipStatus: currentStatus } as any)
      );

      // 1. PENDING → ACTIVE (premier paiement)
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockImplementation((args: any) => {
        currentStatus = args.data.membershipStatus;
        return Promise.resolve({ ...mockUser, membershipStatus: currentStatus } as any);
      });
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const activeEvent: Stripe.Event = {
        id: 'evt_active_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_active_123',
            amount: 1000,
            currency: 'eur',
            status: 'succeeded',
            metadata: { userId: String(userId), upgradeTo: 'ACTIVE' },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(activeEvent);

      await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(activeEvent));

      expect(currentStatus).toBe('ACTIVE');

      // 2. ACTIVE → PREMIUM
      const premiumEvent: Stripe.Event = {
        ...activeEvent,
        id: 'evt_premium_123',
        data: {
          object: {
            ...activeEvent.data.object,
            id: 'pi_premium_123',
            amount: 2999,
            metadata: { userId: String(userId), upgradeTo: 'PREMIUM' },
          } as any,
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(premiumEvent);

      await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=124,v1=sig')
        .send(JSON.stringify(premiumEvent));

      expect(currentStatus).toBe('PREMIUM');

      // 3. PREMIUM → VIP
      const vipEvent: Stripe.Event = {
        ...activeEvent,
        id: 'evt_vip_123',
        data: {
          object: {
            ...activeEvent.data.object,
            id: 'pi_vip_123',
            amount: 9999,
            metadata: { userId: String(userId), upgradeTo: 'VIP' },
          } as any,
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(vipEvent);

      await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=125,v1=sig')
        .send(JSON.stringify(vipEvent));

      expect(currentStatus).toBe('VIP');

      // Vérifier que les emails ont été envoyés pour chaque upgrade
      expect(sendEmail).toHaveBeenCalledTimes(3);
    });
  });

  describe('Flux Complet: Payment Method Management', () => {
    it('devrait gérer l\'ajout et le retrait de méthodes de paiement', async () => {
      const userId = 1;
      const customerId = 'cus_123';
      const paymentMethodId = 'pm_123';

      const mockUser = {
        id: userId,
        email: 'payment-method@example.com',
        stripeCustomerId: customerId,
        stripePaymentMethodId: null,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripePaymentMethodId: paymentMethodId,
      } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      // 1. Ajout d'une méthode de paiement
      const attachedEvent: Stripe.Event = {
        id: 'evt_pm_attached_123',
        object: 'event',
        type: 'payment_method.attached',
        data: {
          object: {
            id: paymentMethodId,
            customer: customerId,
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
            },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(attachedEvent);

      const attachResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(attachedEvent));

      expect(attachResponse.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          stripePaymentMethodId: paymentMethodId,
        }),
      });

      // 2. Retrait de la méthode de paiement
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        stripePaymentMethodId: paymentMethodId,
      } as any);

      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripePaymentMethodId: null,
      } as any);

      const detachedEvent: Stripe.Event = {
        id: 'evt_pm_detached_123',
        object: 'event',
        type: 'payment_method.detached',
        data: {
          object: {
            id: paymentMethodId,
            customer: null,
            type: 'card',
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(detachedEvent);

      const detachResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=124,v1=sig')
        .send(JSON.stringify(detachedEvent));

      expect(detachResponse.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          stripePaymentMethodId: null,
        },
      });
    });
  });

  describe('Scénarios d\'Erreur et Récupération', () => {
    it('devrait récupérer après une erreur de DB temporaire', async () => {
      const userId = 1;

      mockPrisma.user.findUnique.mockResolvedValue({ id: userId } as any);

      // Premier appel échoue
      mockPrisma.payment.create
        .mockRejectedValueOnce(new Error('DB connection lost'))
        .mockResolvedValueOnce({ id: 1 } as any);

      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const event: Stripe.Event = {
        id: 'evt_retry_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_retry_123',
            amount: 5000,
            currency: 'eur',
            status: 'succeeded',
            metadata: { userId: String(userId) },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      // Premier essai échoue
      const firstResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(event));

      expect(firstResponse.status).toBe(400);

      // Retry réussit
      const retryResponse = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=123,v1=sig')
        .send(JSON.stringify(event));

      expect(retryResponse.status).toBe(200);
      expect(mockPrisma.payment.create).toHaveBeenCalledTimes(2);
    });
  });
});
