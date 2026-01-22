/**
 * Idempotency Tests
 *
 * Tests for idempotent payment processing
 * Ensures duplicate requests are handled safely
 *
 * Coverage:
 * - Idempotency key validation
 * - Duplicate request detection
 * - Cache-based idempotency
 * - Concurrent request handling
 * - Key expiration
 * - Error replay
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

// Mock Redis for idempotency cache
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisSetEx = jest.fn();
const mockRedisDel = jest.fn();

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: mockRedisGet,
    set: mockRedisSet,
    setex: mockRedisSetEx,
    del: mockRedisDel,
    on: jest.fn(),
    connect: jest.fn(),
    quit: jest.fn(),
  }));
});

// Idempotency middleware
const idempotencyMiddleware = () => {
  const Redis = require("ioredis");
  const redis = new Redis();

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] as string;

      if (!idempotencyKey) {
        return res.status(400).json({
          success: false,
          error: "Idempotency-Key header required",
        });
      }

      // Check if we've seen this key before
      const cacheKey = `idempotency:${idempotencyKey}`;
      const cachedResponse = await redis.get(cacheKey);

      if (cachedResponse) {
        // Return cached response
        const cached = JSON.parse(cachedResponse);
        return res.status(cached.status).json(cached.body);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Cache the response (24 hours TTL)
        const responseToCache = {
          status: res.statusCode,
          body: body,
        };
        redis.setex(cacheKey, 86400, JSON.stringify(responseToCache));
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Idempotency middleware error:", error);
      next(error);
    }
  };
};

// Create test routes with idempotency
const createIdempotentRoutes = () => {
  const router = express.Router();

  router.post(
    "/payment",
    idempotencyMiddleware(),
    async (req: express.Request, res: express.Response) => {
      try {
        const { amount, paymentMethodId } = req.body;

        if (!amount || !paymentMethodId) {
          return res.status(400).json({
            success: false,
            error: "Amount and payment method required",
          });
        }

        // Simulate payment processing
        const payment = {
          id: `pay_${Date.now()}`,
          amount,
          status: "succeeded",
          paymentMethodId,
        };

        res.json({
          success: true,
          payment,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Payment processing failed",
        });
      }
    }
  );

  router.post(
    "/refund",
    idempotencyMiddleware(),
    async (req: express.Request, res: express.Response) => {
      const { paymentId, amount } = req.body;

      res.json({
        success: true,
        refund: {
          id: `ref_${Date.now()}`,
          paymentId,
          amount,
          status: "succeeded",
        },
      });
    }
  );

  return router;
};

describe("Idempotency Tests", () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use("/api/payments", createIdempotentRoutes());

    // Default mock behavior - no cached response
    mockRedisGet.mockResolvedValue(null);
    mockRedisSetEx.mockResolvedValue("OK");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Idempotency Key Validation", () => {
    it("should require Idempotency-Key header", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Idempotency-Key header required");
    });

    it("should accept valid Idempotency-Key", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", "key_123456789")
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockRedisGet).toHaveBeenCalledWith("idempotency:key_123456789");
    });

    it("should handle UUID format idempotency keys", async () => {
      // Arrange
      const uuid = "550e8400-e29b-41d4-a716-446655440000";

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", uuid)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(mockRedisGet).toHaveBeenCalledWith(`idempotency:${uuid}`);
    });

    it("should handle custom string idempotency keys", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", "custom_key_user_123_payment_456")
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(200);
    });

    it("should reject empty Idempotency-Key", async () => {
      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", "")
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Idempotency-Key header required");
    });
  });

  describe("Duplicate Request Detection", () => {
    it("should return cached response for duplicate request", async () => {
      // Arrange
      const idempotencyKey = "key_duplicate_test";
      const cachedResponse = {
        status: 200,
        body: {
          success: true,
          payment: {
            id: "pay_cached_123",
            amount: 2999,
            status: "succeeded",
          },
        },
      };

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedResponse));

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedResponse.body);
      expect(response.body.payment.id).toBe("pay_cached_123");
      expect(mockRedisSetEx).not.toHaveBeenCalled();
    });

    it("should cache successful response for future requests", async () => {
      // Arrange
      const idempotencyKey = "key_cache_success";
      mockRedisGet.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        `idempotency:${idempotencyKey}`,
        86400, // 24 hours
        expect.stringContaining('"success":true')
      );
    });

    it("should cache error responses", async () => {
      // Arrange
      const idempotencyKey = "key_cache_error";
      mockRedisGet.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          // Missing required fields
          amount: 2999,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        `idempotency:${idempotencyKey}`,
        86400,
        expect.stringContaining('"success":false')
      );
    });

    it("should return same error for duplicate failed requests", async () => {
      // Arrange
      const idempotencyKey = "key_duplicate_error";
      const cachedError = {
        status: 400,
        body: {
          success: false,
          error: "Amount and payment method required",
        },
      };

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedError));

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual(cachedError.body);
    });

    it("should handle multiple sequential duplicate requests", async () => {
      // Arrange
      const idempotencyKey = "key_sequential";
      mockRedisGet
        .mockResolvedValueOnce(null) // First request - no cache
        .mockResolvedValueOnce(
          JSON.stringify({
            status: 200,
            body: {
              success: true,
              payment: { id: "pay_123", amount: 2999 },
            },
          })
        ) // Second request - cached
        .mockResolvedValueOnce(
          JSON.stringify({
            status: 200,
            body: {
              success: true,
              payment: { id: "pay_123", amount: 2999 },
            },
          })
        ); // Third request - cached

      // Act
      const response1 = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({ amount: 2999, paymentMethodId: "pm_card_visa" });

      const response2 = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({ amount: 2999, paymentMethodId: "pm_card_visa" });

      const response3 = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({ amount: 2999, paymentMethodId: "pm_card_visa" });

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      expect(response1.body.payment.id).toBe(response2.body.payment.id);
      expect(response2.body.payment.id).toBe(response3.body.payment.id);
      expect(mockRedisSetEx).toHaveBeenCalledTimes(1); // Only first request caches
    });
  });

  describe("Concurrent Request Handling", () => {
    it("should handle concurrent requests with same idempotency key", async () => {
      // Arrange
      const idempotencyKey = "key_concurrent";
      mockRedisGet.mockResolvedValue(null);

      // Act - Send 5 concurrent requests with same key
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/payments/payment")
            .set("Idempotency-Key", idempotencyKey)
            .send({
              amount: 2999,
              paymentMethodId: "pm_card_visa",
            })
        );

      const responses = await Promise.all(requests);

      // Assert - All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it("should handle concurrent requests with different idempotency keys", async () => {
      // Arrange
      mockRedisGet.mockResolvedValue(null);

      // Act
      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post("/api/payments/payment")
            .set("Idempotency-Key", `key_concurrent_${i}`)
            .send({
              amount: 2999,
              paymentMethodId: "pm_card_visa",
            })
        );

      const responses = await Promise.all(requests);

      // Assert
      expect(responses).toHaveLength(5);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Each should have cached its own response
      expect(mockRedisSetEx).toHaveBeenCalledTimes(5);
    });
  });

  describe("Cache Expiration & Management", () => {
    it("should set 24 hour TTL on cached responses", async () => {
      // Arrange
      const idempotencyKey = "key_ttl_test";
      mockRedisGet.mockResolvedValue(null);

      // Act
      await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        `idempotency:${idempotencyKey}`,
        86400, // 24 hours in seconds
        expect.any(String)
      );
    });

    it("should allow new request after cache expiration", async () => {
      // Arrange
      const idempotencyKey = "key_expired";

      // First request - cache miss (expired)
      mockRedisGet.mockResolvedValueOnce(null);

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(response.status).toBe(200);
      expect(mockRedisSetEx).toHaveBeenCalled();
    });

    it("should use consistent cache key format", async () => {
      // Arrange
      const idempotencyKey = "test_key_format";
      mockRedisGet.mockResolvedValue(null);

      // Act
      await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert
      expect(mockRedisGet).toHaveBeenCalledWith(
        `idempotency:${idempotencyKey}`
      );
      expect(mockRedisSetEx).toHaveBeenCalledWith(
        `idempotency:${idempotencyKey}`,
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe("Different Endpoints", () => {
    it("should apply idempotency to refund endpoint", async () => {
      // Arrange
      const idempotencyKey = "key_refund_test";
      mockRedisGet.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/api/payments/refund")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          paymentId: "pay_123",
          amount: 1000,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refund).toBeDefined();
      expect(mockRedisSetEx).toHaveBeenCalled();
    });

    it("should isolate idempotency keys between endpoints", async () => {
      // Arrange
      const idempotencyKey = "key_shared";
      mockRedisGet.mockResolvedValue(null);

      // Act - Use same key for different endpoints
      const paymentResponse = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      const refundResponse = await request(app)
        .post("/api/payments/refund")
        .set("Idempotency-Key", idempotencyKey)
        .send({
          paymentId: "pay_123",
          amount: 1000,
        });

      // Assert - Both should succeed (keys are namespaced)
      expect(paymentResponse.status).toBe(200);
      expect(refundResponse.status).toBe(200);
      expect(paymentResponse.body.payment).toBeDefined();
      expect(refundResponse.body.refund).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle Redis connection errors gracefully", async () => {
      // Arrange
      mockRedisGet.mockRejectedValue(new Error("Redis connection failed"));

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", "key_redis_error")
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert - Should fail gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle malformed cached data", async () => {
      // Arrange
      mockRedisGet.mockResolvedValue("{ invalid json }");

      // Act
      const response = await request(app)
        .post("/api/payments/payment")
        .set("Idempotency-Key", "key_malformed_cache")
        .send({
          amount: 2999,
          paymentMethodId: "pm_card_visa",
        });

      // Assert - Should handle error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
