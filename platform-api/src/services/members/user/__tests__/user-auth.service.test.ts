import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { userAuthService } from "../user-auth.service.js";
import { prisma } from "../../../prisma/prisma.service.js";
import { emailService } from "../../../operations/communication/email.service.js";
import { userService } from "../user.service.js";

jest.mock("../../../prisma/prisma.service.js", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../operations/communication/email.service.js", () => ({
  emailService: {
    sendWelcomeEmail: jest.fn(),
  },
}));

jest.mock("../user.service.js", () => ({
  userService: {
    verifyPassword: jest.fn(),
    generateToken: jest.fn(),
    hashPassword: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

describe("UserAuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("login", () => {
    const validCredentials = {
      email: "john@example.com",
      password: "Password123!",
      tenantId: "tenant-123",
    };

    describe("Successful Login", () => {
      it("should login user with valid credentials", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: { id: 1, nom: "Active" },
          genre: { id: 1, nom: "Male" },
          grade: { id: 1, nom: "Member" },
          abonnement: null,
        };

        const mockToken = "jwt.token.here";

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(true);
        jest.fn(userService.generateToken).mockReturnValue(mockToken);

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Connexion réussie");
        expect(result.user).toBeDefined();
        expect(result.user?.id).toBe(1);
        expect(result.user?.email).toBe("john@example.com");
        expect(result.token).toBe(mockToken);
      });

      it("should generate JWT token with correct payload", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: { id: 1, nom: "Active" },
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(true);
        jest.fn(userService.generateToken).mockReturnValue("token");

        await userAuthService.login(validCredentials);

        expect(userService.generateToken).toHaveBeenCalledWith(
          1,
          "john@example.com",
          "tenant-123",
          1,
        );
      });

      it("should return user profile without password", async () => {
        const mockUser = {
          id: 2,
          email: "jane@example.com",
          firstName: "Jane",
          lastName: "Smith",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1995-05-15"),
          statusId: 2,
          status: { id: 2, nom: "Premium" },
          genre: { id: 2, nom: "Female" },
          grade: { id: 2, nom: "Gold" },
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(true);
        jest.fn(userService.generateToken).mockReturnValue("token");

        const result = await userAuthService.login(validCredentials);

        expect(result.user).toBeDefined();
        expect(result.user).not.toHaveProperty("password");
      });

      it("should query user with email and tenantId", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(true);
        jest.fn(userService.generateToken).mockReturnValue("token");

        await userAuthService.login(validCredentials);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: {
            unique_email_per_tenant: {
              email: "john@example.com",
              tenantId: "tenant-123",
            },
          },
          include: {
            status: true,
            genre: true,
            grade: true,
            abonnement: true,
          },
        });
      });
    });

    describe("Validation Errors", () => {
      it("should reject login without email", async () => {
        const result = await userAuthService.login({
          email: "",
          password: "Password123!",
          tenantId: "tenant-123",
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe("Email et mot de passe requis");
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should reject login without password", async () => {
        const result = await userAuthService.login({
          email: "john@example.com",
          password: "",
          tenantId: "tenant-123",
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe("Email et mot de passe requis");
      });

      it("should reject login with null email", async () => {
        const result = await userAuthService.login({
          email: null as any,
          password: "Password123!",
          tenantId: "tenant-123",
        });

        expect(result.success).toBe(false);
      });

      it("should reject login with null password", async () => {
        const result = await userAuthService.login({
          email: "john@example.com",
          password: null as any,
          tenantId: "tenant-123",
        });

        expect(result.success).toBe(false);
      });
    });

    describe("User Not Found", () => {
      it("should reject login when user does not exist", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Email ou mot de passe incorrect");
        expect(result.user).toBeUndefined();
        expect(result.token).toBeUndefined();
      });

      it("should not reveal if email exists", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);

        const result = await userAuthService.login(validCredentials);

        expect(result.message).not.toContain("utilisateur");
        expect(result.message).not.toContain("trouvé");
      });
    });

    describe("Inactive User", () => {
      it("should reject login for inactive user", async () => {
        const mockInactiveUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: false,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(
          mockInactiveUser as any,
        );

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "Compte désactivé. Contactez l'administrateur.",
        );
      });

      it("should not verify password for inactive user", async () => {
        const mockInactiveUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: false,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(
          mockInactiveUser as any,
        );

        await userAuthService.login(validCredentials);

        expect(userService.verifyPassword).not.toHaveBeenCalled();
      });
    });

    describe("Invalid Password", () => {
      it("should reject login with incorrect password", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(false);

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Email ou mot de passe incorrect");
      });

      it("should reject login when password is null in database", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: null,
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Aucun mot de passe défini pour ce compte");
      });

      it("should not generate token for failed login", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(false);

        await userAuthService.login(validCredentials);

        expect(userService.generateToken).not.toHaveBeenCalled();
      });
    });

    describe("Error Handling", () => {
      it("should handle database errors gracefully", async () => {
        jest.fn(prisma.user.findUnique).mockRejectedValue(
          new Error("Database connection failed"),
        );

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Erreur lors de la connexion");
      });

      it("should handle password verification errors", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockRejectedValue(
          new Error("Bcrypt error"),
        );

        const result = await userAuthService.login(validCredentials);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Erreur lors de la connexion");
      });
    });

    describe("Security", () => {
      it("should not leak sensitive information in errors", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);

        const result = await userAuthService.login(validCredentials);

        expect(result.message).not.toContain("database");
        expect(result.message).not.toContain("id");
        expect(result.message).not.toContain("tenant");
      });

      it("should verify password in constant time (via bcrypt)", async () => {
        const mockUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          status: null,
          genre: null,
          grade: null,
          abonnement: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.fn(userService.verifyPassword).mockResolvedValue(true);
        jest.fn(userService.generateToken).mockReturnValue("token");

        await userAuthService.login(validCredentials);

        expect(userService.verifyPassword).toHaveBeenCalledWith(
          "Password123!",
          "hashed_password",
        );
      });
    });
  });

  describe("register", () => {
    const validRegisterData = {
      tenantId: "tenant-123",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: new Date("1990-01-01"),
      genderId: 1,
    };

    describe("Successful Registration", () => {
      it("should register new user with valid data", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockResolvedValue(
          "hashed_password",
        );

        const mockCreatedUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
          status: { id: 1, nom: "Active" },
          genre: { id: 1, nom: "Male" },
          grade: { id: 1, nom: "Member" },
        };

        jest.fn(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
        jest.fn(userService.generateToken).mockReturnValue("new.jwt.token");

        const mockTenant = {
          id: "tenant-123",
          name: "Test Tenant",
          slug: "test-tenant",
        };
        jest.fn(prisma.tenant.findUnique).mockResolvedValue(
          mockTenant as any,
        );

        const result = await userAuthService.register(validRegisterData);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Inscription réussie");
        expect(result.user).toBeDefined();
        expect(result.token).toBe("new.jwt.token");
      });

      it("should hash password before storing", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockResolvedValue(
          "hashed_password_123",
        );

        const mockCreatedUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed_password_123",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
          status: null,
          genre: null,
          grade: null,
        };

        jest.fn(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
        jest.fn(userService.generateToken).mockReturnValue("token");
        jest.fn(prisma.tenant.findUnique).mockResolvedValue({
          id: "tenant-123",
          name: "Test",
          slug: "test",
        } as any);

        await userAuthService.register(validRegisterData);

        expect(userService.hashPassword).toHaveBeenCalledWith("Password123!");
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              password: "hashed_password_123",
            }),
          }),
        );
      });

      it("should set default status and grade", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockResolvedValue("hashed");

        const mockCreatedUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
          status: null,
          genre: null,
          grade: null,
        };

        jest.fn(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
        jest.fn(userService.generateToken).mockReturnValue("token");
        jest.fn(prisma.tenant.findUnique).mockResolvedValue({
          id: "tenant-123",
          name: "Test",
          slug: "test",
        } as any);

        await userAuthService.register(validRegisterData);

        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              statusId: 1,
              gradeId: 1,
              actif: true,
            }),
          }),
        );
      });

      it("should send welcome email after registration", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockResolvedValue("hashed");

        const mockCreatedUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
          status: null,
          genre: null,
          grade: null,
        };

        jest.fn(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
        jest.fn(userService.generateToken).mockReturnValue("token");

        const mockTenant = {
          id: "tenant-123",
          name: "Test Club",
          slug: "test-club",
        };
        jest.fn(prisma.tenant.findUnique).mockResolvedValue(
          mockTenant as any,
        );
        jest.fn(emailService.sendWelcomeEmail).mockResolvedValue(
          undefined as any,
        );

        await userAuthService.register(validRegisterData);

        // Wait a bit for async email sending
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
          "john@example.com",
          expect.objectContaining({
            userName: "John Doe",
            tenantName: "Test Club",
            loginUrl: expect.stringContaining("login"),
          }),
        );
      });

      it("should generate JWT token for new user", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockResolvedValue("hashed");

        const mockCreatedUser = {
          id: 5,
          email: "new@example.com",
          firstName: "New",
          lastName: "User",
          password: "hashed",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
          status: null,
          genre: null,
          grade: null,
        };

        jest.fn(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
        jest.fn(userService.generateToken).mockReturnValue("generated.token");
        jest.fn(prisma.tenant.findUnique).mockResolvedValue({
          id: "tenant-123",
          name: "Test",
          slug: "test",
        } as any);

        await userAuthService.register(validRegisterData);

        expect(userService.generateToken).toHaveBeenCalledWith(
          5,
          "new@example.com",
          "tenant-123",
          1,
        );
      });
    });

    describe("Duplicate User", () => {
      it("should reject registration when email already exists", async () => {
        const existingUser = {
          id: 1,
          email: "john@example.com",
          firstName: "Existing",
          lastName: "User",
          password: "hashed",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(
          existingUser as any,
        );

        const result = await userAuthService.register(validRegisterData);

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "Un utilisateur avec cet email existe déjà",
        );
        expect(prisma.user.create).not.toHaveBeenCalled();
      });

      it("should check email uniqueness per tenant", async () => {
        const existingUser = {
          id: 1,
          email: "john@example.com",
          firstName: "Existing",
          lastName: "User",
          password: "hashed",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
        };

        jest.fn(prisma.user.findUnique).mockResolvedValue(
          existingUser as any,
        );

        await userAuthService.register(validRegisterData);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: {
            unique_email_per_tenant: {
              email: "john@example.com",
              tenantId: "tenant-123",
            },
          },
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle database errors during registration", async () => {
        jest.fn(prisma.user.findUnique).mockRejectedValue(
          new Error("Database error"),
        );

        const result = await userAuthService.register(validRegisterData);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Erreur lors de l'inscription");
      });

      it("should handle password hashing errors", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockRejectedValue(
          new Error("Hashing error"),
        );

        const result = await userAuthService.register(validRegisterData);

        expect(result.success).toBe(false);
      });

      it("should continue even if welcome email fails", async () => {
        jest.fn(prisma.user.findUnique).mockResolvedValue(null);
        jest.fn(userService.hashPassword).mockResolvedValue("hashed");

        const mockCreatedUser = {
          id: 1,
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "hashed",
          actif: true,
          tenantId: "tenant-123",
          dateOfBirth: new Date("1990-01-01"),
          statusId: 1,
          gradeId: 1,
          genderId: 1,
          userId: null,
          status: null,
          genre: null,
          grade: null,
        };

        jest.fn(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
        jest.fn(userService.generateToken).mockReturnValue("token");
        jest.fn(prisma.tenant.findUnique).mockResolvedValue({
          id: "tenant-123",
          name: "Test",
          slug: "test",
        } as any);
        jest.fn(emailService.sendWelcomeEmail).mockRejectedValue(
          new Error("Email service down"),
        );

        const result = await userAuthService.register(validRegisterData);

        expect(result.success).toBe(true);
      });
    });
  });

  describe("logout", () => {
    it("should return success for logout", async () => {
      const result = await userAuthService.logout(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Déconnexion réussie");
    });

    it("should handle errors during logout", async () => {
      // Force an error
      const result = await userAuthService.logout(null as any);

      // Should still succeed as logout is mostly client-side
      expect(result.success).toBe(true);
    });
  });

  describe("refreshToken", () => {
    it("should refresh valid token", async () => {
      const mockDecoded = {
        id: 1,
        email: "john@example.com",
        tenantId: "tenant-123",
      };

      const mockUser = {
        id: 1,
        email: "john@example.com",
        actif: true,
        tenantId: "tenant-123",
        statusId: 1,
      };

      jest.fn(userService.verifyToken).mockReturnValue(mockDecoded as any);
      jest.fn(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      jest.fn(userService.generateToken).mockReturnValue(
        "new.refreshed.token",
      );

      const result = await userAuthService.refreshToken("old.token");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Token rafraîchi avec succès");
      expect(result.token).toBe("new.refreshed.token");
    });

    it("should reject invalid token", async () => {
      jest.fn(userService.verifyToken).mockReturnValue(null);

      const result = await userAuthService.refreshToken("invalid.token");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token invalide");
    });

    it("should reject token for non-existent user", async () => {
      const mockDecoded = {
        id: 999,
        email: "deleted@example.com",
        tenantId: "tenant-123",
      };

      jest.fn(userService.verifyToken).mockReturnValue(mockDecoded as any);
      jest.fn(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userAuthService.refreshToken("token");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Utilisateur non trouvé ou inactif");
    });

    it("should reject token for inactive user", async () => {
      const mockDecoded = {
        id: 1,
        email: "john@example.com",
        tenantId: "tenant-123",
      };

      const mockInactiveUser = {
        id: 1,
        email: "john@example.com",
        actif: false,
        tenantId: "tenant-123",
        statusId: 1,
      };

      jest.fn(userService.verifyToken).mockReturnValue(mockDecoded as any);
      jest.fn(prisma.user.findUnique).mockResolvedValue(
        mockInactiveUser as any,
      );

      const result = await userAuthService.refreshToken("token");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Utilisateur non trouvé ou inactif");
    });
  });

  describe("verifyAuthentication", () => {
    it("should verify authenticated user", async () => {
      const mockUser = {
        id: 1,
        email: "john@example.com",
        tenantId: "tenant-123",
      };

      const mockProfile = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        dateOfBirth: new Date("1990-01-01"),
        actif: true,
        tenantId: "tenant-123",
      };

      jest.fn(userService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      jest.fn(userService.getUserById).mockResolvedValue(mockProfile);

      const result = await userAuthService.verifyAuthentication("valid.token");

      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockProfile);
    });

    it("should reject unauthenticated request", async () => {
      jest.fn(userService.verifyAuth).mockResolvedValue({
        success: false,
        error: "Token invalide",
      });

      const result =
        await userAuthService.verifyAuthentication("invalid.token");

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe("Token invalide");
    });

    it("should handle user not found after token verification", async () => {
      const mockUser = {
        id: 1,
        email: "john@example.com",
        tenantId: "tenant-123",
      };

      jest.fn(userService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      jest.fn(userService.getUserById).mockResolvedValue(null);

      const result = await userAuthService.verifyAuthentication("token");

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe("Utilisateur non trouvé");
    });
  });

  describe("verifyEmailToken", () => {
    it("should return not implemented", async () => {
      const result = await userAuthService.verifyEmailToken(
        "token",
        "email@example.com",
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email verification not implemented");
    });
  });
});
