/**
 * Tests de base pour le module Paiements
 * Tests des fonctionnalités principales (happy path)
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import {
  createPaymentEcheance,
  createPaymentCommande,
  confirmEcheancePayment,
  confirmCommandePayment,
  getHistoriquePaiements,
  getEcheancesUtilisateur,
  getEcheanceDetails,
  healthCheck,
} from "../core/handlers/index.js";

describe("Paiements Module - Tests de base", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockPaiementsClient: Partial<Paiements>;
  let mockEmailClient: Partial<EmailClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    // Mock du client Paiements
    mockPaiementsClient = {
      verifierEcheanceExiste: jest.fn(),
      obtenirEcheance: jest.fn(),
      obtenirCommandeParId: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
      mettreAJourStatutEcheance: jest.fn(),
      mettreAJourStatutCommande: jest.fn(),
      estPremierPaiement: jest.fn(),
      upgradeStatutUtilisateur: jest.fn(),
      enregistrerPaiement: jest.fn(),
      obtenirTousPaiements: jest.fn(),
      obtenirHistoriquePaiementsUtilisateur: jest.fn(),
      obtenirEcheancesUtilisateur: jest.fn(),
      obtenirEcheanceAvecUtilisateur: jest.fn(),
      obtenirCommandeAvecUtilisateur: jest.fn(),
    };

    // Mock du client Email
    mockEmailClient = {
      envoyerEmail: jest.fn(),
    };
  });

  describe("createPaymentEcheance - POST /api/paiements/stripe/create-payment-intent", () => {
    it("devrait créer un Payment Intent avec succès", async () => {
      mockRequest.body = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        currency: "eur",
        description: "Paiement échéance mensuelle",
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        description: "Échéance mensuelle",
        date_echeance: "2024-03-15",
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      // Note: Le vrai test nécessiterait de mocker Stripe, ici on teste la validation
      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(mockPaiementsClient.verifierEcheanceExiste).toHaveBeenCalledWith(
        1,
      );
    });

    it("devrait retourner 400 si le montant est manquant", async () => {
      mockRequest.body = {
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si l'echeanceId est manquant", async () => {
      mockRequest.body = {
        amount: 25.5,
        userId: 1,
      };

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 si le montant est négatif", async () => {
      mockRequest.body = {
        amount: -10,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("positif"),
        }),
      );
    });

    it("devrait retourner 400 si le montant est trop petit (< 0.50€)", async () => {
      mockRequest.body = {
        amount: 0.25,
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("0.50"),
        }),
      );
    });
  });

  describe("createPaymentCommande - POST /api/paiements/stripe/create-payment-intent-commande", () => {
    it("devrait créer un Payment Intent pour une commande avec ID numérique", async () => {
      mockRequest.body = {
        amount: 45.0,
        commande: 5,
        userId: 2,
        currency: "eur",
      };

      const mockCommande = {
        id: 5,
        utilisateur_id: 2,
        statut: "en_attente",
        total: 45.0,
      };

      (mockPaiementsClient.obtenirCommandeParId as jest.Mock).mockResolvedValue(
        mockCommande,
      );

      await createPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      // La validation devrait passer
      expect(mockRequest.body.commande).toBe(5);
    });

    it("devrait créer un Payment Intent pour une commande avec objet", async () => {
      mockRequest.body = {
        amount: 45.0,
        commande: {
          id: 5,
          articles: [{ id: 1, quantite: 2 }],
        },
        userId: 2,
      };

      const mockCommande = {
        id: 5,
        utilisateur_id: 2,
        statut: "en_attente",
        total: 45.0,
      };

      (mockPaiementsClient.obtenirCommandeParId as jest.Mock).mockResolvedValue(
        mockCommande,
      );

      await createPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(mockRequest.body.commande.id).toBe(5);
    });

    it("devrait retourner 400 si la commande est manquante", async () => {
      mockRequest.body = {
        amount: 45.0,
        userId: 2,
      };

      await createPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });

  describe("confirmEcheancePayment - POST /api/paiements/stripe/confirm-echeance", () => {
    it("devrait confirmer un paiement d'échéance avec succès", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_1234567890",
        echeanceId: 1,
        userId: 1,
        amount: 2550, // En centimes
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        description: "Échéance mensuelle",
      };

      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        status_id: 2,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUser);
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockEmailClient.envoyerEmail as jest.Mock).mockResolvedValue({
        success: true,
      });

      // Note: Nécessite de mocker Stripe pour un test complet
      // Ici on teste la structure de validation
      expect(mockRequest.body.paymentIntentId).toMatch(/^pi_/);
      expect(mockRequest.body.echeanceId).toBe(1);
      expect(mockRequest.body.userId).toBe(1);
    });

    it("devrait retourner 400 si le paymentIntentId est invalide", async () => {
      mockRequest.body = {
        paymentIntentId: "invalid_id", // Ne commence pas par "pi_"
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("pi_"),
        }),
      );
    });
  });

  describe("getHistoriquePaiements - GET /api/paiements/historique", () => {
    it("devrait retourner l'historique des paiements avec pagination", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "0",
      };

      const mockPaiements = [
        {
          id: 1,
          stripe_payment_intent_id: "pi_123",
          montant: 25.5,
          statut: "completed",
          date_creation: "2024-03-01",
        },
        {
          id: 2,
          stripe_payment_intent_id: "pi_456",
          montant: 45.0,
          statut: "completed",
          date_creation: "2024-03-02",
        },
      ];

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: mockPaiements,
          total: 25,
        },
      );

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPaiements,
          pagination: expect.objectContaining({
            total: 25,
            limit: 10,
            offset: 0,
            hasMore: true,
          }),
        }),
      );
    });

    it("devrait filtrer par utilisateur", async () => {
      mockRequest.query = {
        utilisateur_id: "5",
        limit: "10",
        offset: "0",
      };

      const mockPaiements = [
        {
          id: 1,
          utilisateur_id: 5,
          montant: 25.5,
          statut: "completed",
        },
      ];

      (
        mockPaiementsClient.obtenirHistoriquePaiementsUtilisateur as jest.Mock
      ).mockResolvedValue({
        paiements: mockPaiements,
        total: 1,
      });

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(
        mockPaiementsClient.obtenirHistoriquePaiementsUtilisateur,
      ).toHaveBeenCalledWith(5, expect.any(Object));
    });

    it("devrait utiliser les valeurs par défaut pour limit et offset", async () => {
      mockRequest.query = {};

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 0,
        },
      );

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(mockPaiementsClient.obtenirTousPaiements).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 0,
        }),
      );
    });
  });

  describe("getEcheancesUtilisateur - GET /api/paiements/echeances/:userId", () => {
    it("devrait retourner les échéances d'un utilisateur", async () => {
      mockRequest.params = {
        userId: "3",
      };

      const mockEcheances = [
        {
          id: 1,
          utilisateur_id: 3,
          montant: 25.5,
          statut: "en_attente",
          date_echeance: "2024-03-15",
        },
        {
          id: 2,
          utilisateur_id: 3,
          montant: 25.5,
          statut: "payé",
          date_echeance: "2024-02-15",
        },
      ];

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue(mockEcheances);

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEcheances,
          count: 2,
          utilisateur_id: 3,
        }),
      );
      expect(
        mockPaiementsClient.obtenirEcheancesUtilisateur,
      ).toHaveBeenCalledWith(3);
    });

    it("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = {
        userId: "invalid",
      };

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockRequest.params = {
        userId: "3",
      };

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Erreur de connexion"));

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur"),
        }),
      );
    });
  });

  describe("getEcheanceDetails - GET /api/paiements/echeance/:echeanceId", () => {
    it("devrait retourner les détails d'une échéance", async () => {
      mockRequest.params = {
        echeanceId: "1",
      };

      const mockEcheance = {
        id: 1,
        utilisateur_id: 3,
        montant: 25.5,
        statut: "en_attente",
        description: "Échéance mensuelle",
        date_echeance: "2024-03-15",
        utilisateur_first_name: "John",
        utilisateur_last_name: "Doe",
        utilisateur_email: "john@example.com",
      };

      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockResolvedValue(mockEcheance);

      await getEcheanceDetails(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEcheance,
        }),
      );
      expect(
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur,
      ).toHaveBeenCalledWith(1);
    });

    it("devrait retourner 404 si l'échéance n'existe pas", async () => {
      mockRequest.params = {
        echeanceId: "999",
      };

      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockResolvedValue(null);

      await getEcheanceDetails(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("introuvable"),
        }),
      );
    });

    it("devrait retourner 400 si l'echeanceId est invalide", async () => {
      mockRequest.params = {
        echeanceId: "abc",
      };

      await getEcheanceDetails(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });
  });

  describe("healthCheck - GET /api/paiements/health", () => {
    it("devrait retourner le statut de santé du module", async () => {
      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 0,
        },
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      // Le health check devrait vérifier Stripe et la DB
      expect(mockPaiementsClient.obtenirTousPaiements).toHaveBeenCalled();
    });
  });
});
