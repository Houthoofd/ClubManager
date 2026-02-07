/**
 * Tests unitaires principaux pour le module Stripe
 * Tests des fonctionnalités de base des handlers (happy path + erreurs)
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { StripeService } from "../core/services/stripe.service.js";
import { PaymentService } from "../core/services/payment.service.js";
import { StatusUpgradeService } from "../core/services/status-upgrade.service.js";
import { EmailNotificationService } from "../core/services/email-notification.service.js";
import {
  createPaymentIntentEcheance,
  createPaymentIntentCommande,
  confirmPaymentEcheance,
  confirmPaymentCommande,
  bancontact,
  paypal,
  bitcoin,
  config,
  debugStripeConfig,
  testPaymentIntent,
  health,
} from "../core/handlers/index.js";

describe("Stripe Module - Tests unitaires de base", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockStripeService: Partial<StripeService>;
  let mockPaymentService: Partial<PaymentService>;
  let mockStatusUpgradeService: Partial<StatusUpgradeService>;
  let mockEmailService: Partial<EmailNotificationService>;

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

    // Mock des services
    mockStripeService = {
      creerPaymentIntentEcheance: jest.fn(),
      creerPaymentIntentCommande: jest.fn(),
      recupererPaymentIntent: jest.fn(),
      testerConnectivite: jest.fn(),
      obtenirConfiguration: jest.fn(),
    };

    mockPaymentService = {
      verifierEcheance: jest.fn(),
      verifierCommande: jest.fn(),
      creerCommandeSiNecessaire: jest.fn(),
      confirmerPaiementEcheance: jest.fn(),
      confirmerPaiementCommande: jest.fn(),
      enregistrerPaiement: jest.fn(),
    };

    mockStatusUpgradeService = {
      upgraderStatutUtilisateur: jest.fn(),
    };

    mockEmailService = {
      envoyerConfirmationPaiement: jest.fn(),
    };
  });

  // ==================== CREATE PAYMENT INTENT ECHEANCE ====================
  describe("createPaymentIntentEcheance - POST /api/stripe/create-payment-intent", () => {
    it("devrait créer un PaymentIntent pour une échéance valide", async () => {
      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
        description: "Paiement échéance",
      };

      (mockPaymentService.verifierEcheance as jest.Mock).mockResolvedValue({
        valid: true,
        echeance: { id: 1, userId: 1 },
      });

      (
        mockStripeService.creerPaymentIntentEcheance as jest.Mock
      ).mockResolvedValue({
        clientSecret: "pi_test_secret_xxx",
        paymentIntentId: "pi_test_xxx",
      });

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(mockPaymentService.verifierEcheance).toHaveBeenCalledWith(1, 1);
      expect(mockStripeService.creerPaymentIntentEcheance).toHaveBeenCalledWith(
        {
          amount: 50,
          echeanceId: 1,
          userId: 1,
          description: "Paiement échéance",
        },
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "PaymentIntent créé avec succès",
          data: expect.objectContaining({
            clientSecret: "pi_test_secret_xxx",
            paymentIntentId: "pi_test_xxx",
          }),
        }),
      );
    });

    it("devrait retourner 400 si les données sont invalides", async () => {
      mockRequest.body = {
        amount: -10, // Montant négatif invalide
        echeanceId: 1,
        userId: 1,
      };

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait retourner 403 si l'échéance n'appartient pas à l'utilisateur", async () => {
      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      (mockPaymentService.verifierEcheance as jest.Mock).mockResolvedValue({
        valid: false,
        error: "L'échéance n'appartient pas à cet utilisateur",
      });

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait retourner 404 si l'échéance n'existe pas", async () => {
      mockRequest.body = {
        amount: 50,
        echeanceId: 999,
        userId: 1,
      };

      (mockPaymentService.verifierEcheance as jest.Mock).mockResolvedValue({
        valid: false,
        error: "Échéance non trouvée",
      });

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      mockRequest.body = {
        amount: 50,
        echeanceId: 1,
        userId: 1,
      };

      (mockPaymentService.verifierEcheance as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await createPaymentIntentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la création du PaymentIntent",
        }),
      );
    });
  });

  // ==================== CREATE PAYMENT INTENT COMMANDE ====================
  describe("createPaymentIntentCommande - POST /api/stripe/create-payment-intent-commande", () => {
    it("devrait créer un PaymentIntent pour une commande", async () => {
      mockRequest.body = {
        amount: 100,
        commande: {
          id: 1,
          articles: [{ id: 1, quantite: 2 }],
        },
        userId: 1,
      };

      (
        mockPaymentService.creerCommandeSiNecessaire as jest.Mock
      ).mockResolvedValue({
        commandeId: 1,
        created: false,
      });

      (mockPaymentService.verifierCommande as jest.Mock).mockResolvedValue({
        valid: true,
        commande: { id: 1, articles: [{ id: 1, quantite: 2 }] },
      });

      (
        mockStripeService.creerPaymentIntentCommande as jest.Mock
      ).mockResolvedValue({
        clientSecret: "pi_test_secret_xxx",
        paymentIntentId: "pi_test_xxx",
      });

      await createPaymentIntentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clientSecret: expect.any(String),
            paymentIntentId: "pi_test_xxx",
          }),
        }),
      );
    });

    it("devrait retourner 400 si la commande n'a pas d'articles", async () => {
      mockRequest.body = {
        amount: 100,
        commande: {
          id: 1,
          articles: [],
        },
        userId: 1,
      };

      (
        mockPaymentService.creerCommandeSiNecessaire as jest.Mock
      ).mockResolvedValue({
        commandeId: 1,
        created: false,
      });

      (mockPaymentService.verifierCommande as jest.Mock).mockResolvedValue({
        valid: false,
        error: "La commande doit contenir au moins un article",
      });

      await createPaymentIntentCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== CONFIRM PAYMENT ECHEANCE ====================
  describe("confirmPaymentEcheance - POST /api/stripe/confirm-payment", () => {
    it("devrait confirmer un paiement d'échéance avec succès", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      (mockStripeService.recupererPaymentIntent as jest.Mock).mockResolvedValue(
        {
          id: "pi_test_xxx",
          status: "succeeded",
        },
      );

      (
        mockPaymentService.confirmerPaiementEcheance as jest.Mock
      ).mockResolvedValue({
        success: true,
        paiementId: 1,
        premierPaiement: false,
        userEmail: "test@example.com",
        userName: "Test User",
      });

      (
        mockEmailService.envoyerConfirmationPaiement as jest.Mock
      ).mockResolvedValue({
        success: true,
      });

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
        mockStatusUpgradeService as StatusUpgradeService,
        mockEmailService as EmailNotificationService,
      );

      expect(mockPaymentService.confirmerPaiementEcheance).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Paiement confirmé avec succès",
          data: expect.objectContaining({
            paiementId: 1,
            premierPaiement: false,
          }),
        }),
      );
    });

    it("devrait upgrader le statut utilisateur sur premier paiement", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      (mockStripeService.recupererPaymentIntent as jest.Mock).mockResolvedValue(
        {
          id: "pi_test_xxx",
        },
      );

      (
        mockPaymentService.confirmerPaiementEcheance as jest.Mock
      ).mockResolvedValue({
        success: true,
        paiementId: 1,
        premierPaiement: true,
        userEmail: "test@example.com",
        userName: "Test User",
      });

      (
        mockStatusUpgradeService.upgraderStatutUtilisateur as jest.Mock
      ).mockResolvedValue({
        upgraded: true,
        ancienStatut: "visiteur",
        nouveauStatut: "utilisateur",
      });

      (
        mockEmailService.envoyerConfirmationPaiement as jest.Mock
      ).mockResolvedValue({
        success: true,
      });

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
        mockStatusUpgradeService as StatusUpgradeService,
        mockEmailService as EmailNotificationService,
      );

      expect(
        mockStatusUpgradeService.upgraderStatutUtilisateur,
      ).toHaveBeenCalledWith(1, true);
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

    it("devrait retourner 404 si le PaymentIntent n'existe pas", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_invalid",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      (mockStripeService.recupererPaymentIntent as jest.Mock).mockResolvedValue(
        null,
      );

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
        mockStatusUpgradeService as StatusUpgradeService,
        mockEmailService as EmailNotificationService,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("ne devrait pas bloquer si l'email échoue", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_xxx",
        echeanceId: 1,
        userId: 1,
        amount: 50,
      };

      (mockStripeService.recupererPaymentIntent as jest.Mock).mockResolvedValue(
        {
          id: "pi_test_xxx",
        },
      );

      (
        mockPaymentService.confirmerPaiementEcheance as jest.Mock
      ).mockResolvedValue({
        success: true,
        paiementId: 1,
        premierPaiement: false,
        userEmail: "test@example.com",
        userName: "Test User",
      });

      (
        mockEmailService.envoyerConfirmationPaiement as jest.Mock
      ).mockRejectedValue(new Error("Email service unavailable"));

      await confirmPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
        mockPaymentService as PaymentService,
        mockStatusUpgradeService as StatusUpgradeService,
        mockEmailService as EmailNotificationService,
      );

      // Le paiement devrait quand même être confirmé
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== MÉTHODES ALTERNATIVES ====================
  describe("Méthodes de paiement alternatives", () => {
    it("bancontact - devrait créer un paiement Bancontact", async () => {
      mockRequest.body = {
        amount: 100,
        commande: { articles: [{ id: 1 }] },
        userId: 1,
      };

      (
        mockPaymentService.creerCommandeSiNecessaire as jest.Mock
      ).mockResolvedValue({
        commandeId: 1,
        created: true,
      });

      (mockPaymentService.enregistrerPaiement as jest.Mock).mockResolvedValue(
        1,
      );

      await bancontact(
        mockRequest as Request,
        mockResponse as Response,
        mockPaymentService as PaymentService,
      );

      expect(mockPaymentService.enregistrerPaiement).toHaveBeenCalledWith(
        expect.objectContaining({
          methodePaiement: "bancontact",
          montant: 100,
          userId: 1,
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          data: expect.objectContaining({
            paiementId: 1,
            methodePaiement: "bancontact",
          }),
        }),
      );
    });

    it("paypal - devrait créer un paiement PayPal", async () => {
      mockRequest.body = {
        amount: 100,
        commande: { articles: [{ id: 1 }] },
        userId: 1,
      };

      (
        mockPaymentService.creerCommandeSiNecessaire as jest.Mock
      ).mockResolvedValue({
        commandeId: 1,
        created: true,
      });

      (mockPaymentService.enregistrerPaiement as jest.Mock).mockResolvedValue(
        1,
      );

      await paypal(
        mockRequest as Request,
        mockResponse as Response,
        mockPaymentService as PaymentService,
      );

      expect(mockPaymentService.enregistrerPaiement).toHaveBeenCalledWith(
        expect.objectContaining({
          methodePaiement: "paypal",
          montant: 100,
          userId: 1,
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          data: expect.objectContaining({
            paiementId: 1,
            methodePaiement: "paypal",
          }),
        }),
      );
    });

    it("bitcoin - devrait créer un paiement Bitcoin", async () => {
      mockRequest.body = {
        amount: 100,
        commande: { articles: [{ id: 1 }] },
        userId: 1,
      };

      (
        mockPaymentService.creerCommandeSiNecessaire as jest.Mock
      ).mockResolvedValue({
        commandeId: 1,
        created: true,
      });

      (mockPaymentService.enregistrerPaiement as jest.Mock).mockResolvedValue(
        1,
      );

      await bitcoin(
        mockRequest as Request,
        mockResponse as Response,
        mockPaymentService as PaymentService,
      );

      expect(mockPaymentService.enregistrerPaiement).toHaveBeenCalledWith(
        expect.objectContaining({
          methodePaiement: "bitcoin",
          montant: 100,
          userId: 1,
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          data: expect.objectContaining({
            paiementId: 1,
            methodePaiement: "bitcoin",
          }),
        }),
      );
    });
  });

  // ==================== CONFIG & DEBUG ====================
  describe("Config et Debug", () => {
    it("config - devrait retourner la configuration Stripe", async () => {
      (mockStripeService.obtenirConfiguration as jest.Mock).mockReturnValue({
        publishableKey: "pk_test_xxx",
        paymentMethods: ["card", "bancontact"],
      });

      await config(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            publishableKey: "pk_test_xxx",
            paymentMethods: expect.arrayContaining(["card", "bancontact"]),
          }),
        }),
      );
    });

    it("health - devrait retourner healthy si tout est configuré", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";

      (mockStripeService.testerConnectivite as jest.Mock).mockResolvedValue({
        connected: true,
      });

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: "healthy",
            connected: true,
          }),
        }),
      );
    });

    it("health - devrait retourner unhealthy si mal configuré", async () => {
      delete process.env.STRIPE_SECRET_KEY;

      (mockStripeService.testerConnectivite as jest.Mock).mockResolvedValue({
        connected: false,
        error: "No API key",
      });

      await health(
        mockRequest as Request,
        mockResponse as Response,
        mockStripeService as StripeService,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: expect.objectContaining({
            status: "unhealthy",
            connected: false,
          }),
        }),
      );
    });
  });
});
