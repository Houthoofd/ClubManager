/**
 * Tests de performance pour le module Stripe
 * Vérifie les temps de réponse et la gestion de charge
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { createPaymentIntentEcheance, confirmPaymentEcheance } from "../core/handlers/index.js";

describe("Stripe Performance Tests", () => {
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

  describe("Temps de réponse", () => {
    it("devrait créer un PaymentIntent en moins de 200ms", async () => {
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

      const start = Date.now();

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait confirmer un paiement en moins de 300ms", async () => {
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

      const mockStatusService = { upgraderStatutUtilisateur: jest.fn() };
      const mockEmailService = {
        envoyerConfirmationPaiement: jest.fn().mockResolvedValue({ success: true }),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      const start = Date.now();

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        mockStatusService as any,
        mockEmailService as any
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Gestion de charge", () => {
    it("devrait gérer 10 requêtes concurrentes sans erreur", async () => {
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

      const promises = Array.from({ length: 10 }, () =>
        createPaymentIntentEcheance(
          mockRequest as Request,
          mockResponse as Response,
          mockStripeService as any,
          mockPaymentService as any
        )
      );

      await Promise.all(promises);

      expect(mockStripeService.creerPaymentIntentEcheance).toHaveBeenCalledTimes(10);
    });

    it("devrait gérer des gros volumes de données", async () => {
      const mockStripeService = {
        creerPaymentIntentCommande: jest.fn().mockResolvedValue({
          clientSecret: "pi_test_secret",
          paymentIntentId: "pi_test_xxx",
        }),
      };

      const mockPaymentService = {
        creerCommandeSiNecessaire: jest.fn().mockResolvedValue({
          commandeId: 1,
          created: true,
        }),
        verifierCommande: jest.fn().mockResolvedValue({
          valid: true,
          commande: {
            id: 1,
            articles: Array.from({ length: 100 }, (_, i) => ({ id: i, quantite: 1 })),
          },
        }),
      };

      mockRequest.body = {
        amount: 1000,
        commande: {
          articles: Array.from({ length: 100 }, (_, i) => ({ id: i, quantite: 1 })),
        },
        userId: 1,
      };

      const { createPaymentIntentCommande } = await import("../core/handlers/index.js");

      const start = Date.now();

      await createPaymentIntentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Validation rapide", () => {
    it("devrait rejeter rapidement des données invalides (< 10ms)", async () => {
      mockRequest.body = {
        amount: -50,
        echeanceId: 1,
        userId: 1,
      };

      const start = Date.now();

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        {} as any,
        {} as any
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });
});
