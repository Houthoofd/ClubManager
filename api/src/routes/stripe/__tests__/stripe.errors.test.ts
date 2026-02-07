/**
 * Tests de gestion d'erreurs pour le module Stripe
 * Teste les différents types d'erreurs (Stripe API, DB, réseau, validation)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { createPaymentIntentEcheance, confirmPaymentEcheance } from "../core/handlers/index.js";

describe("Stripe Error Handling Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  // ==================== ERREURS STRIPE API ====================
  describe("Erreurs API Stripe", () => {
    it("devrait gérer une erreur de clé API invalide", async () => {
      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn().mockRejectedValue({
          type: "StripeAuthenticationError",
          message: "Invalid API Key provided",
        }),
      };

      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: true,
          echeance: {},
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la création du PaymentIntent",
        })
      );
    });

    it("devrait gérer une erreur de carte déclinée", async () => {
      const mockStripeService = {
        recupererPaymentIntent: jest.fn().mockRejectedValue({
          type: "StripeCardError",
          code: "card_declined",
          message: "Your card was declined",
        }),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        {} as any,
        {} as any,
        {} as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur de rate limit Stripe", async () => {
      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn().mockRejectedValue({
          type: "StripeRateLimitError",
          message: "Too many requests",
        }),
      };

      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: true,
          echeance: {},
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur réseau vers Stripe", async () => {
      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn().mockRejectedValue(
          new Error("ECONNREFUSED - Cannot connect to Stripe API")
        ),
      };

      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: true,
          echeance: {},
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS BASE DE DONNÉES ====================
  describe("Erreurs Base de Données", () => {
    it("devrait gérer une erreur ECONNREFUSED de la DB", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockRejectedValue({
          code: "ECONNREFUSED",
          message: "Cannot connect to database",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("devrait gérer un timeout de la DB", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockRejectedValue({
          code: "ETIMEDOUT",
          message: "Connection timeout",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur de contrainte FK", async () => {
      const mockStripeService = {
        recupererPaymentIntent: jest.fn().mockResolvedValue({ id: "pi_test" }),
      };

      const mockPaymentService = {
        confirmerPaiementEcheance: jest.fn().mockRejectedValue({
          code: "ER_NO_REFERENCED_ROW_2",
          message: "Foreign key constraint fails",
        }),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        {} as any,
        {} as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur de deadlock", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockRejectedValue({
          code: "ER_LOCK_DEADLOCK",
          message: "Deadlock found when trying to get lock",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS DE VALIDATION ====================
  describe("Erreurs de Validation", () => {
    it("devrait retourner 400 pour des données invalides", async () => {
      mockRequest.body = {
        amount: -50, // Invalide
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        {} as any
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
          errors: expect.any(Array),
        })
      );
    });

    it("devrait inclure les détails des erreurs de validation", async () => {
      mockRequest.body = {
        amount: -50,
        echeanceId: "invalid",
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        {} as any
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const response = jsonMock.mock.calls[0][0];
      expect(response.errors).toBeDefined();
      expect(Array.isArray(response.errors)).toBe(true);
      expect(response.errors.length).toBeGreaterThan(0);
    });
  });

  // ==================== ERREURS MÉTIER ====================
  describe("Erreurs Métier", () => {
    it("devrait retourner 404 si échéance non trouvée", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: false,
          error: "Échéance non trouvée",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 999,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Échéance non trouvée",
        })
      );
    });

    it("devrait retourner 403 si ownership invalide", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: false,
          error: "L'échéance n'appartient pas à cet utilisateur",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 2,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("devrait retourner 404 si échéance déjà payée", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: false,
          error: "Échéance déjà payée",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  // ==================== ERREURS EMAIL ====================
  describe("Erreurs Email (Non-bloquantes)", () => {
    it("devrait continuer si l'email échoue", async () => {
      const mockStripeService = {
        recupererPaymentIntent: jest.fn().mockResolvedValue({ id: "pi_test" }),
      };

      const mockPaymentService = {
        confirmerPaiementEcheance: jest.fn().mockResolvedValue({
          success: true,
          paiementId: 1,
          premierPaiement: false,
          userEmail: "test@example.com",
          userName: "Test User",
        }),
      };

      const mockEmailService = {
        envoyerConfirmationPaiement: jest.fn().mockRejectedValue(
          new Error("SMTP server unavailable")
        ),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        {} as any,
        mockEmailService as any
      );

      // Le paiement devrait quand même être confirmé
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  // ==================== ERREURS INATTENDUES ====================
  describe("Erreurs Inattendues", () => {
    it("devrait gérer une erreur générique", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockRejectedValue(
          new Error("Something went wrong")
        ),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Something went wrong",
        })
      );
    });

    it("devrait gérer une erreur sans message", async () => {
      const mockPaymentService = {
        verifierEcheance: jest.fn().mockRejectedValue("Unknown error"),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        mockPaymentService as any
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Erreur inconnue",
        })
      );
    });
  });
});
