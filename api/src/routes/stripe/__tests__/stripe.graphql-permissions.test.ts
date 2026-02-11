/**
 * @file stripe.graphql-permissions.test.ts
 * @description Tests avancés des permissions GraphQL pour Stripe
 *
 * PRIORITÉ 2 - IMPORTANT ⭐
 *
 * Couvre:
 * - Permissions par rôle (USER, ADMIN, SUPER_ADMIN)
 * - Permissions par statut de membership
 * - Accès aux mutations de paiement
 * - Accès aux queries de paiement
 * - Permissions sur les webhooks (admin only)
 * - Isolation des données utilisateur
 * - Rate limiting par rôle
 * - Audit des accès
 *
 * Focus sur:
 * - Sécurité des endpoints GraphQL
 * - Prévention d'accès non autorisé
 * - Protection des données sensibles
 * - Validation des permissions métier
 */

import { createYoga } from 'graphql-yoga';
import { schema } from '../../../graphql/schema';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { sign } from 'jsonwebtoken';

// Mocks
jest.mock('@prisma/client');
jest.mock('stripe');

describe('Stripe GraphQL Permissions Tests', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockStripe: jest.Mocked<Stripe>;
  let yoga: ReturnType<typeof createYoga>;

  // Helper pour créer des tokens JWT
  const createToken = (payload: any) => {
    return sign(payload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  };

  // Helper pour exécuter une query GraphQL
  const executeGraphQL = async (query: string, token?: string, variables?: any) => {
    const request = new Request('http://localhost/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ query, variables }),
    });

    return yoga.fetch(request);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      webhookLog: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      subscription: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    // Mock Stripe
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        confirm: jest.fn(),
        cancel: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        cancel: jest.fn(),
      },
    } as any;

    // Créer le serveur Yoga
    yoga = createYoga({
      schema,
      context: {
        prisma: mockPrisma,
        stripe: mockStripe,
      },
    });
  });

  describe('Authentication Requirements', () => {
    it('devrait rejeter les requêtes sans token', async () => {
      const query = `
        query {
          myPayments {
            id
            amount
          }
        }
      `;

      const response = await executeGraphQL(query);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Not authenticated');
    });

    it('devrait rejeter les tokens invalides', async () => {
      const query = `
        query {
          myPayments {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, 'invalid_token');
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Invalid token');
    });

    it('devrait rejeter les tokens expirés', async () => {
      const expiredToken = sign(
        { userId: 1, role: 'USER' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const query = `
        query {
          myPayments {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, expiredToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Token expired');
    });
  });

  describe('User Role Permissions - Queries', () => {
    const userToken = createToken({ userId: 1, role: 'USER' });
    const adminToken = createToken({ userId: 2, role: 'ADMIN' });
    const superAdminToken = createToken({ userId: 3, role: 'SUPER_ADMIN' });

    it('USER devrait accéder à ses propres paiements', async () => {
      const mockPayments = [
        { id: 1, userId: 1, amount: 50.00, status: 'SUCCEEDED' },
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments as any);

      const query = `
        query {
          myPayments {
            id
            amount
            status
          }
        }
      `;

      const response = await executeGraphQL(query, userToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.myPayments).toEqual(mockPayments);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('USER ne devrait PAS accéder aux paiements d\'autres utilisateurs', async () => {
      const query = `
        query {
          userPayments(userId: 2) {
            id
            amount
          }
        }
      `;

      const response = await executeGraphQL(query, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Forbidden');
    });

    it('ADMIN devrait accéder aux paiements de tous les utilisateurs', async () => {
      const mockPayments = [
        { id: 1, userId: 2, amount: 50.00 },
        { id: 2, userId: 3, amount: 30.00 },
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments as any);

      const query = `
        query {
          allPayments {
            id
            userId
            amount
          }
        }
      `;

      const response = await executeGraphQL(query, adminToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.allPayments).toEqual(mockPayments);
    });

    it('USER ne devrait PAS accéder à allPayments', async () => {
      const query = `
        query {
          allPayments {
            id
            amount
          }
        }
      `;

      const response = await executeGraphQL(query, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Admin access required');
    });

    it('ADMIN devrait accéder aux webhook logs', async () => {
      const mockLogs = [
        { id: 1, eventType: 'payment_intent.succeeded', status: 'SUCCESS' },
      ];

      mockPrisma.webhookLog.findMany.mockResolvedValue(mockLogs as any);

      const query = `
        query {
          webhookLogs {
            id
            eventType
            status
          }
        }
      `;

      const response = await executeGraphQL(query, adminToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.webhookLogs).toEqual(mockLogs);
    });

    it('USER ne devrait PAS accéder aux webhook logs', async () => {
      const query = `
        query {
          webhookLogs {
            id
            eventType
          }
        }
      `;

      const response = await executeGraphQL(query, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Admin access required');
    });
  });

  describe('User Role Permissions - Mutations', () => {
    const userToken = createToken({ userId: 1, role: 'USER' });
    const adminToken = createToken({ userId: 2, role: 'ADMIN' });

    it('USER devrait créer son propre Payment Intent', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_123',
      } as any);

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'pi_123_secret',
      } as any);

      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const mutation = `
        mutation {
          createPaymentIntent(amount: 5000, currency: "eur") {
            id
            clientSecret
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.createPaymentIntent.id).toBe('pi_123');
    });

    it('USER ne devrait PAS créer de Payment Intent pour un autre utilisateur', async () => {
      const mutation = `
        mutation {
          createPaymentIntentForUser(userId: 2, amount: 5000) {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Forbidden');
    });

    it('ADMIN devrait créer des Payment Intents pour n\'importe quel utilisateur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 5,
        stripeCustomerId: 'cus_456',
      } as any);

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_admin_123',
      } as any);

      mockPrisma.payment.create.mockResolvedValue({ id: 2 } as any);

      const mutation = `
        mutation {
          createPaymentIntentForUser(userId: 5, amount: 5000) {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, adminToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.createPaymentIntentForUser.id).toBe('pi_admin_123');
    });

    it('USER devrait annuler son propre paiement', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        userId: 1,
        stripePaymentIntentId: 'pi_123',
        status: 'PENDING',
      } as any);

      mockStripe.paymentIntents.cancel.mockResolvedValue({
        id: 'pi_123',
        status: 'canceled',
      } as any);

      mockPrisma.payment.update.mockResolvedValue({
        id: 1,
        status: 'CANCELED',
      } as any);

      const mutation = `
        mutation {
          cancelPayment(paymentIntentId: "pi_123") {
            id
            status
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.cancelPayment.status).toBe('CANCELED');
    });

    it('USER ne devrait PAS annuler le paiement d\'un autre utilisateur', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 2,
        userId: 2, // Différent utilisateur
        stripePaymentIntentId: 'pi_456',
      } as any);

      const mutation = `
        mutation {
          cancelPayment(paymentIntentId: "pi_456") {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Not authorized');
    });

    it('ADMIN devrait retry un webhook échoué', async () => {
      mockPrisma.webhookLog.findUnique.mockResolvedValue({
        id: 1,
        status: 'FAILED',
      } as any);

      mockPrisma.webhookLog.update.mockResolvedValue({
        id: 1,
        status: 'SUCCESS',
      } as any);

      const mutation = `
        mutation {
          retryWebhook(webhookLogId: 1) {
            id
            status
          }
        }
      `;

      const response = await executeGraphQL(mutation, adminToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.retryWebhook.status).toBe('SUCCESS');
    });

    it('USER ne devrait PAS retry un webhook', async () => {
      const mutation = `
        mutation {
          retryWebhook(webhookLogId: 1) {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Admin access required');
    });
  });

  describe('Membership Status Permissions', () => {
    it('PENDING ne devrait PAS créer de paiement', async () => {
      const token = createToken({
        userId: 1,
        role: 'USER',
        membershipStatus: 'PENDING',
      });

      const mutation = `
        mutation {
          createPaymentIntent(amount: 5000, currency: "eur") {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, token);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Account not activated');
    });

    it('INACTIVE ne devrait PAS créer de paiement', async () => {
      const token = createToken({
        userId: 1,
        role: 'USER',
        membershipStatus: 'INACTIVE',
      });

      const mutation = `
        mutation {
          createPaymentIntent(amount: 5000, currency: "eur") {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, token);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Account is inactive');
    });

    it('ACTIVE devrait créer des paiements', async () => {
      const token = createToken({
        userId: 1,
        role: 'USER',
        membershipStatus: 'ACTIVE',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_123',
      } as any);

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
      } as any);

      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const mutation = `
        mutation {
          createPaymentIntent(amount: 5000, currency: "eur") {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, token);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.createPaymentIntent.id).toBe('pi_123');
    });

    it('PREMIUM devrait avoir accès aux fonctionnalités premium', async () => {
      const token = createToken({
        userId: 1,
        role: 'USER',
        membershipStatus: 'PREMIUM',
      });

      const query = `
        query {
          premiumFeatures {
            name
            enabled
          }
        }
      `;

      const response = await executeGraphQL(query, token);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.data.premiumFeatures).toBeDefined();
    });

    it('ACTIVE ne devrait PAS avoir accès aux fonctionnalités premium', async () => {
      const token = createToken({
        userId: 1,
        role: 'USER',
        membershipStatus: 'ACTIVE',
      });

      const query = `
        query {
          premiumFeatures {
            name
          }
        }
      `;

      const response = await executeGraphQL(query, token);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Premium membership required');
    });
  });

  describe('Data Isolation', () => {
    const user1Token = createToken({ userId: 1, role: 'USER' });
    const user2Token = createToken({ userId: 2, role: 'USER' });

    it('devrait isoler les données de paiement entre utilisateurs', async () => {
      mockPrisma.payment.findMany
        .mockResolvedValueOnce([{ id: 1, userId: 1 }] as any)
        .mockResolvedValueOnce([{ id: 2, userId: 2 }] as any);

      const query = `
        query {
          myPayments {
            id
            userId
          }
        }
      `;

      // User 1
      const response1 = await executeGraphQL(query, user1Token);
      const data1 = await response1.json();

      // User 2
      const response2 = await executeGraphQL(query, user2Token);
      const data2 = await response2.json();

      expect(data1.data.myPayments[0].userId).toBe(1);
      expect(data2.data.myPayments[0].userId).toBe(2);
    });

    it('devrait empêcher l\'accès direct aux paiements par ID d\'un autre utilisateur', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 10,
        userId: 2, // Appartient à user2
      } as any);

      const query = `
        query {
          payment(id: 10) {
            id
            amount
          }
        }
      `;

      const response = await executeGraphQL(query, user1Token);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Not authorized');
    });

    it('devrait isoler les abonnements entre utilisateurs', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        { id: 1, userId: 1 },
      ] as any);

      const query = `
        query {
          mySubscriptions {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, user1Token);
      const data = await response.json();

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });

  describe('Field-Level Permissions', () => {
    const userToken = createToken({ userId: 1, role: 'USER' });
    const adminToken = createToken({ userId: 2, role: 'ADMIN' });

    it('USER ne devrait PAS voir les champs sensibles', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          amount: 50.00,
          stripePaymentIntentId: 'pi_secret_123',
          internalNotes: 'Admin notes',
        },
      ] as any);

      const query = `
        query {
          myPayments {
            id
            amount
            stripePaymentIntentId
            internalNotes
          }
        }
      `;

      const response = await executeGraphQL(query, userToken);
      const data = await response.json();

      // stripePaymentIntentId devrait être masqué
      expect(data.data.myPayments[0].stripePaymentIntentId).toMatch(/^pi_\*+/);
      // internalNotes ne devrait pas être accessible
      expect(data.data.myPayments[0].internalNotes).toBeUndefined();
    });

    it('ADMIN devrait voir tous les champs', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 1,
          amount: 50.00,
          stripePaymentIntentId: 'pi_secret_123',
          internalNotes: 'Admin notes',
        },
      ] as any);

      const query = `
        query {
          allPayments {
            id
            stripePaymentIntentId
            internalNotes
          }
        }
      `;

      const response = await executeGraphQL(query, adminToken);
      const data = await response.json();

      expect(data.data.allPayments[0].stripePaymentIntentId).toBe('pi_secret_123');
      expect(data.data.allPayments[0].internalNotes).toBe('Admin notes');
    });

    it('devrait masquer les emails dans les webhooks pour USER', async () => {
      mockPrisma.webhookLog.findMany.mockResolvedValue([
        {
          id: 1,
          payload: JSON.stringify({ customer: { email: 'secret@example.com' } }),
        },
      ] as any);

      const query = `
        query {
          webhookLogs {
            id
            payload
          }
        }
      `;

      // User ne devrait pas pouvoir accéder aux webhooks
      const response = await executeGraphQL(query, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
    });
  });

  describe('Rate Limiting par Rôle', () => {
    it('USER devrait avoir un rate limit plus bas', async () => {
      const userToken = createToken({ userId: 1, role: 'USER' });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_123',
      } as any);

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
      } as any);

      mockPrisma.payment.create.mockResolvedValue({ id: 1 } as any);

      const mutation = `
        mutation {
          createPaymentIntent(amount: 5000, currency: "eur") {
            id
          }
        }
      `;

      // Faire 10 requêtes rapidement
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(executeGraphQL(mutation, userToken));
      }

      const responses = await Promise.all(promises);
      const lastResponse = await responses[9].json();

      // La dernière requête devrait être rate-limited
      expect(lastResponse.errors).toBeDefined();
      expect(lastResponse.errors[0].message).toContain('Rate limit exceeded');
    });

    it('ADMIN devrait avoir un rate limit plus élevé', async () => {
      const adminToken = createToken({ userId: 2, role: 'ADMIN' });

      mockPrisma.payment.findMany.mockResolvedValue([]);

      const query = `
        query {
          allPayments {
            id
          }
        }
      `;

      // Faire 20 requêtes rapidement (plus que USER)
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(executeGraphQL(query, adminToken));
      }

      const responses = await Promise.all(promises);
      const lastResponse = await responses[19].json();

      // Ne devrait pas être rate-limited
      expect(lastResponse.errors).toBeUndefined();
    });
  });

  describe('Audit Trail', () => {
    it('devrait logger les accès aux données sensibles', async () => {
      const adminToken = createToken({ userId: 2, role: 'ADMIN' });

      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.auditLog = {
        create: jest.fn().mockResolvedValue({}),
      } as any;

      const query = `
        query {
          allPayments {
            id
            amount
          }
        }
      `;

      await executeGraphQL(query, adminToken);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 2,
          action: 'READ',
          resource: 'payments',
          query: expect.stringContaining('allPayments'),
        }),
      });
    });

    it('devrait logger les mutations critiques', async () => {
      const adminToken = createToken({ userId: 2, role: 'ADMIN' });

      mockPrisma.webhookLog.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.webhookLog.update.mockResolvedValue({ id: 1 } as any);
      mockPrisma.auditLog = {
        create: jest.fn().mockResolvedValue({}),
      } as any;

      const mutation = `
        mutation {
          retryWebhook(webhookLogId: 1) {
            id
          }
        }
      `;

      await executeGraphQL(mutation, adminToken);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'RETRY_WEBHOOK',
          userId: 2,
        }),
      });
    });
  });

  describe('Cross-Resource Permissions', () => {
    const userToken = createToken({ userId: 1, role: 'USER' });

    it('devrait vérifier les permissions avant de créer un abonnement', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        membershipStatus: 'PENDING', // Ne peut pas s'abonner
      } as any);

      const mutation = `
        mutation {
          createSubscription(planId: "premium") {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Cannot create subscription');
    });

    it('devrait vérifier que l\'utilisateur possède le paiement avant de le rembourser', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 1,
        userId: 2, // Différent utilisateur
      } as any);

      const mutation = `
        mutation {
          requestRefund(paymentId: 1) {
            id
          }
        }
      `;

      const response = await executeGraphQL(mutation, userToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Not authorized');
    });
  });

  describe('Temporary Permissions', () => {
    it('devrait permettre l\'accès temporaire avec un token spécial', async () => {
      const tempToken = createToken({
        userId: 1,
        role: 'USER',
        tempPermissions: ['view_all_payments'],
        expiresIn: '5m',
      });

      mockPrisma.payment.findMany.mockResolvedValue([]);

      const query = `
        query {
          allPayments {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, tempToken);
      const data = await response.json();

      expect(data.errors).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('devrait gérer les rôles inconnus', async () => {
      const unknownRoleToken = createToken({ userId: 1, role: 'UNKNOWN' });

      const query = `
        query {
          myPayments {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, unknownRoleToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Invalid role');
    });

    it('devrait gérer les userId manquants dans le token', async () => {
      const noUserIdToken = createToken({ role: 'USER' });

      const query = `
        query {
          myPayments {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, noUserIdToken);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('Invalid token');
    });

    it('devrait gérer les utilisateurs supprimés', async () => {
      const token = createToken({ userId: 999, role: 'USER' });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const query = `
        query {
          myPayments {
            id
          }
        }
      `;

      const response = await executeGraphQL(query, token);
      const data = await response.json();

      expect(data.errors).toBeDefined();
      expect(data.errors[0].message).toContain('User not found');
    });
  });
});
