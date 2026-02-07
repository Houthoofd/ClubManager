/**
 * Tests du health check du module Stripe
 * Vérifie la détection de problèmes de configuration et connectivité
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { health } from "../core/handlers/index.js";

describe("Stripe Health Check Tests", () => {
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

  describe("Configuration complète", () => {
    it("devrait retourner healthy si tout est configuré", async () => {
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
        mockStripeService as any
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: "healthy",
            checks: expect.objectContaining({
              secretKeyConfigured: true,
              publishableKeyConfigured: true,
              stripeConnectivity: true,
            }),
          }),
        })
      );
    });
  });

  describe("Configuration incomplète", () => {
    it("devrait retourner unhealthy si secret key manquante", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: false,
          error: "No API key provided",
        }),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: expect.objectContaining({
            status: "unhealthy",
            checks: expect.objectContaining({
              secretKeyConfigured: false,
            }),
          }),
        })
      );
    });

    it("devrait retourner unhealthy si publishable key manquante", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      delete process.env.STRIPE_PUBLISHABLE_KEY;

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: true,
        }),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checks: expect.objectContaining({
              publishableKeyConfigured: false,
            }),
          }),
        })
      );
    });

    it("devrait retourner unhealthy si les deux clés manquent", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_PUBLISHABLE_KEY;

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: false,
        }),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "unhealthy",
            checks: expect.objectContaining({
              secretKeyConfigured: false,
              publishableKeyConfigured: false,
            }),
          }),
        })
      );
    });
  });

  describe("Problèmes de connectivité", () => {
    it("devrait retourner unhealthy si Stripe inaccessible", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: false,
          error: "Network error",
        }),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "unhealthy",
            checks: expect.objectContaining({
              stripeConnectivity: false,
              stripeError: "Network error",
            }),
          }),
        })
      );
    });

    it("devrait inclure le message d'erreur de connectivité", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: false,
          error: "ECONNREFUSED",
        }),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.data.checks.stripeError).toBe("ECONNREFUSED");
    });
  });

  describe("Format de la réponse", () => {
    it("devrait inclure un timestamp", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      const mockStripeService = {
        testerConnectivite: jest.fn().mockResolvedValue({
          connected: true,
        }),
      };

      const beforeTime = new Date().toISOString();

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      const afterTime = new Date().toISOString();
      const response = jsonMock.mock.calls[0][0];

      expect(response.data.timestamp).toBeDefined();
      expect(response.data.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(response.data.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("devrait inclure tous les checks", async () => {
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
        mockStripeService as any
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.data.checks).toHaveProperty("secretKeyConfigured");
      expect(response.data.checks).toHaveProperty("publishableKeyConfigured");
      expect(response.data.checks).toHaveProperty("stripeConnectivity");
    });
  });

  describe("Gestion d'erreurs", () => {
    it("devrait gérer une erreur lors du test de connectivité", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      const mockStripeService = {
        testerConnectivite: jest.fn().mockRejectedValue(
          new Error("Unexpected error")
        ),
      };

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: expect.objectContaining({
            status: "unhealthy",
          }),
        })
      );
    });
  });
});
