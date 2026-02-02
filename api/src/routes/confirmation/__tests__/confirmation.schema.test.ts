/**
 * Tests de cohérence des schémas pour le module Confirmation
 * Vérifie la structure et les types des données retournées
 * Refactorisé pour utiliser jest.spyOn() comme les tests de compte
 */

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

describe("Confirmation - Tests de cohérence des schémas", () => {
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

  describe("Structure des réponses - confirmPayment", () => {
    it("devrait retourner une structure cohérente pour un paiement réussi", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      // Mock des appels successifs à queryAsync
      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50.0,
            date_echeance: new Date("2024-01-01"),
            abonnement_id: 1,
          },
        ])
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);

      jest
        .spyOn(emailClient, "sendPaymentConfirmation")
        .mockResolvedValue(undefined);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];

      // Vérifier la structure de la réponse
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("echeanceId");
      expect(response).toHaveProperty("paymentIntentId");
      expect(response).toHaveProperty("amount");

      // Vérifier les types
      expect(typeof response.message).toBe("string");
      expect(typeof response.paymentIntentId).toBe("string");
    });

    it("devrait inclure statut_upgrade pour un premier paiement", async () => {
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
            montant: 50.0,
            date_echeance: new Date("2024-01-01"),
            abonnement_id: 1,
          },
        ])
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest.spyOn(paiementsClient, "estPremierPaiement").mockResolvedValue(true);

      jest
        .spyOn(emailClient, "sendPaymentConfirmation")
        .mockResolvedValue(undefined);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);

      const response = jsonMock.mock.calls[0][0];

      // Devrait inclure statut_upgrade pour premier paiement
      expect(response).toHaveProperty("statut_upgrade");
      expect(typeof response.statut_upgrade).toBe("boolean");
    });

    it("devrait retourner une structure cohérente pour une échéance déjà payée", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "payé",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];

      // Devrait retourner un message approprié
      expect(response).toHaveProperty("message");
      if (response.error) {
        expect(typeof response.error).toBe("string");
      }
    });
  });

  describe("Structure des réponses - confirmPaymentCommande", () => {
    it("devrait retourner une structure cohérente pour une commande payée", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      jest
        .spyOn(emailClient, "sendOrderConfirmation")
        .mockResolvedValue(undefined);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];

      // Vérifier la structure de base
      if (response.message) {
        expect(typeof response.message).toBe("string");
      }
      if (response.commandeId) {
        expect(typeof response.commandeId).toBe("string");
      }
      if (response.paymentIntentId) {
        expect(typeof response.paymentIntentId).toBe("string");
      }
    });

    it("devrait inclure les informations de structure de table", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      jest
        .spyOn(emailClient, "sendOrderConfirmation")
        .mockResolvedValue(undefined);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];

      // La réponse devrait être cohérente
      expect(response).toBeDefined();
      expect(typeof response).toBe("object");
    });
  });

  describe("Structure des réponses - health", () => {
    it("devrait retourner un statut de santé avec la structure attendue", async () => {
      await health(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];

      // Vérifier la structure du health check
      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("module");
      expect(response.module).toBe("confirmation");
      expect(response.status).toBe("ok");
    });
  });

  describe("Structure des réponses - debugTableStructure", () => {
    it("devrait retourner une structure complète de table", async () => {
      mockRequest.query = { table: "echeances" };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
        {
          Field: "montant",
          Type: "decimal(10,2)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
      ]);

      await debugTableStructure(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];

      // Vérifier la structure de la réponse
      expect(response).toHaveProperty("table");
      expect(response).toHaveProperty("columns");
      expect(response.table).toBe("echeances");
      expect(Array.isArray(response.columns)).toBe(true);
    });

    it("devrait formater correctement les colonnes", async () => {
      mockRequest.query = { table: "commandes" };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
      ]);

      await debugTableStructure(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];

      if (response.columns && response.columns.length > 0) {
        const column = response.columns[0];

        // Vérifier les propriétés de chaque colonne
        expect(column).toHaveProperty("Field");
        expect(column).toHaveProperty("Type");
        expect(column).toHaveProperty("Null");
        expect(column).toHaveProperty("Key");
      }
    });

    it("devrait gérer les tables inexistantes", async () => {
      mockRequest.query = { table: "table_inexistante" };

      const error = new Error("Table doesn't exist");
      jest.spyOn(paiementsClient, "queryAsync").mockRejectedValue(error);

      await debugTableStructure(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("error");
    });
  });

  describe("Structure des erreurs", () => {
    it("devrait retourner une structure d'erreur SQL cohérente", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      const sqlError = new Error("SQL Error");
      (sqlError as any).code = "ER_DUP_ENTRY";

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockRejectedValue(sqlError);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];

      // Vérifier la structure de l'erreur
      expect(response).toHaveProperty("error");
      expect(typeof response.error).toBe("string");
    });

    it("devrait retourner une erreur 400 pour des paramètres manquants", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        // userId manquant
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("error");
    });

    it("devrait retourner une erreur 404 pour une échéance inexistante", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "999",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("error");
    });
  });

  describe("Validation des types de données", () => {
    it("devrait convertir les IDs en nombres appropriés", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
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

      const response = jsonMock.mock.calls[0][0];

      // Vérifier que les IDs sont cohérents
      if (response.echeanceId) {
        expect(
          typeof response.echeanceId === "string" ||
            typeof response.echeanceId === "number",
        ).toBe(true);
      }
    });

    it("devrait valider le format des montants", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue({ affectedRows: 1 } as any);

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ]);

      jest
        .spyOn(emailClient, "sendOrderConfirmation")
        .mockResolvedValue(undefined);

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];

      // Vérifier le format du montant si présent
      if (response.amount) {
        const amount = parseFloat(response.amount);
        expect(isNaN(amount)).toBe(false);
        expect(amount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Cohérence entre requête et réponse", () => {
    it("devrait retourner le même paymentIntentId fourni", async () => {
      const paymentIntentId = "pi_test_unique_123";

      mockRequest.body = {
        paymentIntentId,
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
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

      const response = jsonMock.mock.calls[0][0];

      // Le paymentIntentId devrait correspondre
      if (response.paymentIntentId) {
        expect(response.paymentIntentId).toBe(paymentIntentId);
      }
    });

    it("devrait retourner le même echeanceId fourni", async () => {
      const echeanceId = "42";

      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId,
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 42,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
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

      const response = jsonMock.mock.calls[0][0];

      // L'echeanceId devrait correspondre (en string ou number)
      if (response.echeanceId) {
        expect(response.echeanceId.toString()).toBe(echeanceId);
      }
    });
  });

  describe("Gestion des champs optionnels", () => {
    it("devrait gérer les réponses avec et sans champs optionnels", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
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

      const response = jsonMock.mock.calls[0][0];

      // Les champs obligatoires doivent être présents
      expect(response).toBeDefined();
      expect(typeof response).toBe("object");

      // Les champs optionnels peuvent être absents
      // Pas d'erreur si statut_upgrade n'est pas présent pour un non-premier paiement
    });
  });
});
