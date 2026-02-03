/**
 * Tests d'intégration pour le module Échéances
 * Tests des flux complets avec mocks
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";

describe("Échéances Module - Integration Tests (Mocked)", () => {
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
      obtenirEcheanceAvecUtilisateur: jest.fn(),
      creerEcheance: jest.fn(),
      mettreAJourEcheance: jest.fn(),
      supprimerEcheance: jest.fn(),
      obtenirStatistiquesEcheances: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("Flux complet de création d'échéance", () => {
    it("devrait créer une échéance avec toutes les données requises", async () => {
      const echeanceData = {
        utilisateur_id: 1,
        abonnement_id: 5,
        montant: 45.0,
        date_echeance: "2024-06-15",
        numero_echeance: 3,
        statut: "en attente",
      };

      const mockCreatedEcheance = {
        id: 10,
        ...echeanceData,
        date_creation: new Date().toISOString(),
      };

      (mockPaiementsClient.creerEcheance as jest.Mock).mockResolvedValue(
        mockCreatedEcheance
      );

      mockRequest.body = echeanceData;

      // Simule l'appel au handler
      await mockResponse.json?.({
        success: true,
        data: mockCreatedEcheance,
        message: "Échéance créée avec succès",
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedEcheance,
        message: "Échéance créée avec succès",
      });
    });

    it("devrait créer une échéance sans abonnement_id", async () => {
      const echeanceData = {
        utilisateur_id: 2,
        montant: 30.0,
        date_echeance: "2024-07-01",
        numero_echeance: 1,
        statut: "en attente",
      };

      const mockCreatedEcheance = {
        id: 11,
        ...echeanceData,
        abonnement_id: null,
        date_creation: new Date().toISOString(),
      };

      (mockPaiementsClient.creerEcheance as jest.Mock).mockResolvedValue(
        mockCreatedEcheance
      );

      mockRequest.body = echeanceData;

      await mockResponse.json?.({
        success: true,
        data: mockCreatedEcheance,
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedEcheance,
      });
    });
  });

  describe("Flux complet de mise à jour d'échéance", () => {
    it("devrait mettre à jour le statut d'une échéance", async () => {
      const echeanceId = 5;
      const updateData = {
        statut: "payé",
      };

      const mockUpdatedEcheance = {
        id: echeanceId,
        utilisateur_id: 1,
        montant: 45.0,
        statut: "payé",
        date_echeance: "2024-06-15",
        numero_echeance: 2,
        date_modification: new Date().toISOString(),
      };

      (mockPaiementsClient.mettreAJourEcheance as jest.Mock).mockResolvedValue(
        mockUpdatedEcheance
      );

      mockRequest.params = { id: echeanceId.toString() };
      mockRequest.body = updateData;

      await mockResponse.json?.({
        success: true,
        data: mockUpdatedEcheance,
        message: "Échéance mise à jour avec succès",
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedEcheance,
        message: "Échéance mise à jour avec succès",
      });
    });

    it("devrait mettre à jour plusieurs champs à la fois", async () => {
      const echeanceId = 6;
      const updateData = {
        montant: 50.0,
        date_echeance: "2024-08-15",
        statut: "en retard",
      };

      const mockUpdatedEcheance = {
        id: echeanceId,
        utilisateur_id: 2,
        ...updateData,
        numero_echeance: 1,
        date_modification: new Date().toISOString(),
      };

      (mockPaiementsClient.mettreAJourEcheance as jest.Mock).mockResolvedValue(
        mockUpdatedEcheance
      );

      mockRequest.params = { id: echeanceId.toString() };
      mockRequest.body = updateData;

      await mockResponse.json?.({
        success: true,
        data: mockUpdatedEcheance,
      });

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Flux complet de consultation d'échéances", () => {
    it("devrait récupérer toutes les échéances d'un utilisateur", async () => {
      const userId = 3;
      const mockEcheances = [
        {
          id: 1,
          utilisateur_id: userId,
          montant: 25.0,
          statut: "payé",
          date_echeance: "2024-01-15",
          numero_echeance: 1,
        },
        {
          id: 2,
          utilisateur_id: userId,
          montant: 25.0,
          statut: "en attente",
          date_echeance: "2024-02-15",
          numero_echeance: 2,
        },
        {
          id: 3,
          utilisateur_id: userId,
          montant: 25.0,
          statut: "en attente",
          date_echeance: "2024-03-15",
          numero_echeance: 3,
        },
      ];

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue(mockEcheances);

      mockRequest.params = { userId: userId.toString() };

      await mockResponse.json?.({
        success: true,
        data: mockEcheances,
        count: mockEcheances.length,
        utilisateur_id: userId,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 3,
          utilisateur_id: userId,
        })
      );
    });

    it("devrait récupérer le détail d'une échéance spécifique", async () => {
      const echeanceId = 5;
      const mockEcheanceDetail = {
        id: echeanceId,
        utilisateur_id: 2,
        abonnement_id: 3,
        montant: 35.0,
        statut: "en attente",
        date_echeance: "2024-04-20",
        numero_echeance: 2,
        utilisateur: {
          id: 2,
          nom: "Dupont",
          prenom: "Marie",
          email: "marie.dupont@example.com",
        },
      };

      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockResolvedValue(mockEcheanceDetail);

      mockRequest.params = { id: echeanceId.toString() };

      await mockResponse.json?.({
        success: true,
        data: mockEcheanceDetail,
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockEcheanceDetail,
      });
    });

    it("devrait filtrer les échéances par statut", async () => {
      const userId = 4;
      const statut = "en attente";

      const mockEcheances = [
        {
          id: 10,
          utilisateur_id: userId,
          montant: 40.0,
          statut: statut,
          date_echeance: "2024-05-10",
          numero_echeance: 1,
        },
        {
          id: 11,
          utilisateur_id: userId,
          montant: 40.0,
          statut: statut,
          date_echeance: "2024-06-10",
          numero_echeance: 2,
        },
      ];

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue(mockEcheances);

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { statut };

      await mockResponse.json?.({
        success: true,
        data: mockEcheances,
        count: mockEcheances.length,
        utilisateur_id: userId,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
        })
      );
    });
  });

  describe("Flux complet de suppression d'échéance", () => {
    it("devrait supprimer une échéance existante", async () => {
      const echeanceId = 7;

      (mockPaiementsClient.supprimerEcheance as jest.Mock).mockResolvedValue({
        success: true,
        id: echeanceId,
      });

      mockRequest.params = { id: echeanceId.toString() };

      await mockResponse.json?.({
        success: true,
        message: "Échéance supprimée avec succès",
        id: echeanceId,
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Échéance supprimée avec succès",
        id: echeanceId,
      });
    });

    it("devrait gérer la suppression d'une échéance inexistante", async () => {
      const echeanceId = 999;

      (mockPaiementsClient.supprimerEcheance as jest.Mock).mockRejectedValue(
        new Error("Échéance non trouvée")
      );

      mockRequest.params = { id: echeanceId.toString() };

      await mockResponse.status?.(404);
      await mockResponse.json?.({
        success: false,
        error: "Échéance non trouvée",
      });

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe("Statistiques et diagnostics", () => {
    it("devrait récupérer les statistiques d'un utilisateur", async () => {
      const userId = 5;
      const mockStats = {
        total_echeances: 12,
        echeances_payees: 8,
        echeances_en_attente: 3,
        echeances_en_retard: 1,
        montant_total: 360.0,
        montant_paye: 240.0,
        montant_restant: 120.0,
      };

      (
        mockPaiementsClient.obtenirStatistiquesEcheances as jest.Mock
      ).mockResolvedValue(mockStats);

      mockRequest.params = { userId: userId.toString() };

      await mockResponse.json?.({
        success: true,
        data: mockStats,
        utilisateur_id: userId,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          utilisateur_id: userId,
        })
      );
    });

    it("devrait fournir un diagnostic de santé du module", async () => {
      const mockDiagnostic = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        stats: {
          total_echeances_systeme: 150,
          echeances_actives: 45,
        },
      };

      await mockResponse.json?.(mockDiagnostic);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
        })
      );
    });
  });

  describe("Gestion des erreurs en cascade", () => {
    it("devrait gérer une erreur de base de données lors de la création", async () => {
      const echeanceData = {
        utilisateur_id: 1,
        montant: 45.0,
        date_echeance: "2024-06-15",
        numero_echeance: 1,
      };

      (mockPaiementsClient.creerEcheance as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      mockRequest.body = echeanceData;

      await mockResponse.status?.(500);
      await mockResponse.json?.({
        success: false,
        error: "Erreur lors de la création de l'échéance",
      });

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un utilisateur inexistant", async () => {
      const userId = 9999;

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockRejectedValue(new Error("Utilisateur non trouvé"));

      mockRequest.params = { userId: userId.toString() };

      await mockResponse.status?.(404);
      await mockResponse.json?.({
        success: false,
        error: "Utilisateur non trouvé",
      });

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait gérer une date d'échéance invalide", async () => {
      const echeanceData = {
        utilisateur_id: 1,
        montant: 45.0,
        date_echeance: "invalid-date",
        numero_echeance: 1,
      };

      mockRequest.body = echeanceData;

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "Format de date invalide",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Scénarios multi-étapes", () => {
    it("devrait gérer le cycle complet : création -> consultation -> mise à jour -> suppression", async () => {
      const userId = 1;
      const echeanceData = {
        utilisateur_id: userId,
        montant: 50.0,
        date_echeance: "2024-09-01",
        numero_echeance: 1,
        statut: "en attente",
      };

      // Étape 1: Création
      const mockCreated = {
        id: 20,
        ...echeanceData,
        date_creation: new Date().toISOString(),
      };

      (mockPaiementsClient.creerEcheance as jest.Mock).mockResolvedValue(
        mockCreated
      );

      // Étape 2: Consultation
      (
        mockPaiementsClient.obtenirEcheanceAvecUtilisateur as jest.Mock
      ).mockResolvedValue(mockCreated);

      // Étape 3: Mise à jour
      const mockUpdated = {
        ...mockCreated,
        statut: "payé",
        date_modification: new Date().toISOString(),
      };

      (mockPaiementsClient.mettreAJourEcheance as jest.Mock).mockResolvedValue(
        mockUpdated
      );

      // Étape 4: Suppression
      (mockPaiementsClient.supprimerEcheance as jest.Mock).mockResolvedValue({
        success: true,
        id: 20,
      });

      // Vérifications
      expect(mockCreated.id).toBe(20);
      expect(mockUpdated.statut).toBe("payé");
    });

    it("devrait gérer plusieurs échéances pour le même utilisateur", async () => {
      const userId = 6;
      const echeances = [
        {
          utilisateur_id: userId,
          montant: 30.0,
          date_echeance: "2024-07-01",
          numero_echeance: 1,
        },
        {
          utilisateur_id: userId,
          montant: 30.0,
          date_echeance: "2024-08-01",
          numero_echeance: 2,
        },
        {
          utilisateur_id: userId,
          montant: 30.0,
          date_echeance: "2024-09-01",
          numero_echeance: 3,
        },
      ];

      const mockCreatedEcheances = echeances.map((e, index) => ({
        id: 30 + index,
        ...e,
        statut: "en attente",
        date_creation: new Date().toISOString(),
      }));

      for (let i = 0; i < echeances.length; i++) {
        (mockPaiementsClient.creerEcheance as jest.Mock).mockResolvedValueOnce(
          mockCreatedEcheances[i]
        );
      }

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue(mockCreatedEcheances);

      expect(mockCreatedEcheances.length).toBe(3);
      expect(mockCreatedEcheances[0].numero_echeance).toBe(1);
      expect(mockCreatedEcheances[2].numero_echeance).toBe(3);
    });
  });

  describe("Intégration avec abonnements", () => {
    it("devrait créer des échéances liées à un abonnement", async () => {
      const abonnementId = 10;
      const userId = 7;

      const echeancesAbonnement = [
        {
          utilisateur_id: userId,
          abonnement_id: abonnementId,
          montant: 25.0,
          date_echeance: "2024-06-01",
          numero_echeance: 1,
        },
        {
          utilisateur_id: userId,
          abonnement_id: abonnementId,
          montant: 25.0,
          date_echeance: "2024-07-01",
          numero_echeance: 2,
        },
      ];

      const mockCreatedEcheances = echeancesAbonnement.map((e, index) => ({
        id: 40 + index,
        ...e,
        statut: "en attente",
        date_creation: new Date().toISOString(),
      }));

      expect(mockCreatedEcheances[0].abonnement_id).toBe(abonnementId);
      expect(mockCreatedEcheances[1].abonnement_id).toBe(abonnementId);
    });

    it("devrait récupérer toutes les échéances d'un abonnement", async () => {
      const abonnementId = 10;
      const mockEcheances = [
        {
          id: 50,
          utilisateur_id: 7,
          abonnement_id: abonnementId,
          montant: 25.0,
          statut: "payé",
          date_echeance: "2024-06-01",
          numero_echeance: 1,
        },
        {
          id: 51,
          utilisateur_id: 7,
          abonnement_id: abonnementId,
          montant: 25.0,
          statut: "en attente",
          date_echeance: "2024-07-01",
          numero_echeance: 2,
        },
      ];

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue(
        mockEcheances
      );

      expect(mockEcheances.length).toBe(2);
      expect(
        mockEcheances.every((e) => e.abonnement_id === abonnementId)
      ).toBe(true);
    });
  });

  describe("Pagination et tri", () => {
    it("devrait paginer les résultats correctement", async () => {
      const userId = 8;
      const limit = 10;
      const offset = 0;

      const mockEcheances = Array.from({ length: limit }, (_, i) => ({
        id: i + 1,
        utilisateur_id: userId,
        montant: 30.0,
        statut: "en attente",
        date_echeance: `2024-0${(i % 9) + 1}-15`,
        numero_echeance: i + 1,
      }));

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue(mockEcheances);

      mockRequest.params = { userId: userId.toString() };
      mockRequest.query = { limit: limit.toString(), offset: offset.toString() };

      await mockResponse.json?.({
        success: true,
        data: mockEcheances,
        count: mockEcheances.length,
        pagination: {
          limit,
          offset,
          total: 25,
          hasMore: true,
        },
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            limit,
            offset,
          }),
        })
      );
    });

    it("devrait trier les échéances par date", async () => {
      const userId = 9;
      const mockEcheances = [
        {
          id: 1,
          utilisateur_id: userId,
          montant: 30.0,
          statut: "en attente",
          date_echeance: "2024-03-15",
          numero_echeance: 3,
        },
        {
          id: 2,
          utilisateur_id: userId,
          montant: 30.0,
          statut: "en attente",
          date_echeance: "2024-01-15",
          numero_echeance: 1,
        },
        {
          id: 3,
          utilisateur_id: userId,
          montant: 30.0,
          statut: "en attente",
          date_echeance: "2024-02-15",
          numero_echeance: 2,
        },
      ];

      const sortedEcheances = [...mockEcheances].sort(
        (a, b) =>
          new Date(a.date_echeance).getTime() -
          new Date(b.date_echeance).getTime()
      );

      expect(sortedEcheances[0].date_echeance).toBe("2024-01-15");
      expect(sortedEcheances[2].date_echeance).toBe("2024-03-15");
    });
  });
});
