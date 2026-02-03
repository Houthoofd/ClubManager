/**
 * Tests de validation pour le module Échéances
 * Tests des validations de données et des cas d'erreur
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getEcheancesUtilisateur,
  createEcheance,
  updateEcheance,
  deleteEcheance,
} from "../core/handlers/index.js";

describe("Échéances Module - Tests de validation", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockPaiementsClient: Partial<Paiements>;

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
      obtenirEcheancesUtilisateur: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("Validation des IDs utilisateur", () => {
    it("devrait rejeter un userId non numérique", async () => {
      mockRequest.params = { userId: "abc" };

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un userId négatif", async () => {
      mockRequest.params = { userId: "-1" };

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait rejeter un userId égal à zéro", async () => {
      mockRequest.params = { userId: "0" };

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter un userId valide", async () => {
      mockRequest.params = { userId: "1" };

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue([]);

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe("Validation des montants", () => {
    it("devrait rejeter un montant négatif", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: -10,
        date_echeance: "2024-03-15",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un montant égal à zéro", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 0,
        date_echeance: "2024-03-15",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un montant trop petit (< 0.01€)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 0.001,
        date_echeance: "2024-03-15",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un montant trop grand (> 999999€)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 1000000,
        date_echeance: "2024-03-15",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter un montant valide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            statut: "en attente",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter des montants avec décimales", async () => {
      const montantsValides = [0.01, 1.5, 10.99, 100.0, 999.99];

      for (const montant of montantsValides) {
        jest.clearAllMocks();

        mockRequest.body = {
          utilisateur_id: 1,
          montant,
          date_echeance: "2024-03-15",
        };

        (mockPaiementsClient.queryAsync as jest.Mock)
          .mockResolvedValueOnce({ insertId: 1 })
          .mockResolvedValueOnce([
            {
              id: 1,
              utilisateur_id: 1,
              montant,
              date_echeance: "2024-03-15",
              statut: "en attente",
            },
          ]);

        await createEcheance(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        );

        expect(statusMock).toHaveBeenCalledWith(201);
      }
    });
  });

  describe("Validation des dates", () => {
    it("devrait rejeter une date invalide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "invalid-date",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter une date vide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter une date au format ISO", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            statut: "en attente",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter différents formats de date valides", async () => {
      const datesValides = [
        "2024-03-15",
        "2024-12-31",
        "2025-01-01",
        "2024-03-15T10:30:00Z",
      ];

      for (const date of datesValides) {
        jest.clearAllMocks();

        mockRequest.body = {
          utilisateur_id: 1,
          montant: 25.5,
          date_echeance: date,
        };

        (mockPaiementsClient.queryAsync as jest.Mock)
          .mockResolvedValueOnce({ insertId: 1 })
          .mockResolvedValueOnce([
            {
              id: 1,
              utilisateur_id: 1,
              montant: 25.5,
              date_echeance: date,
              statut: "en attente",
            },
          ]);

        await createEcheance(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        );

        expect(statusMock).toHaveBeenCalledWith(201);
      }
    });
  });

  describe("Validation des statuts", () => {
    it("devrait rejeter un statut invalide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "invalid_status",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter 'en attente'", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "en attente",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            statut: "en attente",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter 'payé'", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "payé",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            statut: "payé",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter 'échu'", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        statut: "échu",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            statut: "échu",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Validation des descriptions", () => {
    it("devrait rejeter une description vide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter une description trop longue (> 255 caractères)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "a".repeat(256),
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter une description valide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Cotisation mensuelle Mars 2024",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            description: "Cotisation mensuelle Mars 2024",
            statut: "en attente",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter une description avec caractères spéciaux", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Cotisation 2024 - Club de Judo (avec remise 10%)",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            date_echeance: "2024-03-15",
            description: "Cotisation 2024 - Club de Judo (avec remise 10%)",
            statut: "en attente",
          },
        ]);

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Validation des champs requis", () => {
    it("devrait rejeter si utilisateur_id est manquant", async () => {
      mockRequest.body = {
        montant: 25.5,
        date_echeance: "2024-03-15",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si montant est manquant", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        date_echeance: "2024-03-15",
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si date_echeance est manquante", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
      };

      await createEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Validation de la mise à jour", () => {
    it("devrait rejeter une mise à jour sans champs", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      const mockEcheance = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 25.5,
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      await updateEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Aucun champ à mettre à jour",
        }),
      );
    });

    it("devrait accepter une mise à jour partielle", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        montant: 30.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            statut: "en attente",
          },
        ])
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 30.0,
            statut: "en attente",
          },
        ]);

      await updateEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Validation de la suppression", () => {
    it("devrait rejeter un ID invalide pour suppression", async () => {
      mockRequest.params = { id: "abc" };

      await deleteEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "ID échéance invalide",
        }),
      );
    });

    it("devrait accepter un ID valide pour suppression", async () => {
      mockRequest.params = { id: "1" };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
          },
        ])
        .mockResolvedValueOnce({ affectedRows: 1 });

      await deleteEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Validation du stripe_payment_intent_id", () => {
    it("devrait rejeter un payment intent ID invalide", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        stripe_payment_intent_id: "invalid_id",
      };

      await updateEcheance(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter un payment intent ID valide", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        stripe_payment_intent_id: "pi_1234567890abcdef",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            statut: "en attente",
          },
        ])
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([
          {
            id: 1,
            utilisateur_id: 1,
            montant: 25.5,
            statut: "en attente",
            stripe_payment_intent_id: "pi_1234567890abcdef",
          },
        ]);

      await updateEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
