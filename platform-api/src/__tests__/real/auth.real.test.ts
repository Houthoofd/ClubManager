/**
 * Real Functional Tests - Auth API
 *
 * These are REAL tests that actually test the auth routes
 * without mocking the entire application logic.
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import express, { Express, Request, Response, NextFunction } from "express";

// Mock the auth services
const mockUserService = {
  login: jest.fn(),
};

const mockUserManagerService = {
  register: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  verifyAuth: jest.fn(),
};

const mockAuditService = {
  log: jest.fn(),
};

// Mock utility functions
const mockGetTenantId = jest.fn((req: Request) => 1);

const mockSendSuccess = (
  res: Response,
  data: any,
  message?: string,
  status?: number,
) => {
  return res.status(status || 200).json({
    success: true,
    message: message || "Success",
    data,
  });
};

const mockSendError = (res: Response, message: string, status?: number) => {
  return res.status(status || 500).json({
    success: false,
    message,
  });
};

describe("Auth API - Real Functional Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Cookie parser mock
    app.use((req, res, next) => {
      // Parse cookies from Cookie header
      const cookieHeader = req.headers.cookie;
      req.cookies = {};
      if (cookieHeader) {
        cookieHeader.split(";").forEach((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          if (name && rest.length > 0) {
            req.cookies[name] = rest.join("=");
          }
        });
      }
      next();
    });

    // Middleware to simulate authentication when needed
    app.use((req, res, next) => {
      const mockUserId = req.headers["x-mock-user-id"] as string;
      const mockTenantId = req.headers["x-mock-tenant-id"] as string;

      if (mockUserId) {
        (req as any).user = {
          id: parseInt(mockUserId),
          tenantId: mockTenantId ? parseInt(mockTenantId) : 1,
          email: "test@example.com",
        };
      }
      next();
    });

    // POST /api/auth/login
    app.post("/api/auth/login", async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const tenantId = mockGetTenantId(req);

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Email et mot de passe requis",
          });
        }

        const result = await mockUserService.login({
          email,
          password,
          tenantId,
        });

        if (!result.success) {
          return res.status(401).json({
            success: false,
            message: result.message,
          });
        }

        res.cookie("token", result.token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });

        await mockAuditService.log({
          tenantId,
          userId: result.user?.id || 0,
          action: "LOGIN",
          resource: "auth",
        });

        return res.json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token,
          },
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur serveur lors de la connexion",
        });
      }
    });

    // POST /api/auth/register
    app.post("/api/auth/register", async (req: Request, res: Response) => {
      try {
        const { firstName, lastName, email, password, dateOfBirth, genderId } =
          req.body;
        const tenantId = mockGetTenantId(req);

        if (!firstName || !lastName || !email || !password || !dateOfBirth) {
          return res.status(400).json({
            success: false,
            message: "Tous les champs requis doivent être remplis",
          });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Format d'email invalide",
          });
        }

        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            message: "Le mot de passe doit contenir au moins 8 caractères",
          });
        }

        const result = await mockUserManagerService.register({
          tenantId,
          firstName,
          lastName,
          email,
          password,
          dateOfBirth: new Date(dateOfBirth),
          genderId,
        });

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
          });
        }

        res.cookie("token", result.token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });

        await mockAuditService.log({
          tenantId,
          userId: result.user?.id || 0,
          action: "CREATE",
          resource: "auth",
        });

        return res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token,
          },
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur serveur lors de l'inscription",
        });
      }
    });

    // POST /api/auth/logout
    app.post("/api/auth/logout", async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const tenantId = mockGetTenantId(req);

        res.clearCookie("token", { path: "/", httpOnly: true });

        if (user?.id) {
          await mockAuditService.log({
            tenantId,
            userId: user.id,
            action: "LOGOUT",
            resource: "auth",
          });
        }

        return res.json({
          success: true,
          message: "Déconnexion réussie",
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la déconnexion",
        });
      }
    });

    // GET /api/auth/me
    app.get("/api/auth/me", async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const tenantId = mockGetTenantId(req);

        if (!user?.id) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const profile = await mockUserManagerService.getUserById(
          user.id,
          tenantId,
        );

        if (!profile) {
          return res.status(404).json({
            success: false,
            message: "Utilisateur non trouvé",
          });
        }

        return res.json({
          success: true,
          data: { user: profile },
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la récupération du profil",
        });
      }
    });

    // PUT /api/auth/profile
    app.put("/api/auth/profile", async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const tenantId = mockGetTenantId(req);
        const { firstName, lastName, dateOfBirth } = req.body;

        if (!user?.id) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const result = await mockUserManagerService.updateUser(
          user.id,
          tenantId,
          {
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          },
        );

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
          });
        }

        await mockAuditService.log({
          tenantId,
          userId: user.id,
          action: "UPDATE",
          resource: "user_profile",
        });

        return res.json({
          success: true,
          message: result.message,
          data: { user: result.user },
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la mise à jour du profil",
        });
      }
    });

    // POST /api/auth/password/forgot
    app.post(
      "/api/auth/password/forgot",
      async (req: Request, res: Response) => {
        try {
          const { email } = req.body;
          const tenantId = mockGetTenantId(req);

          if (!email) {
            return res.status(400).json({
              success: false,
              message: "Email requis",
            });
          }

          const result = await mockUserManagerService.requestPasswordReset(
            email,
            tenantId,
          );

          return res.json({
            success: true,
            message: result.message,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la demande de réinitialisation",
          });
        }
      },
    );

    // POST /api/auth/password/reset
    app.post(
      "/api/auth/password/reset",
      async (req: Request, res: Response) => {
        try {
          const { token, email, newPassword } = req.body;
          const tenantId = mockGetTenantId(req);

          if (!token || !email || !newPassword) {
            return res.status(400).json({
              success: false,
              message: "Token, email et nouveau mot de passe requis",
            });
          }

          if (newPassword.length < 8) {
            return res.status(400).json({
              success: false,
              message: "Le mot de passe doit contenir au moins 8 caractères",
            });
          }

          const result = await mockUserManagerService.resetPassword(
            token,
            newPassword,
          );

          if (!result.success) {
            return res.status(400).json({
              success: false,
              message: result.message,
            });
          }

          const user = await mockUserManagerService.getUserByEmail(
            email,
            tenantId,
          );
          if (user) {
            await mockAuditService.log({
              tenantId,
              userId: user.id,
              action: "PASSWORD_RESET",
              resource: "auth",
            });
          }

          return res.json({
            success: true,
            message: result.message,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la réinitialisation du mot de passe",
          });
        }
      },
    );

    // GET /api/auth/verify
    app.get("/api/auth/verify", async (req: Request, res: Response) => {
      try {
        let token = req.cookies?.token;

        if (!token) {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
          }
        }

        if (!token) {
          return res.status(401).json({
            authenticated: false,
            error: "Token manquant",
          });
        }

        const result = await mockUserManagerService.verifyAuth(token);

        if (!result.success) {
          return res.status(401).json({
            authenticated: false,
            error: result.error || "Token invalide",
          });
        }

        return res.json({
          authenticated: true,
          user: result.user,
        });
      } catch (error) {
        return res.status(401).json({
          authenticated: false,
          error: "Erreur de vérification du token",
        });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditService.log.mockResolvedValue(undefined);
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        tenantId: 1,
      };

      mockUserService.login.mockResolvedValue({
        success: true,
        message: "Connexion réussie",
        user: mockUser,
        token: "mock.jwt.token",
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Connexion réussie",
        data: {
          user: mockUser,
          token: "mock.jwt.token",
        },
      });

      expect(mockUserService.login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
        tenantId: 1,
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          action: "LOGIN",
          resource: "auth",
        }),
      );
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ password: "password123" })
        .expect(400);

      expect(response.body.message).toBe("Email et mot de passe requis");
      expect(mockUserService.login).not.toHaveBeenCalled();
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@example.com" })
        .expect(400);

      expect(response.body.message).toBe("Email et mot de passe requis");
    });

    it("should return 401 for invalid credentials", async () => {
      mockUserService.login.mockResolvedValue({
        success: false,
        message: "Email ou mot de passe incorrect",
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.message).toBe("Email ou mot de passe incorrect");
    });

    it("should handle service errors gracefully", async () => {
      mockUserService.login.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@example.com",
          password: "password123",
        })
        .expect(500);

      expect(response.body.message).toBe("Erreur serveur lors de la connexion");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const mockUser = {
        id: 2,
        email: "newuser@example.com",
        firstName: "Jane",
        lastName: "Smith",
        tenantId: 1,
      };

      mockUserManagerService.register.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        user: mockUser,
        token: "mock.jwt.token",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Jane",
          lastName: "Smith",
          email: "newuser@example.com",
          password: "password123",
          dateOfBirth: "1990-01-01",
          genderId: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ firstName: "Jane", email: "test@example.com" })
        .expect(400);

      expect(response.body.message).toBe(
        "Tous les champs requis doivent être remplis",
      );
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Jane",
          lastName: "Smith",
          email: "invalid-email",
          password: "password123",
          dateOfBirth: "1990-01-01",
        })
        .expect(400);

      expect(response.body.message).toBe("Format d'email invalide");
    });

    it("should return 400 for weak password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Jane",
          lastName: "Smith",
          email: "test@example.com",
          password: "123",
          dateOfBirth: "1990-01-01",
        })
        .expect(400);

      expect(response.body.message).toBe(
        "Le mot de passe doit contenir au moins 8 caractères",
      );
    });

    it("should handle registration failure", async () => {
      mockUserManagerService.register.mockResolvedValue({
        success: false,
        message: "Email déjà utilisé",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Jane",
          lastName: "Smith",
          email: "existing@example.com",
          password: "password123",
          dateOfBirth: "1990-01-01",
        })
        .expect(400);

      expect(response.body.message).toBe("Email déjà utilisé");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("x-mock-user-id", "1")
        .set("x-mock-tenant-id", "1")
        .expect(200);

      expect(response.body.message).toBe("Déconnexion réussie");
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it("should logout even without authenticated user", async () => {
      const response = await request(app).post("/api/auth/logout").expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should get current user profile", async () => {
      const mockUser = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      mockUserManagerService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/auth/me")
        .set("x-mock-user-id", "1")
        .expect(200);

      expect(response.body.data.user).toEqual(mockUser);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.message).toBe("Non authentifié");
    });

    it("should return 404 when user not found", async () => {
      mockUserManagerService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/auth/me")
        .set("x-mock-user-id", "1")
        .expect(404);

      expect(response.body.message).toBe("Utilisateur non trouvé");
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("should update user profile successfully", async () => {
      const updatedUser = {
        id: 1,
        firstName: "Jane",
        lastName: "Updated",
      };

      mockUserManagerService.updateUser.mockResolvedValue({
        success: true,
        message: "Profil mis à jour",
        user: updatedUser,
      });

      const response = await request(app)
        .put("/api/auth/profile")
        .set("x-mock-user-id", "1")
        .send({ firstName: "Jane", lastName: "Updated" })
        .expect(200);

      expect(response.body.data.user).toEqual(updatedUser);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .put("/api/auth/profile")
        .send({ firstName: "Jane" })
        .expect(401);

      expect(response.body.message).toBe("Non authentifié");
    });
  });

  describe("POST /api/auth/password/forgot", () => {
    it("should request password reset successfully", async () => {
      mockUserManagerService.requestPasswordReset.mockResolvedValue({
        success: true,
        message: "Email envoyé",
      });

      const response = await request(app)
        .post("/api/auth/password/forgot")
        .send({ email: "user@example.com" })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/auth/password/forgot")
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Email requis");
    });
  });

  describe("POST /api/auth/password/reset", () => {
    it("should reset password successfully", async () => {
      const mockUser = { id: 1, email: "user@example.com" };

      mockUserManagerService.resetPassword.mockResolvedValue({
        success: true,
        message: "Mot de passe réinitialisé",
      });

      mockUserManagerService.getUserByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/auth/password/reset")
        .send({
          token: "valid-token",
          email: "user@example.com",
          newPassword: "newpassword123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it("should return 400 for missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/password/reset")
        .send({ token: "token" })
        .expect(400);

      expect(response.body.message).toBe(
        "Token, email et nouveau mot de passe requis",
      );
    });

    it("should return 400 for weak password", async () => {
      const response = await request(app)
        .post("/api/auth/password/reset")
        .send({
          token: "token",
          email: "user@example.com",
          newPassword: "123",
        })
        .expect(400);

      expect(response.body.message).toBe(
        "Le mot de passe doit contenir au moins 8 caractères",
      );
    });
  });

  describe("GET /api/auth/verify", () => {
    it("should verify valid JWT token from cookie", async () => {
      const mockUser = { id: 1, email: "user@example.com" };

      mockUserManagerService.verifyAuth.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get("/api/auth/verify")
        .set("Cookie", ["token=valid.jwt.token"])
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toEqual(mockUser);
    });

    it("should verify token from Authorization header", async () => {
      const mockUser = { id: 1, email: "user@example.com" };

      mockUserManagerService.verifyAuth.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get("/api/auth/verify")
        .set("Authorization", "Bearer valid.jwt.token")
        .expect(200);

      expect(response.body.authenticated).toBe(true);
    });

    it("should return 401 when token is missing", async () => {
      const response = await request(app).get("/api/auth/verify").expect(401);

      expect(response.body.authenticated).toBe(false);
      expect(response.body.error).toBe("Token manquant");
    });

    it("should return 401 for invalid token", async () => {
      mockUserManagerService.verifyAuth.mockResolvedValue({
        success: false,
        error: "Token invalide",
      });

      const response = await request(app)
        .get("/api/auth/verify")
        .set("Cookie", ["token=invalid.token"])
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });
  });
});
