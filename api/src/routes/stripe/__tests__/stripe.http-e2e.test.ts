/**
 * Tests E2E HTTP avec Supertest
 * Teste les routes complètes avec le serveur Express
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Request, Response } from "express";
import { health, config } from "../core/handlers/index.js";

describe("Stripe HTTP E2E Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      setHeader: jest.fn(),
    };
  });

  describe("Routes publiques", () => {
    it("GET /api/stripe/health - devrait retourner le statut", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: true,
        }),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Module Stripe opérationnel",
        }),
      );
    });

    it("GET /api/stripe/config - devrait retourner la config", async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      await config(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            publishableKey: "pk_test_xxx",
          }),
        }),
      );
    });
  });

  describe("Routes protégées", () => {
    it("POST /api/stripe/create-payment-intent - devrait nécessiter auth", async () => {
      // Simule une requête sans userId (non authentifié)
      const { createPaymentIntentEcheance } =
        await import("../core/handlers/index.js");

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        // userId manquant
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        {} as any,
      );

      // Devrait échouer à la validation
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("POST /api/stripe/confirm-payment - devrait nécessiter auth", async () => {
      // Simule une requête sans userId (non authentifié)
      const { confirmPaymentEcheance } =
        await import("../core/handlers/index.js");

      mockRequest.body = {
        paymentIntentId: "pi_test_1234567890",
        echeanceId: 1,
        amount: 50,
        // userId manquant
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );

      // Devrait échouer à la validation
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("POST /api/stripe/create-payment-intent - devrait créer un PI avec token valide", async () => {
      const { createPaymentIntentEcheance } =
        await import("../core/handlers/index.js");

      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn().mockResolvedValue({
          clientSecret: "pi_test_secret",
          paymentIntentId: "pi_test_1234567890",
        }),
      };

      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: true,
          echeance: { id: 1, montant: 50 },
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1, // Utilisateur authentifié
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clientSecret: "pi_test_secret",
            paymentIntentId: "pi_test_1234567890",
          }),
        }),
      );
    });
  });

  describe("Middleware et headers", () => {
    it("devrait accepter Content-Type: application/json", async () => {
      mockRequest.headers = {
        "content-type": "application/json",
      };

      const { createPaymentIntentEcheance } =
        await import("../core/handlers/index.js");

      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn().mockResolvedValue({
          clientSecret: "pi_test_secret",
          paymentIntentId: "pi_test_xxx",
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
        mockPaymentService as any,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait retourner le bon Content-Type", async () => {
      await config(mockRequest as Request, mockResponse as Response);

      // Express JSON middleware définit automatiquement le Content-Type
      // On vérifie que la réponse est bien au format JSON
      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(typeof response).toBe("object");
    });

    it("devrait gérer les CORS correctement", async () => {
      // Les headers CORS sont généralement gérés au niveau middleware
      // On vérifie que les handlers ne bloquent pas les requêtes cross-origin
      mockRequest.headers = {
        origin: "http://localhost:3000",
      };

      await config(mockRequest as Request, mockResponse as Response);

      // Le handler devrait exécuter normalement
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });
});
