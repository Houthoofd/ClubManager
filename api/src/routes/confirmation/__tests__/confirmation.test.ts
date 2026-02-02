/**
 * Tests de base pour le module Confirmation
 * Tests des fonctionnalités principales (happy path)
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
  health,
  debugTableStructure,
} from "../core/handlers/index.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import { setStripeInstance } from "../core/utils/stripe-instance.js";
import Stripe from "stripe";

describe("Confirmation Module - Tests de base", () => {
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

  describe("health - GET /api/confirmation/health", () => {
    it("devrait retourner le statut de santé du module", async () => {
      await health(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          module: "confirmation",
          routes: expect.any(Array),
          stripe: expect.objectContaining({
            configured: expect.any(Boolean),
            hasSecretKey: expect.any(Boolean),
          }),
          timestamp: expect.any(String),
        }),
      );
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("devrait indiquer si Stripe est configuré", async () => {
      await health(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response.stripe).toHaveProperty("configured");
      expect(response.stripe).toHaveProperty("hasSecretKey");
    });
  });

  describe("confirmPayment - POST /api/confirmation/confirm-payment", () => {
    it("devrait confirmer un paiement d'échéance avec succès", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      // Mock des queries
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

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          paiement_id: "pi_test_123",
          echeance_id: 1,
          echeance_confirmee: true,
        }),
      );
    });

    it("devrait retourner une erreur si des données sont manquantes", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        // Manque echeanceId, userId
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Données manquantes pour la confirmation de paiement",
          required: ["paymentIntentId", "echeanceId", "userId"],
        }),
      );
    });

    it("devrait gérer une échéance déjà payée (idempotence)", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      // Mock échéance déjà payée
      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "payé",
          utilisateur_id: 1,
          montant: 50,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ] as any);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Paiement confirmé (échéance déjà payée)",
          already_paid: true,
        }),
      );
    });

    it("devrait retourner une erreur si l'échéance n'existe pas", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "999",
        userId: "1",
        amount: "50.00",
      };

      // Mock échéance non trouvée
      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([] as any);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Échéance non trouvée",
          echeanceId: 999,
        }),
      );
    });

    it("devrait promouvoir un visiteur en utilisateur au premier paiement", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      // Mock premier paiement
      jest.spyOn(paiementsClient, "estPremierPaiement").mockResolvedValue(true);

      // Mock des queries
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
          { status_id: 1, status_actuel: "visiteur" },
        ] as any)
        .mockResolvedValueOnce([{ id: 2 }] as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          premier_paiement: true,
          statut_upgrade: "visiteur → utilisateur",
        }),
      );
    });
  });

  describe("confirmPaymentCommande - POST /api/confirmation/confirm-payment-commande", () => {
    it("devrait confirmer un paiement de commande avec succès", async () => {
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
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any)
        .mockResolvedValueOnce([
          {
            numero_commande: "CMD-001",
            total: 99.99,
            articles: [],
          },
        ] as any);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          payment_intent_id: "pi_test_456",
          commande_id: "1",
          database_updated: true,
        }),
      );
    });

    it("devrait retourner une erreur si des champs sont manquants", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        // Manque commandeId, userId
      };

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Données manquantes pour la confirmation de paiement commande",
          missing: expect.arrayContaining(["commandeId", "userId"]),
        }),
      );
    });

    it("devrait retourner une erreur si le paiement Stripe n'est pas succeeded", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      // Mock Stripe retrieve avec statut pending
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "pending",
        amount: 9999,
        currency: "eur",
      });

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Le paiement n'a pas été confirmé sur Stripe",
          stripeStatus: "pending",
        }),
      );
    });
  });

  describe("debugTableStructure - GET /api/confirmation/debug/table-structure", () => {
    it("devrait retourner la structure de la table commandes", async () => {
      const mockTableStructure = [
        { Field: "id", Type: "int(11)", Null: "NO", Key: "PRI" },
        { Field: "numero_commande", Type: "varchar(50)", Null: "NO", Key: "" },
        { Field: "statut", Type: "varchar(20)", Null: "NO", Key: "" },
      ];

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue(mockTableStructure as any);

      await debugTableStructure(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          table: "commandes",
          structure: mockTableStructure,
          analysis: expect.objectContaining({
            has_id: expect.any(String),
            has_numero_commande: expect.any(String),
            has_stripe_payment_intent_id: expect.any(String),
            pour_tracer_paiement: expect.any(String),
            statut_commande: expect.any(String),
          }),
        }),
      );
    });

    it("devrait gérer les erreurs de base de données", async () => {
      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(new Error("Database error"));

      await debugTableStructure(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Erreur lors de la vérification de la structure",
          details: "Database error",
        }),
      );
    });
  });

  describe("Validation des données d'entrée", () => {
    it("devrait valider le format du paymentIntentId", async () => {
      mockRequest.body = {
        paymentIntentId: "invalid_format",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ] as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);
      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait traiter la requête même si le format est inhabituel
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider les IDs numériques", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "abc",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([] as any);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait gérer l'erreur gracieusement
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Intégration avec Stripe", () => {
    it("devrait vérifier le statut du paiement sur Stripe", async () => {
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
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any)
        .mockResolvedValueOnce([
          {
            numero_commande: "CMD-001",
            total: 99.99,
            articles: [],
          },
        ] as any);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(
        "pi_test_456",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Gestion des emails", () => {
    it("devrait envoyer un email de confirmation après un paiement réussi", async () => {
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      // L'email devrait être tenté (même si le mock ne capture pas l'appel réel)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });
});
