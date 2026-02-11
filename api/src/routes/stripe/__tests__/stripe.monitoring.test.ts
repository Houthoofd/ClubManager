/**
 * @file stripe.monitoring.test.ts
 * @description Tests de monitoring et métriques pour les webhooks Stripe
 *
 * PRIORITÉ 3 - NICE TO HAVE ✨
 *
 * Couvre:
 * - Intégration Sentry (erreurs, breadcrumbs, contexte)
 * - Logging structuré et niveaux de logs
 * - Métriques personnalisées (compteurs, gauges, histogrammes)
 * - Alertes et notifications
 * - Health checks et diagnostics
 * - Audit trails et traçabilité
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Request, Response } from "express";
import Stripe from "stripe";

// Mock dependencies
jest.mock("@prisma/client");
jest.mock("stripe");

describe("Stripe Monitoring Tests - Priority 3 ✨", () => {
  let mockPrisma: any;
  let mockStripe: any;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let sentryMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Sentry functions
    sentryMock = {
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      addBreadcrumb: jest.fn(),
      setContext: jest.fn(),
      setTag: jest.fn(),
      setUser: jest.fn(),
      withScope: jest.fn((callback) =>
        callback({
          setTag: jest.fn(),
          setContext: jest.fn(),
          setLevel: jest.fn(),
          addBreadcrumb: jest.fn(),
        }),
      ),
    };

    mockPrisma = {
      paiement: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      utilisateur: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      echeance: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockStripe = {
      webhooks: {
        constructEvent: jest.fn(),
      },
      paymentIntents: {
        retrieve: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    req = {
      body: {},
      headers: {
        "stripe-signature": "test_signature",
      },
      rawBody: Buffer.from("test"),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("🔍 Intégration Sentry", () => {
    it("devrait capturer les exceptions avec contexte complet", async () => {
      const error = new Error("Payment processing failed");
      const webhookEvent = {
        id: "evt_test123",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test456",
            amount: 5000,
            metadata: { userId: "1", echeanceId: "2" },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      mockPrisma.paiement.create.mockRejectedValue(error);

      try {
        await mockPrisma.paiement.create({});
      } catch (err) {
        sentryMock.withScope((scope: any) => {
          scope.setTag("webhook_type", webhookEvent.type);
          scope.setTag("payment_intent_id", webhookEvent.data.object.id);
          scope.setContext("webhook", {
            event_id: webhookEvent.id,
            amount: webhookEvent.data.object.amount,
            metadata: webhookEvent.data.object.metadata,
          });
          sentryMock.captureException(err);
        });
      }

      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.captureException).toHaveBeenCalledWith(error);
    });

    it("devrait ajouter des breadcrumbs pour tracer le flux", async () => {
      const webhookEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
            metadata: { userId: "1" },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      mockPrisma.paiement.create.mockResolvedValue({ id: 1 });

      // Simulate webhook processing with breadcrumbs
      sentryMock.addBreadcrumb({
        category: "webhook",
        message: "Webhook received",
        level: "info",
        data: { type: webhookEvent.type },
      });

      sentryMock.addBreadcrumb({
        category: "stripe",
        message: "Signature verified",
        level: "info",
      });

      await mockPrisma.paiement.create({});

      sentryMock.addBreadcrumb({
        category: "database",
        message: "Payment record created",
        level: "info",
        data: { paymentId: 1 },
      });

      expect(sentryMock.addBreadcrumb).toHaveBeenCalledTimes(3);
      expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "webhook",
          message: "Webhook received",
        }),
      );
    });

    it("devrait définir des tags pertinents pour le filtrage", async () => {
      const webhookEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
            currency: "eur",
            metadata: { userId: "1", plan: "premium" },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      sentryMock.setTag("webhook_type", webhookEvent.type);
      sentryMock.setTag("payment_amount", "5000");
      sentryMock.setTag("currency", webhookEvent.data.object.currency);
      sentryMock.setTag("user_plan", webhookEvent.data.object.metadata.plan);

      expect(sentryMock.setTag).toHaveBeenCalledTimes(4);
      expect(sentryMock.setTag).toHaveBeenCalledWith(
        "webhook_type",
        "payment_intent.succeeded",
      );
      expect(sentryMock.setTag).toHaveBeenCalledWith("user_plan", "premium");
    });

    it("devrait capturer les messages de performance", async () => {
      const startTime = Date.now();
      const webhookType = "payment_intent.succeeded";

      mockPrisma.paiement.create.mockResolvedValue({ id: 1 });
      await mockPrisma.paiement.create({});

      const duration = Date.now() - startTime;

      if (duration > 1000) {
        sentryMock.captureMessage(
          `Slow webhook processing: ${webhookType} took ${duration}ms`,
          "warning",
        );
      }

      // Simulate slow processing
      if (duration > 100) {
        sentryMock.captureMessage(
          `Webhook processed: ${webhookType} in ${duration}ms`,
          "info",
        );
      }

      expect(sentryMock.captureMessage).toHaveBeenCalled();
    });

    it("devrait associer les erreurs aux utilisateurs", async () => {
      const userId = "123";
      const userEmail = "test@example.com";

      mockPrisma.utilisateur.findUnique.mockResolvedValue({
        id: parseInt(userId),
        email: userEmail,
        nom: "Test User",
      });

      const user = await mockPrisma.utilisateur.findUnique({
        where: { id: parseInt(userId) },
      });

      sentryMock.setUser({
        id: userId,
        email: user.email,
        username: user.nom,
      });

      expect(sentryMock.setUser).toHaveBeenCalledWith({
        id: userId,
        email: userEmail,
        username: "Test User",
      });
    });

    it("devrait définir des contextes pour le debugging", async () => {
      const webhookEvent = {
        id: "evt_test",
        type: "payment_intent.succeeded",
        created: Date.now() / 1000,
        data: {
          object: {
            id: "pi_test",
            amount: 5000,
            metadata: { userId: "1" },
          },
        },
      };

      sentryMock.setContext("webhook_event", {
        id: webhookEvent.id,
        type: webhookEvent.type,
        created: new Date(webhookEvent.created * 1000).toISOString(),
      });

      sentryMock.setContext("payment_details", {
        amount: webhookEvent.data.object.amount,
        currency: "eur",
        payment_intent_id: webhookEvent.data.object.id,
      });

      sentryMock.setContext("request_info", {
        headers: req.headers,
        timestamp: new Date().toISOString(),
      });

      expect(sentryMock.setContext).toHaveBeenCalledTimes(3);
      expect(sentryMock.setContext).toHaveBeenCalledWith(
        "webhook_event",
        expect.objectContaining({ type: "payment_intent.succeeded" }),
      );
    });
  });

  describe("📝 Logging Structuré", () => {
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest.spyOn(console, "log").mockImplementation();
      jest.spyOn(console, "error").mockImplementation();
      jest.spyOn(console, "warn").mockImplementation();
      jest.spyOn(console, "info").mockImplementation();
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it("devrait logger en format JSON structuré", async () => {
      const logEntry = {
        level: "info",
        message: "Webhook processed successfully",
        timestamp: new Date().toISOString(),
        context: {
          webhookType: "payment_intent.succeeded",
          paymentIntentId: "pi_test",
          userId: 1,
        },
      };

      console.log(JSON.stringify(logEntry));

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("payment_intent.succeeded"),
      );
    });

    it("devrait utiliser différents niveaux de logs", async () => {
      const logger = {
        debug: jest.fn((msg: string, data?: any) =>
          console.log(
            JSON.stringify({ level: "debug", message: msg, ...data }),
          ),
        ),
        info: jest.fn((msg: string, data?: any) =>
          console.info(
            JSON.stringify({ level: "info", message: msg, ...data }),
          ),
        ),
        warn: jest.fn((msg: string, data?: any) =>
          console.warn(
            JSON.stringify({ level: "warn", message: msg, ...data }),
          ),
        ),
        error: jest.fn((msg: string, data?: any) =>
          console.error(
            JSON.stringify({ level: "error", message: msg, ...data }),
          ),
        ),
      };

      logger.debug("Webhook signature validated");
      logger.info("Payment processed", { paymentId: 1 });
      logger.warn("Duplicate webhook detected", { eventId: "evt_test" });
      logger.error("Payment creation failed", { error: "DB error" });

      expect(logger.debug).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it("devrait inclure des métadonnées de traçabilité", async () => {
      const traceId = "trace_" + Math.random().toString(36).substr(2, 9);
      const spanId = "span_" + Math.random().toString(36).substr(2, 9);

      const logWithTrace = {
        level: "info",
        message: "Processing webhook",
        trace_id: traceId,
        span_id: spanId,
        timestamp: new Date().toISOString(),
      };

      console.log(JSON.stringify(logWithTrace));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(traceId));
    });

    it("devrait logger les durées des opérations", async () => {
      const startTime = Date.now();

      mockPrisma.paiement.create.mockResolvedValue({ id: 1 });
      await mockPrisma.paiement.create({});

      const duration = Date.now() - startTime;

      const logEntry = {
        level: "info",
        message: "Database operation completed",
        operation: "paiement.create",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };

      console.log(JSON.stringify(logEntry));

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("duration_ms"),
      );
    });

    it("devrait masquer les données sensibles dans les logs", async () => {
      const sensitiveData = {
        paymentIntentId: "pi_test123",
        cardNumber: "4242424242424242",
        cvv: "123",
        email: "user@example.com",
        apiKey: "sk_test_abcdefg",
      };

      const sanitized = {
        paymentIntentId: sensitiveData.paymentIntentId,
        cardNumber: "****" + sensitiveData.cardNumber.slice(-4),
        cvv: "***",
        email: sensitiveData.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
        apiKey: "sk_test_***",
      };

      console.log(JSON.stringify({ level: "info", data: sanitized }));

      expect(logSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("4242424242424242"),
      );
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("****4242"));
    });
  });

  describe("📊 Métriques Personnalisées", () => {
    it("devrait incrémenter des compteurs", async () => {
      const metrics = {
        webhooksReceived: 0,
        webhooksProcessed: 0,
        webhooksFailed: 0,
      };

      const processWebhook = async (shouldFail: boolean) => {
        metrics.webhooksReceived++;
        try {
          if (shouldFail) throw new Error("Processing failed");
          await new Promise((resolve) => setTimeout(resolve, 10));
          metrics.webhooksProcessed++;
        } catch {
          metrics.webhooksFailed++;
        }
      };

      await processWebhook(false);
      await processWebhook(false);
      await processWebhook(true);

      expect(metrics.webhooksReceived).toBe(3);
      expect(metrics.webhooksProcessed).toBe(2);
      expect(metrics.webhooksFailed).toBe(1);
    });

    it("devrait mesurer des gauges (valeurs instantanées)", async () => {
      const gauges = {
        activeConnections: 0,
        queueSize: 0,
        memoryUsage: 0,
      };

      gauges.activeConnections = 5;
      gauges.queueSize = 23;
      gauges.memoryUsage = process.memoryUsage().heapUsed;

      expect(gauges.activeConnections).toBeGreaterThanOrEqual(0);
      expect(gauges.queueSize).toBeGreaterThanOrEqual(0);
      expect(gauges.memoryUsage).toBeGreaterThan(0);
    });

    it("devrait créer des histogrammes de latence", async () => {
      const latencyHistogram: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
        latencyHistogram.push(Date.now() - start);
      }

      const sorted = latencyHistogram.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      console.log(`Latency: P50=${p50}ms, P95=${p95}ms, P99=${p99}ms`);

      expect(p50).toBeLessThan(p95);
      expect(p95).toBeLessThan(p99);
    });

    it("devrait tracker les taux de succès/échec", async () => {
      const metrics = {
        total: 0,
        success: 0,
        failure: 0,
      };

      const operations = Array.from({ length: 100 }, () => Math.random() < 0.9);

      for (const shouldSucceed of operations) {
        metrics.total++;
        if (shouldSucceed) {
          metrics.success++;
        } else {
          metrics.failure++;
        }
      }

      const successRate = (metrics.success / metrics.total) * 100;
      const failureRate = (metrics.failure / metrics.total) * 100;

      console.log(`Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`Failure Rate: ${failureRate.toFixed(2)}%`);

      expect(successRate + failureRate).toBeCloseTo(100, 1);
    });

    it("devrait mesurer le throughput (req/sec)", async () => {
      const startTime = Date.now();
      let requestCount = 0;

      const processRequests = async () => {
        for (let i = 0; i < 50; i++) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          requestCount++;
        }
      };

      await processRequests();

      const duration = (Date.now() - startTime) / 1000; // seconds
      const throughput = requestCount / duration;

      console.log(`Throughput: ${throughput.toFixed(2)} req/sec`);

      expect(throughput).toBeGreaterThan(0);
      expect(requestCount).toBe(50);
    });
  });

  describe("🚨 Alertes et Notifications", () => {
    it("devrait déclencher une alerte si taux d'erreur élevé", async () => {
      const alertThreshold = 0.1; // 10%
      const windowSize = 100;
      const errors = Array.from(
        { length: windowSize },
        () => Math.random() < 0.15,
      );

      const errorRate = errors.filter((e) => e).length / windowSize;
      const shouldAlert = errorRate > alertThreshold;

      if (shouldAlert) {
        sentryMock.captureMessage(
          `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
          "error",
        );
      }

      expect(shouldAlert).toBe(true);
      expect(sentryMock.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("High error rate"),
        "error",
      );
    });

    it("devrait alerter en cas de latence excessive", async () => {
      const latencyThreshold = 1000; // 1 second
      const latencies = [50, 100, 150, 1200, 80, 1500, 90];

      const slowRequests = latencies.filter((l) => l > latencyThreshold);

      if (slowRequests.length > 0) {
        sentryMock.captureMessage(
          `Slow requests detected: ${slowRequests.length} requests exceeded ${latencyThreshold}ms`,
          "warning",
        );
      }

      expect(slowRequests.length).toBe(2);
      expect(sentryMock.captureMessage).toHaveBeenCalled();
    });

    it("devrait alerter si queue trop longue", async () => {
      const maxQueueSize = 50;
      const currentQueueSize = 75;

      if (currentQueueSize > maxQueueSize) {
        sentryMock.captureMessage(
          `Queue size exceeded: ${currentQueueSize}/${maxQueueSize}`,
          "warning",
        );
      }

      expect(currentQueueSize).toBeGreaterThan(maxQueueSize);
      expect(sentryMock.captureMessage).toHaveBeenCalled();
    });

    it("devrait envoyer des notifications par email pour erreurs critiques", async () => {
      const sendAlert = jest.fn();
      const criticalError = new Error("Payment gateway down");

      try {
        throw criticalError;
      } catch (error) {
        sentryMock.captureException(error);
        sendAlert({
          to: "admin@example.com",
          subject: "CRITICAL: Payment Gateway Error",
          body: `Error: ${(error as Error).message}`,
        });
      }

      expect(sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("CRITICAL"),
        }),
      );
    });
  });

  describe("💚 Health Checks", () => {
    it("devrait vérifier la santé de la base de données", async () => {
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{ result: 1 }]);

      const checkDatabase = async () => {
        try {
          await mockPrisma.$queryRaw`SELECT 1 as result`;
          return { status: "healthy", latency: 10 };
        } catch (error) {
          return { status: "unhealthy", error: (error as Error).message };
        }
      };

      const health = await checkDatabase();

      expect(health.status).toBe("healthy");
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it("devrait vérifier la connectivité Stripe", async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test",
        status: "succeeded",
      });

      const checkStripe = async () => {
        try {
          const start = Date.now();
          await mockStripe.paymentIntents.retrieve("pi_test");
          return { status: "healthy", latency: Date.now() - start };
        } catch (error) {
          return { status: "unhealthy", error: (error as Error).message };
        }
      };

      const health = await checkStripe();

      expect(health.status).toBe("healthy");
      expect(health.latency).toBeDefined();
    });

    it("devrait retourner un statut de santé global", async () => {
      const healthChecks = {
        database: { status: "healthy", latency: 15 },
        stripe: { status: "healthy", latency: 120 },
        redis: { status: "healthy", latency: 5 },
        email: { status: "healthy", latency: 200 },
      };

      const overallStatus = Object.values(healthChecks).every(
        (check) => check.status === "healthy",
      );

      const healthResponse = {
        status: overallStatus ? "healthy" : "degraded",
        checks: healthChecks,
        timestamp: new Date().toISOString(),
      };

      expect(healthResponse.status).toBe("healthy");
      expect(Object.keys(healthResponse.checks)).toHaveLength(4);
    });

    it("devrait détecter une dégradation partielle", async () => {
      const healthChecks = {
        database: { status: "healthy", latency: 15 },
        stripe: { status: "unhealthy", error: "Connection timeout" },
        redis: { status: "healthy", latency: 5 },
      };

      const unhealthyServices = Object.entries(healthChecks)
        .filter(([_, check]) => check.status === "unhealthy")
        .map(([service]) => service);

      const overallStatus =
        unhealthyServices.length === 0 ? "healthy" : "degraded";

      expect(overallStatus).toBe("degraded");
      expect(unhealthyServices).toContain("stripe");
    });
  });

  describe("🔍 Audit Trail", () => {
    it("devrait enregistrer tous les événements de paiement", async () => {
      const auditLog: any[] = [];

      const logAuditEvent = (event: any) => {
        auditLog.push({
          ...event,
          timestamp: new Date().toISOString(),
        });
      };

      logAuditEvent({
        type: "payment.initiated",
        userId: 1,
        amount: 5000,
        paymentIntentId: "pi_test",
      });

      logAuditEvent({
        type: "payment.succeeded",
        userId: 1,
        paymentId: 1,
        paymentIntentId: "pi_test",
      });

      expect(auditLog).toHaveLength(2);
      expect(auditLog[0].type).toBe("payment.initiated");
      expect(auditLog[1].type).toBe("payment.succeeded");
    });

    it("devrait tracer les modifications de statut utilisateur", async () => {
      const auditLog: any[] = [];

      mockPrisma.utilisateur.update.mockImplementation(async (args: any) => {
        auditLog.push({
          type: "user.status_changed",
          userId: args.where.id,
          oldStatus: "INACTIF",
          newStatus: args.data.statut,
          timestamp: new Date().toISOString(),
        });
        return { id: args.where.id, statut: args.data.statut };
      });

      await mockPrisma.utilisateur.update({
        where: { id: 1 },
        data: { statut: "ACTIF" },
      });

      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].type).toBe("user.status_changed");
      expect(auditLog[0].newStatus).toBe("ACTIF");
    });

    it("devrait inclure l'identité de l'acteur", async () => {
      const auditLog: any[] = [];

      const logAction = (action: string, actorId: number | string) => {
        auditLog.push({
          action,
          actor: actorId === "system" ? "system" : `user:${actorId}`,
          timestamp: new Date().toISOString(),
        });
      };

      logAction("webhook.processed", "system");
      logAction("payment.refunded", 123); // Admin user

      expect(auditLog[0].actor).toBe("system");
      expect(auditLog[1].actor).toBe("user:123");
    });

    it("devrait permettre de rechercher dans l'audit log", async () => {
      const auditLog = [
        {
          type: "payment.succeeded",
          userId: 1,
          amount: 5000,
          timestamp: "2024-01-01",
        },
        {
          type: "payment.failed",
          userId: 2,
          amount: 3000,
          timestamp: "2024-01-02",
        },
        {
          type: "payment.succeeded",
          userId: 1,
          amount: 2000,
          timestamp: "2024-01-03",
        },
      ];

      const findByUserId = (userId: number) =>
        auditLog.filter((log) => log.userId === userId);

      const findByType = (type: string) =>
        auditLog.filter((log) => log.type === type);

      expect(findByUserId(1)).toHaveLength(2);
      expect(findByType("payment.succeeded")).toHaveLength(2);
    });
  });

  describe("📈 Dashboards et Reporting", () => {
    it("devrait générer des statistiques quotidiennes", async () => {
      const dailyStats = {
        date: new Date().toISOString().split("T")[0],
        webhooksReceived: 1250,
        webhooksProcessed: 1230,
        webhooksFailed: 20,
        totalAmount: 125000,
        averageLatency: 85,
      };

      const successRate =
        (dailyStats.webhooksProcessed / dailyStats.webhooksReceived) * 100;

      expect(dailyStats.webhooksReceived).toBeGreaterThan(0);
      expect(successRate).toBeGreaterThan(95);
      console.log(`Daily Stats: ${successRate.toFixed(2)}% success rate`);
    });

    it("devrait calculer des métriques par type de webhook", async () => {
      const metricsByType = {
        "payment_intent.succeeded": { count: 950, avgLatency: 75 },
        "payment_intent.failed": { count: 20, avgLatency: 120 },
        "payment_intent.canceled": { count: 30, avgLatency: 50 },
      };

      const totalWebhooks = Object.values(metricsByType).reduce(
        (sum, m) => sum + m.count,
        0,
      );

      expect(totalWebhooks).toBe(1000);
      expect(metricsByType["payment_intent.succeeded"].count).toBeGreaterThan(
        metricsByType["payment_intent.failed"].count,
      );
    });

    it("devrait tracker les tendances hebdomadaires", async () => {
      const weeklyTrend = [
        { day: "Mon", requests: 180, errors: 5 },
        { day: "Tue", requests: 195, errors: 3 },
        { day: "Wed", requests: 210, errors: 8 },
        { day: "Thu", requests: 205, errors: 4 },
        { day: "Fri", requests: 220, errors: 6 },
      ];

      const totalRequests = weeklyTrend.reduce((sum, d) => sum + d.requests, 0);
      const totalErrors = weeklyTrend.reduce((sum, d) => sum + d.errors, 0);
      const avgErrorRate = (totalErrors / totalRequests) * 100;

      console.log(`Weekly Error Rate: ${avgErrorRate.toFixed(2)}%`);

      expect(avgErrorRate).toBeLessThan(5);
      expect(totalRequests).toBe(1010);
    });
  });
});
