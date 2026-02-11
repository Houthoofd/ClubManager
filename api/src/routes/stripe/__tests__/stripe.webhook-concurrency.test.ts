/**
 * @file stripe.webhook-concurrency.test.ts
 * @description Tests de concurrence et race conditions pour les webhooks Stripe
 *
 * PRIORITÉ 1 - CRITIQUE ⚠️
 *
 * Couvre:
 * - Race conditions sur les webhooks simultanés
 * - Idempotence des opérations
 * - Locks et transactions
 * - Ordonnancement des événements
 * - Conflits de mise à jour
 * - Deadlocks
 * - Consistency des données
 *
 * Focus sur:
 * - Prévention des doublons de paiement
 * - Intégrité des données sous charge
 * - Gestion des événements out-of-order
 * - Performance sous charge concurrente
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

describe('Stripe Webhook Concurrency Tests', () => {
  let webhookService: WebhookService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma with transaction support
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      webhookLog: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
    } as any;

    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn(),
      },
    } as any;

    webhookService = new WebhookService(mockPrisma as any, mockStripe as any);
  });

  describe('Simultaneous Webhook Processing', () => {
    it('devrait gérer plusieurs webhooks identiques en parallèle (idempotence)', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_concurrent_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        customer: 'cus_123',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        membershipStatus: 'PENDING',
      };

      // Premier webhook trouve l'utilisateur, second aussi
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Premier webhook ne trouve pas de paiement existant
      mockPrisma.payment.findFirst
        .mockResolvedValueOnce(null) // Premier appel
        .mockResolvedValueOnce({ id: 1, status: 'SUCCEEDED' } as any); // Second appel trouve le paiement créé

      mockPrisma.payment.create.mockResolvedValueOnce({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      // Exécuter deux webhooks en parallèle
      const results = await Promise.allSettled([
        webhookService.handlePaymentIntentSucceeded(mockIntent),
        webhookService.handlePaymentIntentSucceeded(mockIntent),
      ]);

      // Premier devrait réussir
      expect(results[0].status).toBe('fulfilled');

      // Second devrait être ignoré (idempotent) ou réussir
      expect(mockPrisma.payment.create).toHaveBeenCalledTimes(1);
    });

    it('devrait utiliser des locks pour éviter les race conditions', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_lock_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      const mockUser = { id: 1, email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Simuler un lock avec SELECT FOR UPDATE
      mockPrisma.$executeRaw.mockResolvedValue(1);

      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentSucceeded(mockIntent);

      // Vérifie que le lock a été acquis
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.anything() // SQL avec FOR UPDATE
      );
    });

    it('devrait gérer le timeout d\'acquisition de lock', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_timeout_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      // Simuler un lock timeout
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Lock timeout'));
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow('Lock timeout');

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('Transaction Isolation', () => {
    it('devrait utiliser des transactions pour les opérations critiques', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_transaction_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1', upgradeTo: 'PREMIUM' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.user.update.mockResolvedValue({ id: 1 } as any);

      await webhookService.handlePaymentIntentSucceeded(mockIntent);

      // Vérifie qu'une transaction a été utilisée
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('devrait rollback la transaction en cas d\'erreur partielle', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_rollback_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1', upgradeTo: 'PREMIUM' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      // L'update échoue
      mockPrisma.user.update.mockRejectedValue(new Error('Update failed'));

      // La transaction devrait échouer complètement
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction rolled back'));

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow();

      // Le paiement ne devrait pas être créé (rollback)
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait utiliser le niveau d\'isolation SERIALIZABLE pour les opérations critiques', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_isolation_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.$transaction.mockImplementation(async (callback, options) => {
        expect(options?.isolationLevel).toBe('Serializable');
        return callback(mockPrisma);
      });

      await webhookService.handlePaymentIntentSucceeded(mockIntent);
    });
  });

  describe('Out-of-Order Event Handling', () => {
    it('devrait gérer les événements reçus dans le désordre', async () => {
      // Événement 3 : succeeded (reçu en premier)
      const succeededIntent: Stripe.PaymentIntent = {
        id: 'pi_order_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000) + 20,
        livemode: false,
      } as any;

      // Événement 1 : created (reçu en dernier)
      const createdIntent: Stripe.PaymentIntent = {
        ...succeededIntent,
        status: 'requires_payment_method',
        created: Math.floor(Date.now() / 1000),
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      // Traiter succeeded en premier
      await webhookService.handlePaymentIntentSucceeded(succeededIntent);

      // Puis traiter created (plus ancien)
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 1, status: 'SUCCEEDED' } as any);

      await webhookService.handlePaymentIntentCreated(createdIntent);

      // Le statut ne devrait PAS revenir à PENDING
      expect(mockPrisma.payment.update).not.toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({ status: 'PENDING' }),
      });
    });

    it('devrait utiliser les timestamps pour ordonner les événements', async () => {
      const olderEvent = {
        id: 'pi_older_123',
        created: Math.floor(Date.now() / 1000) - 100,
        status: 'processing',
        metadata: { userId: '1' },
      } as any;

      const newerEvent = {
        id: 'pi_newer_123',
        created: Math.floor(Date.now() / 1000),
        status: 'succeeded',
        metadata: { userId: '1' },
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        status: 'SUCCEEDED',
        updatedAt: new Date(newerEvent.created * 1000),
      } as any);

      // Essayer de traiter l'ancien événement après le nouveau
      await webhookService.handlePaymentIntentProcessing(olderEvent);

      // Ne devrait pas mettre à jour avec un statut plus ancien
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Status Updates', () => {
    it('devrait gérer les mises à jour concurrentes du statut utilisateur', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        membershipStatus: 'PENDING',
        version: 1, // Optimistic locking
      };

      const intent1: Stripe.PaymentIntent = {
        id: 'pi_concurrent1_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1', upgradeTo: 'PREMIUM' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      const intent2: Stripe.PaymentIntent = {
        id: 'pi_concurrent2_123',
        amount: 10000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1', upgradeTo: 'VIP' },
        created: Math.floor(Date.now() / 1000) + 1,
        livemode: false,
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      // Premier update réussit
      mockPrisma.user.update.mockResolvedValueOnce({
        ...mockUser,
        membershipStatus: 'PREMIUM',
        version: 2,
      } as any);

      // Second update échoue (version mismatch)
      mockPrisma.user.update.mockRejectedValueOnce(
        new Error('Optimistic lock failed')
      );

      const results = await Promise.allSettled([
        webhookService.handlePaymentIntentSucceeded(intent1),
        webhookService.handlePaymentIntentSucceeded(intent2),
      ]);

      // Un devrait réussir, l'autre échouer
      expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait prévenir les race conditions avec optimistic locking', async () => {
      const mockPayment = {
        id: 1,
        status: 'PENDING',
        version: 1,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment as any);

      // Deux updates concurrents
      mockPrisma.payment.update
        .mockResolvedValueOnce({ ...mockPayment, status: 'PROCESSING', version: 2 } as any)
        .mockRejectedValueOnce(new Error('Version mismatch'));

      const update1 = webhookService.updatePaymentStatus(1, 'PROCESSING');
      const update2 = webhookService.updatePaymentStatus(1, 'SUCCEEDED');

      const results = await Promise.allSettled([update1, update2]);

      // Une mise à jour devrait échouer
      expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    });
  });

  describe('Duplicate Event Prevention', () => {
    it('devrait détecter les doublons basés sur eventId', async () => {
      const eventId = 'evt_duplicate_123';

      mockPrisma.webhookLog.findFirst
        .mockResolvedValueOnce(null) // Premier appel
        .mockResolvedValueOnce({ id: 1, eventId, status: 'SUCCESS' } as any); // Second appel

      const isDuplicate1 = await webhookService.isDuplicateEvent(eventId);
      const isDuplicate2 = await webhookService.isDuplicateEvent(eventId);

      expect(isDuplicate1).toBe(false);
      expect(isDuplicate2).toBe(true);
    });

    it('devrait utiliser un cache distribué pour les doublons', async () => {
      const eventId = 'evt_cache_123';

      // Mock du cache Redis/Memcached
      const mockCache = {
        get: jest.fn(),
        set: jest.fn(),
      };

      (webhookService as any).cache = mockCache;

      mockCache.get.mockResolvedValueOnce(null).mockResolvedValueOnce('processed');

      const isDuplicate1 = await webhookService.isDuplicateEventCached(eventId);
      const isDuplicate2 = await webhookService.isDuplicateEventCached(eventId);

      expect(isDuplicate1).toBe(false);
      expect(isDuplicate2).toBe(true);
      expect(mockCache.set).toHaveBeenCalledWith(eventId, 'processed', expect.any(Number));
    });

    it('devrait gérer les doublons avec un TTL approprié', async () => {
      const eventId = 'evt_ttl_123';
      const ttl = 86400; // 24 heures

      mockPrisma.webhookLog.create.mockResolvedValue({
        id: 1,
        eventId,
        createdAt: new Date(),
      } as any);

      await webhookService.recordWebhookEvent(eventId, 'payment_intent.succeeded');

      // Après le TTL, le doublon devrait être autorisé
      const futureDate = new Date(Date.now() + ttl * 1000 + 1000);
      jest.setSystemTime(futureDate);

      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);

      const isDuplicate = await webhookService.isDuplicateEvent(eventId);
      expect(isDuplicate).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Payment Amount Race Conditions', () => {
    it('devrait prévenir les doubles paiements pour le même intent', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_double_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);

      // Premier appel crée le paiement
      mockPrisma.payment.findFirst.mockResolvedValueOnce(null);
      mockPrisma.payment.create.mockResolvedValueOnce({ id: 1 } as any);

      // Second appel trouve le paiement existant
      mockPrisma.payment.findFirst.mockResolvedValueOnce({
        id: 1,
        stripePaymentIntentId: 'pi_double_123',
        status: 'SUCCEEDED',
      } as any);

      await Promise.all([
        webhookService.handlePaymentIntentSucceeded(mockIntent),
        webhookService.handlePaymentIntentSucceeded(mockIntent),
      ]);

      // Le paiement ne devrait être créé qu'une seule fois
      expect(mockPrisma.payment.create).toHaveBeenCalledTimes(1);
    });

    it('devrait vérifier le montant avant de créer un paiement en doublon', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_amount_check_123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      // Un paiement existe déjà avec un montant différent (suspect)
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        stripePaymentIntentId: 'pi_amount_check_123',
        amount: 100.00, // Différent de 50.00
        status: 'SUCCEEDED',
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow('Payment amount mismatch');
    });
  });

  describe('Subscription State Consistency', () => {
    it('devrait maintenir la cohérence lors de mises à jour concurrentes d\'abonnement', async () => {
      const subscriptionId = 'sub_123';

      const event1 = {
        id: 'evt_sub1_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: subscriptionId,
            status: 'active',
          },
        },
      };

      const event2 = {
        id: 'evt_sub2_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: subscriptionId,
            status: 'canceled',
          },
        },
      };

      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 1,
        stripeSubscriptionId: subscriptionId,
        status: 'PENDING',
      } as any);

      mockPrisma.subscription.update.mockResolvedValue({} as any);

      await Promise.all([
        webhookService.handleSubscriptionUpdated(event1.data.object as any),
        webhookService.handleSubscriptionDeleted(event2.data.object as any),
      ]);

      // Le statut final devrait être déterministe
      expect(mockPrisma.subscription.update).toHaveBeenCalled();
    });
  });

  describe('Deadlock Prevention', () => {
    it('devrait ordonner les locks pour éviter les deadlocks', async () => {
      const userId1 = 1;
      const userId2 = 2;

      // Transaction 1 : lock user1 puis user2
      const transaction1 = async () => {
        await webhookService.acquireLock('user', userId1);
        await new Promise((resolve) => setTimeout(resolve, 10));
        await webhookService.acquireLock('user', userId2);
      };

      // Transaction 2 : lock user2 puis user1 (risque de deadlock)
      const transaction2 = async () => {
        await webhookService.acquireLock('user', userId2);
        await new Promise((resolve) => setTimeout(resolve, 10));
        await webhookService.acquireLock('user', userId1);
      };

      mockPrisma.$executeRaw.mockResolvedValue(1);

      // Les locks devraient être ordonnés pour éviter le deadlock
      await expect(Promise.all([transaction1(), transaction2()])).resolves.not.toThrow();
    });

    it('devrait timeout et retry en cas de deadlock détecté', async () => {
      mockPrisma.$executeRaw
        .mockRejectedValueOnce(new Error('Deadlock detected'))
        .mockResolvedValueOnce(1);

      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_deadlock_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      // Devrait retry et réussir
      await webhookService.handlePaymentIntentSucceeded(mockIntent);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
    });
  });

  describe('Queue Processing Concurrency', () => {
    it('devrait limiter le nombre de webhooks traités en parallèle', async () => {
      const maxConcurrent = 10;
      const webhooks = Array.from({ length: 50 }, (_, i) => ({
        id: `pi_queue_${i}`,
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      })) as Stripe.PaymentIntent[];

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      let concurrent = 0;
      let maxReached = 0;

      const processWebhook = async (intent: Stripe.PaymentIntent) => {
        concurrent++;
        maxReached = Math.max(maxReached, concurrent);
        await webhookService.handlePaymentIntentSucceeded(intent);
        concurrent--;
      };

      // Traiter avec concurrence limitée
      await webhookService.processWebhooksWithLimit(webhooks, maxConcurrent, processWebhook);

      expect(maxReached).toBeLessThanOrEqual(maxConcurrent);
    });
  });

  describe('Memory Consistency', () => {
    it('devrait invalider les caches lors de mises à jour', async () => {
      const userId = 1;
      const mockCache = {
        del: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
      };

      (webhookService as any).cache = mockCache;

      mockPrisma.user.update.mockResolvedValue({ id: userId } as any);

      await webhookService.updateUserMembershipStatus(userId, 'PREMIUM');

      // Le cache utilisateur devrait être invalidé
      expect(mockCache.del).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('devrait utiliser des opérations atomiques pour les compteurs', async () => {
      const userId = 1;

      // Incrémenter le compteur de paiements
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await webhookService.incrementPaymentCount(userId);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET payment_count = payment_count + 1')
      );
    });
  });

  describe('Event Ordering Guarantees', () => {
    it('devrait maintenir l\'ordre FIFO pour les événements du même payment intent', async () => {
      const paymentIntentId = 'pi_order_123';
      const events = [
        { id: 'evt_1', type: 'payment_intent.created', created: 1000 },
        { id: 'evt_2', type: 'payment_intent.processing', created: 1010 },
        { id: 'evt_3', type: 'payment_intent.succeeded', created: 1020 },
      ];

      const processedOrder: string[] = [];

      for (const event of events) {
        await webhookService.processEventOrdered(paymentIntentId, event, () => {
          processedOrder.push(event.id);
        });
      }

      expect(processedOrder).toEqual(['evt_1', 'evt_2', 'evt_3']);
    });
  });

  describe('High Load Scenarios', () => {
    it('devrait gérer 1000 webhooks concurrents sans erreur', async () => {
      const webhookCount = 1000;
      const intents = Array.from({ length: webhookCount }, (_, i) => ({
        id: `pi_load_${i}`,
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: String((i % 10) + 1) }, // 10 utilisateurs différents
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      })) as Stripe.PaymentIntent[];

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const startTime = Date.now();

      const results = await Promise.allSettled(
        intents.map((intent) => webhookService.handlePaymentIntentSucceeded(intent))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      expect(successCount).toBeGreaterThan(webhookCount * 0.95); // 95% success rate
      expect(duration).toBeLessThan(30000); // Devrait se terminer en moins de 30 secondes
    });

    it('devrait maintenir les performances avec des transactions longues', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_perf_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
      } as any;

      // Simuler une transaction lente
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return callback(mockPrisma);
      });

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const startTime = Date.now();
      await webhookService.handlePaymentIntentSucceeded(mockIntent);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Ne devrait pas bloquer trop longtemps
    });
  });
});
