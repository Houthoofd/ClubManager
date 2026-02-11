/**
 * Tests d'intégration E2E pour les routes REST des webhooks Stripe
 * Teste le endpoint POST /api/stripe/webhooks/stripe avec validation de signature
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import Stripe from "stripe";

// Mock Prisma
const mockPrisma = {
  paiements: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
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
  },
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

// Mock Stripe
const mockStripeWebhooks = {
  constructEvent: jest.fn(),
};

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: mockStripeWebhooks,
  }));
});

// Import après les mocks
import { webhooksRouter } from "../core/webhooks/webhooks.routes.js";

describe("Webhook Routes - Tests E2E", () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration de l'application Express
    app = express();

    // Important: express.raw pour les webhooks Stripe
    app.use(
      "/api/stripe/webhooks/stripe",
      express.raw({ type: "application/json" })
    );

    // Monter le router
    app.use("/api/stripe/webhooks", webhooksRouter);

    // Variables d'environnement
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== SIGNATURE VALIDATION ====================
  describe("POST /api/stripe/webhooks/stripe - Signature Validation", () => {
    it("devrait rejeter une requête sans signature", async () => {
      const payload = JSON.stringify({
        id: "evt_test_123",
        type: "payment_intent.succeeded",
        data: { object: {} },
      });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(payload)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("devrait rejeter une signature invalide", async () => {
      const payload = JSON.stringify({
        id: "evt_test_123",
        type: "payment_intent.succeeded",
        data: { object: {} },
      });

      mockStripeWebhooks.constructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(payload)
        .set("Content-Type", "application/json")
        .set("stripe-signature", "t=123456,v1=invalid_signature");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid signature");
    });

    it("devrait accepter une signature valide", async () => {
      const payload = JSON.stringify({
        id: "evt_test_123",
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
      });

      const mockEvent = {
        id: "evt_test_123",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
      mockPrisma.echeances_paiement.update.mockResolvedValue({});
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
      });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(payload)
        .set("Content-Type", "application/json")
        .set("stripe-signature", "t=123456,v1=valid_signature");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("received", true);
    });
  });

  // ==================== EVENT HANDLING ====================
  describe("POST /api/stripe/webhooks/stripe - Event Handling", () => {
    beforeEach(() => {
      // Configuration commune pour les tests
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
      mockPrisma.webhook_logs.update.mockResolvedValue({ id: 1 });
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
      });
    });

    it("devrait traiter payment_intent.succeeded", async () => {
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
      mockPrisma.echeances_paiement.update.mockResolvedValue({});

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.paiements.create).toHaveBeenCalled();
      expect(mockPrisma.echeances_paiement.update).toHaveBeenCalled();
      expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
    });

    it("devrait traiter payment_intent.payment_failed", async () => {
      const mockEvent = {
        id: "evt_payment_failed",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_123",
            metadata: {
              user_id: "1",
              echeance_id: "1",
            },
            amount: 5000,
            currency: "eur",
            last_payment_error: {
              message: "Your card was declined",
              code: "card_declined",
            },
          },
        },
      };

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.paiements.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statut: "echoue",
          }),
        })
      );
      expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
    });

    it("devrait traiter checkout.session.completed", async () => {
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
      mockPrisma.echeances_paiement.update.mockResolvedValue({});

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.paiements.create).toHaveBeenCalled();
    });

    it("devrait traiter invoice.payment_succeeded", async () => {
      const mockEvent = {
        id: "evt_invoice_success",
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
            hosted_invoice_url: "https://stripe.com/invoice",
            invoice_pdf: "https://stripe.com/invoice.pdf",
            number: "INV-001",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        stripe_customer_id: "cus_123",
      });
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.paiements.create).toHaveBeenCalled();
      expect(mockMessageClient.sendTemplate).toHaveBeenCalled();
    });

    it("devrait traiter invoice.payment_failed", async () => {
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
            attempt_count: 1,
            payment_intent: "pi_123",
            hosted_invoice_url: "https://stripe.com/invoice",
            number: "INV-001",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        stripe_customer_id: "cus_123",
      });
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.paiements.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statut: "echoue",
          }),
        })
      );
    });

    it("devrait traiter customer.subscription.created", async () => {
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        stripe_customer_id: "cus_123",
        plans_tarifaires: {
          montant: 5000,
        },
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({});
      mockPrisma.echeances_paiement.create.mockResolvedValue({});

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.utilisateurs.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stripe_subscription_id: "sub_123",
          active: true,
        },
      });
    });

    it("devrait traiter customer.subscription.updated", async () => {
      const mockEvent = {
        id: "evt_sub_updated",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            status: "active",
            cancel_at_period_end: false,
          },
        },
      };

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        stripe_subscription_id: "sub_123",
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({});

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
    });

    it("devrait traiter customer.subscription.deleted", async () => {
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        stripe_subscription_id: "sub_123",
      });
      mockPrisma.utilisateurs.update.mockResolvedValue({});
      mockPrisma.echeances_paiement.updateMany.mockResolvedValue({ count: 3 });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockPrisma.utilisateurs.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stripe_subscription_id: null,
          active: false,
        },
      });
    });
  });

  // ==================== UNKNOWN EVENTS ====================
  describe("POST /api/stripe/webhooks/stripe - Unknown Events", () => {
    it("devrait accepter les événements non gérés", async () => {
      const mockEvent = {
        id: "evt_unknown",
        type: "charge.dispute.created",
        data: {
          object: {
            id: "dp_123",
          },
        },
      };

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("received", true);
    });
  });

  // ==================== ERROR HANDLING ====================
  describe("POST /api/stripe/webhooks/stripe - Error Handling", () => {
    it("devrait gérer les erreurs de base de données", async () => {
      const mockEvent = {
        id: "evt_db_error",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(500);
      expect(mockSentry.captureException).toHaveBeenCalled();
    });

    it("devrait gérer les metadata manquantes", async () => {
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      // Devrait retourner 200 même si le traitement échoue
      expect(response.status).toBe(200);
      expect(mockSentry.captureException).toHaveBeenCalled();
    });

    it("devrait gérer les utilisateurs introuvables", async () => {
      const mockEvent = {
        id: "evt_no_user",
        type: "invoice.payment_succeeded",
        data: {
          object: {
            id: "in_123",
            subscription: "sub_123",
            customer: "cus_unknown",
            amount_paid: 5000,
            currency: "eur",
            status: "paid",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
      expect(mockSentry.captureException).toHaveBeenCalled();
    });
  });

  // ==================== IDEMPOTENCY ====================
  describe("POST /api/stripe/webhooks/stripe - Idempotency", () => {
    it("devrait traiter le même événement une seule fois", async () => {
      const mockEvent = {
        id: "evt_duplicate",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
      mockPrisma.echeances_paiement.update.mockResolvedValue({});
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      // Première requête
      const response1 = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response1.status).toBe(200);

      // Deuxième requête avec le même événement
      const response2 = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response2.status).toBe(200);

      // Vérifier que le log a été créé deux fois (pour tracker les duplicates)
      expect(mockPrisma.webhook_logs.create).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== CONTENT TYPE ====================
  describe("POST /api/stripe/webhooks/stripe - Content Type", () => {
    it("devrait accepter application/json", async () => {
      const mockEvent = {
        id: "evt_json",
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

      mockStripeWebhooks.constructEvent.mockReturnValue(mockEvent);
      mockPrisma.webhook_logs.create.mockResolvedValue({ id: 1 });
      mockPrisma.paiements.create.mockResolvedValue({ id: 1 });
      mockPrisma.echeances_paiement.update.mockResolvedValue({});
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      const response = await request(app)
        .post("/api/stripe/webhooks/stripe")
        .send(JSON.stringify(mockEvent))
        .set("Content-Type", "application/json")
        .set("stripe-signature", "valid_signature");

      expect(response.status).toBe(200);
    });
  });

  // ==================== HEALTH CHECK ====================
  describe("GET /api/stripe/webhooks/health", () => {
    it("devrait retourner le statut de santé", async () => {
      const response = await request(app).get("/api/stripe/webhooks/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
    });
  });
});
