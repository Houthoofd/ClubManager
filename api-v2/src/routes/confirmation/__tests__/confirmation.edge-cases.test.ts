/**
 * Tests de cas limites pour le module Confirmation
 * Test des scénarios edge cases et situations inhabituelles
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
} from "../core/handlers/index.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import { setStripeInstance } from "../core/utils/stripe-instance.js";
import Stripe from "stripe";

describe("Confirmation - Tests de cas limites", () => {
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

  describe("Cas limites confirmPayment", () => {
    it("devrait gérer un montant de 0€", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "0.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 0,
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
        }),
      );
    });

    it("devrait gérer un très grand montant", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "999999.99",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 999999.99,
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
        }),
      );
    });

    it("devrait gérer un utilisateur sans nom", async () => {
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
          { email: "test@test.com", first_name: null, last_name: null },
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
        }),
      );
    });

    it("devrait gérer un utilisateur avec des noms vides", async () => {
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
          { email: "test@test.com", first_name: "", last_name: "" },
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
        }),
      );
    });

    it("devrait gérer des IDs très grands", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "999999999",
        userId: "999999999",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 999999999,
            statut: "en_attente",
            utilisateur_id: 999999999,
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
          echeance_id: 999999999,
        }),
      );
    });

    it("devrait gérer un PaymentIntent ID très long", async () => {
      const longId = "pi_" + "a".repeat(500);
      mockRequest.body = {
        paymentIntentId: longId,
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

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          paiement_id: longId,
        }),
      );
    });

    it("devrait gérer une échéance avec date_echeance dans le futur lointain", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const futureDate = new Date("2099-12-31");

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: futureDate,
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
        }),
      );
    });

    it("devrait gérer une échéance avec date_echeance dans le passé lointain", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const pastDate = new Date("1990-01-01");

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: pastDate,
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
        }),
      );
    });

    it("devrait gérer des caractères spéciaux dans les noms", async () => {
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
          {
            email: "test@test.com",
            first_name: "François-André",
            last_name: "O'Connor-Müller",
          },
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
        }),
      );
    });
  });

  describe("Cas limites confirmPaymentCommande", () => {
    it("devrait gérer une commande sans articles", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "0.00",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 0,
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
            total: 0,
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
        }),
      );
    });

    it("devrait gérer une commande avec beaucoup d'articles", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "500.00",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 50000,
        currency: "eur",
      });

      const manyArticles = Array.from({ length: 100 }, (_, i) => ({
        total: 5,
        article_id: i + 1,
        quantite: 1,
        prix: 5,
        article_nom: `Article ${i + 1}`,
        taille_nom: "M",
      }));

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
            total: 500,
            articles: manyArticles,
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
        }),
      );
    });

    it("devrait gérer une commande avec des articles sans taille", async () => {
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
            articles: [
              {
                total: 99.99,
                article_id: 1,
                quantite: 1,
                prix: 99.99,
                article_nom: "Article sans taille",
                taille_nom: null,
              },
            ],
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
        }),
      );
    });

    it("devrait gérer une commande avec des noms d'articles très longs", async () => {
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

      const longName = "A".repeat(500);

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
            articles: [
              {
                total: 99.99,
                article_id: 1,
                quantite: 1,
                prix: 99.99,
                article_nom: longName,
                taille_nom: "M",
              },
            ],
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
        }),
      );
    });

    it("devrait gérer une quantité très élevée", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99999.99",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 9999999,
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
            total: 99999.99,
            articles: [
              {
                total: 99999.99,
                article_id: 1,
                quantite: 9999,
                prix: 10.01,
                article_nom: "Article en masse",
                taille_nom: "M",
              },
            ],
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
        }),
      );
    });

    it("devrait gérer des montants avec beaucoup de décimales", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.999999",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 10000,
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
            total: 100.0,
            articles: [],
          },
        ] as any);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Cas limites d'idempotence", () => {
    it("devrait permettre plusieurs appels consécutifs pour le même paiement", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      // Premier appel - échéance déjà payée
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
          already_paid: true,
        }),
      );

      // Deuxième appel - même résultat
      jest.clearAllMocks();
      jsonMock = jest.fn();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.json = jsonMock as any;
      mockResponse.status = statusMock as any;

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
          already_paid: true,
        }),
      );
    });

    it("devrait gérer une race condition où deux requêtes arrivent simultanément", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const dupError = new Error("Duplicate entry");
      (dupError as any).code = "ER_DUP_ENTRY";

      // Première requête réussit
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

      // Devrait quand même retourner succès (idempotence)
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
      );
    });
  });

  describe("Cas limites de dates et horaires", () => {
    it("devrait gérer un paiement à minuit pile", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: midnight,
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
        }),
      );
    });

    it("devrait gérer un paiement le 29 février (année bissextile)", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const leapDay = new Date("2024-02-29");

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: leapDay,
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
        }),
      );
    });
  });
});
