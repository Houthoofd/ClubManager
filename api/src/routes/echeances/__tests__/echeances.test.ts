/**
 * Tests de base pour le module Échéances
 * Tests des fonctionnalités principales (happy path)
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getEcheancesUtilisateur,
  getEcheanceDetail,
  getEcheanceCompat,
  createEcheance,
  updateEcheance,
  deleteEcheance,
  getStatistiquesUtilisateur,
  getDiagnosticEcheance,
  healthCheck,
} from "../core/handlers/index.js";

describe("Échéances Module - Tests de base", () => {
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

    // Mock du client Paiements
    mockPaiementsClient = {
      obtenirEcheancesUtilisateur: jest.fn(),
      obtenirEcheanceAvecUtilisateur: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("getEcheancesUtilisateur - GET /api/echeances/:userId", () => {
    it("devrait retourner les échéances d'un utilisateur", async () => {
      mockRequest.params = { userId: "1" };

      const mockEcheances = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 25.5,
          statut: "en attente",
          date_echeance: "2024-03-15",
        },
        {
          id: 2,
          utilisateur_id: 1,
          montant: 30.0,
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

      expect(
        mockPaiementsClient.obtenirEcheancesUtilisateur,
      ).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockEcheances,
          count: 2,
          utilisateur_id: 1,
        }),
      );
    });

    it("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = { userId: "abc" };

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait retourner un tableau vide si aucune échéance", async () => {
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
          data: [],
          count: 0,
          utilisateur_id: 1,
        }),
      );
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockRequest.params = { userId: "1" };

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Erreur DB"));

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
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

  describe("getEcheanceDetail - GET /api/echeances/detail/:echeanceId", () => {
    it("devrait retourner les détails d'une échéance", async () => {
      mockRequest.params = { echeanceId: "1" };
      (mockRequest as any).user = { id: 1 };

      const mockEcheance = {
        id: 1,
        utilisateur_id: 1,
        montant: 25.5,
        statut: "en attente",
        description: "Cotisation mensuelle",
        date_echeance: "2024-03-15",
        utilisateur: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockEcheance,
      ]);

      await getEcheanceDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 1,
            montant: 25.5,
          }),
        }),
      );
    });

    it("devrait retourner 404 si l'échéance n'existe pas", async () => {
      mockRequest.params = { echeanceId: "999" };
      (mockRequest as any).user = { id: 1 };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      await getEcheanceDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Échéance non trouvée",
        }),
      );
    });

    it("devrait retourner 400 si l'echeanceId est invalide", async () => {
      mockRequest.params = { echeanceId: "abc" };

      await getEcheanceDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "ID échéance invalide",
        }),
      );
    });
  });

  describe("createEcheance - POST /api/echeances", () => {
    it("devrait créer une échéance avec succès", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Cotisation mensuelle",
      };

      const mockEcheanceCreee = {
        id: 1,
        utilisateur_id: 1,
        montant: 25.5,
        date_echeance: "2024-03-15",
        description: "Cotisation mensuelle",
        statut: "en attente",
      };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 }) // INSERT
        .mockResolvedValueOnce([mockEcheanceCreee]); // SELECT

      await createEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Échéance créée avec succès",
          data: expect.objectContaining({
            id: 1,
            montant: 25.5,
          }),
        }),
      );
    });

    it("devrait retourner 400 si des champs requis sont manquants", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        // montant manquant
        date_echeance: "2024-03-15",
      };

      await createEcheance(
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

    it("devrait retourner 400 si le montant est invalide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        montant: -10, // montant négatif
        date_echeance: "2024-03-15",
      };

      await createEcheance(
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

  describe("updateEcheance - PUT /api/echeances/:id", () => {
    it("devrait mettre à jour une échéance avec succès", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        montant: 30.0,
        statut: "payé",
      };

      const mockEcheanceExistante = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 25.5,
          statut: "en attente",
        },
      ];

      const mockEcheanceMiseAJour = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 30.0,
          statut: "payé",
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockEcheanceExistante) // SELECT vérification
        .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE
        .mockResolvedValueOnce(mockEcheanceMiseAJour); // SELECT final

      await updateEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Échéance mise à jour avec succès",
          data: expect.objectContaining({
            id: 1,
            montant: 30.0,
            statut: "payé",
          }),
        }),
      );
    });

    it("devrait retourner 404 si l'échéance n'existe pas", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = {
        montant: 30.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      await updateEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Échéance non trouvée",
        }),
      );
    });

    it("devrait retourner 400 si aucun champ à mettre à jour", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      const mockEcheanceExistante = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 25.5,
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEcheanceExistante,
      );

      await updateEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Aucun champ à mettre à jour",
        }),
      );
    });
  });

  describe("deleteEcheance - DELETE /api/echeances/:id", () => {
    it("devrait supprimer une échéance avec succès", async () => {
      mockRequest.params = { id: "1" };

      const mockEcheanceExistante = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 25.5,
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockEcheanceExistante) // SELECT vérification
        .mockResolvedValueOnce({ affectedRows: 1 }); // DELETE

      await deleteEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Échéance supprimée avec succès",
          echeanceId: 1,
        }),
      );
    });

    it("devrait retourner 404 si l'échéance n'existe pas", async () => {
      mockRequest.params = { id: "999" };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      await deleteEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Échéance non trouvée",
        }),
      );
    });

    it("devrait retourner 400 si l'ID est invalide", async () => {
      mockRequest.params = { id: "abc" };

      await deleteEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "ID échéance invalide",
        }),
      );
    });
  });

  describe("getStatistiquesUtilisateur - GET /api/echeances/statistiques/:userId", () => {
    it("devrait retourner les statistiques d'un utilisateur", async () => {
      mockRequest.params = { userId: "1" };

      const mockEcheances = [
        {
          id: 1,
          utilisateur_id: 1,
          abonnement_id: 1,
          montant: 25.5,
          statut: "en attente",
          date_echeance: "2024-03-15",
          date_creation: "2024-01-01",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          nom_plan: "Plan Basic",
          prix_plan: 25.5,
        },
        {
          id: 2,
          utilisateur_id: 1,
          abonnement_id: 1,
          montant: 30.0,
          statut: "payé",
          date_echeance: "2024-02-15",
          date_creation: "2024-01-01",
          date_paiement: "2024-02-15",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          nom_plan: "Plan Basic",
          prix_plan: 30.0,
        },
        {
          id: 3,
          utilisateur_id: 1,
          abonnement_id: 1,
          montant: 20.0,
          statut: "en attente",
          date_echeance: "2024-01-15",
          date_creation: "2024-01-01",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          nom_plan: "Plan Basic",
          prix_plan: 20.0,
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEcheances,
      );

      await getStatistiquesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          utilisateur_id: 1,
          statistiques: expect.objectContaining({
            total_echeances: 3,
            en_attente: 2,
            payees: 1,
            montant_total_du: 45.5,
          }),
          echeances: expect.any(Array),
        }),
      );
    });

    it("devrait retourner 400 si l'userId est invalide", async () => {
      mockRequest.params = { userId: "abc" };

      await getStatistiquesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });
  });

  describe("getDiagnosticEcheance - GET /api/echeances/debug/echeance/:echeanceId/user/:userId", () => {
    it("devrait retourner le diagnostic d'une échéance", async () => {
      mockRequest.params = { echeanceId: "1", userId: "1" };

      const mockEcheance = [
        {
          id: 1,
          utilisateur_id: 1,
          montant: 25.5,
          statut: "en attente",
        },
      ];

      const mockUser = [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        },
      ];

      const mockEcheancesUser = [
        {
          id: 1,
          montant: 25.5,
          statut: "en attente",
          date_echeance: "2024-03-15",
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockEcheance) // Échéance existe
        .mockResolvedValueOnce(mockUser) // User existe
        .mockResolvedValueOnce(mockEcheancesUser); // Toutes échéances user

      await getDiagnosticEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.objectContaining({
            echeance_recherchee: expect.objectContaining({
              id: 1,
              existe: true,
              appartient_utilisateur: true,
            }),
            utilisateur: expect.objectContaining({
              id: 1,
              existe: true,
            }),
            echeances_utilisateur: expect.objectContaining({
              total: 1,
              liste: expect.any(Array),
            }),
          }),
        }),
      );
    });

    it("devrait retourner 400 si les IDs sont invalides", async () => {
      mockRequest.params = { echeanceId: "abc", userId: "xyz" };

      await getDiagnosticEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "IDs invalides",
        }),
      );
    });
  });

  describe("healthCheck - GET /api/echeances/health", () => {
    it("devrait retourner le statut de santé du module", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ test: 1 }]) // Test connexion DB
        .mockResolvedValueOnce([{ Tables_in_db: "echeances_paiements" }]); // Table existe

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "healthy",
          module: "echeances",
          database: expect.objectContaining({
            connected: true,
            table_echeances_paiements: true,
          }),
        }),
      );
    });

    it("devrait retourner un statut dégradé si la DB n'est pas accessible", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("DB connection failed"),
      );

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: "unhealthy",
          module: "echeances",
        }),
      );
    });
  });

  describe("getEcheanceCompat - GET /api/echeances/echeance/:echeanceId", () => {
    it("devrait retourner une échéance (route de compatibilité)", async () => {
      mockRequest.params = { echeanceId: "1" };
      mockRequest.query = { userId: "1" };

      const mockEcheance = {
        id: 1,
        utilisateur_id: 1,
        montant: 25.5,
        statut: "en attente",
        date_echeance: "2024-03-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockEcheance,
      ]);

      await getEcheanceCompat(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 1,
            payment_ready: true,
            currency: "EUR",
          }),
        }),
      );
    });

    it("devrait retourner 400 si l'échéance est déjà payée", async () => {
      mockRequest.params = { echeanceId: "1" };

      const mockEcheance = {
        id: 1,
        utilisateur_id: 1,
        montant: 25.5,
        statut: "payé",
        date_echeance: "2024-02-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockEcheance,
      ]);

      await getEcheanceCompat(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Cette échéance est déjà payée",
        }),
      );
    });
  });
});
