import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  optionalAuth,
  requireRole,
  generateToken,
  JWTPayload,
} from "../auth";
import jwt from "jsonwebtoken";

// Mock jwt
vi.mock("jsonwebtoken");

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const mockJwtSecret = "test-jwt-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = mockJwtSecret;

    mockRequest = {
      headers: {},
      cookies: {},
      user: undefined,
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    nextFunction = vi.fn();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
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

      vi.mocked(jwt.sign).mockReturnValue("generated.token.here" as never);

      const token = generateToken(payload);

      expect(token).toBe("generated.token.here");
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        mockJwtSecret,
        expect.any(Object)
      );
    });

    it("should use JWT_SECRET from environment", () => {
      const payload = { id: 1, email: "test@example.com" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        mockJwtSecret,
        expect.any(Object)
      );
    });

    it("should use fallback secret if JWT_SECRET not set", () => {
      delete process.env.JWT_SECRET;
      const payload = { id: 1, email: "test@example.com" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        "your-secret-key",
        expect.any(Object)
      );
    });

    it("should set expiration when JWT_EXPIRES_IN is numeric", () => {
      process.env.JWT_EXPIRES_IN = "3600";
      const payload = { id: 1, email: "test@example.com" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        expiresIn: 3600,
      });

      delete process.env.JWT_EXPIRES_IN;
    });

    it("should set expiration when JWT_EXPIRES_IN is string", () => {
      process.env.JWT_EXPIRES_IN = "24h";
      const payload = { id: 1, email: "test@example.com" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        expiresIn: "24h",
      });

      delete process.env.JWT_EXPIRES_IN;
    });

    it("should not set expiration when JWT_EXPIRES_IN is not set", () => {
      const payload = { id: 1, email: "test@example.com" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, mockJwtSecret);
    });

    it("should handle optional fields in payload", () => {
      const payload = {
        id: 1,
        email: "test@example.com",
      };

      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, expect.any(String), undefined);
    });
  });

  // ==========================================
  // verifyToken Middleware Tests
  // ==========================================
  describe("verifyToken", () => {
    const mockDecodedToken: JWTPayload = {
      id: 1,
      email: "test@example.com",
      tenantId: "tenant-123",
      first_name: "John",
      last_name: "Doe",
      role: "USER",
      status: "ACTIVE",
    };

    it("should verify valid token from Authorization header", () => {
      mockRequest.headers = {
        authorization: "Bearer valid.jwt.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
      expect(mockRequest.user).toEqual({
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        first_name: "John",
        last_name: "Doe",
        role: "USER",
        status: "ACTIVE",
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should verify token from cookies when Authorization header is missing", () => {
      mockRequest.cookies = { token: "valid.jwt.token" };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should return 401 when no token provided", () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Token d'accès requis",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 for expired token", () => {
      mockRequest.headers = {
        authorization: "Bearer expired.token",
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expiré",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 for invalid token", () => {
      mockRequest.headers = {
        authorization: "Bearer invalid.token",
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Token invalide",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should strip Bearer prefix from token", () => {
      mockRequest.headers = {
        authorization: "Bearer valid.jwt.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
    });

    it("should map role from status_id when role is missing", () => {
      const decodedWithStatusId = {
        ...mockDecodedToken,
        role: undefined,
        status_id: 2,
      };

      mockRequest.headers = {
        authorization: "Bearer valid.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedWithStatusId as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user?.role).toBe("2");
    });

    it("should map status from status_id when status is missing", () => {
      const decodedWithStatusId = {
        ...mockDecodedToken,
        status: undefined,
        status_id: 1,
      };

      mockRequest.headers = {
        authorization: "Bearer valid.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedWithStatusId as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user?.status).toBe("1");
    });

    it("should handle missing optional fields", () => {
      const minimalToken = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
      };

      mockRequest.headers = {
        authorization: "Bearer valid.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(minimalToken as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        first_name: "",
        last_name: "",
        role: undefined,
        status: undefined,
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should prioritize Authorization header over cookies", () => {
      mockRequest.headers = {
        authorization: "Bearer header.token",
      };
      mockRequest.cookies = { token: "cookie.token" };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith("header.token", mockJwtSecret);
    });
  });

  // ==========================================
  // optionalAuth Middleware Tests
  // ==========================================
  describe("optionalAuth", () => {
    const mockDecodedToken: JWTPayload = {
      id: 1,
      email: "test@example.com",
      tenantId: "tenant-123",
      first_name: "John",
      last_name: "Doe",
      role: "USER",
      status: "ACTIVE",
    };

    it("should set user when valid token provided", () => {
      mockRequest.headers = {
        authorization: "Bearer valid.jwt.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.email).toBe("test@example.com");
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should continue without user when no token provided", () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should continue without user when token is invalid", () => {
      mockRequest.headers = {
        authorization: "Bearer invalid.token",
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should continue without user when token is expired", () => {
      mockRequest.headers = {
        authorization: "Bearer expired.token",
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should verify token from cookies", () => {
      mockRequest.cookies = { token: "valid.jwt.token" };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should strip Bearer prefix from token", () => {
      mockRequest.headers = {
        authorization: "Bearer valid.jwt.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
    });

    it("should map optional fields correctly", () => {
      const minimalToken = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
      };

      mockRequest.headers = {
        authorization: "Bearer valid.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(minimalToken as never);

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        first_name: "",
        last_name: "",
        role: undefined,
        status: undefined,
      });
    });
  });

  // ==========================================
  // requireRole Middleware Tests
  // ==========================================
  describe("requireRole", () => {
    it("should allow access for user with required role", () => {
      mockRequest.user = {
        id: 1,
        email: "admin@example.com",
        tenantId: "tenant-123",
        first_name: "Admin",
        last_name: "User",
        role: "ADMIN",
        status: "ACTIVE",
      };

      const middleware = requireRole(["ADMIN", "MANAGER"]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow access for user with any of multiple required roles", () => {
      mockRequest.user = {
        id: 1,
        email: "manager@example.com",
        tenantId: "tenant-123",
        first_name: "Manager",
        last_name: "User",
        role: "MANAGER",
        status: "ACTIVE",
      };

      const middleware = requireRole(["ADMIN", "MANAGER", "SUPERVISOR"]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should deny access when user has insufficient role", () => {
      mockRequest.user = {
        id: 1,
        email: "user@example.com",
        tenantId: "tenant-123",
        first_name: "Regular",
        last_name: "User",
        role: "USER",
        status: "ACTIVE",
      };

      const middleware = requireRole(["ADMIN", "MANAGER"]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Permissions insuffisantes",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should deny access when user is not authenticated", () => {
      mockRequest.user = undefined;

      const middleware = requireRole(["ADMIN"]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentification requise",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should allow access for single required role", () => {
      mockRequest.user = {
        id: 1,
        email: "admin@example.com",
        tenantId: "tenant-123",
        first_name: "Admin",
        last_name: "User",
        role: "ADMIN",
        status: "ACTIVE",
      };

      const middleware = requireRole(["ADMIN"]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should handle role comparison case-sensitively", () => {
      mockRequest.user = {
        id: 1,
        email: "user@example.com",
        tenantId: "tenant-123",
        first_name: "User",
        last_name: "Test",
        role: "admin",
        status: "ACTIVE",
      };

      const middleware = requireRole(["ADMIN"]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return function that can be called multiple times", () => {
      const middleware = requireRole(["ADMIN"]);

      mockRequest.user = {
        id: 1,
        email: "admin@example.com",
        role: "ADMIN",
        tenantId: "tenant-123",
        first_name: "Admin",
        last_name: "User",
        status: "ACTIVE",
      };

      // First call
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);

      // Reset mocks
      vi.clearAllMocks();

      // Second call with different user
      mockRequest.user = {
        id: 2,
        email: "user@example.com",
        role: "USER",
        tenantId: "tenant-123",
        first_name: "Regular",
        last_name: "User",
        status: "ACTIVE",
      };

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it("should handle empty roles array", () => {
      mockRequest.user = {
        id: 1,
        email: "user@example.com",
        role: "ADMIN",
        tenantId: "tenant-123",
        first_name: "User",
        last_name: "Test",
        status: "ACTIVE",
      };

      const middleware = requireRole([]);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Integration & Edge Cases
  // ==========================================
  describe("Integration & Edge Cases", () => {
    it("should work with verifyToken then requireRole chain", () => {
      const mockDecodedToken = {
        id: 1,
        email: "admin@example.com",
        tenantId: "tenant-123",
        role: "ADMIN",
      };

      mockRequest.headers = {
        authorization: "Bearer valid.token",
      };

      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as never);

      // First middleware: verifyToken
      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();

      // Reset next function
      nextFunction = vi.fn();

      // Second middleware: requireRole
      const roleMiddleware = requireRole(["ADMIN"]);
      roleMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should handle malformed Authorization header", () => {
      mockRequest.headers = {
        authorization: "InvalidFormat token.here",
      };

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Token d'accès requis",
      });
    });

    it("should handle Authorization header without Bearer", () => {
      mockRequest.headers = {
        authorization: "just.a.token",
      };

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it("should not leak sensitive information in error messages", () => {
      mockRequest.headers = {
        authorization: "Bearer invalid.token",
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Secret key mismatch: expected 'abc123'");
      });

      verifyToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Token invalide",
      });
    });
  });
});
