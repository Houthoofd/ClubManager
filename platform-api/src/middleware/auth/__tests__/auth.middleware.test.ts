/**
 * Auth Middleware Tests
 * Tests for JWT authentication middleware with proper ESM/Jest patterns
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockJWTPayload,
} from "../../../__tests__/helpers/mock-helpers.js";

// Define mocks BEFORE imports
const mockJwtVerify = jest.fn();
const mockJwtSign = jest.fn();

jest.mock("jsonwebtoken", () => ({
  verify: mockJwtVerify,
  sign: mockJwtSign,
  default: {
    verify: mockJwtVerify,
    sign: mockJwtSign,
  },
}));

// Import after mocks
import {
  verifyToken,
  optionalAuth,
  requireRole,
  generateToken,
} from "../auth.js";

describe("Auth Middleware", () => {
  const mockJwtSecret = "test-jwt-secret";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = mockJwtSecret;
    process.env.JWT_EXPIRES_IN = "1h";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  // ==========================================
  // generateToken Tests
  // ==========================================
  describe("generateToken", () => {
    it("should generate token with correct payload", () => {
      const payload = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        first_name: "John",
        last_name: "Doe",
        role: "USER",
      };

      mockJwtSign.mockReturnValue("generated.token.here");

      const token = generateToken(payload);

      expect(token).toBe("generated.token.here");
      expect(mockJwtSign).toHaveBeenCalledWith(
        payload,
        mockJwtSecret,
        expect.objectContaining({
          expiresIn: "1h",
        }),
      );
    });

    it("should use JWT_SECRET from environment", () => {
      const payload = { id: 1, email: "test@example.com" };
      mockJwtSign.mockReturnValue("token");

      generateToken(payload);

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        mockJwtSecret,
        expect.any(Object),
      );
    });

    it("should throw error if JWT_SECRET is not set", () => {
      delete process.env.JWT_SECRET;
      const payload = { id: 1, email: "test@example.com" };

      expect(() => generateToken(payload)).toThrow();
    });

    it("should include all payload fields", () => {
      const payload = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        role: "ADMIN",
      };

      mockJwtSign.mockReturnValue("token");
      generateToken(payload);

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          email: "test@example.com",
          tenantId: "tenant-123",
          role: "ADMIN",
        }),
        mockJwtSecret,
        expect.any(Object),
      );
    });

    it("should use custom expiration if provided", () => {
      process.env.JWT_EXPIRES_IN = "24h";
      const payload = { id: 1, email: "test@example.com" };

      mockJwtSign.mockReturnValue("token");
      generateToken(payload);

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        mockJwtSecret,
        expect.objectContaining({
          expiresIn: "24h",
        }),
      );
    });
  });

  // ==========================================
  // verifyToken Tests
  // ==========================================
  describe("verifyToken", () => {
    it("should verify token from Authorization header", async () => {
      const mockPayload = createMockJWTPayload({
        userId: "123",
        email: "test@example.com",
      });

      const req = createMockRequest({
        headers: {
          authorization: "Bearer valid.token.here",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockPayload);

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(mockJwtVerify).toHaveBeenCalledWith(
        "valid.token.here",
        mockJwtSecret,
      );
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should verify token from cookies", async () => {
      const mockPayload = createMockJWTPayload({
        userId: "123",
        email: "test@example.com",
      });

      const req = createMockRequest({
        headers: {},
        cookies: {
          token: "valid.token.from.cookie",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockPayload);

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(mockJwtVerify).toHaveBeenCalledWith(
        "valid.token.from.cookie",
        mockJwtSecret,
      );
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
    });

    it("should return 401 if no token provided", async () => {
      const req = createMockRequest({
        headers: {},
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("token"),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid", async () => {
      const req = createMockRequest({
        headers: {
          authorization: "Bearer invalid.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is expired", async () => {
      const req = createMockRequest({
        headers: {
          authorization: "Bearer expired.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockImplementation(() => {
        const error: any = new Error("jwt expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/expired|invalid/i),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle malformed Authorization header", async () => {
      const req = createMockRequest({
        headers: {
          authorization: "NotBearer invalid-format",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle missing JWT_SECRET", async () => {
      delete process.env.JWT_SECRET;

      const req = createMockRequest({
        headers: {
          authorization: "Bearer token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("configuration"),
        }),
      );
    });

    it("should attach complete user payload to request", async () => {
      const mockPayload = createMockJWTPayload({
        userId: "123",
        email: "test@example.com",
        tenantId: "tenant-456",
        role: "ADMIN",
      });

      const req = createMockRequest({
        headers: {
          authorization: "Bearer valid.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockPayload);

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(req.user).toEqual(mockPayload);
      expect(req.user?.userId).toBe("123");
      expect(req.user?.email).toBe("test@example.com");
      expect(req.user?.tenantId).toBe("tenant-456");
    });
  });

  // ==========================================
  // optionalAuth Tests
  // ==========================================
  describe("optionalAuth", () => {
    it("should attach user if valid token provided", async () => {
      const mockPayload = createMockJWTPayload({
        userId: "123",
        email: "test@example.com",
      });

      const req = createMockRequest({
        headers: {
          authorization: "Bearer valid.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockPayload);

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should continue without user if no token provided", async () => {
      const req = createMockRequest({
        headers: {},
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should continue without user if token is invalid", async () => {
      const req = createMockRequest({
        headers: {
          authorization: "Bearer invalid.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should not throw error on expired token", async () => {
      const req = createMockRequest({
        headers: {
          authorization: "Bearer expired.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockImplementation(() => {
        const error: any = new Error("jwt expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // requireRole Tests
  // ==========================================
  describe("requireRole", () => {
    it("should allow access if user has required role", () => {
      const req = createMockRequest({
        user: createMockJWTPayload({
          userId: "123",
          role: "ADMIN",
        }),
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole("ADMIN");
      middleware(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow access if user has one of required roles", () => {
      const req = createMockRequest({
        user: createMockJWTPayload({
          userId: "123",
          role: "MANAGER",
        }),
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(["ADMIN", "MANAGER"]);
      middleware(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", () => {
      const req = createMockRequest({
        user: undefined,
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole("ADMIN");
      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Authentication required"),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 if user does not have required role", () => {
      const req = createMockRequest({
        user: createMockJWTPayload({
          userId: "123",
          role: "USER",
        }),
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole("ADMIN");
      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("permission"),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 if user role is missing", () => {
      const req = createMockRequest({
        user: createMockJWTPayload({
          userId: "123",
          role: undefined,
        }),
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole("ADMIN");
      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle multiple required roles", () => {
      const req = createMockRequest({
        user: createMockJWTPayload({
          userId: "123",
          role: "USER",
        }),
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("should be case-sensitive for roles", () => {
      const req = createMockRequest({
        user: createMockJWTPayload({
          userId: "123",
          role: "admin", // lowercase
        }),
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole("ADMIN"); // uppercase
      middleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================
  describe("Integration - Full Auth Flow", () => {
    it("should handle complete authentication flow", async () => {
      // Generate token
      const payload = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        role: "USER",
      };

      mockJwtSign.mockReturnValue("generated.token");
      const token = generateToken(payload);
      expect(token).toBe("generated.token");

      // Verify token
      const mockVerifiedPayload = createMockJWTPayload({
        userId: "1",
        email: "test@example.com",
        tenantId: "tenant-123",
      });

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockVerifiedPayload);

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(req.user).toEqual(mockVerifiedPayload);
      expect(next).toHaveBeenCalled();
    });

    it("should handle auth with role check", async () => {
      const mockPayload = createMockJWTPayload({
        userId: "123",
        email: "admin@example.com",
        role: "ADMIN",
      });

      // First verify token
      const req = createMockRequest({
        headers: {
          authorization: "Bearer admin.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockPayload);

      await verifyToken(req as Request, res as Response, next as NextFunction);

      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();

      // Then check role
      jest.clearAllMocks();
      const roleMiddleware = requireRole("ADMIN");
      roleMiddleware(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject user without proper role", async () => {
      const mockPayload = createMockJWTPayload({
        userId: "123",
        email: "user@example.com",
        role: "USER",
      });

      const req = createMockRequest({
        headers: {
          authorization: "Bearer user.token",
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      mockJwtVerify.mockReturnValue(mockPayload);

      // Verify token succeeds
      await verifyToken(req as Request, res as Response, next as NextFunction);
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();

      // But role check fails
      jest.clearAllMocks();
      const roleMiddleware = requireRole("ADMIN");
      roleMiddleware(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
