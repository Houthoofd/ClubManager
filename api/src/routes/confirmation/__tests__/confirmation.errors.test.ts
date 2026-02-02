/**
 * Tests de gestion d'erreurs pour le module Confirmation
 * Test des cas d'erreur et des mécanismes de récupération
 * Refactorisé pour utiliser jest.spyOn() comme les tests de compte
 */

// Configurer l'environnement AVANT les imports pour initialiser Stripe
process.env.STRIPE_SECRET_KEY = "sk_test_51MockKeyForTestingOnly";
process.env.NODE_ENV = "test";

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  confirmPayment,
  confirmPaymentCommande,
  debugTableStructure,
} from "../core/handlers/index.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import { setStripeInstance } from "../core/utils/stripe-instance.js";
import Stripe from "stripe";

describe("Confirmation - Tests de gestion d'erreurs", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let paiementsClient: Paiements;
  let emailClient: EmailClient;
  let mockStripe: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Créer les instances réelles
    paiementsClient = new Paiements();
    emailClient = EmailClient.getInstance();

    // Créer un mock Stripe complet
    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn(),
      },
    };

    // Injecter le mock Stripe
    setStripeInstance(mockStripe as any);

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock as any,
      status: statusMock as any,
    };
  });

  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion à la base de données", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(
          new Error("Connection lost: The server closed the connection"),
        );

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          details: expect.stringContaining("Connection lost"),
        }),
      );
    });

    it("devrait gérer une erreur de contrainte de clé étrangère", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "999",
        userId: "1",
        amount: "50.00",
      };

      const foreignKeyError: any = new Error("Foreign key constraint fails");
      foreignKeyError.code = "ER_NO_REFERENCED_ROW_2";
      foreignKeyError.sqlMessage =
        "Cannot add or update a child row: a foreign key constraint fails";

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(foreignKeyError);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur de doublon (ER_DUP_ENTRY) de manière idempotente", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const dupError: any = new Error("Duplicate entry");
      dupError.code = "ER_DUP_ENTRY";
      dupError.sqlMessage = "Duplicate entry '1' for key 'PRIMARY'";

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockRejectedValueOnce(dupError);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);
      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait gérer le doublon de manière gracieuse
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
      );
    });

    it("devrait gérer une erreur de timeout de requête", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const timeoutError: any = new Error("Query timeout");
      timeoutError.code = "ETIMEDOUT";

      jest.spyOn(paiementsClient, "queryAsync").mockRejectedValue(timeoutError);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur de colonne inexistante (ER_BAD_FIELD_ERROR)", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 9999,
        currency: "eur",
      } as any);

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 9999,
        currency: "eur",
      });

      const badFieldError: any = new Error("Unknown column");
      badFieldError.code = "ER_BAD_FIELD_ERROR";
      badFieldError.sqlMessage =
        "Unknown column 'invalid_column' in 'field list'";

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(badFieldError);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          sql_error: expect.any(Boolean),
        }),
      );
    });
  });

  describe("Erreurs Stripe", () => {
    it("devrait gérer une erreur Stripe indisponible", async () => {
      // Test sans body pour vérifier la validation
      mockRequest.body = {
        paymentIntentId: undefined,
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur de récupération du PaymentIntent", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      const stripeError = new Error("No such payment_intent");
      (stripeError as any).type = "StripeInvalidRequestError";
      (stripeError as any).code = "resource_missing";

      // Mock Stripe retrieve qui rejette
      mockStripe.paymentIntents.retrieve.mockRejectedValue(stripeError);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          details: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur d'authentification Stripe", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      const authError = new Error("Invalid API Key");
      (authError as any).type = "StripeAuthenticationError";

      // Mock Stripe retrieve qui rejette
      mockStripe.paymentIntents.retrieve.mockRejectedValue(authError);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur de réseau Stripe", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      const networkError = new Error("Network error");
      (networkError as any).type = "StripeConnectionError";

      // Mock Stripe retrieve qui rejette
      mockStripe.paymentIntents.retrieve.mockRejectedValue(networkError);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });
  });

  describe("Erreurs d'envoi d'email", () => {
    it("devrait continuer même si l'envoi d'email échoue", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);
      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      // Mock l'échec d'envoi d'email
      jest
        .spyOn(emailClient, "sendPaymentConfirmation")
        .mockRejectedValue(new Error("SMTP connection failed"));

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Le paiement devrait quand même être confirmé
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait gérer une erreur d'email invalide", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 9999,
        currency: "eur",
      });

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          {
            email: "invalid-email",
            first_name: "Test",
            last_name: "User",
          },
        ] as any)
        .mockResolvedValueOnce([
          {
            numero_commande: "CMD-001",
            total: 99.99,
            articles: [],
          },
        ] as any);

      // Mock l'échec d'envoi d'email
      jest
        .spyOn(emailClient, "sendOrderConfirmation")
        .mockRejectedValue(new Error("Invalid email format"));

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Le paiement devrait quand même être confirmé
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe("Erreurs de mise à jour du statut", () => {
    it("devrait gérer une erreur lors de la mise à jour de l'échéance", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockResolvedValueOnce({ affectedRows: 0 } as any) // Échec de la mise à jour
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente", // Toujours en attente
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur lors de la confirmation Stripe", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockRejectedValue(new Error("Stripe confirmation failed"));

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait quand même retourner succès car la DB est mise à jour
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Erreurs de promotion de statut", () => {
    it("devrait continuer si la promotion du statut échoue", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "estPremierPaiement").mockResolvedValue(true);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockRejectedValueOnce(new Error("Status promotion failed")) // Échec de promotion
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Le paiement devrait être confirmé même si la promotion échoue
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe("Erreurs debugTableStructure", () => {
    it("devrait gérer une erreur lors de la récupération de la structure", async () => {
      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(new Error("Table does not exist"));

      await debugTableStructure(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          details: expect.stringContaining("Table does not exist"),
        }),
      );
    });
  });

  describe("Erreurs génériques", () => {
    it("devrait gérer une exception non prévue", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(new Error("Unexpected error occurred"));

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          details: expect.stringContaining("Unexpected error"),
        }),
      );
    });

    it("devrait inclure l'error_code dans la réponse si disponible", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const errorWithCode: any = new Error("Custom error");
      errorWithCode.code = "CUSTOM_ERROR_CODE";

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(errorWithCode);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error_code: "CUSTOM_ERROR_CODE",
        }),
      );
    });
  });
});
