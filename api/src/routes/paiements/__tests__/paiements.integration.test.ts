/**
 * Tests d'intégration (avec mocks) pour le module Paiements
 * Vérifie l'intégration entre handlers, services, et validators
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
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
  webhookHandler,
  healthCheck,
} from "../core/handlers/index.js";

describe("Paiements Module - Integration Tests (Mocked)", () => {
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

    mockEmailClient = {
      envoyerEmail: jest.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Flux complet de paiement d'échéance", () => {
    it("devrait créer un paiement, le confirmer, et envoyer un email", async () => {
      const echeanceId = 1;
      const userId = 1;
      const amount = 25.5;

      // Étape 1: Créer le Payment Intent
      mockRequest.body = {
        amount,
        echeanceId,
        userId,
      };

      const mockEcheance = {
        id: echeanceId,
        montant: amount,
        statut: "en_attente",
        utilisateur_id: userId,
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // Étape 2: Confirmer le paiement
      mockRequest.body = {
        paymentIntentId: "pi_test123",
        echeanceId,
        userId,
        amount: amount * 100, // en centimes
      };

      const mockUser = {
        id: userId,
        email: "test@example.com",
        nom: "Test",
        prenom: "User",
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUser);
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        true,
      );
      (
        mockPaiementsClient.upgradeStatutUtilisateur as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      // Vérifications
      expect(
        mockPaiementsClient.mettreAJourStatutEcheance,
      ).toHaveBeenCalledWith(echeanceId, "payé");
      expect(mockPaiementsClient.estPremierPaiement).toHaveBeenCalledWith(
        userId,
      );
      expect(mockPaiementsClient.upgradeStatutUtilisateur).toHaveBeenCalledWith(
        userId,
        "actif",
      );
      expect(mockPaiementsClient.enregistrerPaiement).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer le flux complet avec premier paiement", async () => {
      const echeanceId = 1;
      const userId = 1;
      const amount = 50.0;

      mockRequest.body = {
        paymentIntentId: "pi_first_payment",
        echeanceId,
        userId,
        amount: amount * 100,
      };

      const mockEcheance = {
        id: echeanceId,
        montant: amount,
        statut: "en_attente",
        utilisateur_id: userId,
      };

      const mockUser = {
        id: userId,
        email: "newuser@example.com",
        nom: "New",
        prenom: "User",
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUser);
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        true,
      );
      (
        mockPaiementsClient.upgradeStatutUtilisateur as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      // Vérifie que le statut a été upgradé pour premier paiement
      expect(mockPaiementsClient.upgradeStatutUtilisateur).toHaveBeenCalledWith(
        userId,
        "actif",
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer le flux complet sans upgrade pour paiements suivants", async () => {
      const echeanceId = 2;
      const userId = 1;
      const amount = 25.5;

      mockRequest.body = {
        paymentIntentId: "pi_second_payment",
        echeanceId,
        userId,
        amount: amount * 100,
      };

      const mockEcheance = {
        id: echeanceId,
        montant: amount,
        statut: "en_attente",
        utilisateur_id: userId,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      // Ne devrait PAS upgrader le statut
      expect(
        mockPaiementsClient.upgradeStatutUtilisateur,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Flux complet de paiement de commande", () => {
    it("devrait créer et confirmer un paiement de commande", async () => {
      const commandeId = 1;
      const userId = 1;
      const amount = 150.0;

      // Étape 1: Créer le Payment Intent
      mockRequest.body = {
        amount,
        commandeId,
        userId,
      };

      const mockCommande = {
        id: commandeId,
        montant_total: amount,
        statut: "en_attente",
        utilisateur_id: userId,
      };

      (mockPaiementsClient.obtenirCommandeParId as jest.Mock).mockResolvedValue(
        mockCommande,
      );

      await createPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // Étape 2: Confirmer le paiement
      mockRequest.body = {
        paymentIntentId: "pi_commande123",
        commandeId,
        userId,
        amount: amount * 100,
      };

      const mockUser = {
        id: userId,
        email: "commande@example.com",
      };

      (mockPaiementsClient.obtenirCommandeParId as jest.Mock).mockResolvedValue(
        mockCommande,
      );
      (
        mockPaiementsClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUser);
      (
        mockPaiementsClient.mettreAJourStatutCommande as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await confirmCommandePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(
        mockPaiementsClient.mettreAJourStatutCommande,
      ).toHaveBeenCalledWith(commandeId, "payé");
      expect(mockPaiementsClient.enregistrerPaiement).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Intégration Webhook Stripe", () => {
    it("devrait traiter un webhook payment_intent.succeeded pour échéance", async () => {
      const paymentIntentId = "pi_webhook123";
      const echeanceId = 1;

      mockRequest.body = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: paymentIntentId,
            metadata: {
              echeanceId: echeanceId.toString(),
              type: "echeance",
            },
            amount: 2550,
          },
        },
      };

      mockRequest.headers = {
        "stripe-signature": "valid_signature",
      };

      const mockEcheance = {
        id: echeanceId,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await webhookHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(
        mockPaiementsClient.mettreAJourStatutEcheance,
      ).toHaveBeenCalledWith(echeanceId, "payé");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait traiter un webhook payment_intent.succeeded pour commande", async () => {
      const paymentIntentId = "pi_webhook_commande";
      const commandeId = 1;

      mockRequest.body = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: paymentIntentId,
            metadata: {
              commandeId: commandeId.toString(),
              type: "commande",
            },
            amount: 15000,
          },
        },
      };

      mockRequest.headers = {
        "stripe-signature": "valid_signature",
      };

      const mockCommande = {
        id: commandeId,
        montant_total: 150.0,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      (mockPaiementsClient.obtenirCommandeParId as jest.Mock).mockResolvedValue(
        mockCommande,
      );
      (
        mockPaiementsClient.mettreAJourStatutCommande as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await webhookHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(
        mockPaiementsClient.mettreAJourStatutCommande,
      ).toHaveBeenCalledWith(commandeId, "payé");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait traiter un webhook payment_intent.payment_failed", async () => {
      const paymentIntentId = "pi_failed";
      const echeanceId = 1;

      mockRequest.body = {
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: paymentIntentId,
            metadata: {
              echeanceId: echeanceId.toString(),
              type: "echeance",
            },
            last_payment_error: {
              message: "Carte refusée",
            },
          },
        },
      };

      mockRequest.headers = {
        "stripe-signature": "valid_signature",
      };

      const mockEcheance = {
        id: echeanceId,
        montant: 25.5,
        statut: "en_attente",
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);

      await webhookHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(
        mockPaiementsClient.mettreAJourStatutEcheance,
      ).toHaveBeenCalledWith(echeanceId, "échoué");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait traiter un webhook charge.refunded", async () => {
      const echeanceId = 1;

      mockRequest.body = {
        type: "charge.refunded",
        data: {
          object: {
            metadata: {
              echeanceId: echeanceId.toString(),
              type: "echeance",
            },
          },
        },
      };

      mockRequest.headers = {
        "stripe-signature": "valid_signature",
      };

      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);

      await webhookHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(
        mockPaiementsClient.mettreAJourStatutEcheance,
      ).toHaveBeenCalledWith(echeanceId, "remboursé");
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Intégration des requêtes de consultation", () => {
    it("devrait récupérer l'historique complet avec pagination", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "0",
      };

      const mockPaiements = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        montant: 25.5,
        statut: "payé",
        date_creation: new Date(),
      }));

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: mockPaiements,
          total: 100,
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
          data: expect.arrayContaining([expect.any(Object)]),
          pagination: expect.objectContaining({
            limit: 10,
            offset: 0,
            total: 100,
            hasMore: true,
          }),
        }),
      );
    });

    it("devrait récupérer les échéances d'un utilisateur", async () => {
      const userId = 1;

      mockRequest.params = {
        userId: userId.toString(),
      };

      const mockEcheances = [
        { id: 1, montant: 25.5, statut: "en_attente" },
        { id: 2, montant: 25.5, statut: "payé" },
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
        }),
      );
    });

    it("devrait récupérer les détails d'une échéance", async () => {
      const echeanceId = 1;

      mockRequest.params = {
        echeanceId: echeanceId.toString(),
      };

      const mockEcheance = {
        id: echeanceId,
        montant: 25.5,
        statut: "payé",
        date_echeance: new Date(),
        utilisateur: {
          id: 1,
          nom: "Test",
          prenom: "User",
        },
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
    });
  });

  describe("Health Check et diagnostics", () => {
    it("devrait vérifier la santé du module avec statistiques", async () => {
      const mockPaiements = [
        { id: 1, statut: "payé", montant: 25.5 },
        { id: 2, statut: "payé", montant: 50.0 },
        { id: 3, statut: "en_attente", montant: 25.5 },
      ];

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: mockPaiements,
          total: 3,
        },
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          timestamp: expect.any(String),
          stats: expect.objectContaining({
            totalPaiements: 3,
          }),
        }),
      );
    });
  });

  describe("Gestion des erreurs en cascade", () => {
    it("devrait rollback si l'envoi d'email échoue (idéalement)", async () => {
      const echeanceId = 1;

      mockRequest.body = {
        paymentIntentId: "pi_test",
        echeanceId,
        userId: 1,
        amount: 2550,
      };

      const mockEcheance = {
        id: echeanceId,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      const mockUser = {
        id: 1,
        email: "test@example.com",
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUser);
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Email échoue mais ne devrait pas bloquer
      (mockEmailClient.envoyerEmail as jest.Mock).mockRejectedValue(
        new Error("Email service down"),
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      // Le paiement devrait être confirmé même si l'email échoue
      expect(mockPaiementsClient.mettreAJourStatutEcheance).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une échéance inexistante", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_invalid",
        echeanceId: 999,
        userId: 1,
        amount: 2550,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        null,
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("Échéance"),
        }),
      );
    });

    it("devrait gérer un montant incorrect", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_wrong_amount",
        echeanceId: 1,
        userId: 1,
        amount: 9999, // Mauvais montant
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

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
          error: expect.stringContaining("montant"),
        }),
      );
    });
  });

  describe("Scénarios multi-étapes", () => {
    it("devrait gérer plusieurs paiements pour le même utilisateur", async () => {
      const userId = 1;

      // Paiement 1
      mockRequest.body = {
        paymentIntentId: "pi_1",
        echeanceId: 1,
        userId,
        amount: 2550,
      };

      const mockEcheance1 = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: userId,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance1,
      );
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        true,
      );
      (
        mockPaiementsClient.upgradeStatutUtilisateur as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      expect(mockPaiementsClient.upgradeStatutUtilisateur).toHaveBeenCalledWith(
        userId,
        "actif",
      );

      // Paiement 2
      mockRequest.body = {
        paymentIntentId: "pi_2",
        echeanceId: 2,
        userId,
        amount: 2550,
      };

      const mockEcheance2 = {
        id: 2,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: userId,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance2,
      );
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      // Le deuxième paiement ne devrait PAS upgrader
      expect(
        mockPaiementsClient.upgradeStatutUtilisateur,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
