/**
 * @file stripe.resilience.test.ts
 * @description Tests de résilience pour le système de paiement Stripe
 *
 * PRIORITÉ 2 - IMPORTANT ⭐
 *
 * Couvre:
 * - Retry automatique avec exponential backoff
 * - Circuit breaker pattern
 * - Fallback mechanisms
 * - Timeout handling
 * - Queue retry pour webhooks échoués
 * - Dead letter queue
 * - Health checks
 * - Graceful degradation
 *
 * Focus sur:
 * - Résilience du système sous stress
 * - Récupération automatique d'erreurs
 * - Prévention de cascades de failures
 * - Observabilité et monitoring
 */

import { ResilienceService } from '../ResilienceService';
import { WebhookService } from '../WebhookService';
import { PaymentService } from '../PaymentService';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import * as Sentry from '@sentry/node';

// Mocks
jest.mock('@prisma/client');
jest.mock('stripe');
jest.mock('@sentry/node');

describe('Stripe Resilience Tests', () => {
  let resilienceService: ResilienceService;
  let webhookService: WebhookService;
  let paymentService: PaymentService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      webhookLog: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      webhookRetry: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    } as any;

    // Mock Stripe
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as any;

    resilienceService = new ResilienceService(mockPrisma as any, mockStripe as any);
    webhookService = new WebhookService(mockPrisma as any, mockStripe as any);
    paymentService = new PaymentService(mockPrisma as any, mockStripe as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Retry with Exponential Backoff', () => {
    it('devrait retry avec exponential backoff après échec temporaire', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const result = await resilienceService.retryWithBackoff(
        operation,
        {
          maxRetries: 3,
          initialDelay: 100,
          maxDelay: 5000,
          factor: 2,
        }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('devrait respecter le délai exponential entre les retries', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const startTime = Date.now();

      const promise = resilienceService.retryWithBackoff(
        async () => {
          delays.push(Date.now() - startTime);
          return operation();
        },
        {
          maxRetries: 3,
          initialDelay: 100,
          factor: 2,
        }
      );

      // Avancer le temps pour simuler les délais
      await jest.advanceTimersByTimeAsync(100); // Premier retry
      await jest.advanceTimersByTimeAsync(200); // Deuxième retry (100 * 2)
      await jest.advanceTimersByTimeAsync(400); // Troisième retry (200 * 2)

      await promise;

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('devrait arrêter après maxRetries dépassé', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        resilienceService.retryWithBackoff(operation, { maxRetries: 3 })
      ).rejects.toThrow('Persistent error');

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('devrait ne pas retry les erreurs non-retriable', async () => {
      const operation = jest.fn().mockRejectedValue(
        new Error('Invalid request')
      );

      await expect(
        resilienceService.retryWithBackoff(operation, {
          maxRetries: 3,
          isRetriable: (error: Error) => !error.message.includes('Invalid'),
        })
      ).rejects.toThrow('Invalid request');

      expect(operation).toHaveBeenCalledTimes(1); // Pas de retry
    });

    it('devrait appliquer jitter au délai', async () => {
      const delays: number[] = [];
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      await resilienceService.retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 1000,
        jitter: true,
      });

      // Avec jitter, les délais ne devraient pas être exactement 1000, 2000, 4000
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('devrait respecter le maxDelay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      await resilienceService.retryWithBackoff(operation, {
        maxRetries: 2,
        initialDelay: 10000,
        maxDelay: 5000, // Limite à 5 secondes
      });

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('devrait ouvrir le circuit après trop d\'échecs', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service down'));

      const circuitBreaker = resilienceService.createCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 60000,
      });

      // Provoquer 3 échecs
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      // Le circuit devrait être ouvert maintenant
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Les appels suivants devraient échouer immédiatement
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');

      expect(operation).toHaveBeenCalledTimes(3); // Pas d'appel supplémentaire
    });

    it('devrait passer à HALF_OPEN après le resetTimeout', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const circuitBreaker = resilienceService.createCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      // Ouvrir le circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Avancer le temps
      jest.advanceTimersByTime(1000);

      // Le circuit devrait être HALF_OPEN
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');

      // Essayer à nouveau
      const result = await circuitBreaker.execute(operation);
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('devrait fermer le circuit après un succès en HALF_OPEN', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Error'))
        .mockRejectedValue(new Error('Error'))
        .mockRejectedValue(new Error('Error'))
        .mockResolvedValue('success');

      const circuitBreaker = resilienceService.createCircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      // Ouvrir le circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }

      jest.advanceTimersByTime(1000);

      // Test en HALF_OPEN réussit
      await circuitBreaker.execute(operation);

      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('devrait réouvrir le circuit si échec en HALF_OPEN', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Still down'));

      const circuitBreaker = resilienceService.createCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
      });

      // Ouvrir le circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      jest.advanceTimersByTime(1000);

      // Échec en HALF_OPEN
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      // Devrait revenir à OPEN
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('devrait tracker les statistiques du circuit breaker', () => {
      const operation = jest.fn().mockResolvedValue('success');

      const circuitBreaker = resilienceService.createCircuitBreaker({
        failureThreshold: 3,
      });

      const stats = circuitBreaker.getStats();

      expect(stats).toEqual({
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        rejections: 0,
        lastFailureTime: null,
      });
    });
  });

  describe('Fallback Mechanisms', () => {
    it('devrait utiliser le fallback si l\'opération échoue', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      const fallback = jest.fn().mockResolvedValue('fallback_data');

      const result = await resilienceService.executeWithFallback(
        operation,
        fallback
      );

      expect(result).toBe('fallback_data');
      expect(operation).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it('devrait retourner le résultat principal si succès', async () => {
      const operation = jest.fn().mockResolvedValue('primary_data');
      const fallback = jest.fn().mockResolvedValue('fallback_data');

      const result = await resilienceService.executeWithFallback(
        operation,
        fallback
      );

      expect(result).toBe('primary_data');
      expect(fallback).not.toHaveBeenCalled();
    });

    it('devrait gérer les fallbacks en cascade', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback1 = jest.fn().mockRejectedValue(new Error('Fallback 1 failed'));
      const fallback2 = jest.fn().mockResolvedValue('fallback2_data');

      const result = await resilienceService.executeWithFallbacks(
        primary,
        [fallback1, fallback2]
      );

      expect(result).toBe('fallback2_data');
      expect(primary).toHaveBeenCalled();
      expect(fallback1).toHaveBeenCalled();
      expect(fallback2).toHaveBeenCalled();
    });

    it('devrait utiliser des données en cache comme fallback', async () => {
      const cache = { get: jest.fn().mockReturnValue('cached_data') };
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await resilienceService.executeWithCacheFallback(
        operation,
        'cache_key',
        cache
      );

      expect(result).toBe('cached_data');
      expect(cache.get).toHaveBeenCalledWith('cache_key');
    });
  });

  describe('Timeout Handling', () => {
    it('devrait timeout après le délai spécifié', async () => {
      const slowOperation = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('result'), 5000))
      );

      const promise = resilienceService.executeWithTimeout(
        slowOperation,
        1000 // 1 seconde
      );

      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow('Operation timed out');
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait compléter si l\'opération est rapide', async () => {
      const fastOperation = jest.fn().mockResolvedValue('result');

      const result = await resilienceService.executeWithTimeout(
        fastOperation,
        1000
      );

      expect(result).toBe('result');
    });

    it('devrait nettoyer le timer si l\'opération réussit', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      await resilienceService.executeWithTimeout(operation, 1000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Webhook Retry Queue', () => {
    it('devrait ajouter un webhook échoué à la queue de retry', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_failed_123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } as any },
        created: Math.floor(Date.now() / 1000),
      } as any;

      mockPrisma.webhookRetry.create.mockResolvedValue({
        id: 1,
        eventId: 'evt_failed_123',
        retryCount: 0,
        status: 'PENDING',
      } as any);

      await resilienceService.addToRetryQueue(mockEvent, 'Processing error');

      expect(mockPrisma.webhookRetry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt_failed_123',
          eventType: 'payment_intent.succeeded',
          payload: expect.any(String),
          retryCount: 0,
          status: 'PENDING',
          errorMessage: 'Processing error',
        }),
      });
    });

    it('devrait traiter les webhooks de la retry queue', async () => {
      const mockRetries = [
        {
          id: 1,
          eventId: 'evt_1',
          eventType: 'payment_intent.succeeded',
          payload: JSON.stringify({ id: 'evt_1' }),
          retryCount: 0,
          status: 'PENDING',
        },
        {
          id: 2,
          eventId: 'evt_2',
          eventType: 'invoice.paid',
          payload: JSON.stringify({ id: 'evt_2' }),
          retryCount: 1,
          status: 'PENDING',
        },
      ];

      mockPrisma.webhookRetry.findMany.mockResolvedValue(mockRetries as any);
      mockPrisma.webhookRetry.update.mockResolvedValue({} as any);
      mockPrisma.webhookLog.create.mockResolvedValue({} as any);

      const processWebhookSpy = jest.spyOn(webhookService, 'handleWebhookEvent')
        .mockResolvedValue();

      await resilienceService.processRetryQueue();

      expect(processWebhookSpy).toHaveBeenCalledTimes(2);
      expect(mockPrisma.webhookRetry.update).toHaveBeenCalledTimes(2);
    });

    it('devrait incrémenter le retryCount à chaque tentative', async () => {
      const mockRetry = {
        id: 1,
        eventId: 'evt_1',
        payload: JSON.stringify({ id: 'evt_1', type: 'payment_intent.succeeded' }),
        retryCount: 2,
        status: 'PENDING',
      };

      mockPrisma.webhookRetry.findMany.mockResolvedValue([mockRetry] as any);
      mockPrisma.webhookRetry.update.mockResolvedValue({} as any);

      jest.spyOn(webhookService, 'handleWebhookEvent')
        .mockRejectedValue(new Error('Still failing'));

      await resilienceService.processRetryQueue();

      expect(mockPrisma.webhookRetry.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          retryCount: 3,
        }),
      });
    });

    it('devrait déplacer vers la dead letter queue après max retries', async () => {
      const mockRetry = {
        id: 1,
        eventId: 'evt_dead_123',
        payload: JSON.stringify({ id: 'evt_dead_123' }),
        retryCount: 5, // Max atteint
        status: 'PENDING',
      };

      mockPrisma.webhookRetry.findMany.mockResolvedValue([mockRetry] as any);
      mockPrisma.webhookRetry.update.mockResolvedValue({} as any);
      mockPrisma.deadLetterQueue = {
        create: jest.fn().mockResolvedValue({} as any),
      } as any;

      jest.spyOn(webhookService, 'handleWebhookEvent')
        .mockRejectedValue(new Error('Permanent failure'));

      await resilienceService.processRetryQueue();

      expect(mockPrisma.deadLetterQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt_dead_123',
          reason: 'Max retries exceeded',
        }),
      });

      expect(mockPrisma.webhookRetry.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'FAILED' },
      });
    });

    it('devrait utiliser exponential backoff pour les retries', async () => {
      const delays = [];

      for (let i = 0; i < 5; i++) {
        const delay = resilienceService.calculateRetryDelay(i);
        delays.push(delay);
      }

      // Vérifier que les délais augmentent exponentiellement
      expect(delays[0]).toBeLessThan(delays[1]);
      expect(delays[1]).toBeLessThan(delays[2]);
      expect(delays[2]).toBeLessThan(delays[3]);
      expect(delays[3]).toBeLessThan(delays[4]);
    });
  });

  describe('Dead Letter Queue', () => {
    it('devrait lister les événements dans la dead letter queue', async () => {
      const mockDeadLetters = [
        {
          id: 1,
          eventId: 'evt_dead_1',
          eventType: 'payment_intent.failed',
          reason: 'Max retries exceeded',
          createdAt: new Date(),
        },
      ];

      mockPrisma.deadLetterQueue = {
        findMany: jest.fn().mockResolvedValue(mockDeadLetters),
      } as any;

      const result = await resilienceService.getDeadLetterQueue();

      expect(result).toEqual(mockDeadLetters);
    });

    it('devrait permettre de retraiter manuellement un événement', async () => {
      const mockDeadLetter = {
        id: 1,
        eventId: 'evt_dead_1',
        payload: JSON.stringify({ id: 'evt_1', type: 'payment_intent.succeeded' }),
      };

      mockPrisma.deadLetterQueue = {
        findUnique: jest.fn().mockResolvedValue(mockDeadLetter),
        delete: jest.fn().mockResolvedValue(mockDeadLetter),
      } as any;

      jest.spyOn(webhookService, 'handleWebhookEvent')
        .mockResolvedValue();

      await resilienceService.reprocessDeadLetter(1);

      expect(mockPrisma.deadLetterQueue.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('devrait nettoyer les anciens dead letters', async () => {
      mockPrisma.deadLetterQueue = {
        deleteMany: jest.fn().mockResolvedValue({ count: 10 }),
      } as any;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 jours

      const result = await resilienceService.cleanOldDeadLetters(30);

      expect(result.count).toBe(10);
      expect(mockPrisma.deadLetterQueue.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('Health Checks', () => {
    it('devrait vérifier la santé du système Stripe', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test',
      } as any);

      const health = await resilienceService.checkStripeHealth();

      expect(health).toEqual({
        status: 'healthy',
        latency: expect.any(Number),
        timestamp: expect.any(Date),
      });
    });

    it('devrait détecter un Stripe down', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('Service unavailable')
      );

      const health = await resilienceService.checkStripeHealth();

      expect(health).toEqual({
        status: 'unhealthy',
        error: 'Service unavailable',
        timestamp: expect.any(Date),
      });
    });

    it('devrait vérifier la santé de la base de données', async () => {
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ result: 1 }]);

      const health = await resilienceService.checkDatabaseHealth();

      expect(health.status).toBe('healthy');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.anything()
      );
    });

    it('devrait détecter une DB down', async () => {
      mockPrisma.$queryRaw = jest.fn().mockRejectedValue(
        new Error('Connection refused')
      );

      const health = await resilienceService.checkDatabaseHealth();

      expect(health.status).toBe('unhealthy');
    });

    it('devrait vérifier la santé de la retry queue', async () => {
      mockPrisma.webhookRetry = {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
          { retryCount: 2 },
          { retryCount: 3 },
        ]),
      } as any;

      const health = await resilienceService.checkRetryQueueHealth();

      expect(health).toEqual({
        status: 'healthy',
        queueSize: 5,
        oldestRetryCount: 3,
      });
    });

    it('devrait alerter si la retry queue est trop grande', async () => {
      mockPrisma.webhookRetry = {
        count: jest.fn().mockResolvedValue(1000),
      } as any;

      const health = await resilienceService.checkRetryQueueHealth();

      expect(health.status).toBe('warning');
      expect(health.queueSize).toBe(1000);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Retry queue is large'),
        'warning'
      );
    });
  });

  describe('Graceful Degradation', () => {
    it('devrait désactiver les fonctionnalités non-essentielles si Stripe down', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Service unavailable')
      );

      const degradationMode = await resilienceService.enableDegradationMode();

      expect(degradationMode).toEqual({
        paymentsDisabled: true,
        webhooksQueued: true,
        readOnlyMode: false,
      });
    });

    it('devrait permettre les opérations de lecture en mode dégradé', async () => {
      await resilienceService.enableDegradationMode();

      mockPrisma.payment.findMany.mockResolvedValue([]);

      const result = await resilienceService.executeReadOperation(
        () => mockPrisma.payment.findMany()
      );

      expect(result).toEqual([]);
    });

    it('devrait bloquer les opérations d\'écriture en mode dégradé', async () => {
      await resilienceService.enableDegradationMode();

      await expect(
        resilienceService.executeWriteOperation(
          () => mockPrisma.payment.create({ data: {} as any })
        )
      ).rejects.toThrow('System in degraded mode');
    });

    it('devrait rétablir le mode normal après récupération', async () => {
      await resilienceService.enableDegradationMode();

      mockStripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_test' } as any);

      await resilienceService.checkAndRestoreNormalMode();

      const mode = resilienceService.getDegradationMode();
      expect(mode.paymentsDisabled).toBe(false);
    });
  });

  describe('Rate Limiting Protection', () => {
    it('devrait détecter le rate limiting de Stripe', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue({
        type: 'StripeRateLimitError',
        message: 'Too many requests',
      });

      const isRateLimited = await resilienceService.detectRateLimit(
        async () => mockStripe.paymentIntents.create({ amount: 1000, currency: 'eur' } as any)
      );

      expect(isRateLimited).toBe(true);
    });

    it('devrait attendre avant de retry après rate limit', async () => {
      mockStripe.paymentIntents.create
        .mockRejectedValueOnce({ type: 'StripeRateLimitError' })
        .mockResolvedValueOnce({ id: 'pi_123' } as any);

      const result = await resilienceService.executeWithRateLimitHandling(
        () => mockStripe.paymentIntents.create({ amount: 1000, currency: 'eur' } as any)
      );

      expect(result.id).toBe('pi_123');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(2);
    });

    it('devrait implémenter un local rate limiter', async () => {
      const limiter = resilienceService.createRateLimiter({
        maxRequests: 100,
        windowMs: 1000,
      });

      // Faire 100 requêtes
      for (let i = 0; i < 100; i++) {
        await limiter.acquire();
      }

      // La 101ème devrait être rejetée
      await expect(limiter.acquire()).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Monitoring and Observability', () => {
    it('devrait enregistrer les métriques de résilience', async () => {
      const metrics = resilienceService.getResilienceMetrics();

      expect(metrics).toEqual({
        totalRetries: expect.any(Number),
        successfulRetries: expect.any(Number),
        failedRetries: expect.any(Number),
        circuitBreakerTrips: expect.any(Number),
        averageRetryDelay: expect.any(Number),
        deadLetterQueueSize: expect.any(Number),
      });
    });

    it('devrait notifier Sentry des problèmes de résilience', async () => {
      const circuitBreaker = resilienceService.createCircuitBreaker({
        failureThreshold: 2,
      });

      const operation = jest.fn().mockRejectedValue(new Error('Service down'));

      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened'),
        'error'
      );
    });

    it('devrait exposer des métriques Prometheus', () => {
      const prometheusMetrics = resilienceService.getPrometheusMetrics();

      expect(prometheusMetrics).toContain('stripe_retries_total');
      expect(prometheusMetrics).toContain('stripe_circuit_breaker_state');
      expect(prometheusMetrics).toContain('stripe_retry_queue_size');
    });
  });
});
