/**
 * Tests unitaires pour WebhookService
 * Teste toutes les nouvelles méthodes ajoutées pour la gestion des webhooks Stripe
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import Stripe from "stripe";

// Mock Prisma
const mockPrisma = {
  paiements: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  utilisateurs: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  echeances_paiement: {
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  webhook_logs: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

// Mock message client
const mockMessageClient = {
  sendTemplate: jest.fn().mockResolvedValue({ success: true }),
};

// Mock Sentry
const mockSentry = {
  startTransaction: jest.fn().mockReturnValue({
    setTag: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn(),
  }),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("@sentry/node", () => mockSentry);

// Import après les mocks
import { WebhookService } from "../core/webhooks/webhook.service.js";

describe("WebhookService - Tests unitaires", () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    webhookService = new WebhookService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== VALIDATION DE SIGNATURE ====================
  describe("validateSignature", () => {
    const mockStripeConstructor = Stripe as unknown as jest.Mock;
    const mockWebhooks = {
      constructEvent: jest.fn(),
    };

    beforeEach(() => {
      mockStripeConstructor.mockReturnValue({
        webhooks: mockWebhooks,
      } as any);
    });

    it("devrait valider une signature Stripe valide", () => {
      const payload = '{"type":"payment_intent.succeeded"}';
      const signature = "t=1234567890,v1=signature_hash";
      const secret = "whsec_test_secret";

      const mockEvent = {
        id: "evt_test_123",
        type: "payment_intent.succeeded",
        data: { object: {} },
      };

      mockWebhooks.constructEvent.mockReturnValue(mockEvent);

      const result = webhookService.validateSignature(payload, signature, secret);

      expect(result).toEqual(mockEvent);
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(payload, signature, secret);
    });

    it("devrait rejeter une signature invalide", () => {
      const payload = '{"type":"payment_intent.succeeded"}';
      const signature = "invalid_signature";
      const secret = "whsec_test_secret";

      mockWebhooks.constructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      expect(() => {
        webhookService.validateSignature(payload, signature, secret);
      }).toThrow("Invalid signature");
    });
  });

  // ==================== GESTION DES LOGS WEBHOOKS ====================
  describe("createWebhookLog", () => {
    it("devrait créer un log webhook avec succès", async () => {
      const mockLog = {
        id: 1,
        eventId: "evt_test_123",
        eventType: "payment_intent.succeeded",
        status: "PENDING",
        payload: {},
        retryCount: 0,
        createdAt: new Date(),
      };

      mockPrisma.webhook_logs.create.mockResolvedValue(mockLog);

      const result = await webhookService["createWebhookLog"]("evt_test_123", "payment_intent.succeeded", {});

      expect(result).toEqual(mockLog);
      expect(mockPrisma.webhook_logs.create).toHaveBeenCalledWith({
        data: {
          eventId: "evt_test_123",
          eventType: "payment_intent.succeeded",
          status: "PENDING",
          payload: {},
          retryCount: 0,
        },
      });
    });

    it("devrait gérer les erreurs de création", async () => {
      mockPrisma.webhook_logs.create.mockRejectedValue(new Error("Database error"));

      await expect(
        webhookService["createWebhookLog"]("evt_test_123", "payment_intent.succeeded", {})
      ).rejects.toThrow("Database error");
    });
  });

  describe("markWebhookSuccess", () => {
    it("devrait marquer un webhook comme succès", async () => {
      const mockUpdatedLog = {
        id: 1,
        status: "SUCCESS",
        processedAt: new Date(),
      };

      mockPrisma.webhook_logs.update.mockResolvedValue(mockUpdatedLog);

      await webhookService["markWebhookSuccess"]("evt_test_123");

      expect(mockPrisma.webhook_logs.update).toHaveBeenCalledWith({
        where: { eventId: "evt_test_123" },
        data: {
          status: "SUCCESS",
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe("markWebhookFailure", () => {
    it("devrait marquer un webhook comme échec et incrémenter retryCount", async () => {
      const mockLog = {
        id: 1,
        retryCount: 0,
      };

      mockPrisma.webhook_logs.findUnique.mockResolvedValue(mockLog);
      mockPrisma.webhook_logs.update.mockResolvedValue({ ...mockLog, retryCount: 1 });

      await webhookService["markWebhookFailure"]("evt_test_123", "Error message");

      expect(mockPrisma.webhook_logs.findUnique).toHaveBeenCalledWith({
        where: { eventId: "evt_test_123" },
      });

      expect(mockPrisma.webhook_logs.update).toHaveBeenCalledWith({
        where: { eventId: "evt_test_123" },
        data: {
          status: "FAILURE",
          error: "Error message",
          retryCount: 1,
          nextRetryAt: expect.any(Date),
        },
      });
    });

    it("devrait calculer nextRetryAt avec exponential backoff", async () => {
      const mockLog = {
        id: 1,
        retryCount: 2,
      };

      mockPrisma.webhook_logs.findUnique.mockResolvedValue(mockLog);
      mockPrisma.webhook_logs.update.mockResolvedValue({ ...mockLog, retryCount: 3 });

      await webhookService["markWebhookFailure"]("evt_test_123", "Error");

      const updateCall = mockPrisma.webhook_logs.update.mock.calls[0][0];
      const nextRetryAt = updateCall.data.nextRetryAt as Date;

      // Vérifier que nextRetryAt est dans le futur
      expect(nextRetryAt.getTime()).toBeGreaterThan(Date.now());

      // Vérifier l'exponential backoff (2^3 * 5 = 40 minutes)
      const expectedDelay = Math.pow(2, 3) * 5 * 60 * 1000;
      const actualDelay = nextRetryAt.getTime() - Date.now();

      // Tolérance de 1 seconde
      expect(Math.abs(actualDelay - expectedDelay)).toBeLessThan(1000);
    });
  });

  // ==================== RÉCUPÉRATION DES LOGS ====================
  describe("getWebhookLogs", () => {
    it("devrait récupérer les logs avec filtres et pagination", async () => {
      const mockLogs = [
        {
          id: 1,
          eventId: "evt_1",
          eventType: "payment_intent.succeeded",
          status: "SUCCESS",
          createdAt: new Date(),
        },
        {
          id: 2,
          eventId: "evt_2",
          eventType: "payment_intent.failed",
          status: "FAILURE",
          createdAt: new Date(),
        },
      ];

      mockPrisma.webhook_logs.findMany.mockResolvedValue(mockLogs);

      const result = await webhookService.getWebhookLogs({
        status: "SUCCESS",
        eventType: "payment_intent.succeeded",
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveLength(2);
      expect(mockPrisma.webhook_logs.findMany).toHaveBeenCalledWith({
        where: {
          status: "SUCCESS",
          eventType: "payment_intent.succeeded",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("devrait retourner tous les logs sans filtres", async () => {
      const mockLogs = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        eventId: `evt_${i}`,
        eventType: "payment_intent.succeeded",
        status: "SUCCESS",
        createdAt: new Date(),
      }));

      mockPrisma.webhook_logs.findMany.mockResolvedValue(mockLogs.slice(0, 50));

      const result = await webhookService.getWebhookLogs({});

      expect(result).toHaveLength(50);
    });
  });

  describe("getWebhookLogById", () => {
    it("devrait récupérer un log spécifique par ID", async () => {
      const mockLog = {
        id: 1,
        eventId: "evt_test_123",
        eventType: "payment_intent.succeeded",
        status: "SUCCESS",
        payload: { amount: 5000 },
        error: null,
        retryCount: 0,
        nextRetryAt: null,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhook_logs.findUnique.mockResolvedValue(mockLog);

      const result = await webhookService.getWebhookLogById(1);

      expect(result).toEqual(mockLog);
      expect(mockPrisma.webhook_logs.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si le log n'existe pas", async () => {
      mockPrisma.webhook_logs.findUnique.mockResolvedValue(null);

      const result = await webhookService.getWebhookLogById(999);

      expect(result).toBeNull();
    });
  });

  // ==================== STATISTIQUES ====================
  describe("getWebhookStats", () => {
    it("devrait calculer les statistiques globales", async () => {
      mockPrisma.webhook_logs.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // success
        .mockResolvedValueOnce(15)  // failure
        .mockResolvedValueOnce(5);  // pending

      mockPrisma.webhook_logs.findMany.mockResolvedValue([]);

      mockPrisma.webhook_logs.groupBy.mockResolvedValue([
        {
          eventType: "payment_intent.succeeded",
          _count: { id: 50 },
        },
        {
          eventType: "invoice.payment_succeeded",
          _count: { id: 30 },
        },
      ]);

      const result = await webhookService.getWebhookStats();

      expect(result.totalProcessed).toBe(100);
      expect(result.successCount).toBe(80);
      expect(result.failureCount).toBe(15);
      expect(result.pendingCount).toBe(5);
      expect(result.byEventType).toHaveLength(2);
    });

    it("devrait filtrer par période", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      mockPrisma.webhook_logs.count.mockResolvedValue(50);
      mockPrisma.webhook_logs.findMany.mockResolvedValue([]);
      mockPrisma.webhook_logs.groupBy.mockResolvedValue([]);

      await webhookService.getWebhookStats(startDate, endDate);

      const countCalls = mockPrisma.webhook_logs.count.mock.calls;

      countCalls.forEach((call) => {
        if (call[0]?.where) {
          expect(call[0].where.createdAt).toBeDefined();
        }
      });
    });
  });

  // ==================== RETRY WEBHOOK ====================
  describe("retryWebhook", () => {
    it("devrait retenter un webhook en échec", async () => {
      const mockLog = {
        id: 1,
        eventId: "evt_test_123",
        eventType: "payment_intent.succeeded",
        status: "FAILURE",
        payload: {
          data: {
            object: {
              metadata: {
                user_id: "1",
                echeance_id: "1",
              },
              amount: 5000,
              currency: "eur",
            },
          },
        },
        retryCount: 1,
      };

      mockPrisma.webhook_logs.findUnique.mockResolvedValue(mockLog);
      mockPrisma.webhook_logs.update.mockResolvedValue({ ...mockLog, status: "PENDING" });

      // Mock des méthodes nécessaires pour handlePaymentSuccess
      mockPrisma.paiements.create.mockResolvedValue({});
      mockPrisma.echeances_paiement.update.mockResolvedValue({});
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
      });

      const result = await webhookService.retryWebhook(1);

      expect(result.success).toBe(true);
      expect(mockPrisma.webhook_logs.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "PENDING" },
      });
    });

    it("ne devrait pas retenter un webhook en succès", async () => {
      const mockLog = {
        id: 1,
        status: "SUCCESS",
      };

      mockPrisma.webhook_logs.findUnique.mockResolvedValue(mockLog);

      const result = await webhookService.retryWebhook(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain("déjà traité avec succès");
    });

    it("ne devrait pas retenter un webhook inexistant", async () => {
      mockPrisma.webhook_logs.findUnique.mockResolvedValue(null);

      const result = await webhookService.retryWebhook(999);

      expect(result.success).toBe(false);
      expect(result.message).toContain("introuvable");
    });

    it("ne devrait pas retenter si max retry atteint", async () => {
      const mockLog = {
        id: 1,
        status: "FAILURE",
        retryCount: 5,
      };

      mockPrisma.webhook_logs.findUnique.mockResolvedValue(mockLog);

      const result = await webhookService.retryWebhook(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain("maximum de tentatives");
    });
  });

  // ==================== PROCESS MANUALLY ====================
  describe("processManually", () => {
    it("devrait traiter manuellement un événement", async () => {
      const mockEvent = {
        id: "evt_manual_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            metadata: {
              user_id: "1",
              echeance_id: "1",
            },
            amount: 5000,
            currency: "eur",
          },
        },
      };

      mockPrisma.webhook_logs.create.mockResolvedValue({
        id: 1,
        eventId: mockEvent.id,
        eventType: mockEvent.type,
      });

      mockPrisma.paiements.create.mockResolvedValue({});
      mockPrisma.echeances_paiement.update.mockResolvedValue({});
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
      });

      const result = await webhookService.processManually(mockEvent as any);

      expect(result.success).toBe(true);
      expect(mockPrisma.webhook_logs.create).toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de traitement manuel", async () => {
      const mockEvent = {
        id: "evt_manual_error",
        type: "unknown.event",
        data: { object: {} },
      };

      mockPrisma.webhook_logs.create.mockResolvedValue({
        id: 1,
        eventId: mockEvent.id,
      });

      const result = await webhookService.processManually(mockEvent as any);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  // ==================== CLEAN OLD LOGS ====================
  describe("cleanOldLogs", () => {
    it("devrait supprimer les logs anciens réussis", async () => {
      const mockResult = { count: 150 };
      mockPrisma.webhook_logs.deleteMany.mockResolvedValue(mockResult);

      const result = await webhookService.cleanOldLogs(30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(150);

      const deleteCall = mockPrisma.webhook_logs.deleteMany.mock.calls[0][0];
      expect(deleteCall.where.status.in).toEqual(["SUCCESS", "FAILURE"]);
    });

    it("devrait calculer correctement la date limite", async () => {
      mockPrisma.webhook_logs.deleteMany.mockResolvedValue({ count: 10 });

      await webhookService.cleanOldLogs(90);

      const deleteCall = mockPrisma.webhook_logs.deleteMany.mock.calls[0][0];
      const cutoffDate = deleteCall.where.createdAt.lt as Date;

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 90);

      // Tolérance de 1 seconde
      expect(Math.abs(cutoffDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });

    it("devrait gérer l'absence de logs à supprimer", async () => {
      mockPrisma.webhook_logs.deleteMany.mockResolvedValue({ count: 0 });

      const result = await webhookService.cleanOldLogs(30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });

  // ==================== EMAIL NOTIFICATIONS ====================
  describe("Email Notifications", () => {
    beforeEach(() => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
      });
    });

    describe("sendInvoiceSuccessEmail", () => {
      it("devrait envoyer un email de confirmation de facture", async () => {
        const emailData = {
          email: "test@example.com",
          userName: "Test User",
          firstName: "Test",
          lastName: "User",
          invoiceNumber: "INV-001",
          amount: 5000,
          currency: "eur",
          subscriptionId: "sub_123",
          periodStart: new Date(),
          periodEnd: new Date(),
          invoicePdfUrl: "https://stripe.com/invoice.pdf",
          hostedInvoiceUrl: "https://stripe.com/invoice",
          paymentIntentId: "pi_123",
        };

        await webhookService["sendInvoiceSuccessEmail"](emailData);

        expect(mockMessageClient.sendTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "test@example.com",
            templateName: "confirmation-facture",
          })
        );
      });
    });

    describe("sendInvoiceFailureEmail", () => {
      it("devrait envoyer un email d'échec de facture", async () => {
        const emailData = {
          email: "test@example.com",
          userName: "Test User",
          firstName: "Test",
          lastName: "User",
          invoiceNumber: "INV-001",
          montant: 5000,
          currency: "eur",
          subscriptionId: "sub_123",
          periodStart: new Date(),
          periodEnd: new Date(),
          attemptCount: 1,
          nextPaymentAttempt: new Date(),
          hostedInvoiceUrl: "https://stripe.com/invoice",
          errorMessage: "Card declined",
        };

        await webhookService["sendInvoiceFailureEmail"](emailData);

        expect(mockMessageClient.sendTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "test@example.com",
            templateName: "echec-facture",
          })
        );
      });
    });

    describe("sendSubscriptionWelcomeEmail", () => {
      it("devrait envoyer un email de bienvenue abonnement", async () => {
        const emailData = {
          email: "test@example.com",
          userName: "Test User",
          firstName: "Test",
          lastName: "User",
          subscriptionId: "sub_123",
          planName: "Premium",
          startDate: new Date(),
          nextBillingDate: new Date(),
          trialEnd: null,
        };

        await webhookService["sendSubscriptionWelcomeEmail"](emailData);

        expect(mockMessageClient.sendTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "test@example.com",
            templateName: "bienvenue-abonnement",
          })
        );
      });
    });

    describe("sendSubscriptionCancelledEmail", () => {
      it("devrait envoyer un email d'annulation d'abonnement", async () => {
        const emailData = {
          email: "test@example.com",
          userName: "Test User",
          firstName: "Test",
          lastName: "User",
          subscriptionId: "sub_123",
          planName: "Premium",
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
          endDate: new Date(),
        };

        await webhookService["sendSubscriptionCancelledEmail"](emailData);

        expect(mockMessageClient.sendTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "test@example.com",
            templateName: "annulation-abonnement",
          })
        );
      });
    });

    describe("sendSubscriptionPastDueEmail", () => {
      it("devrait envoyer un email d'abonnement en retard", async () => {
        const emailData = {
          email: "test@example.com",
          userName: "Test User",
          subscriptionId: "sub_123",
        };

        await webhookService["sendSubscriptionPastDueEmail"](emailData);

        expect(mockMessageClient.sendTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "test@example.com",
            templateName: "abonnement-en-retard",
          })
        );
      });
    });
  });

  // ==================== PAYMENT SCHEDULE ====================
  describe("Payment Schedule", () => {
    describe("createPaymentSchedule", () => {
      it("devrait créer des échéances de paiement mensuelles", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          plans_tarifaires: {
            montant: 5000,
          },
        });

        mockPrisma.echeances_paiement.create.mockResolvedValue({
          id: 1,
          utilisateur_id: 1,
          abonnement_id: "sub_123",
          montant: 5000,
          statut: "en_attente",
        });

        await webhookService["createPaymentSchedule"](
          1,
          "sub_123",
          new Date("2024-01-01"),
          new Date("2024-12-31")
        );

        // Devrait créer 12 échéances (une par mois)
        expect(mockPrisma.echeances_paiement.create).toHaveBeenCalledTimes(12);
      });

      it("devrait gérer l'absence de plan tarifaire", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          plans_tarifaires: null,
        });

        await expect(
          webhookService["createPaymentSchedule"](
            1,
            "sub_123",
            new Date(),
            new Date()
          )
        ).rejects.toThrow();
      });
    });

    describe("cancelFuturePaymentSchedules", () => {
      it("devrait annuler les échéances futures", async () => {
        mockPrisma.echeances_paiement.updateMany.mockResolvedValue({ count: 5 });

        await webhookService["cancelFuturePaymentSchedules"](1, "sub_123");

        expect(mockPrisma.echeances_paiement.updateMany).toHaveBeenCalledWith({
          where: {
            utilisateur_id: 1,
            date_echeance: { gte: expect.any(Date) },
            statut: "en_attente",
          },
          data: {
            statut: "annule",
          },
        });
      });
    });
  });

  // ==================== HANDLERS WEBHOOKS STRIPE ====================
  describe("Stripe Webhook Handlers", () => {
    describe("handlePaymentSuccess", () => {
      it("devrait traiter un paiement réussi", async () => {
        const mockEvent = {
          id: "evt_payment_success",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_123",
              metadata: {
                user_id: "1",
                echeance_id: "1",
              },
              amount: 5000,
              currency: "eur",
            },
          },
        };

        mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
        mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
        mockPrisma.echeances_paiement.update.mockResolvedValue({});
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
        });

        await webhookService.handlePaymentSuccess(mockEvent as any);

        expect(mockPrisma.paiements.create).toHaveBeenCalled();
        expect(mockPrisma.echeances_paiement.update).toHaveBeenCalled();
        expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
      });
    });

    describe("handleCheckoutSessionCompleted", () => {
      it("devrait traiter une session checkout complétée", async () => {
        const mockEvent = {
          id: "evt_checkout_complete",
          type: "checkout.session.completed",
          data: {
            object: {
              id: "cs_123",
              payment_intent: "pi_123",
              metadata: {
                user_id: "1",
                echeance_id: "1",
              },
              amount_total: 5000,
              currency: "eur",
              payment_status: "paid",
            },
          },
        };

        mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
        mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
        mockPrisma.echeances_paiement.update.mockResolvedValue({});
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
        });

        await webhookService.handleCheckoutSessionCompleted(mockEvent as any);

        expect(mockPrisma.paiements.create).toHaveBeenCalled();
      });
    });

    describe("handleSubscriptionCreated", () => {
      it("devrait créer un abonnement et générer des échéances", async () => {
        const mockEvent = {
          id: "evt_sub_created",
          type: "customer.subscription.created",
          data: {
            object: {
              id: "sub_123",
              customer: "cus_123",
              status: "active",
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 2592000,
              items: {
                data: [
                  {
                    price: {
                      nickname: "Premium Plan",
                    },
                  },
                ],
              },
            },
          },
        };

        mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
          stripe_customer_id: "cus_123",
          plans_tarifaires: {
            montant: 5000,
          },
        });
        mockPrisma.utilisateurs.update.mockResolvedValue({});
        mockPrisma.echeances_paiement.create.mockResolvedValue({});

        await webhookService.handleSubscriptionCreated(mockEvent as any);

        expect(mockPrisma.utilisateurs.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            stripe_subscription_id: "sub_123",
            active: true,
          },
        });
        expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
      });
    });

    describe("handleSubscriptionDeleted", () => {
      it("devrait annuler un abonnement et les échéances futures", async () => {
        const mockEvent = {
          id: "evt_sub_deleted",
          type: "customer.subscription.deleted",
          data: {
            object: {
              id: "sub_123",
              customer: "cus_123",
              status: "canceled",
              canceled_at: Math.floor(Date.now() / 1000),
              cancel_at_period_end: false,
              current_period_end: Math.floor(Date.now() / 1000),
              items: {
                data: [
                  {
                    price: {
                      nickname: "Premium Plan",
                    },
                  },
                ],
              },
            },
          },
        };

        mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
          stripe_subscription_id: "sub_123",
        });
        mockPrisma.utilisateurs.update.mockResolvedValue({});
        mockPrisma.echeances_paiement.updateMany.mockResolvedValue({ count: 3 });

        await webhookService.handleSubscriptionDeleted(mockEvent as any);

        expect(mockPrisma.utilisateurs.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            stripe_subscription_id: null,
            active: false,
          },
        });
        expect(mockPrisma.echeances_paiement.updateMany).toHaveBeenCalled();
        expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
      });
    });

    describe("handleInvoicePaymentFailed", () => {
      it("devrait suspendre l'utilisateur après 3 échecs", async () => {
        const mockEvent = {
          id: "evt_invoice_failed",
          type: "invoice.payment_failed",
          data: {
            object: {
              id: "in_123",
              subscription: "sub_123",
              customer: "cus_123",
              amount_due: 5000,
              currency: "eur",
              status: "open",
              attempt_count: 3,
              next_payment_attempt: null,
              hosted_invoice_url: "https://stripe.com/invoice",
              invoice_pdf: "https://stripe.com/invoice.pdf",
              payment_intent: "pi_123",
              lines: {
                data: [
                  {
                    period: {
                      start: Math.floor(Date.now() / 1000),
                      end: Math.floor(Date.now() / 1000) + 2592000,
                    },
                  },
                ],
              },
            },
          },
        };

        mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({
          id: 1,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
          stripe_customer_id: "cus_123",
          active: true,
        });
        mockPrisma.paiements.create.mockResolvedValue({});
        mockPrisma.utilisateurs.update.mockResolvedValue({});

        await webhookService.handleInvoicePaymentFailed(mockEvent as any);

        // Vérifier que l'utilisateur est suspendu après 3 échecs
        expect(mockPrisma.utilisateurs.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            active: false,
            stripe_subscription_id: null,
          },
        });
        expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
      });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe("Error Handling", () => {
    it("devrait capturer les exceptions dans Sentry", async () => {
      mockPrisma.webhook_logs.create.mockRejectedValue(new Error("Database error"));

      await expect(
        webhookService["createWebhookLog"]("evt_error", "test.event", {})
      ).rejects.toThrow("Database error");

      expect(mockSentry.captureException).toHaveBeenCalled();
    });

    it("devrait gérer les metadata manquantes gracieusement", async () => {
      const mockEvent = {
        id: "evt_no_metadata",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123",
            metadata: {},
            amount: 5000,
            currency: "eur",
          },
        },
      };

      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });

      // Ne devrait pas throw mais loguer l'erreur
      await webhookService.handlePaymentSuccess(mockEvent as any);

      expect(mockSentry.captureException).toHaveBeenCalled();
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe("Integration Scenarios", () => {
    it("devrait traiter un cycle complet d'abonnement", async () => {
      // 1. Création d'abonnement
      const createEvent = {
        id: "evt_sub_created",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            status: "active",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            items: {
              data: [{ price: { nickname: "Premium" } }],
            },
          },
        },
      };

      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        stripe_customer_id: "cus_123",
        plans_tarifaires: { montant: 5000 },
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({});
      mockPrisma.echeances_paiement.create.mockResolvedValue({});

      await webhookService.handleSubscriptionCreated(createEvent as any);

      expect(mockPrisma.utilisateurs.update).toHaveBeenCalled();
      expect(mockMessageClient.sendTemplate).toHaveBeenCalled();

      // 2. Paiement de facture
      const invoiceEvent = {
        id: "evt_invoice_paid",
        type: "invoice.payment_succeeded",
        data: {
          object: {
            id: "in_123",
            subscription: "sub_123",
            customer: "cus_123",
            amount_paid: 5000,
            currency: "eur",
            status: "paid",
            payment_intent: "pi_123",
            lines: {
              data: [
                {
                  period: {
                    start: Math.floor(Date.now() / 1000),
                    end: Math.floor(Date.now() / 1000) + 2592000,
                  },
                },
              ],
            },
          },
        },
      };

      mockPrisma.paiements.create.mockResolvedValue({});

      await webhookService.handleInvoicePaymentSucceeded(invoiceEvent as any);

      expect(mockPrisma.paiements.create).toHaveBeenCalled();

      // 3. Annulation d'abonnement
      const deleteEvent = {
        id: "evt_sub_deleted",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            status: "canceled",
            canceled_at: Math.floor(Date.now() / 1000),
            items: {
              data: [{ price: { nickname: "Premium" } }],
            },
          },
        },
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        stripe_subscription_id: "sub_123",
      });
      mockPrisma.echeances_paiement.updateMany.mockResolvedValue({ count: 2 });

      await webhookService.handleSubscriptionDeleted(deleteEvent as any);

      expect(mockPrisma.utilisateurs.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stripe_subscription_id: null,
          active: false,
        },
      });
    });
  });
});
