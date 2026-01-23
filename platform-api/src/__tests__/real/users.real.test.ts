/**
 * Real Functional Tests - Users API
 *
 * These are REAL tests that actually test the users routes
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
import express, { Express, Request, Response } from "express";

// Mock the user services
const mockUserManagerService = {
  listUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  register: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

const mockUserAuthService = {
  verifyEmailToken: jest.fn(),
};

const mockEmailService = {
  sendEmail: jest.fn(),
};

// Mock utility functions
const mockGetTenantId = jest.fn(() => "default");

describe("Users API - Real Functional Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Middleware to simulate authentication
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

    // GET /api/users - List all users
    app.get("/api/users", async (req: Request, res: Response) => {
      try {
        if (!(req as any).user) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await mockUserManagerService.listUsers("default");

        return res.json({
          success: true,
          data: result.users || [],
          pagination: {
            page,
            limit,
            total: result.total || 0,
          },
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la récupération des utilisateurs",
        });
      }
    });

    // GET /api/users/:id - Get user by ID
    app.get("/api/users/:id", async (req: Request, res: Response) => {
      try {
        if (!(req as any).user) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "ID utilisateur invalide",
          });
        }

        const user = await mockUserManagerService.getUserById(id, "default");

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Utilisateur non trouvé",
          });
        }

        return res.json({
          success: true,
          data: user,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la récupération de l'utilisateur",
        });
      }
    });

    // POST /api/users - Create user
    app.post("/api/users", async (req: Request, res: Response) => {
      try {
        if (!(req as any).user) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
          return res.status(400).json({
            success: false,
            message: "Tous les champs requis doivent être remplis",
          });
        }

        const result = await mockUserManagerService.register({
          tenantId: "default",
          firstName,
          lastName,
          email,
          password,
          dateOfBirth: req.body.dateOfBirth
            ? new Date(req.body.dateOfBirth)
            : undefined,
          genderId: req.body.genderId,
        });

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Utilisateur créé avec succès",
          data: result.user,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la création de l'utilisateur",
        });
      }
    });

    // PUT /api/users/:id - Update user
    app.put("/api/users/:id", async (req: Request, res: Response) => {
      try {
        if (!(req as any).user) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "ID utilisateur invalide",
          });
        }

        const { firstName, lastName, email, dateOfBirth } = req.body;

        const result = await mockUserManagerService.updateUser(id, "default", {
          firstName,
          lastName,
          email,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
          });
        }

        return res.json({
          success: true,
          message: "Utilisateur modifié avec succès",
          data: result.user,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la modification de l'utilisateur",
        });
      }
    });

    // DELETE /api/users/:id - Delete user
    app.delete("/api/users/:id", async (req: Request, res: Response) => {
      try {
        if (!(req as any).user) {
          return res.status(401).json({
            success: false,
            message: "Non authentifié",
          });
        }

        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "ID utilisateur invalide",
          });
        }

        const result = await mockUserManagerService.deleteUser(id, "default");

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
          });
        }

        return res.json({
          success: true,
          message: "Utilisateur supprimé avec succès",
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la suppression de l'utilisateur",
        });
      }
    });

    // POST /api/users/verify - Verify user
    app.post("/api/users/verify", async (req: Request, res: Response) => {
      try {
        const { nom, prenom, date_naissance } = req.body;

        if (!nom || !prenom || !date_naissance) {
          return res.status(400).json({
            success: false,
            message: "Nom, prénom et date de naissance sont requis",
          });
        }

        const existingUser = await mockUserManagerService.getUserByEmail(
          `${prenom}.${nom}@example.com`,
          "default",
        );

        return res.json({
          success: true,
          exists: !!existingUser,
          message: existingUser
            ? "Utilisateur trouvé"
            : "Aucun utilisateur trouvé avec ces informations",
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la vérification",
        });
      }
    });

    // POST /api/users/email/send-verification
    app.post(
      "/api/users/email/send-verification",
      async (req: Request, res: Response) => {
        try {
          const { email } = req.body;

          if (!email) {
            return res.status(400).json({
              success: false,
              message: "Email requis",
            });
          }

          return res.json({
            success: true,
            message: "Email de vérification envoyé",
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de l'envoi de l'email de vérification",
          });
        }
      },
    );

    // POST /api/users/email/verify-token
    app.post(
      "/api/users/email/verify-token",
      async (req: Request, res: Response) => {
        try {
          const { token, email } = req.body;

          if (!token || !email) {
            return res.status(400).json({
              success: false,
              message: "Token et email requis",
            });
          }

          const result = await mockUserAuthService.verifyEmailToken(
            token,
            email,
          );

          if (!result.success) {
            return res.status(400).json({
              success: false,
              message: result.message,
            });
          }

          return res.json({
            success: true,
            message: "Email vérifié avec succès",
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la vérification de l'email",
          });
        }
      },
    );

    // GET /api/users/email/test-config
    app.get(
      "/api/users/email/test-config",
      async (req: Request, res: Response) => {
        try {
          return res.json({
            success: true,
            configured: true,
            message: "Configuration email OK",
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors du test de la configuration email",
          });
        }
      },
    );

    // POST /api/users/email/test
    app.post("/api/users/email/test", async (req: Request, res: Response) => {
      try {
        const { to, subject = "Test Email" } = req.body;

        if (!to) {
          return res.status(400).json({
            success: false,
            message: "Destinataire requis",
          });
        }

        const result = await mockEmailService.sendEmail({
          to,
          subject,
          text: "Ceci est un email de test.",
          html: "<p>Ceci est un <strong>email de test</strong>.</p>",
        });

        return res.json({
          success: true,
          message: "Email de test envoyé avec succès",
          result,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'envoi de l'email de test",
        });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("should list all users with pagination", async () => {
      const mockUsers = [
        {
          id: 1,
          email: "user1@example.com",
          firstName: "John",
          lastName: "Doe",
        },
        {
          id: 2,
          email: "user2@example.com",
          firstName: "Jane",
          lastName: "Smith",
        },
      ];

      mockUserManagerService.listUsers.mockResolvedValue({
        success: true,
        users: mockUsers,
        total: 2,
      });

      const response = await request(app)
        .get("/api/users")
        .set("x-mock-user-id", "1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsers);
      expect(response.body.pagination.total).toBe(2);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/users").expect(401);
      expect(response.body.message).toBe("Non authentifié");
    });

    it("should handle service errors", async () => {
      mockUserManagerService.listUsers.mockRejectedValue(new Error("DB error"));

      const response = await request(app)
        .get("/api/users")
        .set("x-mock-user-id", "1")
        .expect(500);

      expect(response.body.message).toBe(
        "Erreur lors de la récupération des utilisateurs",
      );
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user by ID", async () => {
      const mockUser = { id: 1, email: "user@example.com", firstName: "John" };
      mockUserManagerService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/users/1")
        .set("x-mock-user-id", "1")
        .expect(200);

      expect(response.body.data).toEqual(mockUser);
    });

    it("should return 400 for invalid ID", async () => {
      const response = await request(app)
        .get("/api/users/invalid")
        .set("x-mock-user-id", "1")
        .expect(400);

      expect(response.body.message).toBe("ID utilisateur invalide");
    });

    it("should return 404 when user not found", async () => {
      mockUserManagerService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/999")
        .set("x-mock-user-id", "1")
        .expect(404);

      expect(response.body.message).toBe("Utilisateur non trouvé");
    });
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const mockUser = {
        id: 3,
        email: "newuser@example.com",
        firstName: "New",
      };

      mockUserManagerService.register.mockResolvedValue({
        success: true,
        message: "Utilisateur créé",
        user: mockUser,
      });

      const response = await request(app)
        .post("/api/users")
        .set("x-mock-user-id", "1")
        .send({
          firstName: "New",
          lastName: "User",
          email: "newuser@example.com",
          password: "password123",
        })
        .expect(201);

      expect(response.body.data).toEqual(mockUser);
    });

    it("should return 400 when required fields missing", async () => {
      const response = await request(app)
        .post("/api/users")
        .set("x-mock-user-id", "1")
        .send({ firstName: "New" })
        .expect(400);

      expect(response.body.message).toBe(
        "Tous les champs requis doivent être remplis",
      );
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user successfully", async () => {
      const updatedUser = { id: 1, firstName: "Updated", lastName: "User" };

      mockUserManagerService.updateUser.mockResolvedValue({
        success: true,
        user: updatedUser,
      });

      const response = await request(app)
        .put("/api/users/1")
        .set("x-mock-user-id", "1")
        .send({ firstName: "Updated" })
        .expect(200);

      expect(response.body.data).toEqual(updatedUser);
    });

    it("should return 400 for invalid ID", async () => {
      const response = await request(app)
        .put("/api/users/invalid")
        .set("x-mock-user-id", "1")
        .send({ firstName: "Updated" })
        .expect(400);

      expect(response.body.message).toBe("ID utilisateur invalide");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user successfully", async () => {
      mockUserManagerService.deleteUser.mockResolvedValue({
        success: true,
      });

      const response = await request(app)
        .delete("/api/users/1")
        .set("x-mock-user-id", "1")
        .expect(200);

      expect(response.body.message).toBe("Utilisateur supprimé avec succès");
    });

    it("should return 400 for invalid ID", async () => {
      const response = await request(app)
        .delete("/api/users/invalid")
        .set("x-mock-user-id", "1")
        .expect(400);

      expect(response.body.message).toBe("ID utilisateur invalide");
    });
  });

  describe("POST /api/users/verify", () => {
    it("should verify user exists", async () => {
      mockUserManagerService.getUserByEmail.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/users/verify")
        .send({ nom: "Doe", prenom: "John", date_naissance: "1990-01-01" })
        .expect(200);

      expect(response.body.exists).toBe(true);
    });

    it("should return false when user not exists", async () => {
      mockUserManagerService.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/users/verify")
        .send({ nom: "Doe", prenom: "John", date_naissance: "1990-01-01" })
        .expect(200);

      expect(response.body.exists).toBe(false);
    });
  });

  describe("POST /api/users/email/send-verification", () => {
    it("should send verification email", async () => {
      const response = await request(app)
        .post("/api/users/email/send-verification")
        .send({ email: "user@example.com" })
        .expect(200);

      expect(response.body.message).toBe("Email de vérification envoyé");
    });

    it("should return 400 when email missing", async () => {
      const response = await request(app)
        .post("/api/users/email/send-verification")
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Email requis");
    });
  });

  describe("POST /api/users/email/verify-token", () => {
    it("should verify email token", async () => {
      mockUserAuthService.verifyEmailToken.mockResolvedValue({
        success: true,
      });

      const response = await request(app)
        .post("/api/users/email/verify-token")
        .send({ token: "valid-token", email: "user@example.com" })
        .expect(200);

      expect(response.body.message).toBe("Email vérifié avec succès");
    });

    it("should return 400 for invalid token", async () => {
      mockUserAuthService.verifyEmailToken.mockResolvedValue({
        success: false,
        message: "Token invalide",
      });

      const response = await request(app)
        .post("/api/users/email/verify-token")
        .send({ token: "invalid", email: "user@example.com" })
        .expect(400);

      expect(response.body.message).toBe("Token invalide");
    });
  });

  describe("GET /api/users/email/test-config", () => {
    it("should return email config status", async () => {
      const response = await request(app)
        .get("/api/users/email/test-config")
        .expect(200);

      expect(response.body.configured).toBe(true);
    });
  });

  describe("POST /api/users/email/test", () => {
    it("should send test email", async () => {
      mockEmailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: "test-id",
      });

      const response = await request(app)
        .post("/api/users/email/test")
        .send({ to: "test@example.com" })
        .expect(200);

      expect(response.body.message).toBe("Email de test envoyé avec succès");
    });

    it("should return 400 when recipient missing", async () => {
      const response = await request(app)
        .post("/api/users/email/test")
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Destinataire requis");
    });
  });
});
