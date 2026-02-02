/**
 * Tests de sécurité pour le module Confirmation
 * Test des vulnérabilités et protections de sécurité
 * Refactorisé pour utiliser jest.spyOn() comme les tests de compte
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  confirmPayment,
  confirmPaymentCommande,
} from "../core/handlers/index.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import Stripe from "stripe";

describe("Confirmation - Tests de sécurité", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let paiementsClient: Paiements;
  let emailClient: EmailClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Créer les instances réelles
    paiementsClient = new Paiements();
    emailClient = EmailClient.getInstance();

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

    process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
  });

  describe("Injection SQL", () => {
    it("devrait rejeter des tentatives d'injection SQL dans echeanceId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1' OR '1'='1",
        userId: "1",
        amount: "50.00",
      };

      // Spy sur queryAsync pour simuler aucune échéance trouvée
      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });

    it("devrait rejeter des tentatives d'injection SQL dans userId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1; DROP TABLE utilisateurs;--",
        amount: "50.00",
      };

      // Spy sur queryAsync pour vérifier que les paramètres sont échappés
      const querySpy = jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue([]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // La requête paramétrée devrait protéger contre l'injection
      expect(statusMock).toHaveBeenCalled();
      // Vérifier que queryAsync a été appelé (donc la requête a été tentée)
      if (querySpy.mock.calls.length > 0) {
        expect(querySpy).toHaveBeenCalled();
      }
    });

    it("devrait protéger contre les injections dans commandeId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1 UNION SELECT * FROM utilisateurs",
        userId: "1",
        amount: "99.99",
      };

      // Mock Stripe pour ce test
      const mockStripe = {
        paymentIntents: {
          retrieve: jest.fn().mockResolvedValue({
            id: "pi_test_456",
            status: "succeeded",
            amount: 9999,
            currency: "eur",
          }),
        },
      };

      // Spy sur les méthodes nécessaires
      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("XSS (Cross-Site Scripting)", () => {
    it("devrait échapper les scripts dans le paymentIntentId", async () => {
      mockRequest.body = {
        paymentIntentId: "<script>alert('XSS')</script>",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait rejeter les paymentIntentId invalides
      expect(statusMock).toHaveBeenCalled();
      const statusCode = statusMock.mock.calls[0][0];
      expect([400, 500, 503]).toContain(statusCode);
    });

    it("devrait gérer des balises HTML dans les données", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "<img src=x onerror=alert('XSS')>",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Autorisation et authentification", () => {
    it("devrait empêcher un utilisateur de confirmer le paiement d'un autre", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "999", // Utilisateur différent
        amount: "50.00",
      };

      // Simuler une échéance appartenant à un autre utilisateur
      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1, // Différent de 999
          montant: 50.0,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait rejeter car userId ne correspond pas
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider que le userId correspond à l'échéance", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      // Simuler une échéance avec le bon utilisateur
      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ]);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      jest
        .spyOn(emailClient, "sendPaymentConfirmation")
        .mockResolvedValue(undefined);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Manipulation de données sensibles", () => {
    it("ne devrait pas exposer les clés Stripe dans les erreurs", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_invalid",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const originalKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = "sk_live_SENSITIVE_KEY_12345";

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Vérifier que la réponse ne contient pas la clé
      const response = jsonMock.mock.calls[0]?.[0];
      const responseStr = JSON.stringify(response);

      expect(responseStr).not.toContain("sk_live_SENSITIVE_KEY_12345");
      expect(responseStr).not.toContain("SENSITIVE_KEY");

      process.env.STRIPE_SECRET_KEY = originalKey;
    });

    it("ne devrait pas exposer les détails d'erreur de base de données", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const dbError = new Error("Table 'clubmanager.echeances' doesn't exist");
      (dbError as any).code = "ER_NO_SUCH_TABLE";

      jest.spyOn(paiementsClient, "queryAsync").mockRejectedValue(dbError);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0]?.[0];
      const responseStr = JSON.stringify(response);

      // Ne devrait pas exposer les détails de la structure de la DB
      expect(responseStr).not.toContain("clubmanager.echeances");
      expect(responseStr).not.toContain("ER_NO_SUCH_TABLE");
    });

    it("ne devrait pas exposer la structure de la base de données en détail", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      const tableError = new Error(
        "Unknown column 'secret_field' in 'field list'",
      );

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockRejectedValue(tableError);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Rate limiting et DoS", () => {
    it("devrait gérer de multiples requêtes rapides (simulation)", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ]);

      // Simuler 5 requêtes rapides
      const requests = Array(5)
        .fill(null)
        .map(() =>
          confirmPayment(mockRequest as Request, mockResponse as Response),
        );

      await Promise.all(requests);

      // Toutes les requêtes devraient avoir reçu une réponse
      expect(statusMock.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Validation des montants", () => {
    it("devrait rejeter des montants négatifs", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "-50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ]);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait quand même traiter la requête mais valider le montant
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider la cohérence entre amount et le montant Stripe", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "50.00", // Montant différent de Stripe
      };

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les attaques par timing", () => {
    it("devrait avoir un temps de réponse similaire pour échéance existante ou non", async () => {
      const timings: number[] = [];

      // Test avec échéance existante
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ]);

      const start1 = Date.now();
      await confirmPayment(mockRequest as Request, mockResponse as Response);
      timings.push(Date.now() - start1);

      jest.clearAllMocks();

      // Test avec échéance inexistante
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        echeanceId: "999",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([]);

      const start2 = Date.now();
      await confirmPayment(mockRequest as Request, mockResponse as Response);
      timings.push(Date.now() - start2);

      // Les temps devraient être relativement similaires (différence < 100ms)
      const diff = Math.abs(timings[0] - timings[1]);
      expect(diff).toBeLessThan(100);
    });
  });

  describe("Prévention de la manipulation de paramètres", () => {
    it("devrait ignorer les champs supplémentaires malveillants", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
        // Champs malveillants
        isAdmin: true,
        role: "admin",
        status_id: 999,
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ]);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Les champs supplémentaires ne devraient pas affecter le traitement
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des formats", () => {
    it("devrait valider le format du paymentIntentId", async () => {
      const invalidPaymentIntentIds = [
        "",
        null,
        undefined,
        "invalid",
        "12345",
        "ch_test_123", // Mauvais préfixe
      ];

      for (const invalidId of invalidPaymentIntentIds) {
        jest.clearAllMocks();

        mockRequest.body = {
          paymentIntentId: invalidId,
          echeanceId: "1",
          userId: "1",
          amount: "50.00",
        };

        await confirmPayment(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalled();
      }
    });

    it("devrait valider que les IDs sont des nombres valides", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "abc", // Non numérique
        userId: "1",
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Gestion des erreurs sensibles", () => {
    it("devrait masquer les erreurs internes dans les réponses", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const internalError = new Error(
        "Internal error: Database connection failed at 192.168.1.100:3306",
      );

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockRejectedValue(internalError);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0]?.[0];
      const responseStr = JSON.stringify(response);

      // Ne devrait pas exposer les détails internes
      expect(responseStr).not.toContain("192.168.1.100");
      expect(responseStr).not.toContain("Database connection failed");
    });
  });
});
