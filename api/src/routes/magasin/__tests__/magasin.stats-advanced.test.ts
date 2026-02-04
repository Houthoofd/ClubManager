/**
 * Tests de statistiques avancées pour le module Magasin
 * Tests approfondis des calculs et agrégations statistiques
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getStatistiquesMagasin,
} from "../core/handlers/index.js";
import * as MagasinService from "../core/services/magasin.service.js";

describe("Magasin Module - Tests de statistiques avancées", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMagasinClient: Partial<Magasin>;
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

    mockMagasinClient = {
      obtenirArticlesParCategories: jest.fn(),
      obtenirLesCommandes: jest.fn(),
    };

    mockPaiementsClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("Statistiques globales du magasin", () => {
    it("devrait calculer les statistiques globales correctement", async () => {
      mockRequest.query = {};

      const mockStats = {
        total_commandes: 150,
        commandes_en_attente: 25,
        commandes_validees: 80,
        commandes_livrees: 40,
        commandes_annulees: 5,
        chiffre_affaires_total: 8450.75,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total_commandes: 150,
            commandes_en_attente: 25,
            commandes_validees: 80,
            commandes_livrees: 40,
            commandes_annulees: 5,
            chiffre_affaires_total: 8450.75,
          }),
        })
      );
    });

    it("devrait inclure la période dans la réponse", async () => {
      mockRequest.query = {
        dateDebut: "2024-01-01",
        dateFin: "2024-12-31",
      };

      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 10,
        commandes_validees: 60,
        commandes_livrees: 25,
        commandes_annulees: 5,
        chiffre_affaires_total: 5000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          periode: {
            debut: "2024-01-01",
            fin: "2024-12-31",
          },
        })
      );
    });

    it("devrait inclure un timestamp dans la réponse", async () => {
      mockRequest.query = {};

      const mockStats = {
        total_commandes: 50,
        commandes_en_attente: 5,
        commandes_validees: 30,
        commandes_livrees: 15,
        commandes_annulees: 0,
        chiffre_affaires_total: 2500.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("timestamp");
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("Statistiques par période", () => {
    it("devrait filtrer les statistiques par date de début", async () => {
      mockRequest.query = { dateDebut: "2024-06-01" };

      const mockStats = {
        total_commandes: 75,
        commandes_en_attente: 10,
        commandes_validees: 45,
        commandes_livrees: 18,
        commandes_annulees: 2,
        chiffre_affaires_total: 4200.5,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total_commandes: 75,
          }),
        })
      );
    });

    it("devrait filtrer les statistiques par date de fin", async () => {
      mockRequest.query = { dateFin: "2024-06-30" };

      const mockStats = {
        total_commandes: 40,
        commandes_en_attente: 5,
        commandes_validees: 25,
        commandes_livrees: 10,
        commandes_annulees: 0,
        chiffre_affaires_total: 2100.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total_commandes: 40,
          }),
        })
      );
    });

    it("devrait filtrer par plage de dates complète", async () => {
      mockRequest.query = {
        dateDebut: "2024-01-01",
        dateFin: "2024-03-31",
      };

      const mockStats = {
        total_commandes: 35,
        commandes_en_attente: 3,
        commandes_validees: 22,
        commandes_livrees: 9,
        commandes_annulees: 1,
        chiffre_affaires_total: 1850.25,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        "2024-01-01",
        "2024-03-31",
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(35);
      expect(result.chiffre_affaires_total).toBe(1850.25);
    });
  });

  describe("Calculs d'agrégation", () => {
    it("devrait calculer correctement le total des commandes", async () => {
      const mockStats = {
        total_commandes: 200,
        commandes_en_attente: 30,
        commandes_validees: 110,
        commandes_livrees: 55,
        commandes_annulees: 5,
        chiffre_affaires_total: 12000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      const totalVerifie =
        result.commandes_en_attente +
        result.commandes_validees +
        result.commandes_livrees +
        result.commandes_annulees;

      expect(result.total_commandes).toBe(totalVerifie);
    });

    it("devrait calculer le chiffre d'affaires total", async () => {
      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 15,
        commandes_validees: 60,
        commandes_livrees: 20,
        commandes_annulees: 5,
        chiffre_affaires_total: 5432.1,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.chiffre_affaires_total).toBe(5432.1);
      expect(typeof result.chiffre_affaires_total).toBe("number");
    });

    it("devrait gérer des statistiques avec valeurs nulles", async () => {
      const mockStats = {
        total_commandes: null,
        commandes_en_attente: null,
        commandes_validees: null,
        commandes_livrees: null,
        commandes_annulees: null,
        chiffre_affaires_total: null,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(0);
      expect(result.commandes_en_attente).toBe(0);
      expect(result.chiffre_affaires_total).toBe(0);
    });

    it("devrait gérer un résultat vide", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([{}]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(0);
      expect(result.commandes_en_attente).toBe(0);
      expect(result.commandes_validees).toBe(0);
      expect(result.commandes_livrees).toBe(0);
      expect(result.commandes_annulees).toBe(0);
      expect(result.chiffre_affaires_total).toBe(0);
    });
  });

  describe("Métriques de performance", () => {
    it("devrait calculer le taux de conversion (validées/total)", async () => {
      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 20,
        commandes_validees: 60,
        commandes_livrees: 15,
        commandes_annulees: 5,
        chiffre_affaires_total: 5000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      const tauxConversion = (result.commandes_validees / result.total_commandes) * 100;
      expect(tauxConversion).toBe(60);
    });

    it("devrait calculer le taux de livraison", async () => {
      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 25,
        commandes_validees: 50,
        commandes_livrees: 20,
        commandes_annulees: 5,
        chiffre_affaires_total: 5000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      const tauxLivraison = (result.commandes_livrees / result.total_commandes) * 100;
      expect(tauxLivraison).toBe(20);
    });

    it("devrait calculer le taux d'annulation", async () => {
      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 25,
        commandes_validees: 60,
        commandes_livrees: 10,
        commandes_annulees: 5,
        chiffre_affaires_total: 5000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      const tauxAnnulation = (result.commandes_annulees / result.total_commandes) * 100;
      expect(tauxAnnulation).toBe(5);
    });

    it("devrait calculer le panier moyen", async () => {
      const mockStats = {
        total_commandes: 50,
        commandes_en_attente: 10,
        commandes_validees: 30,
        commandes_livrees: 8,
        commandes_annulees: 2,
        chiffre_affaires_total: 2500.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      const panierMoyen = result.chiffre_affaires_total / result.total_commandes;
      expect(panierMoyen).toBe(50);
    });
  });

  describe("Cas limites et edge cases", () => {
    it("devrait gérer des statistiques avec 0 commandes", async () => {
      const mockStats = {
        total_commandes: 0,
        commandes_en_attente: 0,
        commandes_validees: 0,
        commandes_livrees: 0,
        commandes_annulees: 0,
        chiffre_affaires_total: 0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(0);
      expect(result.chiffre_affaires_total).toBe(0);
    });

    it("devrait gérer des valeurs très élevées", async () => {
      const mockStats = {
        total_commandes: 999999,
        commandes_en_attente: 100000,
        commandes_validees: 600000,
        commandes_livrees: 250000,
        commandes_annulees: 49999,
        chiffre_affaires_total: 9999999.99,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(999999);
      expect(result.chiffre_affaires_total).toBe(9999999.99);
    });

    it("devrait gérer des décimales précises", async () => {
      const mockStats = {
        total_commandes: 10,
        commandes_en_attente: 2,
        commandes_validees: 6,
        commandes_livrees: 2,
        commandes_annulees: 0,
        chiffre_affaires_total: 123.45,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.chiffre_affaires_total).toBe(123.45);
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait lancer une erreur si la requête DB échoue", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        MagasinService.calculerStatistiquesMagasin(
          undefined,
          undefined,
          mockPaiementsClient as Paiements
        )
      ).rejects.toThrow("Impossible de calculer les statistiques");
    });

    it("devrait gérer une erreur de timeout", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Query timeout")), 100);
        });
      });

      await expect(
        MagasinService.calculerStatistiquesMagasin(
          undefined,
          undefined,
          mockPaiementsClient as Paiements
        )
      ).rejects.toThrow();
    });

    it("devrait retourner 500 en cas d'erreur dans le handler", async () => {
      mockRequest.query = {};

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("statistiques"),
        })
      );
    });
  });

  describe("Validation des paramètres de période", () => {
    it("devrait accepter des dates au format ISO", async () => {
      mockRequest.query = {
        dateDebut: "2024-01-01T00:00:00Z",
        dateFin: "2024-12-31T23:59:59Z",
      };

      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 10,
        commandes_validees: 60,
        commandes_livrees: 25,
        commandes_annulees: 5,
        chiffre_affaires_total: 5000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait rejeter des dates invalides", async () => {
      mockRequest.query = {
        dateDebut: "invalid-date",
        dateFin: "2024-12-31",
      };

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("validation"),
        })
      );
    });
  });

  describe("Cohérence des données", () => {
    it("devrait vérifier que la somme des statuts égale le total", async () => {
      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 20,
        commandes_validees: 50,
        commandes_livrees: 25,
        commandes_annulees: 5,
        chiffre_affaires_total: 5000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      const sommeStatuts =
        result.commandes_en_attente +
        result.commandes_validees +
        result.commandes_livrees +
        result.commandes_annulees;

      expect(sommeStatuts).toBe(result.total_commandes);
    });

    it("devrait avoir un chiffre d'affaires >= 0", async () => {
      const mockStats = {
        total_commandes: 50,
        commandes_en_attente: 10,
        commandes_validees: 30,
        commandes_livrees: 10,
        commandes_annulees: 0,
        chiffre_affaires_total: 2500.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.chiffre_affaires_total).toBeGreaterThanOrEqual(0);
    });

    it("devrait avoir des compteurs >= 0", async () => {
      const mockStats = {
        total_commandes: 75,
        commandes_en_attente: 15,
        commandes_validees: 45,
        commandes_livrees: 12,
        commandes_annulees: 3,
        chiffre_affaires_total: 3750.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBeGreaterThanOrEqual(0);
      expect(result.commandes_en_attente).toBeGreaterThanOrEqual(0);
      expect(result.commandes_validees).toBeGreaterThanOrEqual(0);
      expect(result.commandes_livrees).toBeGreaterThanOrEqual(0);
      expect(result.commandes_annulees).toBeGreaterThanOrEqual(0);
    });
  });
});
