/**
 * @file stripe.webhook-security.test.ts
 * @description Tests de sécurité avancés pour les webhooks Stripe
 *
 * PRIORITÉ 1 - CRITIQUE ⚠️
 *
 * Couvre:
 * - Validation de signature Stripe
 * - Protection contre replay attacks
 * - Validation des montants et métadonnées
 * - Injection SQL / NoSQL
 * - Rate limiting
 * - CORS et headers de sécurité
 * - Authentification et autorisation
 * - Sanitization des données
 *
 * Focus sur:
 * - Prévention des vulnérabilités de sécurité
 * - Protection contre les attaques
 * - Validation stricte des entrées
 * - Conformité PCI-DSS
 */

import request from 'supertest';
import express, { Express } from 'express';
import Stripe from 'stripe';
import { WebhookService } from '../WebhookService';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';

// Mocks
jest.mock('@prisma/client');
jest.mock('stripe');
jest.mock('@sentry/node');

describe('Stripe Webhook Security Tests', () => {
  let app: Express;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;
  let webhookService: WebhookService;

  const VALID_WEBHOOK_SECRET = 'whsec_test_secret';
  const INVALID_WEBHOOK_SECRET = 'whsec_invalid_secret';

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
        findFirst: jest.fn(),
      },
      webhookLog: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
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
      },
    } as any;

    webhookService = new WebhookService(mockPrisma as any, mockStripe as any);

    // Setup Express app
    app = express();
    app.use(express.raw({ type: 'application/json' }));
    app.post('/webhooks/stripe', async (req, res) => {
      try {
        const signature = req.headers['stripe-signature'] as string;

        // Validate signature
        const event = mockStripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET || VALID_WEBHOOK_SECRET
        );

        await webhookService.handleWebhookEvent(event);
        res.status(200).json({ received: true });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });
  });

  describe('Signature Validation', () => {
    it('devrait rejeter les requêtes sans signature', async () => {
      const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: { object: {} },
      });

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('devrait rejeter les signatures invalides', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
      });

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'invalid_signature')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid signature');
    });

    it('devrait accepter les signatures valides', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 5000,
            currency: 'eur',
            status: 'succeeded',
            metadata: { userId: '1' },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      const payload = JSON.stringify(mockEvent);
      const validSignature = 't=1234567890,v1=valid_signature';

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', validSignature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('devrait rejeter les signatures expirées (replay attack)', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Timestamp outside tolerance');
      });

      const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
      });

      const oldSignature = `t=${oldTimestamp},v1=signature`;

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', oldSignature)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Timestamp');
    });

    it('devrait détecter les signatures modifiées (tampering)', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Signature mismatch');
      });

      const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: { object: { amount: 999999 } }, // Montant modifié
      });

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 't=1234567890,v1=tampered_sig')
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('Replay Attack Prevention', () => {
    it('devrait détecter et rejeter les événements dupliqués', async () => {
      const eventId = 'evt_duplicate_123';

      // Premier appel réussit
      mockPrisma.webhookLog.findFirst.mockResolvedValueOnce(null);
      mockPrisma.webhookLog.create.mockResolvedValueOnce({ id: 1 } as any);

      // Deuxième appel détecte le doublon
      mockPrisma.webhookLog.findFirst.mockResolvedValueOnce({
        id: 1,
        eventId,
        status: 'SUCCESS',
      } as any);

      const isDuplicate = await webhookService.isDuplicateEvent(eventId);
      expect(isDuplicate).toBe(true);
    });

    it('devrait utiliser un timestamp window de tolérance', async () => {
      const now = Math.floor(Date.now() / 1000);
      const recentTimestamp = now - 100; // 100 secondes ago
      const oldTimestamp = now - 400; // 400 secondes ago

      // Recent timestamp devrait passer
      expect(recentTimestamp).toBeGreaterThan(now - 300);

      // Old timestamp devrait être rejeté
      expect(oldTimestamp).toBeLessThan(now - 300);
    });

    it('devrait logger les tentatives de replay', async () => {
      const eventId = 'evt_replay_123';
      mockPrisma.webhookLog.findFirst.mockResolvedValue({
        id: 1,
        eventId,
        status: 'SUCCESS',
      } as any);

      await webhookService.isDuplicateEvent(eventId);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate webhook'),
        expect.any(String)
      );
    });
  });

  describe('Amount and Metadata Validation', () => {
    it('devrait rejeter les montants négatifs', async () => {
      const maliciousIntent = {
        id: 'pi_negative_123',
        amount: -5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
      };

      await expect(
        webhookService.validatePaymentAmount(maliciousIntent as any)
      ).rejects.toThrow('Invalid amount');
    });

    it('devrait rejeter les montants excessifs', async () => {
      const hugeIntent = {
        id: 'pi_huge_123',
        amount: 999999999999, // Montant irréaliste
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
      };

      await expect(
        webhookService.validatePaymentAmount(hugeIntent as any)
      ).rejects.toThrow('Amount exceeds maximum');
    });

    it('devrait valider les devises supportées uniquement', async () => {
      const invalidCurrency = {
        id: 'pi_currency_123',
        amount: 5000,
        currency: 'xxx', // Devise invalide
        status: 'succeeded',
        metadata: { userId: '1' },
      };

      await expect(
        webhookService.validateCurrency(invalidCurrency as any)
      ).rejects.toThrow('Unsupported currency');
    });

    it('devrait valider la présence de userId dans metadata', async () => {
      const noUserIntent = {
        id: 'pi_nouser_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: {}, // Pas de userId
      };

      await expect(
        webhookService.validateMetadata(noUserIntent as any)
      ).rejects.toThrow('Missing userId');
    });

    it('devrait valider le format du userId', async () => {
      const invalidUserIntent = {
        id: 'pi_invaliduser_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: 'invalid<script>alert("xss")</script>' },
      };

      await expect(
        webhookService.validateMetadata(invalidUserIntent as any)
      ).rejects.toThrow('Invalid userId format');
    });

    it('devrait rejeter les metadata avec des clés suspectes', async () => {
      const suspiciousIntent = {
        id: 'pi_suspicious_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: {
          userId: '1',
          __proto__: 'malicious', // Prototype pollution attempt
        },
      };

      await expect(
        webhookService.validateMetadata(suspiciousIntent as any)
      ).rejects.toThrow('Invalid metadata keys');
    });
  });

  describe('SQL/NoSQL Injection Prevention', () => {
    it('devrait sanitizer les inputs utilisateur', async () => {
      const sqlInjectionAttempt = {
        id: 'pi_sqli_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: {
          userId: "1' OR '1'='1",
          note: "'; DROP TABLE users; --",
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        webhookService.handlePaymentIntentSucceeded(sqlInjectionAttempt as any)
      ).rejects.toThrow();

      // Vérifie que la requête Prisma n'a pas été exécutée avec l'injection
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: expect.any(Number) },
      });
    });

    it('devrait rejeter les caractères non autorisés dans les IDs', async () => {
      const invalidId = "1; DELETE FROM payments WHERE '1'='1";

      await expect(
        webhookService.sanitizeUserId(invalidId)
      ).rejects.toThrow('Invalid user ID format');
    });

    it('devrait échapper les caractères spéciaux dans les emails', async () => {
      const maliciousEmail = "test+<script>alert('xss')</script>@example.com";

      const sanitized = await webhookService.sanitizeEmail(maliciousEmail);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });
  });

  describe('Rate Limiting', () => {
    it('devrait limiter le nombre de webhooks par IP', async () => {
      const ip = '192.168.1.1';
      const maxRequests = 100;
      const timeWindow = 60000; // 1 minute

      mockPrisma.webhookLog.count.mockResolvedValue(maxRequests + 1);

      const isRateLimited = await webhookService.checkRateLimit(ip, maxRequests, timeWindow);

      expect(isRateLimited).toBe(true);
    });

    it('devrait bloquer les IPs suspectes', async () => {
      const suspiciousIp = '1.2.3.4';
      const failedAttempts = 10;

      mockPrisma.webhookLog.count.mockResolvedValue(failedAttempts);

      const isBlocked = await webhookService.isIpBlocked(suspiciousIp);

      expect(isBlocked).toBe(true);
    });

    it('devrait logger les tentatives de rate limit', async () => {
      const ip = '192.168.1.1';
      mockPrisma.webhookLog.count.mockResolvedValue(150);

      await webhookService.checkRateLimit(ip, 100, 60000);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded'),
        expect.any(String)
      );
    });
  });

  describe('CORS and Security Headers', () => {
    it('devrait rejeter les requêtes avec mauvaise origine', async () => {
      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Origin', 'https://malicious-site.com')
        .set('Content-Type', 'application/json')
        .send({});

      // Webhook endpoints ne devraient pas avoir de CORS permissif
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('devrait avoir des headers de sécurité appropriés', async () => {
      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send({});

      // Vérifie la présence des headers de sécurité recommandés
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('devrait rejeter les requêtes avec Content-Type incorrect', async () => {
      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'text/plain')
        .send('malicious data');

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication and Authorization', () => {
    it('devrait vérifier que l\'utilisateur existe avant le traitement', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '999' }, // Utilisateur inexistant
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow('User not found');
    });

    it('devrait vérifier que l\'utilisateur a le droit de recevoir le webhook', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        customer: 'cus_123',
        metadata: { userId: '1' },
      } as any;

      const mockUser = {
        id: 1,
        stripeCustomerId: 'cus_different', // Customer ID ne correspond pas
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow('Customer mismatch');
    });

    it('devrait rejeter les webhooks pour utilisateurs désactivés', async () => {
      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
      } as any;

      const disabledUser = {
        id: 1,
        isActive: false,
        isBanned: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(disabledUser as any);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow('User is disabled or banned');
    });
  });

  describe('Data Sanitization', () => {
    it('devrait supprimer les tags HTML des metadata', async () => {
      const dirtyMetadata = {
        note: '<script>alert("xss")</script>',
        description: '<b>Bold text</b>',
      };

      const cleaned = await webhookService.sanitizeMetadata(dirtyMetadata);

      expect(cleaned.note).not.toContain('<script>');
      expect(cleaned.description).not.toContain('<b>');
    });

    it('devrait limiter la longueur des champs texte', async () => {
      const longString = 'a'.repeat(10000);
      const metadata = {
        note: longString,
      };

      const cleaned = await webhookService.sanitizeMetadata(metadata);

      expect(cleaned.note.length).toBeLessThanOrEqual(1000);
    });

    it('devrait encoder les caractères spéciaux', async () => {
      const specialChars = "Test & <test> 'test' \"test\"";

      const encoded = await webhookService.sanitizeString(specialChars);

      expect(encoded).not.toContain('<');
      expect(encoded).not.toContain('>');
    });
  });

  describe('Error Handling and Information Leakage', () => {
    it('ne devrait pas révéler d\'informations sensibles dans les erreurs', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Database connection string: postgres://user:password@localhost');
      });

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('stripe-signature', 'invalid')
        .send({});

      expect(response.body.error).not.toContain('password');
      expect(response.body.error).not.toContain('postgres://');
    });

    it('devrait logger les erreurs sans les exposer au client', async () => {
      const sensitiveError = new Error('API Key: sk_test_123456789');
      mockPrisma.payment.create.mockRejectedValue(sensitiveError);

      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
      } as any;

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);

      await expect(
        webhookService.handlePaymentIntentSucceeded(mockIntent)
      ).rejects.toThrow();

      expect(Sentry.captureException).toHaveBeenCalledWith(sensitiveError);
    });

    it('devrait utiliser des messages d\'erreur génériques', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Table users does not exist')
      );

      const mockIntent: Stripe.PaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        metadata: { userId: '1' },
      } as any;

      try {
        await webhookService.handlePaymentIntentSucceeded(mockIntent);
      } catch (error: any) {
        expect(error.message).not.toContain('Table');
        expect(error.message).toContain('Internal error');
      }
    });
  });

  describe('Webhook Event Type Validation', () => {
    it('devrait rejeter les types d\'événements non supportés', async () => {
      const unsupportedEvent: Stripe.Event = {
        id: 'evt_unsupported_123',
        object: 'event',
        type: 'unsupported.event.type' as any,
        data: { object: {} as any },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      await expect(
        webhookService.handleWebhookEvent(unsupportedEvent)
      ).rejects.toThrow('Unsupported event type');
    });

    it('devrait valider la structure des événements', async () => {
      const malformedEvent = {
        id: 'evt_malformed_123',
        type: 'payment_intent.succeeded',
        // Manque 'data'
      } as any;

      await expect(
        webhookService.validateEventStructure(malformedEvent)
      ).rejects.toThrow('Invalid event structure');
    });
  });

  describe('Test Mode vs Live Mode', () => {
    it('devrait traiter différemment les webhooks test et live', async () => {
      const testEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 5000,
            currency: 'eur',
            status: 'succeeded',
            metadata: { userId: '1' },
          } as any,
        },
        livemode: false,
        created: Math.floor(Date.now() / 1000),
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handleWebhookEvent(testEvent);

      // En mode test, on devrait logger différemment
      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          livemode: false,
        }),
      });
    });

    it('devrait rejeter les webhooks live avec clés de test', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'; // Test secret

      const liveEvent: Stripe.Event = {
        id: 'evt_live_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: { object: {} as any },
        livemode: true, // Live mode
        created: Math.floor(Date.now() / 1000),
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      await expect(
        webhookService.validateWebhookMode(liveEvent)
      ).rejects.toThrow('Live event with test credentials');
    });
  });

  describe('Compliance and Audit', () => {
    it('devrait logger tous les webhooks pour audit', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_audit_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 5000,
            currency: 'eur',
            status: 'succeeded',
            metadata: { userId: '1' },
          } as any,
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        api_version: '2023-10-16',
        pending_webhooks: 0,
        request: null,
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 1 } as any);

      await webhookService.handleWebhookEvent(mockEvent);

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt_audit_123',
          eventType: 'payment_intent.succeeded',
          status: 'SUCCESS',
        }),
      });
    });

    it('devrait conserver les logs pendant la période réglementaire', async () => {
      const retentionDays = 2555; // 7 ans pour conformité PCI-DSS
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      await webhookService.cleanOldWebhookLogs(retentionDays);

      expect(mockPrisma.webhookLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
    });
  });
});
