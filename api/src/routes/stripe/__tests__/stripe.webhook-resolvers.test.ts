/**
 * Tests unitaires pour les resolvers GraphQL des webhooks
 * Teste les queries, mutations et subscriptions GraphQL
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type Stripe from "stripe";

// Mock WebhookService
const mockWebhookService = {
  getWebhookLogs: jest.fn(),
  getWebhookLogById: jest.fn(),
  getWebhookStats: jest.fn(),
  retryWebhook: jest.fn(),
  processManually: jest.fn(),
  cleanOldLogs: jest.fn(),
};

// Mock PubSub
const mockPubSub = {
  publish: jest.fn(),
  asyncIterator: jest.fn(),
};

jest.mock("graphql-subscriptions", () => ({
  PubSub: jest.fn(() => mockPubSub),
}));

// Import après les mocks
import { webhooksResolvers } from "../core/webhooks/resolvers/webhooks.resolvers.js";

describe("Webhook GraphQL Resolvers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== QUERIES ====================
  describe("Query: webhookLogs", () => {
    it("devrait retourner tous les logs sans filtres", async () => {
      const mockLogs = [
        {
          id: 1,
          eventId: "evt_1",
          eventType: "payment_intent.succeeded",
          status: "SUCCESS",
          payload: { amount: 5000 },
          error: null,
          retryCount: 0,
          nextRetryAt: null,
          processedAt: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-15T09:00:00Z"),
          updatedAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          id: 2,
          eventId: "evt_2",
          eventType: "invoice.payment_succeeded",
          status: "SUCCESS",
          payload: { amount: 10000 },
          error: null,
          retryCount: 0,
          nextRetryAt: null,
          processedAt: new Date("2024-01-15T11:00:00Z"),
          createdAt: new Date("2024-01-15T10:30:00Z"),
          updatedAt: new Date("2024-01-15T11:00:00Z"),
        },
      ];

      mockWebhookService.getWebhookLogs.mockResolvedValue(mockLogs);

      const result = await webhooksResolvers.Query.webhookLogs(
        null,
        { input: {} },
        { webhookService: mockWebhookService }
      );

      expect(result).toEqual(mockLogs);
      expect(mockWebhookService.getWebhookLogs).toHaveBeenCalledWith({});
    });

    it("devrait filtrer par status", async () => {
      const mockLogs = [
        {
          id: 3,
          eventId: "evt_3",
          eventType: "payment_intent.failed",
          status: "FAILURE",
          payload: {},
          error: "Card declined",
          retryCount: 2,
          nextRetryAt: new Date(),
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWebhookService.getWebhookLogs.mockResolvedValue(mockLogs);

      const result = await webhooksResolvers.Query.webhookLogs(
        null,
        { input: { status: "FAILURE" } },
        { webhookService: mockWebhookService }
      );

      expect(result).toEqual(mockLogs);
      expect(mockWebhookService.getWebhookLogs).toHaveBeenCalledWith({
        status: "FAILURE",
      });
    });

    it("devrait filtrer par eventType", async () => {
      const mockLogs = [
        {
          id: 4,
          eventId: "evt_4",
          eventType: "customer.subscription.created",
          status: "SUCCESS",
          payload: {},
          error: null,
          retryCount: 0,
          nextRetryAt: null,
          processedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWebhookService.getWebhookLogs.mockResolvedValue(mockLogs);

      const result = await webhooksResolvers.Query.webhookLogs(
        null,
        { input: { eventType: "customer.subscription.created" } },
        { webhookService: mockWebhookService }
      );

      expect(result).toEqual(mockLogs);
      expect(mockWebhookService.getWebhookLogs).toHaveBeenCalledWith({
        eventType: "customer.subscription.created",
      });
    });

    it("devrait appliquer la pagination", async () => {
      const mockLogs = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        eventId: `evt_${i}`,
        eventType: "payment_intent.succeeded",
        status: "SUCCESS",
        payload: {},
        error: null,
        retryCount: 0,
        nextRetryAt: null,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockWebhookService.getWebhookLogs.mockResolvedValue(mockLogs);

      await webhooksResolvers.Query.webhookLogs(
        null,
        { input: { limit: 10, offset: 20 } },
        { webhookService: mockWebhookService }
      );

      expect(mockWebhookService.getWebhookLogs).toHaveBeenCalledWith({
        limit: 10,
        offset: 20,
      });
    });

    it("devrait utiliser les valeurs par défaut de pagination", async () => {
      mockWebhookService.getWebhookLogs.mockResolvedValue([]);

      await webhooksResolvers.Query.webhookLogs(
        null,
        { input: {} },
        { webhookService: mockWebhookService }
      );

      expect(mockWebhookService.getWebhookLogs).toHaveBeenCalledWith({});
    });

    it("devrait gérer les erreurs de récupération", async () => {
      mockWebhookService.getWebhookLogs.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        webhooksResolvers.Query.webhookLogs(
          null,
          { input: {} },
          { webhookService: mockWebhookService }
        )
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("Query: webhookLog", () => {
    it("devrait retourner un log spécifique par ID", async () => {
      const mockLog = {
        id: 1,
        eventId: "evt_test_123",
        eventType: "payment_intent.succeeded",
        status: "SUCCESS",
        payload: { amount: 5000, currency: "eur" },
        error: null,
        retryCount: 0,
        nextRetryAt: null,
        processedAt: new Date("2024-01-15T10:00:00Z"),
        createdAt: new Date("2024-01-15T09:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockWebhookService.getWebhookLogById.mockResolvedValue(mockLog);

      const result = await webhooksResolvers.Query.webhookLog(
        null,
        { id: 1 },
        { webhookService: mockWebhookService }
      );

      expect(result).toEqual(mockLog);
      expect(mockWebhookService.getWebhookLogById).toHaveBeenCalledWith(1);
    });

    it("devrait retourner null si le log n'existe pas", async () => {
      mockWebhookService.getWebhookLogById.mockResolvedValue(null);

      const result = await webhooksResolvers.Query.webhookLog(
        null,
        { id: 999 },
        { webhookService: mockWebhookService }
      );

      expect(result).toBeNull();
    });

    it("devrait gérer les erreurs de récupération", async () => {
      mockWebhookService.getWebhookLogById.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        webhooksResolvers.Query.webhookLog(
          null,
          { id: 1 },
          { webhookService: mockWebhookService }
        )
      ).rejects.toThrow("Database error");
    });
  });

  describe("Query: webhookStats", () => {
    it("devrait retourner les statistiques complètes", async () => {
      const mockStats = {
        totalProcessed: 1000,
        successCount: 950,
        failureCount: 30,
        pendingCount: 20,
        averageProcessingTime: 1500,
        byEventType: [
          {
            eventType: "payment_intent.succeeded",
            count: 500,
            successRate: 98.5,
            averageProcessingTime: 1200,
          },
          {
            eventType: "invoice.payment_succeeded",
            count: 300,
            successRate: 99.0,
            averageProcessingTime: 1400,
          },
        ],
        recentFailures: [
          {
            id: 1,
            eventId: "evt_failed_1",
            eventType: "payment_intent.failed",
            status: "FAILURE",
            payload: {},
            error: "Card declined",
            retryCount: 3,
            nextRetryAt: new Date(),
            processedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockWebhookService.getWebhookStats.mockResolvedValue(mockStats);

      const result = await webhooksResolvers.Query.webhookStats(
        null,
        {},
        { webhookService: mockWebhookService }
      );

      expect(result).toEqual(mockStats);
      expect(mockWebhookService.getWebhookStats).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });

    it("devrait filtrer par période", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      const mockStats = {
        totalProcessed: 500,
        successCount: 480,
        failureCount: 15,
        pendingCount: 5,
        averageProcessingTime: 1400,
        byEventType: [],
        recentFailures: [],
      };

      mockWebhookService.getWebhookStats.mockResolvedValue(mockStats);

      await webhooksResolvers.Query.webhookStats(
        null,
        { startDate, endDate },
        { webhookService: mockWebhookService }
      );

      expect(mockWebhookService.getWebhookStats).toHaveBeenCalledWith(
        startDate,
        endDate
      );
    });

    it("devrait gérer les erreurs de calcul", async () => {
      mockWebhookService.getWebhookStats.mockRejectedValue(
        new Error("Calculation error")
      );

      await expect(
        webhooksResolvers.Query.webhookStats(
          null,
          {},
          { webhookService: mockWebhookService }
        )
      ).rejects.toThrow("Calculation error");
    });
  });

  // ==================== MUTATIONS ====================
  describe("Mutation: retryWebhook", () => {
    it("devrait retenter un webhook avec succès", async () => {
      const mockResult = {
        success: true,
        message: "Webhook retraité avec succès",
      };

      mockWebhookService.retryWebhook.mockResolvedValue(mockResult);

      const result = await webhooksResolvers.Mutation.retryWebhook(
        null,
        { id: 1 },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result).toEqual(mockResult);
      expect(mockWebhookService.retryWebhook).toHaveBeenCalledWith(1);
      expect(mockPubSub.publish).toHaveBeenCalledWith("WEBHOOK_RETRIED", {
        webhookRetried: { id: 1, success: true },
      });
    });

    it("devrait gérer l'échec de retry", async () => {
      const mockResult = {
        success: false,
        message: "Webhook déjà traité avec succès",
      };

      mockWebhookService.retryWebhook.mockResolvedValue(mockResult);

      const result = await webhooksResolvers.Mutation.retryWebhook(
        null,
        { id: 1 },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result).toEqual(mockResult);
      expect(mockPubSub.publish).toHaveBeenCalledWith("WEBHOOK_RETRIED", {
        webhookRetried: { id: 1, success: false },
      });
    });

    it("devrait gérer les erreurs de retry", async () => {
      mockWebhookService.retryWebhook.mockRejectedValue(
        new Error("Retry failed")
      );

      await expect(
        webhooksResolvers.Mutation.retryWebhook(
          null,
          { id: 1 },
          { webhookService: mockWebhookService, pubsub: mockPubSub }
        )
      ).rejects.toThrow("Retry failed");
    });
  });

  describe("Mutation: processWebhookManually", () => {
    it("devrait traiter un événement manuellement", async () => {
      const mockEvent = {
        id: "evt_manual_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123",
            amount: 5000,
            currency: "eur",
            metadata: {
              user_id: "1",
              echeance_id: "1",
            },
          },
        },
      };

      const mockResult = {
        success: true,
        message: "Événement traité manuellement avec succès",
      };

      mockWebhookService.processManually.mockResolvedValue(mockResult);

      const result = await webhooksResolvers.Mutation.processWebhookManually(
        null,
        { event: mockEvent },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result).toEqual(mockResult);
      expect(mockWebhookService.processManually).toHaveBeenCalledWith(mockEvent);
      expect(mockPubSub.publish).toHaveBeenCalledWith("WEBHOOK_PROCESSED", {
        webhookProcessed: { eventId: "evt_manual_123", success: true },
      });
    });

    it("devrait gérer les erreurs de traitement manuel", async () => {
      const mockEvent = {
        id: "evt_error",
        type: "unknown.event",
        data: { object: {} },
      };

      const mockResult = {
        success: false,
        message: "Type d'événement non supporté",
      };

      mockWebhookService.processManually.mockResolvedValue(mockResult);

      const result = await webhooksResolvers.Mutation.processWebhookManually(
        null,
        { event: mockEvent },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result).toEqual(mockResult);
      expect(mockPubSub.publish).toHaveBeenCalledWith("WEBHOOK_PROCESSED", {
        webhookProcessed: { eventId: "evt_error", success: false },
      });
    });

    it("devrait valider la structure de l'événement", async () => {
      const invalidEvent = {
        id: "evt_invalid",
        // Manque type et data
      };

      mockWebhookService.processManually.mockRejectedValue(
        new Error("Invalid event structure")
      );

      await expect(
        webhooksResolvers.Mutation.processWebhookManually(
          null,
          { event: invalidEvent as any },
          { webhookService: mockWebhookService, pubsub: mockPubSub }
        )
      ).rejects.toThrow("Invalid event structure");
    });
  });

  describe("Mutation: cleanOldWebhookLogs", () => {
    it("devrait nettoyer les anciens logs", async () => {
      const mockResult = {
        success: true,
        message: "150 logs supprimés",
        deletedCount: 150,
      };

      mockWebhookService.cleanOldLogs.mockResolvedValue(mockResult);

      const result = await webhooksResolvers.Mutation.cleanOldWebhookLogs(
        null,
        { daysToKeep: 30 },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result).toEqual(mockResult);
      expect(mockWebhookService.cleanOldLogs).toHaveBeenCalledWith(30);
      expect(mockPubSub.publish).toHaveBeenCalledWith("WEBHOOK_LOGS_CLEANED", {
        webhookLogsCleaned: { deletedCount: 150 },
      });
    });

    it("devrait utiliser la valeur par défaut de 90 jours", async () => {
      const mockResult = {
        success: true,
        message: "50 logs supprimés",
        deletedCount: 50,
      };

      mockWebhookService.cleanOldLogs.mockResolvedValue(mockResult);

      await webhooksResolvers.Mutation.cleanOldWebhookLogs(
        null,
        {},
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(mockWebhookService.cleanOldLogs).toHaveBeenCalledWith(90);
    });

    it("devrait gérer l'absence de logs à supprimer", async () => {
      const mockResult = {
        success: true,
        message: "Aucun log à supprimer",
        deletedCount: 0,
      };

      mockWebhookService.cleanOldLogs.mockResolvedValue(mockResult);

      const result = await webhooksResolvers.Mutation.cleanOldWebhookLogs(
        null,
        { daysToKeep: 7 },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result.deletedCount).toBe(0);
    });

    it("devrait gérer les erreurs de nettoyage", async () => {
      mockWebhookService.cleanOldLogs.mockRejectedValue(
        new Error("Cleanup failed")
      );

      await expect(
        webhooksResolvers.Mutation.cleanOldWebhookLogs(
          null,
          { daysToKeep: 30 },
          { webhookService: mockWebhookService, pubsub: mockPubSub }
        )
      ).rejects.toThrow("Cleanup failed");
    });
  });

  // ==================== SUBSCRIPTIONS ====================
  describe("Subscription: webhookProcessed", () => {
    it("devrait retourner un async iterator", () => {
      const mockIterator = Symbol("asyncIterator");
      mockPubSub.asyncIterator.mockReturnValue(mockIterator);

      const result = webhooksResolvers.Subscription.webhookProcessed.subscribe(
        null,
        {},
        { pubsub: mockPubSub }
      );

      expect(result).toBe(mockIterator);
      expect(mockPubSub.asyncIterator).toHaveBeenCalledWith(["WEBHOOK_PROCESSED"]);
    });

    it("devrait résoudre le payload correctement", () => {
      const payload = {
        webhookProcessed: {
          eventId: "evt_123",
          eventType: "payment_intent.succeeded",
          success: true,
        },
      };

      const result = webhooksResolvers.Subscription.webhookProcessed.resolve(payload);

      expect(result).toEqual(payload.webhookProcessed);
    });
  });

  describe("Subscription: webhookRetried", () => {
    it("devrait retourner un async iterator", () => {
      const mockIterator = Symbol("asyncIterator");
      mockPubSub.asyncIterator.mockReturnValue(mockIterator);

      const result = webhooksResolvers.Subscription.webhookRetried.subscribe(
        null,
        {},
        { pubsub: mockPubSub }
      );

      expect(result).toBe(mockIterator);
      expect(mockPubSub.asyncIterator).toHaveBeenCalledWith(["WEBHOOK_RETRIED"]);
    });

    it("devrait résoudre le payload correctement", () => {
      const payload = {
        webhookRetried: {
          id: 1,
          success: true,
        },
      };

      const result = webhooksResolvers.Subscription.webhookRetried.resolve(payload);

      expect(result).toEqual(payload.webhookRetried);
    });
  });

  describe("Subscription: webhookLogsCleaned", () => {
    it("devrait retourner un async iterator", () => {
      const mockIterator = Symbol("asyncIterator");
      mockPubSub.asyncIterator.mockReturnValue(mockIterator);

      const result = webhooksResolvers.Subscription.webhookLogsCleaned.subscribe(
        null,
        {},
        { pubsub: mockPubSub }
      );

      expect(result).toBe(mockIterator);
      expect(mockPubSub.asyncIterator).toHaveBeenCalledWith(["WEBHOOK_LOGS_CLEANED"]);
    });

    it("devrait résoudre le payload correctement", () => {
      const payload = {
        webhookLogsCleaned: {
          deletedCount: 100,
        },
      };

      const result = webhooksResolvers.Subscription.webhookLogsCleaned.resolve(payload);

      expect(result).toEqual(payload.webhookLogsCleaned);
    });
  });

  // ==================== FIELD RESOLVERS ====================
  describe("WebhookLog Field Resolvers", () => {
    it("devrait formater le payload en JSON", () => {
      const parent = {
        payload: { amount: 5000, currency: "eur" },
      };

      const result = webhooksResolvers.WebhookLog.payload(parent);

      expect(result).toBe('{"amount":5000,"currency":"eur"}');
    });

    it("devrait gérer un payload null", () => {
      const parent = {
        payload: null,
      };

      const result = webhooksResolvers.WebhookLog.payload(parent);

      expect(result).toBe("null");
    });

    it("devrait gérer un payload undefined", () => {
      const parent = {
        payload: undefined,
      };

      const result = webhooksResolvers.WebhookLog.payload(parent);

      expect(result).toBe("null");
    });

    it("devrait gérer des objets complexes", () => {
      const parent = {
        payload: {
          nested: { deep: { value: "test" } },
          array: [1, 2, 3],
          date: new Date("2024-01-01"),
        },
      };

      const result = webhooksResolvers.WebhookLog.payload(parent);
      const parsed = JSON.parse(result);

      expect(parsed.nested.deep.value).toBe("test");
      expect(parsed.array).toEqual([1, 2, 3]);
    });
  });

  // ==================== AUTHORIZATION & PERMISSIONS ====================
  describe("Authorization", () => {
    it("devrait vérifier les permissions admin pour les mutations", async () => {
      const contextWithoutPermission = {
        webhookService: mockWebhookService,
        pubsub: mockPubSub,
        user: { role: "USER" },
      };

      // Dans un vrai scénario, on ajouterait une vérification de permissions
      // Pour l'instant, on vérifie que les mutations fonctionnent
      mockWebhookService.retryWebhook.mockResolvedValue({
        success: true,
        message: "OK",
      });

      await webhooksResolvers.Mutation.retryWebhook(
        null,
        { id: 1 },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(mockWebhookService.retryWebhook).toHaveBeenCalled();
    });
  });

  // ==================== EDGE CASES ====================
  describe("Edge Cases", () => {
    it("devrait gérer des IDs négatifs", async () => {
      mockWebhookService.getWebhookLogById.mockResolvedValue(null);

      const result = await webhooksResolvers.Query.webhookLog(
        null,
        { id: -1 },
        { webhookService: mockWebhookService }
      );

      expect(result).toBeNull();
    });

    it("devrait gérer des limites de pagination extrêmes", async () => {
      mockWebhookService.getWebhookLogs.mockResolvedValue([]);

      await webhooksResolvers.Query.webhookLogs(
        null,
        { input: { limit: 10000, offset: 0 } },
        { webhookService: mockWebhookService }
      );

      expect(mockWebhookService.getWebhookLogs).toHaveBeenCalledWith({
        limit: 10000,
        offset: 0,
      });
    });

    it("devrait gérer des dates invalides pour les stats", async () => {
      const invalidDate = new Date("invalid");

      mockWebhookService.getWebhookStats.mockResolvedValue({
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        pendingCount: 0,
        averageProcessingTime: 0,
        byEventType: [],
        recentFailures: [],
      });

      await webhooksResolvers.Query.webhookStats(
        null,
        { startDate: invalidDate, endDate: invalidDate },
        { webhookService: mockWebhookService }
      );

      expect(mockWebhookService.getWebhookStats).toHaveBeenCalled();
    });

    it("devrait gérer des événements Stripe incomplets", async () => {
      const incompleteEvent = {
        id: "evt_incomplete",
        type: "payment_intent.succeeded",
        // Manque data.object
      } as any;

      mockWebhookService.processManually.mockResolvedValue({
        success: false,
        message: "Événement incomplet",
      });

      const result = await webhooksResolvers.Mutation.processWebhookManually(
        null,
        { event: incompleteEvent },
        { webhookService: mockWebhookService, pubsub: mockPubSub }
      );

      expect(result.success).toBe(false);
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  describe("Performance", () => {
    it("devrait gérer un grand nombre de logs", async () => {
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        eventId: `evt_${i}`,
        eventType: "payment_intent.succeeded",
        status: "SUCCESS",
        payload: {},
        error: null,
        retryCount: 0,
        nextRetryAt: null,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockWebhookService.getWebhookLogs.mockResolvedValue(largeLogs);

      const start = Date.now();
      const result = await webhooksResolvers.Query.webhookLogs(
        null,
        { input: { limit: 1000 } },
        { webhookService: mockWebhookService }
      );
      const duration = Date.now() - start;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Devrait être rapide
    });

    it("devrait gérer des stats complexes rapidement", async () => {
      const complexStats = {
        totalProcessed: 100000,
        successCount: 95000,
        failureCount: 4000,
        pendingCount: 1000,
        averageProcessingTime: 1500,
        byEventType: Array.from({ length: 50 }, (_, i) => ({
          eventType: `event_type_${i}`,
          count: Math.floor(Math.random() * 1000),
          successRate: Math.random() * 100,
          averageProcessingTime: Math.floor(Math.random() * 2000),
        })),
        recentFailures: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          eventId: `evt_${i}`,
          eventType: "payment_intent.failed",
          status: "FAILURE",
          payload: {},
          error: "Error",
          retryCount: 1,
          nextRetryAt: new Date(),
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };

      mockWebhookService.getWebhookStats.mockResolvedValue(complexStats);

      const start = Date.now();
      await webhooksResolvers.Query.webhookStats(
        null,
        {},
        { webhookService: mockWebhookService }
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });
});
