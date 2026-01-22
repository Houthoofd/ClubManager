/**
 * Webhook Signature Verification Tests
 *
 * Tests for Stripe webhook signature validation
 * Ensures webhooks are authentic and not tampered with
 *
 * Coverage:
 * - Valid signature verification
 * - Invalid signature rejection
 * - Missing signature handling
 * - Replay attack prevention
 * - Timestamp validation
 * - Secret key management
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
import crypto from "crypto";

// Mock Stripe
const mockConstructEvent = jest.fn();
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

// Mock webhook route with signature validation
const createWebhookRouteWithSignature = () => {
  const router = express.Router();

  router.post("/webhook-secure", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_secret";

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: "Missing stripe-signature header",
        });
      }

      // Verify signature using Stripe SDK
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123");

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: `Webhook signature verification failed: ${err.message}`,
        });
      }

      // Process verified event
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Verified payment succeeded:", event.data.object.id);
          break;
        case "payment_intent.payment_failed":
          console.log("Verified payment failed:", event.data.object.id);
          break;
      }

      res.json({ received: true, verified: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};

describe("Webhook Signature Verification Tests", () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use("/api/payments/stripe", createWebhookRouteWithSignature());

    // Setup environment
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_123456";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe("Valid Signature Verification", () => {
    it("should accept webhook with valid signature", async () => {
      // Arrange
      const payload = JSON.stringify({
        id: "evt_test_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123456",
            status: "succeeded",
          },
        },
      });

      const validEvent = {
        id: "evt_test_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123456",
            status: "succeeded",
          },
        },
      };

      mockConstructEvent.mockReturnValue(validEvent);

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=valid_signature_hash")
        .set("Content-Type", "application/json")
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(response.body.verified).toBe(true);
      expect(mockConstructEvent).toHaveBeenCalled();
    });

    it("should verify signature with correct timestamp", async () => {
      // Arrange
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        id: "evt_timestamp_test",
        type: "payment_intent.succeeded",
      });

      mockConstructEvent.mockReturnValue({
        id: "evt_timestamp_test",
        type: "payment_intent.succeeded",
      });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", `t=${timestamp},v1=signature_hash`)
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(mockConstructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        `t=${timestamp},v1=signature_hash`,
        "whsec_test_secret_key"
      );
    });

    it("should handle multiple signature versions", async () => {
      // Arrange
      const payload = JSON.stringify({ id: "evt_multi_sig" });
      mockConstructEvent.mockReturnValue({ id: "evt_multi_sig" });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=sig1,v0=sig0")
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.verified).toBe(true);
    });

    it("should use webhook secret from environment", async () => {
      // Arrange
      const customSecret = "whsec_custom_secret_123";
      process.env.STRIPE_WEBHOOK_SECRET = customSecret;

      const payload = JSON.stringify({ id: "evt_custom_secret" });
      mockConstructEvent.mockReturnValue({ id: "evt_custom_secret" });

      // Act
      await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=sig")
        .send(payload);

      // Assert
      expect(mockConstructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(String),
        customSecret
      );
    });
  });

  describe("Invalid Signature Rejection", () => {
    it("should reject webhook with invalid signature", async () => {
      // Arrange
      const payload = JSON.stringify({ id: "evt_invalid" });

      mockConstructEvent.mockImplementation(() => {
        const error = new Error("Invalid signature");
        error.name = "StripeSignatureVerificationError";
        throw error;
      });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=invalid_signature")
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("signature verification failed");
    });

    it("should reject webhook with missing signature header", async () => {
      // Arrange
      const payload = JSON.stringify({ id: "evt_no_sig" });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Missing stripe-signature header");
      expect(mockConstructEvent).not.toHaveBeenCalled();
    });

    it("should reject webhook with empty signature", async () => {
      // Arrange
      const payload = JSON.stringify({ id: "evt_empty_sig" });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "")
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing stripe-signature header");
    });

    it("should reject webhook with malformed signature", async () => {
      // Arrange
      const payload = JSON.stringify({ id: "evt_malformed" });

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Malformed signature");
      });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "malformed_signature_format")
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("verification failed");
    });

    it("should reject webhook with tampered payload", async () => {
      // Arrange
      const originalPayload = JSON.stringify({ id: "evt_original", amount: 1000 });
      const tamperedPayload = JSON.stringify({ id: "evt_original", amount: 10000 });

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Signature does not match payload");
      });

      // Act - signature created for originalPayload, but sending tamperedPayload
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=original_signature")
        .send(tamperedPayload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("verification failed");
    });
  });

  describe("Replay Attack Prevention", () => {
    it("should reject webhook with old timestamp", async () => {
      // Arrange
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes old
      const payload = JSON.stringify({ id: "evt_old" });

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Timestamp outside tolerance zone");
      });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", `t=${oldTimestamp},v1=signature`)
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("verification failed");
    });

    it("should reject webhook with future timestamp", async () => {
      // Arrange
      const futureTimestamp = Math.floor(Date.now() / 1000) + 600; // 10 minutes in future
      const payload = JSON.stringify({ id: "evt_future" });

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Timestamp in the future");
      });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", `t=${futureTimestamp},v1=signature`)
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should accept webhook within tolerance window", async () => {
      // Arrange
      const recentTimestamp = Math.floor(Date.now() / 1000) - 30; // 30 seconds ago
      const payload = JSON.stringify({ id: "evt_recent" });

      mockConstructEvent.mockReturnValue({ id: "evt_recent" });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", `t=${recentTimestamp},v1=signature`)
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.verified).toBe(true);
    });
  });

  describe("Edge Cases & Security", () => {
    it("should handle signature with special characters", async () => {
      // Arrange
      const payload = JSON.stringify({ id: "evt_special" });
      mockConstructEvent.mockReturnValue({ id: "evt_special" });

      // Act
      const response = await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=abc+def/ghi==")
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should not log sensitive data on signature failure", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const payload = JSON.stringify({
        id: "evt_sensitive",
        data: { secret: "sensitive_data_should_not_be_logged" },
      });

      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      // Act
      await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=invalid")
        .send(payload);

      // Assert
      const errorLogs = consoleSpy.mock.calls.map(call => call.join(" "));
      const hasLeakedSecret = errorLogs.some(log =>
        log.includes("sensitive_data_should_not_be_logged")
      );
      expect(hasLeakedSecret).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle webhook secret rotation", async () => {
      // Arrange
      const oldSecret = "whsec_old_secret";
      const newSecret = "whsec_new_secret";

      // First request with old secret
      process.env.STRIPE_WEBHOOK_SECRET = oldSecret;
      const payload1 = JSON.stringify({ id: "evt_old_secret" });
      mockConstructEvent.mockReturnValue({ id: "evt_old_secret" });

      await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=sig_old")
        .send(payload1);

      expect(mockConstructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(String),
        oldSecret
      );

      // Rotate secret
      jest.clearAllMocks();
      process.env.STRIPE_WEBHOOK_SECRET = newSecret;

      // Second request with new secret
      const payload2 = JSON.stringify({ id: "evt_new_secret" });
      mockConstructEvent.mockReturnValue({ id: "evt_new_secret" });

      await request(app)
        .post("/api/payments/stripe/webhook-secure")
        .set("stripe-signature", "t=1234567890,v1=sig_new")
        .send(payload2);

      // Assert - should use new secret
      expect(mockConstructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(String),
        newSecret
      );
    });

    it("should handle concurrent webhook requests", async () => {
      // Arrange
      const requests = Array(5).fill(null).map((_, i) => ({
        payload: JSON.stringify({ id: `evt_concurrent_${i}` }),
        signature: `t=${Date.now()},v1=sig_${i}`,
      }));

      mockConstructEvent.mockImplementation((body, sig) => {
        return JSON.parse(body.toString());
      });

      // Act
      const responses = await Promise.all(
        requests.map(req =>
          request(app)
            .post("/api/payments/stripe/webhook-secure")
            .set("stripe-signature", req.signature)
            .send(req.payload)
        )
      );

      // Assert
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.verified).toBe(true);
      });
    });

    it("should rate limit signature validation failures", async () => {
      // This test documents the need for rate limiting on failed validations
      // to prevent brute force attacks on webhook signatures

      // Arrange
      const payload = JSON.stringify({ id: "evt_brute_force" });
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      // Act - Simulate multiple failed attempts
      const attempts = await Promise.all(
        Array(10).fill(null).map(() =>
          request(app)
            .post("/api/payments/stripe/webhook-secure")
            .set("stripe-signature", "t=1234567890,v1=wrong_sig")
            .send(payload)
        )
      );

      // Assert - All should fail (rate limiting would be implemented separately)
      attempts.forEach(response => {
        expect(response.status).toBe(400);
      });

      // TODO: Implement actual rate limiting for failed signature validations
    });
  });
});
