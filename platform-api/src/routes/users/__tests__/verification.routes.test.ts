/**
 * User Verification Routes Integration Tests
 * Comprehensive tests for /api/users/verify endpoints
 *
 * Coverage:
 * - POST /api/users/verify - Verify user existence
 * - Input validation
 * - Error handling
 * - Multi-tenant isolation
 * - Edge cases
 */

import { jest } from "@jest/globals";

// Mock dependencies BEFORE imports
jest.mock("../../../services/members/users/user-manager.service.js", () => ({
  userManagerService: {
    getUserByEmail: jest.fn(),
  },
}));

import request from "supertest";
import express, { Express } from "express";
import { describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import verificationRoutes from "../verification.js";
import { userManagerService } from "../../../services/members/users/user-manager.service.js";

describe("User Verification Routes - Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use("/api/users/verify", verificationRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/users/verify - Verify User Existence", () => {
    const validVerificationData = {
      nom: "Dupont",
      prenom: "Jean",
      date_naissance: "1990-01-15",
    };

    describe("Successful Verification", () => {
      it("should verify existing user successfully", async () => {
        // Arrange
        const mockUser = {
          id: 1,
          firstName: "Jean",
          lastName: "Dupont",
          email: "Jean.Dupont@example.com",
          tenantId: "default",
          actif: true,
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          mockUser as any,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.exists).toBe(true);
        expect(response.body.message).toBe("Utilisateur trouvé");
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          "Jean.Dupont@example.com",
          "default",
        );
      });

      it("should verify non-existing user successfully", async () => {
        // Arrange
        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.exists).toBe(false);
        expect(response.body.message).toBe(
          "Aucun utilisateur trouvé avec ces informations",
        );
      });

      it("should construct email correctly from nom and prenom", async () => {
        // Arrange
        const testData = {
          nom: "Martin",
          prenom: "Sophie",
          date_naissance: "1995-06-20",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        await request(app).post("/api/users/verify").send(testData);

        // Assert
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          "Sophie.Martin@example.com",
          "default",
        );
      });

      it("should handle names with special characters", async () => {
        // Arrange
        const testData = {
          nom: "O'Connor",
          prenom: "François",
          date_naissance: "1988-03-12",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          "François.O'Connor@example.com",
          "default",
        );
      });

      it("should handle names with spaces", async () => {
        // Arrange
        const testData = {
          nom: "De La Cruz",
          prenom: "Maria Jose",
          date_naissance: "1992-11-30",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          "Maria Jose.De La Cruz@example.com",
          "default",
        );
      });
    });

    describe("Input Validation", () => {
      it("should return 400 when nom is missing", async () => {
        // Arrange
        const invalidData = {
          prenom: "Jean",
          date_naissance: "1990-01-15",
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          "Nom, prénom et date de naissance sont requis",
        );
        expect(userManagerService.getUserByEmail).not.toHaveBeenCalled();
      });

      it("should return 400 when prenom is missing", async () => {
        // Arrange
        const invalidData = {
          nom: "Dupont",
          date_naissance: "1990-01-15",
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          "Nom, prénom et date de naissance sont requis",
        );
        expect(userManagerService.getUserByEmail).not.toHaveBeenCalled();
      });

      it("should return 400 when date_naissance is missing", async () => {
        // Arrange
        const invalidData = {
          nom: "Dupont",
          prenom: "Jean",
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          "Nom, prénom et date de naissance sont requis",
        );
        expect(userManagerService.getUserByEmail).not.toHaveBeenCalled();
      });

      it("should return 400 when all fields are missing", async () => {
        // Act
        const response = await request(app).post("/api/users/verify").send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          "Nom, prénom et date de naissance sont requis",
        );
      });

      it("should return 400 when nom is empty string", async () => {
        // Arrange
        const invalidData = {
          nom: "",
          prenom: "Jean",
          date_naissance: "1990-01-15",
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it("should return 400 when prenom is empty string", async () => {
        // Arrange
        const invalidData = {
          nom: "Dupont",
          prenom: "",
          date_naissance: "1990-01-15",
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it("should return 400 when date_naissance is empty string", async () => {
        // Arrange
        const invalidData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: "",
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it("should return 400 when fields are null", async () => {
        // Arrange
        const invalidData = {
          nom: null,
          prenom: null,
          date_naissance: null,
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it("should return 400 when fields are undefined", async () => {
        // Arrange
        const invalidData = {
          nom: undefined,
          prenom: undefined,
          date_naissance: undefined,
        };

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe("Error Handling", () => {
      it("should handle service errors gracefully", async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        (userManagerService.getUserByEmail as jest.Mock).mockRejectedValue(
          new Error("Database connection failed"),
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Erreur lors de la vérification");
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it("should handle database timeout errors", async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        (userManagerService.getUserByEmail as jest.Mock).mockRejectedValue(
          new Error("Query timeout"),
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        consoleSpy.mockRestore();
      });

      it("should handle unexpected errors", async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        (userManagerService.getUserByEmail as jest.Mock).mockRejectedValue(
          new Error("Unexpected error"),
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        consoleSpy.mockRestore();
      });

      it("should not leak sensitive information in error messages", async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        (userManagerService.getUserByEmail as jest.Mock).mockRejectedValue(
          new Error(
            "Connection string: postgres://user:pass@localhost:5432/db",
          ),
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.message).not.toContain("postgres://");
        expect(response.body.message).not.toContain("password");
        expect(response.body.message).not.toContain("user:pass");

        consoleSpy.mockRestore();
      });
    });

    describe("Edge Cases", () => {
      it("should handle very long names", async () => {
        // Arrange
        const testData = {
          nom: "A".repeat(100),
          prenom: "B".repeat(100),
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should handle unicode characters in names", async () => {
        // Arrange
        const testData = {
          nom: "李明",
          prenom: "王芳",
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          "王芳.李明@example.com",
          "default",
        );
      });

      it("should handle names with diacritics", async () => {
        // Arrange
        const testData = {
          nom: "Müller",
          prenom: "José",
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          "José.Müller@example.com",
          "default",
        );
      });

      it("should handle different date formats", async () => {
        // Arrange
        const testData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: "15/01/1990",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should handle malformed JSON", async () => {
        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .set("Content-Type", "application/json")
          .send("{ invalid json }");

        // Assert
        expect(response.status).toBe(400);
      });

      it("should handle empty request body", async () => {
        // Act
        const response = await request(app).post("/api/users/verify").send();

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it("should handle extra fields in request", async () => {
        // Arrange
        const testData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: "1990-01-15",
          extraField: "should be ignored",
          anotherField: 123,
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe("Date of Birth Handling", () => {
      it("should accept ISO date format", async () => {
        // Arrange
        const testData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: "1990-01-15T00:00:00.000Z",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should accept simple date format", async () => {
        // Arrange
        const testData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should handle future dates", async () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const testData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: futureDate.toISOString(),
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should handle very old dates", async () => {
        // Arrange
        const testData = {
          nom: "Dupont",
          prenom: "Jean",
          date_naissance: "1900-01-01",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(testData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe("Multi-Tenant Isolation", () => {
      it("should always use default tenant", async () => {
        // Arrange
        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          expect.any(String),
          "default",
        );
      });

      it("should not allow tenant override via request body", async () => {
        // Arrange
        const testData = {
          ...validVerificationData,
          tenantId: "malicious-tenant",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        await request(app).post("/api/users/verify").send(testData);

        // Assert
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          expect.any(String),
          "default",
        );
      });

      it("should not allow tenant override via query params", async () => {
        // Arrange
        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        await request(app)
          .post("/api/users/verify?tenantId=malicious-tenant")
          .send(validVerificationData);

        // Assert
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(
          expect.any(String),
          "default",
        );
      });
    });

    describe("Response Format", () => {
      it("should return consistent response format for existing user", async () => {
        // Arrange
        const mockUser = {
          id: 1,
          firstName: "Jean",
          lastName: "Dupont",
          email: "Jean.Dupont@example.com",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          mockUser,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.body).toHaveProperty("success");
        expect(response.body).toHaveProperty("exists");
        expect(response.body).toHaveProperty("message");
        expect(typeof response.body.success).toBe("boolean");
        expect(typeof response.body.exists).toBe("boolean");
        expect(typeof response.body.message).toBe("string");
      });

      it("should return consistent response format for non-existing user", async () => {
        // Arrange
        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.body).toHaveProperty("success");
        expect(response.body).toHaveProperty("exists");
        expect(response.body).toHaveProperty("message");
        expect(typeof response.body.success).toBe("boolean");
        expect(typeof response.body.exists).toBe("boolean");
        expect(typeof response.body.message).toBe("string");
      });

      it("should return consistent error format", async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        (userManagerService.getUserByEmail as jest.Mock).mockRejectedValue(
          new Error("Test error"),
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.body).toHaveProperty("success");
        expect(response.body).toHaveProperty("message");
        expect(response.body.success).toBe(false);
        expect(typeof response.body.message).toBe("string");

        consoleSpy.mockRestore();
      });
    });

    describe("Security", () => {
      it("should not leak user details in response", async () => {
        // Arrange
        const mockUser = {
          id: 1,
          firstName: "Jean",
          lastName: "Dupont",
          email: "Jean.Dupont@example.com",
          password: "hashed_password",
          tenantId: "tenant-123",
          actif: true,
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          mockUser,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        // Assert
        expect(response.body).not.toHaveProperty("user");
        expect(response.body).not.toHaveProperty("data");
        expect(JSON.stringify(response.body)).not.toContain("password");
        expect(JSON.stringify(response.body)).not.toContain("tenant-123");
      });

      it("should handle SQL injection attempts in nom", async () => {
        // Arrange
        const maliciousData = {
          nom: "'; DROP TABLE users; --",
          prenom: "Jean",
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(maliciousData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it("should handle XSS attempts in prenom", async () => {
        // Arrange
        const maliciousData = {
          nom: "Dupont",
          prenom: '<script>alert("XSS")</script>',
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(maliciousData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).not.toContain("<script>");
      });

      it("should handle command injection attempts", async () => {
        // Arrange
        const maliciousData = {
          nom: "Dupont; rm -rf /",
          prenom: "Jean",
          date_naissance: "1990-01-15",
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const response = await request(app)
          .post("/api/users/verify")
          .send(maliciousData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe("Performance", () => {
      it("should respond within acceptable time", async () => {
        // Arrange
        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );
        const startTime = Date.now();

        // Act
        await request(app)
          .post("/api/users/verify")
          .send(validVerificationData);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Assert
        expect(duration).toBeLessThan(1000); // Should respond within 1 second
      });

      it("should handle concurrent requests", async () => {
        // Arrange
        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(
          null,
        );

        // Act
        const requests = Array(10)
          .fill(null)
          .map(() =>
            request(app).post("/api/users/verify").send(validVerificationData),
          );

        const responses = await Promise.all(requests);

        // Assert
        responses.forEach((response) => {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });
        expect(userManagerService.getUserByEmail).toHaveBeenCalledTimes(10);
      });
    });
  });
});
