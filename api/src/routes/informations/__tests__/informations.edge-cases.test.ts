/**
 * Tests des cas limites (edge cases) pour le module Informations
 * Tests des scénarios extrêmes et inhabituels
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Informations } from "../../../db/clients/informations/informations.js";
import {
  getGrades,
  getGenres,
  getStatus,
  getAbonnements,
  getAllReferences,
  healthCheck,
} from "../core/handlers/index.js";

describe("Informations Module - Tests des cas limites (Edge Cases)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockInformationsClient: Partial<Informations>;

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

    mockInformationsClient = {
      obtenirLesGrades: jest.fn(),
      obtenirLesGenres: jest.fn(),
      obtenirLeStatus: jest.fn(),
      obtenirLesPlansTarifaires: jest.fn(),
    };
  });

  // ==================== LISTES VIDES ====================
  describe("Listes vides", () => {
    it("getGrades - devrait gérer une liste vide", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun grade trouvé",
          data: [],
        }),
      );
    });

    it("getGenres - devrait gérer une liste vide", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun genre trouvé",
        }),
      );
    });

    it("getStatus - devrait gérer une liste vide", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("getAbonnements - devrait gérer une liste vide", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("getAllReferences - devrait gérer toutes les listes vides", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            grades: [],
            genres: [],
            status: [],
            abonnements: [],
          },
        }),
      );
    });
  });

  // ==================== VALEURS NULL ====================
  describe("Valeurs null", () => {
    it("getGrades - devrait gérer une réponse null", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        null,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun grade trouvé",
        }),
      );
    });

    it("getGenres - devrait gérer une réponse null", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        null,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("getStatus - devrait gérer une réponse null", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        null,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("getAbonnements - devrait gérer une réponse null", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(null);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  // ==================== VALEURS UNDEFINED ====================
  describe("Valeurs undefined", () => {
    it("getGrades - devrait gérer une réponse undefined", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        undefined,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("getGenres - devrait gérer une réponse undefined", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        undefined,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  // ==================== CARACTÈRES SPÉCIAUX ====================
  describe("Caractères spéciaux", () => {
    it("devrait gérer des noms avec caractères accentués", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Éméraude", ordre: 1 },
        { id: 2, nom: "Ceinture Nacrée", ordre: 2 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockGrades,
        }),
      );
    });

    it("devrait gérer des noms avec apostrophes", async () => {
      const mockGenres = [
        { id: 1, nom: "Genre d'autre" },
        { id: 2, nom: "L'autre" },
      ];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des noms avec guillemets", async () => {
      const mockStatus = [
        { id: 1, nom: 'Statut "spécial"' },
        { id: 2, nom: "Statut 'autre'" },
      ];

      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des descriptions avec symboles spéciaux", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "Premium",
          prix: 50.0,
          duree_mois: 1,
          description: "Tarif: 50€/mois - Économisez 20% ! @clubmanager",
        },
      ];

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des noms avec parenthèses et tirets", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Blanche (Débutant)", ordre: 1 },
        { id: 2, nom: "Ceinture Jaune-Orange", ordre: 2 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== DONNÉES UNICODE ====================
  describe("Données Unicode", () => {
    it("devrait gérer des caractères chinois", async () => {
      const mockGrades = [
        { id: 1, nom: "白帯 (Ceinture Blanche)", ordre: 1 },
        { id: 2, nom: "黒帯 (Ceinture Noire)", ordre: 2 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockGrades,
        }),
      );
    });

    it("devrait gérer des emojis", async () => {
      const mockGrades = [
        { id: 1, nom: "🥋 Karaté", ordre: 1 },
        { id: 2, nom: "🥊 Boxe", ordre: 2 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des caractères arabes", async () => {
      const mockGenres = [
        { id: 1, nom: "ذكر (Homme)" },
        { id: 2, nom: "أنثى (Femme)" },
      ];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des caractères cyrilliques", async () => {
      const mockStatus = [
        { id: 1, nom: "Активный (Actif)" },
        { id: 2, nom: "Неактивный (Inactif)" },
      ];

      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== VALEURS EXTRÊMES ====================
  describe("Valeurs extrêmes", () => {
    it("devrait gérer un nom très long (50 caractères)", async () => {
      const mockGrades = [
        {
          id: 1,
          nom: "A".repeat(50), // Maximum autorisé
          ordre: 1,
        },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une description très longue (500 caractères)", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "Premium",
          prix: 50.0,
          duree_mois: 1,
          description: "A".repeat(500), // Maximum autorisé
        },
      ];

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un prix de 0 (gratuit)", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "Essai gratuit",
          prix: 0,
          duree_mois: 1,
        },
      ];

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un prix très élevé", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "VIP Lifetime",
          prix: 999999.99,
          duree_mois: 999,
        },
      ];

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un ordre égal à 0", async () => {
      const mockGrades = [{ id: 1, nom: "Pas de grade", ordre: 0 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un ID très grand", async () => {
      const mockGenres = [
        { id: 2147483647, nom: "Test" }, // Max int32
      ];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== DONNÉES MALFORMÉES ====================
  describe("Données malformées (tolérées par le système)", () => {
    it("devrait gérer un ordre manquant (optionnel)", async () => {
      const mockGrades = [
        { id: 1, nom: "Grade sans ordre" },
        { id: 2, nom: "Grade avec ordre", ordre: 2 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une description manquante (optionnelle)", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "Basique",
          prix: 30.0,
          duree_mois: 1,
          // description manquante
        },
      ];

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== UN SEUL ÉLÉMENT ====================
  describe("Un seul élément", () => {
    it("getGrades - devrait gérer une liste avec un seul élément", async () => {
      const mockGrades = [{ id: 1, nom: "Unique Grade", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
        }),
      );
    });

    it("getGenres - devrait gérer une liste avec un seul élément", async () => {
      const mockGenres = [{ id: 1, nom: "Unique" }];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
        }),
      );
    });
  });

  // ==================== HEALTHCHECK EDGE CASES ====================
  describe("HealthCheck - Cas limites", () => {
    it("devrait retourner unhealthy si 0 services fonctionnent", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          checks: {
            grades: false,
            genres: false,
            status: false,
            abonnements: false,
          },
        }),
      );
    });

    it("devrait retourner healthy si tous les services retournent des listes vides", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          checks: {
            grades: true,
            genres: true,
            status: true,
            abonnements: true,
          },
        }),
      );
    });

    it("devrait retourner degraded avec exactement 2 services OK", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          message: "2/4 services opérationnels",
        }),
      );
    });
  });

  // ==================== NOMS SIMILAIRES ====================
  describe("Noms similaires ou dupliqués", () => {
    it("devrait gérer des noms identiques avec IDs différents", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Noire", ordre: 1 },
        { id: 2, nom: "Ceinture Noire", ordre: 2 }, // Même nom
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockGrades,
          count: 2,
        }),
      );
    });
  });

  // ==================== ESPACES ET WHITESPACE ====================
  describe("Espaces et whitespace", () => {
    it("devrait gérer des noms avec espaces multiples", async () => {
      const mockGrades = [{ id: 1, nom: "Ceinture    Blanche", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des noms avec espaces de début/fin", async () => {
      const mockGenres = [{ id: 1, nom: "  Homme  " }];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer des noms avec tabulations", async () => {
      const mockStatus = [{ id: 1, nom: "Actif\t(validé)" }];

      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
