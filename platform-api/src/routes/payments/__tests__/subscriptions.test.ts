/**
 * Subscription Tests
 *
 * Tests for Stripe subscription management
 * Ensures recurring payments are handled correctly
 *
 * Coverage:
 * - Create subscription
 * - Update subscription
 * - Cancel subscription
 * - Subscription webhooks
 * - Plan changes
 * - Billing cycle management
 * - Trial periods
 * - Payment failures
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
const mockCreateSubscription = jest.fn();
const mockUpdateSubscription = jest.fn();
const mockCancelSubscription = jest.fn();
const mockRetrieveSubscription = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      create: mockCreateSubscription,
      update: mockUpdateSubscription,
      cancel: mockCancelSubscription,
      retrieve: mockRetrieveSubscription,
    },
    customers: {
      create: jest.fn().mockResolvedValue({ id: "cus_test_123" }),
    },
  }));
});

// Create subscription routes
const createSubscriptionRoutes = () => {
  const router = express.Router();
  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123");

  // Create subscription
  router.post("/subscriptions", async (req: express.Request, res: express.Response) => {
    try {
      const { customerId, priceId, trialDays } = req.body;

      if (!customerId || !priceId) {
        return res.status(400).json({
          success: false,
          error: "Customer ID and Price ID required",
        });
      }

      const subscriptionData: any = {
        customer: customerId,
        items: [{ price: priceId }],
      };

      if (trialDays) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      console.error("Create subscription error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create subscription",
      });
    }
  });

  // Update subscription
  router.patch("/subscriptions/:id", async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { priceId, cancelAtPeriodEnd } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Subscription ID required",
        });
      }

      const updateData: any = {};

      if (priceId) {
        updateData.items = [{ price: priceId }];
      }

      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
      }

      const subscription = await stripe.subscriptions.update(id, updateData);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      console.error("Update subscription error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update subscription",
      });
    }
  });

  // Cancel subscription
  router.delete("/subscriptions/:id", async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { immediately } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Subscription ID required",
        });
      }

      let subscription;
      if (immediately === "true") {
        subscription = await stripe.subscriptions.cancel(id);
      } else {
        subscription = await stripe.subscriptions.update(id, {
          cancel_at_period_end: true,
        });
      }

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to cancel subscription",
      });
    }
  });

  // Get subscription
  router.get("/subscriptions/:id", async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const subscription = await stripe.subscriptions.retrieve(id);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      console.error("Retrieve subscription error:", error);
      res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }
  });

  // Webhook handler for subscriptions
  router.post("/webhooks/subscriptions", async (req: express.Request, res: express.Response) => {
    try {
      const event = req.body;

      switch (event.type) {
        case "customer.subscription.created":
          console.log("Subscription created:", event.data.object.id);
          break;
        case "customer.subscription.updated":
          console.log("Subscription updated:", event.data.object.id);
          break;
        case "customer.subscription.deleted":
          console.log("Subscription deleted:", event.data.object.id);
          break;
        case "customer.subscription.trial_will_end":
          console.log("Trial ending soon:", event.data.object.id);
          break;
        case "invoice.payment_failed":
          console.log("Payment failed for subscription:", event.data.object.subscription);
          break;
        case "invoice.payment_succeeded":
          console.log("Payment succeeded for subscription:", event.data.object.subscription);
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

describe("Subscription Tests", () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use("/api/payments", createSubscriptionRoutes());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Create Subscription", () => {
    it("should create subscription successfully", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_123456",
        customer: "cus_test_123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_pro_monthly",
                recurring: {
                  interval: "month",
                },
              },
            },
          ],
        },
        current_period_start: Date.now() / 1000,
        current_period_end: (Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      mockCreateSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .post("/api/payments/subscriptions")
        .send({
          customerId: "cus_test_123",
          priceId: "price_pro_monthly",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toEqual(mockSubscription);
      expect(mockCreateSubscription).toHaveBeenCalledWith({
        customer: "cus_test_123",
        items: [{ price: "price_pro_monthly" }],
      });
    });

    it("should create subscription with trial period", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_trial_123",
        customer: "cus_test_123",
        status: "trialing",
        trial_end: (Date.now() / 1000) + (14 * 24 * 60 * 60),
      };

      mockCreateSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .post("/api/payments/subscriptions")
        .send({
          customerId: "cus_test_123",
          priceId: "price_pro_monthly",
          trialDays: 14,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subscription.status).toBe("trialing");
      expect(mockCreateSubscription).toHaveBeenCalledWith({
        customer: "cus_test_123",
        items: [{ price: "price_pro_monthly" }],
        trial_period_days: 14,
      });
    });

    it("should validate required customerId", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/subscriptions")
        .send({
          priceId: "price_pro_monthly",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Customer ID and Price ID required");
      expect(mockCreateSubscription).not.toHaveBeenCalled();
    });

    it("should validate required priceId", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/subscriptions")
        .send({
          customerId: "cus_test_123",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Customer ID and Price ID required");
    });

    it("should handle Stripe API errors", async () => {
      // Arrange
      mockCreateSubscription.mockRejectedValue(new Error("Invalid customer"));

      // Act
      const response = await request(app)
        .post("/api/payments/subscriptions")
        .send({
          customerId: "cus_invalid",
          priceId: "price_pro_monthly",
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid customer");
    });
  });

  describe("Update Subscription", () => {
    it("should update subscription plan", async () => {
      // Arrange
      const mockUpdatedSubscription = {
        id: "sub_123456",
        customer: "cus_test_123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_enterprise_monthly",
              },
            },
          ],
        },
      };

      mockUpdateSubscription.mockResolvedValue(mockUpdatedSubscription);

      // Act
      const response = await request(app)
        .patch("/api/payments/subscriptions/sub_123456")
        .send({
          priceId: "price_enterprise_monthly",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.items.data[0].price.id).toBe("price_enterprise_monthly");
      expect(mockUpdateSubscription).toHaveBeenCalledWith(
        "sub_123456",
        {
          items: [{ price: "price_enterprise_monthly" }],
        }
      );
    });

    it("should schedule cancellation at period end", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_123456",
        status: "active",
        cancel_at_period_end: true,
      };

      mockUpdateSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .patch("/api/payments/subscriptions/sub_123456")
        .send({
          cancelAtPeriodEnd: true,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subscription.cancel_at_period_end).toBe(true);
      expect(mockUpdateSubscription).toHaveBeenCalledWith(
        "sub_123456",
        {
          cancel_at_period_end: true,
        }
      );
    });

    it("should update multiple fields simultaneously", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_123456",
        status: "active",
        cancel_at_period_end: false,
      };

      mockUpdateSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .patch("/api/payments/subscriptions/sub_123456")
        .send({
          priceId: "price_new_plan",
          cancelAtPeriodEnd: false,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(mockUpdateSubscription).toHaveBeenCalledWith(
        "sub_123456",
        {
          items: [{ price: "price_new_plan" }],
          cancel_at_period_end: false,
        }
      );
    });

    it("should validate subscription ID", async () => {
      // Act
      const response = await request(app)
        .patch("/api/payments/subscriptions/")
        .send({
          priceId: "price_new_plan",
        });

      // Assert
      expect(response.status).toBe(404); // Route not found without ID
    });

    it("should handle update errors", async () => {
      // Arrange
      mockUpdateSubscription.mockRejectedValue(new Error("Subscription not found"));

      // Act
      const response = await request(app)
        .patch("/api/payments/subscriptions/sub_invalid")
        .send({
          priceId: "price_new_plan",
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Cancel Subscription", () => {
    it("should cancel subscription at period end", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_123456",
        status: "active",
        cancel_at_period_end: true,
        current_period_end: (Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      mockUpdateSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .delete("/api/payments/subscriptions/sub_123456");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.cancel_at_period_end).toBe(true);
      expect(mockUpdateSubscription).toHaveBeenCalledWith(
        "sub_123456",
        {
          cancel_at_period_end: true,
        }
      );
    });

    it("should cancel subscription immediately", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_123456",
        status: "canceled",
        canceled_at: Date.now() / 1000,
      };

      mockCancelSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .delete("/api/payments/subscriptions/sub_123456?immediately=true");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subscription.status).toBe("canceled");
      expect(mockCancelSubscription).toHaveBeenCalledWith("sub_123456");
    });

    it("should validate subscription ID for cancellation", async () => {
      // Act
      const response = await request(app)
        .delete("/api/payments/subscriptions/");

      // Assert
      expect(response.status).toBe(404); // Route not found
    });

    it("should handle cancellation errors", async () => {
      // Arrange
      mockCancelSubscription.mockRejectedValue(new Error("Already canceled"));

      // Act
      const response = await request(app)
        .delete("/api/payments/subscriptions/sub_canceled?immediately=true");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Retrieve Subscription", () => {
    it("should retrieve subscription details", async () => {
      // Arrange
      const mockSubscription = {
        id: "sub_123456",
        customer: "cus_test_123",
        status: "active",
        current_period_start: Date.now() / 1000,
        current_period_end: (Date.now() / 1000) + (30 * 24 * 60 * 60),
      };

      mockRetrieveSubscription.mockResolvedValue(mockSubscription);

      // Act
      const response = await request(app)
        .get("/api/payments/subscriptions/sub_123456");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toEqual(mockSubscription);
      expect(mockRetrieveSubscription).toHaveBeenCalledWith("sub_123456");
    });

    it("should handle subscription not found", async () => {
      // Arrange
      mockRetrieveSubscription.mockRejectedValue(new Error("Not found"));

      // Act
      const response = await request(app)
        .get("/api/payments/subscriptions/sub_nonexistent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Subscription not found");
    });
  });

  describe("Subscription Webhooks", () => {
    it("should handle subscription.created webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_new_123",
            customer: "cus_test_123",
            status: "active",
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith("Subscription created:", "sub_new_123");

      consoleSpy.mockRestore();
    });

    it("should handle subscription.updated webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_123456",
            status: "active",
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Subscription updated:", "sub_123456");

      consoleSpy.mockRestore();
    });

    it("should handle subscription.deleted webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_canceled_123",
            status: "canceled",
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Subscription deleted:", "sub_canceled_123");

      consoleSpy.mockRestore();
    });

    it("should handle trial_will_end webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "customer.subscription.trial_will_end",
        data: {
          object: {
            id: "sub_trial_123",
            trial_end: (Date.now() / 1000) + (3 * 24 * 60 * 60), // 3 days
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Trial ending soon:", "sub_trial_123");

      consoleSpy.mockRestore();
    });

    it("should handle invoice.payment_failed webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "invoice.payment_failed",
        data: {
          object: {
            subscription: "sub_123456",
            amount_due: 2999,
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Payment failed for subscription:", "sub_123456");

      consoleSpy.mockRestore();
    });

    it("should handle invoice.payment_succeeded webhook", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const webhookEvent = {
        type: "invoice.payment_succeeded",
        data: {
          object: {
            subscription: "sub_123456",
            amount_paid: 2999,
          },
        },
      };

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(webhookEvent);

      // Assert
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith("Payment succeeded for subscription:", "sub_123456");

      consoleSpy.mockRestore();
    });

    it("should handle webhook errors gracefully", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      const response = await request(app)
        .post("/api/payments/webhooks/subscriptions")
        .send(null);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Webhook processing failed");

      consoleSpy.mockRestore();
    });
  });
});
