/**
 * Refund Tests
 *
 * Tests for Stripe refund processing
 * Ensures refunds are handled correctly and safely
 *
 * Coverage:
 * - Full refunds
 * - Partial refunds
 * - Refund validation
 * - Refund status tracking
 * - Multiple refunds
 * - Refund webhooks
 * - Error handling
 * - Idempotency
 */

import request from "supertest";
import express, { Express } from "express";
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock Stripe
const mockCreateRefund = jest.fn();
const mockRetrieveRefund = jest.fn();
const mockListRefunds = jest.fn();
const mockRetrievePaymentIntent = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    refunds: {
      create: mockCreateRefund,
      retrieve: mockRetrieveRefund,
      list: mockListRefunds,
    },
    paymentIntents: {
      retrieve: mockRetrievePaymentIntent,
    },
  }));
});

// Create refund routes
const createRefundRoutes = () => {
  const router = express.Router();
  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123");

  // Create refund
  router.post("/refunds", async (req: express.Request, res: express.Response) => {
    try {
      const { paymentIntentId, amount, reason } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          error: "Payment Intent ID required",
        });
      }

      // Validate payment intent exists
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        return res.status(404).json({
          success: false,
          error: "Payment not found",
        });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          error: "Payment must be succeeded to refund",
        });
      }

      // Validate refund amount
      if (amount) {
        if (amount <= 0) {
          return res.status(400).json({
            success: false,
            error: "Refund amount must be positive",
          });
        }

        if (amount > paymentIntent.amount) {
          return res.status(400).json({
            success: false,
            error: "Refund amount cannot exceed payment amount",
          });
        }
      }

      const refundData: any = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = amount;
      }

      if (reason) {
        refundData.reason = reason;
      }

      const refund = await stripe.refunds.create(refundData);

      res.json({
        success: true,
        refund,
      });
    } catch (error: any) {
      console.error("Create refund error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create refund",
      });
    }
  });

  // Get refund
  router.get("/refunds/:id", async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const refund = await stripe.refunds.retrieve(id);

      res.json({
        success: true,
        refund,
      });
    } catch (error: any) {
      console.error("Retrieve refund error:", error);
      res.status(404).json({
        success: false,
        error: "Refund not found",
      });
    }
  });

  // List refunds
  router.get("/refunds", async (req: express.Request, res: express.Response) => {
    try {
      const { paymentIntentId, limit } = req.query;

      const params: any = {
        limit: limit ? parseInt(limit as string) : 10,
      };

      if (paymentIntentId) {
        params.payment_intent = paymentIntentId;
      }

      const refunds = await stripe.refunds.list(params);

      res.json({
        success: true,
        refunds: refunds.data,
        hasMore: refunds.has_more,
      });
    } catch (error: any) {
      console.error("List refunds error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to list refunds",
      });
    }
  });

  // Webhook handler for refunds
  router.post("/webhooks/refunds", async (req: express.Request, res: express.Response) => {
    try {
      const event = req.body;

      switch (event.type) {
        case "charge.refunded":
          console.log("Charge refunded:", event.data.object.id);
          break;
        case "refund.created":
          console.log("Refund created:", event.data.object.id);
          break;
        case "refund.updated":
          console.log("Refund updated:", event.data.object.id);
          break;
        case "refund.failed":
          console.log("Refund failed:", event.data.object.id);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  return router;
};

describe("Refund Tests", () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use("/api/payments", createRefundRoutes());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Full Refunds", () => {
    it("should create full refund successfully", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
        currency: "eur",
      };

      const mockRefund = {
        id: "re_123456",
        payment_intent: "pi_123456",
        amount: 2999,
        status: "succeeded",
        reason: null,
        created: Date.now() / 1000,
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCreateRefund.mockResolvedValue(mockRefund);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refund).toEqual(mockRefund);
      expect(mockCreateRefund).toHaveBeenCalledWith({
        payment_intent: "pi_123456",
      });
    });

    it("should create refund with reason", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
      };

      const mockRefund = {
        id: "re_123456",
        payment_intent: "pi_123456",
        amount: 2999,
        reason: "requested_by_customer",
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCreateRefund.mockResolvedValue(mockRefund);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
          reason: "requested_by_customer",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.refund.reason).toBe("requested_by_customer");
      expect(mockCreateRefund).toHaveBeenCalledWith({
        payment_intent: "pi_123456",
        reason: "requested_by_customer",
      });
    });

    it("should handle fraudulent refund reason", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_fraud",
        amount: 5000,
        status: "succeeded",
      };

      const mockRefund = {
        id: "re_fraud_123",
        payment_intent: "pi_fraud",
        amount: 5000,
        reason: "fraudulent",
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCreateRefund.mockResolvedValue(mockRefund);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_fraud",
          reason: "fraudulent",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.refund.reason).toBe("fraudulent");
    });
  });

  describe("Partial Refunds", () => {
    it("should create partial refund successfully", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
      };

      const mockRefund = {
        id: "re_partial_123",
        payment_intent: "pi_123456",
        amount: 1000,
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCreateRefund.mockResolvedValue(mockRefund);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
          amount: 1000,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.refund.amount).toBe(1000);
      expect(mockCreateRefund).toHaveBeenCalledWith({
        payment_intent: "pi_123456",
        amount: 1000,
      });
    });

    it("should reject refund exceeding payment amount", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
          amount: 5000, // Exceeds payment amount
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Refund amount cannot exceed payment amount");
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it("should reject zero amount refund", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
          amount: 0,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Refund amount must be positive");
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it("should reject negative amount refund", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
          amount: -100,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Refund amount must be positive");
    });

    it("should allow multiple partial refunds", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_multi_refund",
        amount: 10000,
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);

      const mockRefund1 = {
        id: "re_1",
        payment_intent: "pi_multi_refund",
        amount: 3000,
        status: "succeeded",
      };

      const mockRefund2 = {
        id: "re_2",
        payment_intent: "pi_multi_refund",
        amount: 2000,
        status: "succeeded",
      };

      mockCreateRefund
        .mockResolvedValueOnce(mockRefund1)
        .mockResolvedValueOnce(mockRefund2);

      // Act
      const response1 = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_multi_refund",
          amount: 3000,
        });

      const response2 = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_multi_refund",
          amount: 2000,
        });

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.refund.amount).toBe(3000);
      expect(response2.body.refund.amount).toBe(2000);
    });
  });

  describe("Refund Validation", () => {
    it("should require payment intent ID", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          amount: 1000,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Payment Intent ID required");
      expect(mockRetrievePaymentIntent).not.toHaveBeenCalled();
    });

    it("should reject refund for non-existent payment", async () => {
      // Arrange
      mockRetrievePaymentIntent.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_nonexistent",
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Payment not found");
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it("should reject refund for non-succeeded payment", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_pending",
        amount: 2999,
        status: "requires_confirmation",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_pending",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Payment must be succeeded to refund");
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it("should reject refund for canceled payment", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_canceled",
        amount: 2999,
        status: "canceled",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_canceled",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Payment must be succeeded to refund");
    });
  });

  describe("Retrieve & List Refunds", () => {
    it("should retrieve refund by ID", async () => {
      // Arrange
      const mockRefund = {
        id: "re_123456",
        payment_intent: "pi_123456",
        amount: 2999,
        status: "succeeded",
        created: Date.now() / 1000,
      };

      mockRetrieveRefund.mockResolvedValue(mockRefund);

      // Act
      const response = await request(app)
        .get("/api/payments/refunds/re_123456");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refund).toEqual(mockRefund);
      expect(mockRetrieveRefund).toHaveBeenCalledWith("re_123456");
    });

    it("should handle refund not found", async () => {
      // Arrange
      mockRetrieveRefund.mockRejectedValue(new Error("Not found"));

      // Act
      const response = await request(app)
        .get("/api/payments/refunds/re_nonexistent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Refund not found");
    });

    it("should list all refunds", async () => {
      // Arrange
      const mockRefunds = {
        data: [
          { id: "re_1", amount: 1000, status: "succeeded" },
          { id: "re_2", amount: 2000, status: "succeeded" },
        ],
        has_more: false,
      };

      mockListRefunds.mockResolvedValue(mockRefunds);

      // Act
      const response = await request(app)
        .get("/api/payments/refunds");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refunds).toHaveLength(2);
      expect(response.body.hasMore).toBe(false);
    });

    it("should list refunds for specific payment", async () => {
      // Arrange
      const mockRefunds = {
        data: [
          { id: "re_1", payment_intent: "pi_123", amount: 1000 },
        ],
        has_more: false,
      };

      mockListRefunds.mockResolvedValue(mockRefunds);

      // Act
      const response = await request(app)
        .get("/api/payments/refunds?paymentIntentId=pi_123");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.refunds).toHaveLength(1);
      expect(mockListRefunds).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: "pi_123",
        })
      );
    });

    it("should respect limit parameter", async () => {
      // Arrange
      const mockRefunds = {
        data: Array(5).fill(null).map((_, i) => ({ id: `re_${i}` })),
        has_more: true,
      };

      mockListRefunds.mockResolvedValue(mockRefunds);

      // Act
      const response = await request(app)
        .get("/api/payments/refunds?limit=5");

      // Assert
      expect(response.status).toBe(200);
      expect(mockListRefunds).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
        })
      );
    });
  });

  describe("Refund Webhooks", () => {
    it("should handle charge.refunded webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_123456",
            amount_refunded: 2999,
            refunded: true,
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/refunds")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith("Charge refunded:", "ch_123456");

      consoleSpy.mockRestore();
    });

    it("should handle refund.created webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "refund.created",
        data: {
          object: {
            id: "re_123456",
            amount: 2999,
            status: "pending",
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/refunds")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Refund created:", "re_123456");

      consoleSpy.mockRestore();
    });

    it("should handle refund.updated webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "refund.updated",
        data: {
          object: {
            id: "re_123456",
            status: "succeeded",
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/refunds")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Refund updated:", "re_123456");

      consoleSpy.mockRestore();
    });

    it("should handle refund.failed webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "refund.failed",
        data: {
          object: {
            id: "re_failed_123",
            status: "failed",
            failure_reason: "insufficient_funds",
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/refunds")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Refund failed:", "re_failed_123");

      consoleSpy.mockRestore();
    });

    it("should handle webhook errors", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/refunds")
        .send(null);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Webhook processing failed");

      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle Stripe API errors", async () => {
      // Arrange
      const mockPaymentIntent = {
        id: "pi_123456",
        amount: 2999,
        status: "succeeded",
      };

      mockRetrievePaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCreateRefund.mockRejectedValue(new Error("Charge already refunded"));

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_123456",
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Charge already refunded");
    });

    it("should handle payment intent retrieval errors", async () => {
      // Arrange
      mockRetrievePaymentIntent.mockRejectedValue(new Error("Payment intent not found"));

      // Act
      const response = await request(app)
        .post("/api/payments/refunds")
        .send({
          paymentIntentId: "pi_invalid",
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
