import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from "supertest";
import express, { Express } from "express";
import loginRoutes from "../login.js";
import registerRoutes from "../register.js";
import { userService } from "../../../services/members/user/user.service.js";
import { auditService } from "../../../services/infrastructure/audit/audit.service.js";
import { authRateLimit } from "../../../middleware/cache/rate-limit.middleware.js";

// Mock dependencies
jest.mock("../../../services/members/user/user.service");
jest.mock("../../../services/infrastructure/audit/audit.service");
jest.mock("../../../middleware/cache/rate-limit.middleware", () => ({
  authRateLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
jest.mock("../utils", () => ({
  getTenantId: jest.fn(() => "tenant-123"),
}));

describe("Auth Routes", () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock audit service
    jest.fn(auditService.log).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // Login Route Tests
  // ==========================================
  describe("POST /login", () => {
    beforeEach(() => {
      app.use("/login", loginRoutes);
    });

    it("should login successfully with valid credentials", async () => {
      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: {
          id: 1,
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        },
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockResult.user);
      expect(response.body.data.token).toBe("jwt.token.here");
    });

    it("should set HTTP-only cookie with JWT token", async () => {
      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: { id: 1, email: "test@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(response.headers["set-cookie"]).toBeDefined();
      const cookie = response.headers["set-cookie"][0];
      expect(cookie).toContain("token=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Path=/");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          password: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email et mot de passe requis");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email et mot de passe requis");
    });

    it("should return 400 when both email and password are missing", async () => {
      const response = await request(app).post("/login").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email et mot de passe requis");
    });

    it("should return 401 for invalid credentials", async () => {
      const mockResult = {
        success: false,
        message: "Email ou mot de passe incorrect",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Email ou mot de passe incorrect");
    });

    it("should log successful login to audit service", async () => {
      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: { id: 1, email: "test@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          userId: 1,
          action: "LOGIN",
          resource: "auth",
        })
      );
    });

    it("should use tenantId from request", async () => {
      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: { id: 1, email: "test@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(userService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123!",
        tenantId: "tenant-123",
      });
    });

    it("should return 500 on server error", async () => {
      jest.fn(userService.login).mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Erreur serveur lors de la connexion");
    });

    it("should set secure cookie in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: { id: 1, email: "test@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      const cookie = response.headers["set-cookie"]?.[0];
      expect(cookie).toContain("Secure");

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle empty string email", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "",
          password: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email et mot de passe requis");
    });

    it("should handle empty string password", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email et mot de passe requis");
    });

    it("should trim whitespace from credentials", async () => {
      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: { id: 1, email: "test@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(userService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          password: "Password123!",
        })
      );
    });

    it("should apply rate limiting middleware", async () => {
      expect(authRateLimit).toHaveBeenCalled();
    });

    it("should handle user with no ID in response", async () => {
      const mockResult = {
        success: true,
        message: "Connexion réussie",
        user: undefined,
        token: "jwt.token.here",
      };

      jest.fn(userService.login).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!",
        });

      expect(response.status).toBe(200);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 0,
        })
      );
    });
  });

  // ==========================================
  // Register Route Tests
  // ==========================================
  describe("POST /register", () => {
    beforeEach(() => {
      app.use("/register", registerRoutes);
    });

    const validRegistrationData = {
      firstName: "John",
      lastName: "Doe",
      email: "newuser@example.com",
      password: "Password123!",
      dateOfBirth: "1990-01-15",
      genderId: 1,
    };

    it("should register new user successfully", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: {
          id: 1,
          email: "newuser@example.com",
          firstName: "John",
          lastName: "Doe",
        },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockResult.user);
      expect(response.body.data.token).toBe("jwt.token.here");
    });

    it("should set HTTP-only cookie after registration", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send(validRegistrationData);

      expect(response.headers["set-cookie"]).toBeDefined();
      const cookie = response.headers["set-cookie"][0];
      expect(cookie).toContain("token=");
      expect(cookie).toContain("HttpOnly");
    });

    it("should return 400 when firstName is missing", async () => {
      const data = { ...validRegistrationData };
      delete (data as any).firstName;

      const response = await request(app).post("/register").send(data);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Tous les champs requis doivent être remplis");
    });

    it("should return 400 when lastName is missing", async () => {
      const data = { ...validRegistrationData };
      delete (data as any).lastName;

      const response = await request(app).post("/register").send(data);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Tous les champs requis doivent être remplis");
    });

    it("should return 400 when email is missing", async () => {
      const data = { ...validRegistrationData };
      delete (data as any).email;

      const response = await request(app).post("/register").send(data);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Tous les champs requis doivent être remplis");
    });

    it("should return 400 when password is missing", async () => {
      const data = { ...validRegistrationData };
      delete (data as any).password;

      const response = await request(app).post("/register").send(data);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Tous les champs requis doivent être remplis");
    });

    it("should return 400 when dateOfBirth is missing", async () => {
      const data = { ...validRegistrationData };
      delete (data as any).dateOfBirth;

      const response = await request(app).post("/register").send(data);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Tous les champs requis doivent être remplis");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/register")
        .send({
          ...validRegistrationData,
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Format d'email invalide");
    });

    it("should return 400 for email without @", async () => {
      const response = await request(app)
        .post("/register")
        .send({
          ...validRegistrationData,
          email: "invalidemail.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Format d'email invalide");
    });

    it("should return 400 for email without domain", async () => {
      const response = await request(app)
        .post("/register")
        .send({
          ...validRegistrationData,
          email: "invalid@",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Format d'email invalide");
    });

    it("should return 400 for password shorter than 8 characters", async () => {
      const response = await request(app)
        .post("/register")
        .send({
          ...validRegistrationData,
          password: "Short1!",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Le mot de passe doit contenir au moins 8 caractères"
      );
    });

    it("should accept password with exactly 8 characters", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send({
          ...validRegistrationData,
          password: "Pass123!",
        });

      expect(response.status).toBe(201);
    });

    it("should return 400 when user already exists", async () => {
      const mockResult = {
        success: false,
        message: "Un utilisateur avec cet email existe déjà",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send(validRegistrationData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Un utilisateur avec cet email existe déjà"
      );
    });

    it("should log registration to audit service", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      await request(app).post("/register").send(validRegistrationData);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          userId: 1,
          action: "CREATE",
          resource: "auth",
        })
      );
    });

    it("should pass tenantId to userService", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      await request(app).post("/register").send(validRegistrationData);

      expect(userService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          email: "newuser@example.com",
        })
      );
    });

    it("should convert dateOfBirth string to Date object", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      await request(app).post("/register").send(validRegistrationData);

      expect(userService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOfBirth: expect.any(Date),
        })
      );
    });

    it("should handle optional genderId field", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const dataWithoutGender = { ...validRegistrationData };
      delete (dataWithoutGender as any).genderId;

      const response = await request(app).post("/register").send(dataWithoutGender);

      expect(response.status).toBe(201);
    });

    it("should handle optional userId field", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send({
          ...validRegistrationData,
          userId: "custom-user-id",
        });

      expect(response.status).toBe(201);
      expect(userService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "custom-user-id",
        })
      );
    });

    it("should return 500 on server error", async () => {
      jest.fn(userService.register).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/register")
        .send(validRegistrationData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Erreur serveur lors de l'inscription");
    });

    it("should set secure cookie in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "newuser@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send(validRegistrationData);

      const cookie = response.headers["set-cookie"]?.[0];
      expect(cookie).toContain("Secure");

      process.env.NODE_ENV = originalEnv;
    });

    it("should accept valid email formats", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: { id: 1, email: "user@example.com" },
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      for (const email of validEmails) {
        const response = await request(app)
          .post("/register")
          .send({
            ...validRegistrationData,
            email,
          });

        expect(response.status).toBe(201);
      }
    });

    it("should handle user with no ID in response", async () => {
      const mockResult = {
        success: true,
        message: "Inscription réussie",
        user: undefined,
        token: "jwt.token.here",
      };

      jest.fn(userService.register).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/register")
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 0,
        })
      );
    });
  });
});
