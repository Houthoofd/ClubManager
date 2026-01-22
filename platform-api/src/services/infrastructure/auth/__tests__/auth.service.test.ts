import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AuthService } from "../auth.service";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { prisma } from "../../../prisma/prisma.service";

// Mock dependencies
vi.mock("../../../prisma/prisma.service", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcrypt");
vi.mock("jsonwebtoken");

describe("AuthService", () => {
  let authService: AuthService;
  const mockJwtSecret = "test-jwt-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = mockJwtSecret;
    authService = new AuthService();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  // ==========================================
  // Password Hashing Tests
  // ==========================================
  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "TestPassword123!";
      const hashedPassword = "$2b$10$hashedpassword";

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await authService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("should use correct salt rounds", async () => {
      const password = "password123";
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);

      await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("should throw error when hashing fails", async () => {
      const password = "password123";
      const error = new Error("Hashing failed");

      vi.mocked(bcrypt.hash).mockRejectedValue(error);

      await expect(authService.hashPassword(password)).rejects.toThrow(
        "Error hashing password"
      );
    });

    it("should handle empty password", async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);

      await authService.hashPassword("");

      expect(bcrypt.hash).toHaveBeenCalledWith("", 10);
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);

      await authService.hashPassword(longPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
    });
  });

  // ==========================================
  // Password Verification Tests
  // ==========================================
  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const password = "correctPassword";
      const hash = "$2b$10$hashedpassword";

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.verifyPassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it("should return false for incorrect password", async () => {
      const password = "wrongPassword";
      const hash = "$2b$10$hashedpassword";

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.verifyPassword(password, hash);

      expect(result).toBe(false);
    });

    it("should return false when bcrypt compare throws error", async () => {
      const password = "password";
      const hash = "invalid-hash";

      vi.mocked(bcrypt.compare).mockRejectedValue(new Error("Invalid hash"));

      const result = await authService.verifyPassword(password, hash);

      expect(result).toBe(false);
    });

    it("should handle empty password", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.verifyPassword("", "hash");

      expect(result).toBe(false);
    });

    it("should handle empty hash", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.verifyPassword("password", "");

      expect(result).toBe(false);
    });
  });

  // ==========================================
  // Token Generation Tests
  // ==========================================
  describe("generateToken", () => {
    it("should generate JWT token with correct payload", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
      };
      const mockToken = "jwt.token.here";

      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const token = authService.generateToken(user);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
        },
        mockJwtSecret,
        { expiresIn: "24h" }
      );
    });

    it("should use JWT_SECRET from environment", () => {
      const user = { id: 1, email: "test@example.com", tenantId: "tenant-1" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      authService.generateToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        mockJwtSecret,
        expect.any(Object)
      );
    });

    it("should set 24h expiration", () => {
      const user = { id: 1, email: "test@example.com", tenantId: "tenant-1" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      authService.generateToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: "24h" }
      );
    });

    it("should handle numeric user ID", () => {
      const user = { id: 999, email: "test@example.com", tenantId: "tenant-1" };
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      authService.generateToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 999 }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  // ==========================================
  // Token Verification Tests (Simple)
  // ==========================================
  describe("verifyToken", () => {
    it("should verify valid token and return decoded payload", () => {
      const token = "valid.jwt.token";
      const decoded = { id: 1, email: "test@example.com", tenantId: "tenant-1" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);

      const result = authService.verifyToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, mockJwtSecret);
    });

    it("should strip Bearer prefix from token", () => {
      const token = "Bearer valid.jwt.token";
      const decoded = { id: 1, email: "test@example.com", tenantId: "tenant-1" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);

      const result = authService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
      expect(result).toEqual(decoded);
    });

    it("should return null for invalid token", () => {
      const token = "invalid.token";

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = authService.verifyToken(token);

      expect(result).toBeNull();
    });

    it("should return null for expired token", () => {
      const token = "expired.token";

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      const result = authService.verifyToken(token);

      expect(result).toBeNull();
    });

    it("should handle case-insensitive Bearer prefix", () => {
      const token = "bearer valid.jwt.token";
      const decoded = { id: 1, email: "test@example.com", tenantId: "tenant-1" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);

      authService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
    });
  });

  // ==========================================
  // verifyAuth Tests (Full Authentication)
  // ==========================================
  describe("verifyAuth", () => {
    const validToken = "valid.jwt.token";
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tenantId: "tenant-123",
      firstName: "John",
      lastName: "Doe",
      password: "hashed",
      dateOfBirth: new Date("1990-01-01"),
      actif: true,
      genderId: null,
      statusId: 1,
      gradeId: null,
      userId: null,
    };

    it("should return success with user for valid token", async () => {
      const decoded = { id: 1, email: "test@example.com", tenantId: "tenant-123" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);

      const result = await authService.verifyAuth(validToken);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(jwt.verify).toHaveBeenCalledWith(validToken, mockJwtSecret);
    });

    it("should strip Bearer prefix before verification", async () => {
      const tokenWithBearer = "Bearer valid.jwt.token";
      const decoded = { id: 1, email: "test@example.com", tenantId: "tenant-123" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);

      await authService.verifyAuth(tokenWithBearer);

      expect(jwt.verify).toHaveBeenCalledWith("valid.jwt.token", mockJwtSecret);
    });

    it("should return error when token is missing", async () => {
      const result = await authService.verifyAuth("");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token manquant");
      expect(result.user).toBeUndefined();
    });

    it("should return error when user not found", async () => {
      const decoded = { id: 999, email: "notfound@example.com", tenantId: "tenant-1" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await authService.verifyAuth(validToken);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Utilisateur non trouvé");
    });

    it("should return TOKEN_EXPIRED error for expired token", async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      const result = await authService.verifyAuth(validToken);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token expiré");
      expect(result.error).toBe("TOKEN_EXPIRED");
    });

    it("should return INVALID_TOKEN error for malformed token", async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        const error = new Error("Invalid token");
        error.name = "JsonWebTokenError";
        throw error;
      });

      const result = await authService.verifyAuth(validToken);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token invalide");
      expect(result.error).toBe("INVALID_TOKEN");
    });

    it("should return VERIFICATION_ERROR for other errors", async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await authService.verifyAuth(validToken);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur lors de la vérification du token");
      expect(result.error).toBe("VERIFICATION_ERROR");
    });

    it("should query user with correct tenant and active status", async () => {
      const decoded = { id: 1, email: "test@example.com", tenantId: "tenant-123" };

      vi.mocked(jwt.verify).mockReturnValue(decoded as never);
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);

      await authService.verifyAuth(validToken);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          tenantId: "tenant-123",
          actif: true,
        },
      });
    });
  });

  // ==========================================
  // Login Tests
  // ==========================================
  describe("login", () => {
    const credentials = {
      email: "test@example.com",
      password: "Password123!",
      tenantId: "tenant-123",
    };

    const mockUser = {
      id: 1,
      email: "test@example.com",
      tenantId: "tenant-123",
      firstName: "John",
      lastName: "Doe",
      password: "$2b$10$hashedpassword",
      dateOfBirth: new Date("1990-01-01"),
      actif: true,
      genderId: null,
      statusId: 1,
      gradeId: null,
      userId: null,
    };

    it("should login successfully with valid credentials", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue("jwt.token.here" as never);

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Connexion réussie");
      expect(result.user).toMatchObject({
        id: 1,
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });
      expect(result.token).toBe("jwt.token.here");
    });

    it("should fail when user not found", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email ou mot de passe incorrect");
      expect(result.user).toBeUndefined();
      expect(result.token).toBeUndefined();
    });

    it("should fail when user is inactive", async () => {
      const inactiveUser = { ...mockUser, actif: false };
      vi.mocked(prisma.user.findFirst).mockResolvedValue(inactiveUser as never);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email ou mot de passe incorrect");
    });

    it("should fail with incorrect password", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email ou mot de passe incorrect");
    });

    it("should query user with email, tenantId, and active status", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      await authService.login(credentials);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
          tenantId: "tenant-123",
          actif: true,
        },
      });
    });

    it("should verify password correctly", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      await authService.login(credentials);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "Password123!",
        "$2b$10$hashedpassword"
      );
    });

    it("should generate token with correct payload", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      await authService.login(credentials);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          email: "test@example.com",
          tenantId: "tenant-123",
        },
        mockJwtSecret,
        { expiresIn: "24h" }
      );
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.user.findFirst).mockRejectedValue(
        new Error("Database error")
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur lors de la connexion");
    });

    it("should handle null password in database", async () => {
      const userWithNoPassword = { ...mockUser, password: null };
      vi.mocked(prisma.user.findFirst).mockResolvedValue(
        userWithNoPassword as never
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
    });

    it("should be case-sensitive for email", async () => {
      await authService.login({
        ...credentials,
        email: "TEST@EXAMPLE.COM",
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email: "TEST@EXAMPLE.COM",
        }),
      });
    });
  });

  // ==========================================
  // Register Tests
  // ==========================================
  describe("register", () => {
    const registerData = {
      email: "newuser@example.com",
      password: "Password123!",
      firstName: "Jane",
      lastName: "Smith",
      tenantId: "tenant-123",
      dateOfBirth: new Date("1995-05-15"),
      genderId: 2,
    };

    const mockCreatedUser = {
      id: 2,
      email: "newuser@example.com",
      firstName: "Jane",
      lastName: "Smith",
      tenantId: "tenant-123",
      password: "$2b$10$hashedpassword",
      dateOfBirth: new Date("1995-05-15"),
      genderId: 2,
      actif: false,
      statusId: 1,
      gradeId: null,
      userId: null,
    };

    it("should register new user successfully", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null); // No existing user
      vi.mocked(bcrypt.hash).mockResolvedValue("$2b$10$hashedpassword" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      const result = await authService.register(registerData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Inscription réussie - Vérifiez votre email");
      expect(result.user).toMatchObject({
        id: 2,
        email: "newuser@example.com",
        firstName: "Jane",
        lastName: "Smith",
      });
    });

    it("should fail when user already exists", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 1,
        email: "newuser@example.com",
      } as never);

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Un compte existe déjà avec cet email");
    });

    it("should hash password before storing", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("$2b$10$hashedpassword" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      await authService.register(registerData);

      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: "$2b$10$hashedpassword",
          }),
        })
      );
    });

    it("should create user with actif = false (email verification required)", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      await authService.register(registerData);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actif: false,
          }),
        })
      );
    });

    it("should use default dateOfBirth when not provided", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      const dataWithoutDob = { ...registerData };
      delete (dataWithoutDob as any).dateOfBirth;

      await authService.register(dataWithoutDob);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dateOfBirth: new Date("1990-01-01"),
          }),
        })
      );
    });

    it("should use default tenantId when not provided", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      const dataWithoutTenant = { ...registerData };
      delete (dataWithoutTenant as any).tenantId;

      await authService.register(dataWithoutTenant);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: "default",
          }),
        })
      );
    });

    it("should handle null genderId", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      const dataWithoutGender = { ...registerData, genderId: undefined };

      await authService.register(dataWithoutGender);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            genderId: null,
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockRejectedValue(
        new Error("Database error")
      );

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur lors de l'inscription");
    });

    it("should store all required user fields", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as never);

      await authService.register(registerData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          firstName: "Jane",
          lastName: "Smith",
          password: "hashed",
          dateOfBirth: registerData.dateOfBirth,
          genderId: 2,
          tenantId: "tenant-123",
          actif: false,
        },
      });
    });

    it("should check for existing user with correct email and tenantId", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await authService.register(registerData);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: "newuser@example.com",
          tenantId: "tenant-123",
        },
      });
    });
  });

  // ==========================================
  // Edge Cases & Security Tests
  // ==========================================
  describe("Security & Edge Cases", () => {
    it("should use fallback JWT secret when env not set", () => {
      delete process.env.JWT_SECRET;
      const service = new AuthService();
      const user = { id: 1, email: "test@example.com", tenantId: "tenant-1" };

      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      service.generateToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        "fallback-secret-key",
        expect.any(Object)
      );
    });

    it("should not expose password in login response", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        tenantId: "tenant-123",
        firstName: "John",
        lastName: "Doe",
        password: "$2b$10$hashedpassword",
        dateOfBirth: new Date("1990-01-01"),
        actif: true,
        genderId: null,
        statusId: 1,
        gradeId: null,
        userId: null,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue("token" as never);

      const result = await authService.login({
        email: "test@example.com",
        password: "password",
        tenantId: "tenant-123",
      });

      expect(result.user).not.toHaveProperty("password");
    });

    it("should not expose password in register response", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed",
        firstName: "John",
        lastName: "Doe",
      } as never);

      const result = await authService.register({
        email: "test@example.com",
        password: "password",
        firstName: "John",
        lastName: "Doe",
        tenantId: "tenant-1",
        dateOfBirth: new Date(),
      });

      expect(result.user).not.toHaveProperty("password");
    });

    it("should handle SQL injection attempts in email", async () => {
      const maliciousEmail = "'; DROP TABLE users; --";

      await authService.login({
        email: maliciousEmail,
        password: "password",
        tenantId: "tenant-1",
      });

      // Prisma should handle this safely, no exception should be thrown
      expect(prisma.user.findFirst).toHaveBeenCalled();
    });

    it("should handle extremely long email", async () => {
      const longEmail = "a".repeat(1000) + "@example.com";

      await authService.login({
        email: longEmail,
        password: "password",
        tenantId: "tenant-1",
      });

      expect(prisma.user.findFirst).toHaveBeenCalled();
    });

    it("should handle special characters in password", async () => {
      const specialPassword = "P@$$w0rd!#%&*()[]{}";
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);

      await authService.hashPassword(specialPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 10);
    });

    it("should handle Unicode characters in name fields", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        firstName: "José",
        lastName: "François",
      } as never);

      await authService.register({
        email: "test@example.com",
        password: "password",
        firstName: "José",
        lastName: "François",
        tenantId: "tenant-1",
        dateOfBirth: new Date(),
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "José",
            lastName: "François",
          }),
        })
      );
    });
  });
});
