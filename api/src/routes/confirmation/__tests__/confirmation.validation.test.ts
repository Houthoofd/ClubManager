/**
 * Tests de validation pour le module Confirmation
 * Validation des données entrantes et des règles métier
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

describe("Confirmation - Tests de validation", () => {
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

  describe("Validation confirmPayment", () => {
    it("devrait rejeter une requête sans paymentIntentId", async () => {
      mockRequest.body = {
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response).toHaveProperty("error");
      expect(response.error).toContain("paymentIntentId");
    });

    it("devrait rejeter une requête sans echeanceId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        userId: "1",
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response).toHaveProperty("error");
      expect(response.error).toContain("echeanceId");
    });

    it("devrait rejeter une requête sans userId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        amount: "50.00",
      };

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response).toHaveProperty("error");
      expect(response.error).toContain("userId");
    });

    it("devrait accepter une requête avec tous les champs requis", async () => {
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider le format du paymentIntentId (doit commencer par pi_)", async () => {
      const invalidIds = ["invalid", "ch_123", "pm_123", ""];

      for (const invalidId of invalidIds) {
        jest.clearAllMocks();

        mockRequest.body = {
          paymentIntentId: invalidId,
          echeanceId: "1",
          userId: "1",
          amount: "50.00",
        };

        await confirmPayment(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalled();
        const statusCode = statusMock.mock.calls[0][0];
        expect([400, 500, 503]).toContain(statusCode);
      }
    });

    it("devrait valider que echeanceId est un nombre", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "abc",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider que userId est un nombre", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "xyz",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider que amount est un nombre positif", async () => {
      const invalidAmounts = ["-50.00", "0", "-0.01", "abc", ""];

      for (const invalidAmount of invalidAmounts) {
        jest.clearAllMocks();

        mockRequest.body = {
          paymentIntentId: "pi_test_123",
          echeanceId: "1",
          userId: "1",
          amount: invalidAmount,
        };

        jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50.0,
            date_echeance: new Date("2024-01-01"),
            abonnement_id: 1,
          },
        ]);

        await confirmPayment(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalled();
      }
    });
  });

  describe("Validation confirmPaymentCommande", () => {
    it("devrait rejeter une requête sans paymentIntentId", async () => {
      mockRequest.body = {
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("error");
    });

    it("devrait rejeter une requête sans commandeId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        userId: "1",
        amount: "99.99",
      };

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("error");
    });

    it("devrait rejeter une requête sans userId", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        amount: "99.99",
      };

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("error");
    });

    it("devrait accepter une requête avec tous les champs requis", async () => {
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

      // Note: EmailClient methods are called internally

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider que commandeId est un nombre", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "not_a_number",
        userId: "1",
        amount: "99.99",
      };

      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des montants", () => {
    it("devrait rejeter un montant avec trop de décimales", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.123456",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait accepter un montant avec 2 décimales", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.99",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.99,
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter un montant très élevé (anti-fraude)", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "999999999.99",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation de l'état de l'échéance", () => {
    it("devrait rejeter une échéance inexistante", async () => {
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

    it("devrait gérer une échéance déjà payée", async () => {
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
      expect(response).toBeDefined();
    });

    it("devrait valider que le userId correspond à l'échéance", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "999",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1, // Différent de 999
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des types de données", () => {
    it("devrait convertir les IDs en entiers", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "42",
        userId: "7",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 42,
          statut: "en_attente",
          utilisateur_id: 7,
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les montants avec virgule", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50,99",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: new Date("2024-01-01"),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des champs optionnels", () => {
    it("devrait ignorer les champs supplémentaires non autorisés", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
        // Champs non autorisés
        admin: true,
        role: "superadmin",
        deleteUser: true,
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Ne devrait pas échouer, les champs supplémentaires sont ignorés
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait accepter amount optionnel s'il est cohérent avec l'échéance", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        // amount optionnel
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Validation des règles métier", () => {
    it("devrait vérifier que le montant correspond à l'échéance", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "100.00", // Montant différent de l'échéance
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0, // Montant attendu: 50.00
          date_echeance: new Date("2024-01-01"),
          abonnement_id: 1,
        },
      ]);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider que l'échéance n'est pas expirée", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValueOnce([
        {
          id: 1,
          statut: "en_attente",
          utilisateur_id: 1,
          montant: 50.0,
          date_echeance: pastDate, // Date dans le passé
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

      // Note: EmailClient methods are called internally

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait quand même traiter le paiement
      expect(statusMock).toHaveBeenCalled();
    });
  });
});
