/**
 * Tests d'intégration Stripe
 * Teste le flux handlers → services → clients DB avec mocks
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { StripeService } from "../core/services/stripe.service.js";
import { PaymentService } from "../core/services/payment.service.js";
import { StatusUpgradeService } from "../core/services/status-upgrade.service.js";
import { EmailNotificationService } from "../core/services/email-notification.service.js";
import {
  createPaymentIntentEcheance,
  confirmPaymentEcheance,
} from "../core/handlers/index.js";

describe("Stripe Integration Tests - Flux complets", () => {
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

  // ==================== FLUX COMPLET: CRÉATION + CONFIRMATION ====================
  describe("Flux complet: Création PaymentIntent → Confirmation", () => {
    it("devrait gérer le flux complet de paiement d'échéance", async () => {
      // Mock des services
      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn().mockResolvedValue({
          clientSecret: "pi_test_secret",
          paymentIntentId: "pi_test_123",
        }),
        recupererPaymentIntent: jest.fn().mockResolvedValue({
          id: "pi_test_123",
          status: "succeeded",
        }),
      };

      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: true,
          echeance: { id: 1, montant: 50 },
        }),
        confirmerPaiementEcheance: jest.fn().mockResolvedValue({
          success: true,
          paiementId: 1,
          premierPaiement: false,
          userEmail: "test@example.com",
          userName: "Test User",
        }),
      };

      const mockStatusService = {
        upgraderStatutUtilisateur: jest.fn(),
      };

      const mockEmailService = {
        envoyerConfirmationPaiement: jest
          .fn()
          .mockResolvedValue({ success: true }),
      };

      // Étape 1: Créer PaymentIntent
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

      expect(mockPaymentService.verifierEcheance).toHaveBeenCalledWith(1, 1);
      expect(mockStripeService.creerPaymentIntentEcheance).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);

      // Récupérer le PaymentIntent ID de la réponse
      const createResponse = jsonMock.mock.calls[0][0];
      expect(createResponse.success).toBe(true);
      expect(createResponse.data).toEqual(
        expect.objectContaining({
          clientSecret: expect.any(String),
          paymentIntentId: "pi_test_123",
        }),
      );

      // Étape 2: Confirmer le paiement
      jest.clearAllMocks();
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        mockStatusService as any,
        mockEmailService as any,
      );

      expect(mockStripeService.recupererPaymentIntent).toHaveBeenCalledWith(
        "pi_test_123",
      );
      expect(mockPaymentService.confirmerPaiementEcheance).toHaveBeenCalled();
      expect(mockEmailService.envoyerConfirmationPaiement).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paiementId: 1,
            premierPaiement: false,
          }),
        }),
      );
    });

    it("devrait gérer le flux avec upgrade de statut sur premier paiement", async () => {
      const mockStripeService = {
        recupererPaymentIntent: jest.fn().mockResolvedValue({
          id: "pi_test_123",
          status: "succeeded",
        }),
      };

      const mockPaymentService = {
        confirmerPaiementEcheance: jest.fn().mockResolvedValue({
          success: true,
          paiementId: 1,
          premierPaiement: true, // Premier paiement!
          userEmail: "test@example.com",
          userName: "Test User",
        }),
      };

      const mockStatusService = {
        upgraderStatutUtilisateur: jest.fn().mockResolvedValue({
          upgraded: true,
          ancienStatut: "visiteur",
          nouveauStatut: "utilisateur",
        }),
      };

      const mockEmailService = {
        envoyerConfirmationPaiement: jest
          .fn()
          .mockResolvedValue({ success: true }),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        mockStatusService as any,
        mockEmailService as any,
      );

      // Vérifier que l'upgrade a été appelé
      expect(mockStatusService.upgraderStatutUtilisateur).toHaveBeenCalledWith(
        1,
        true,
      );

      // Vérifier que l'email inclut l'info d'upgrade
      expect(mockEmailService.envoyerConfirmationPaiement).toHaveBeenCalledWith(
        expect.objectContaining({
          premierPaiement: true,
          statusUpgrade: expect.objectContaining({
            upgraded: true,
          }),
        }),
      );

      // Vérifier la réponse
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paiementId: 1,
            premierPaiement: true,
            statusUpgrade: expect.objectContaining({
              upgraded: true,
              ancienStatut: "visiteur",
              nouveauStatut: "utilisateur",
            }),
          }),
        }),
      );
    });
  });

  // ==================== GESTION D'ERREURS DANS LE FLUX ====================
  describe("Gestion d'erreurs dans le flux", () => {
    it("devrait échouer à la création si échéance invalide", async () => {
      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn(),
      };

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
        mockStripeService as any,
        mockPaymentService as any,
      );

      // Ne devrait pas appeler Stripe si validation échoue
      expect(
        mockStripeService.creerPaymentIntentEcheance,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait continuer même si l'email échoue", async () => {
      const mockStripeService = {
        recupererPaymentIntent: jest.fn().mockResolvedValue({
          id: "pi_test_123",
        }),
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

      const mockStatusService = {
        upgraderStatutUtilisateur: jest.fn(),
      };

      const mockEmailService = {
        envoyerConfirmationPaiement: jest
          .fn()
          .mockRejectedValue(new Error("Email service down")),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        mockStatusService as any,
        mockEmailService as any,
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

  // ==================== FLUX MÉTHODES ALTERNATIVES ====================
  describe("Flux méthodes de paiement alternatives", () => {
    it("devrait créer une commande et enregistrer le paiement Bancontact", async () => {
      const mockPaymentService = {
        creerCommandeSiNecessaire: jest.fn().mockResolvedValue({
          commandeId: 1,
          created: true,
        }),
        enregistrerPaiement: jest.fn().mockResolvedValue(1),
      };

      mockRequest.body = {
        amount: 100,
        commande: {
          articles: [{ id: 1, quantite: 2 }],
        },
        userId: 1,
      };

      const { bancontact } = await import("../core/handlers/index.js");

      await bancontact(
        mockRequest as Request,
        mockResponse as Response,
        mockPaymentService as any,
      );

      expect(mockPaymentService.creerCommandeSiNecessaire).toHaveBeenCalled();
      expect(mockPaymentService.enregistrerPaiement).toHaveBeenCalledWith(
        expect.objectContaining({
          methodePaiement: "bancontact",
          statut: "en_attente",
          montant: 100,
          userId: 1,
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paiementId: 1,
            methodePaiement: "bancontact",
          }),
        }),
      );
    });
  });

  // ==================== VALIDATION OWNERSHIP ====================
  describe("Validation de propriété (ownership)", () => {
    it("devrait bloquer si l'échéance n'appartient pas à l'utilisateur", async () => {
      const mockStripeService = {
        creerPaymentIntentEcheance: jest.fn(),
      };

      const mockPaymentService = {
        verifierEcheance: jest.fn().mockResolvedValue({
          valid: false,
          error: "L'échéance n'appartient pas à cet utilisateur",
        }),
      };

      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 2, // Utilisateur différent
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(
        mockStripeService.creerPaymentIntentEcheance,
      ).not.toHaveBeenCalled();
    });

    it("devrait bloquer si la commande n'appartient pas à l'utilisateur", async () => {
      const mockStripeService = {
        recupererPaymentIntent: jest.fn().mockResolvedValue({
          id: "pi_test_123",
        }),
      };

      const mockPaymentService = {
        confirmerPaiementCommande: jest.fn().mockResolvedValue({
          success: false,
          error: "La commande n'appartient pas à cet utilisateur",
        }),
      };

      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        commandeId: 1,
        userId: 2,
        amount: 100,
      };

      const { confirmPaymentCommande } =
        await import("../core/handlers/index.js");

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as any,
        mockPaymentService as any,
        {} as any,
        {} as any,
      );

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });
});
