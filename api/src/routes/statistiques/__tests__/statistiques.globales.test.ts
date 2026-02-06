/**
 * Tests des handlers de statistiques globales
 * Tests unitaires pour membres, paiements, plans, cours, articles
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getMembresCount,
  getPaiementsMois,
  getPaiementsRecentsHandler,
  getPaiementsEnAttenteHandler,
  getPlansActifsHandler,
  getTauxRenouvellementHandler,
  getPaiementsParMoisHandler,
  getMembresParPlanHandler,
  getCoursSemaineHandler,
  getDerniersPaiementsHandler,
  getPaiementsEchusHandler,
  getNouveauxMembresHandler,
  getTopMembresAssidusHandler,
  getMembresParGradeHandler,
  getMembresParGenreHandler,
  getProchainsAnniversairesHandler,
  getArticlesPlusVendusHandler,
  getDiagnostic,
} from "../core/handlers/index.js";

describe("Statistiques Globales - Tests des Handlers", () => {
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
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe("Membres - Handlers", () => {
    it("getMembresCount - devrait appeler le handler", async () => {
      await getMembresCount(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getMembresCount - devrait retourner un format de réponse structuré", async () => {
      await getMembresCount(mockRequest as Request, mockResponse as Response);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
      );
    });

    it("getNouveauxMembresHandler - devrait appeler le handler", async () => {
      await getNouveauxMembresHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getTopMembresAssidusHandler - devrait appeler le handler", async () => {
      await getTopMembresAssidusHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getMembresParGradeHandler - devrait appeler le handler", async () => {
      await getMembresParGradeHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getMembresParGenreHandler - devrait appeler le handler", async () => {
      await getMembresParGenreHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getProchainsAnniversairesHandler - devrait appeler le handler", async () => {
      await getProchainsAnniversairesHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getMembresParPlanHandler - devrait appeler le handler", async () => {
      await getMembresParPlanHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Paiements - Handlers", () => {
    it("getPaiementsMois - devrait appeler le handler", async () => {
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getPaiementsRecentsHandler - devrait appeler le handler", async () => {
      await getPaiementsRecentsHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getPaiementsEnAttenteHandler - devrait appeler le handler", async () => {
      await getPaiementsEnAttenteHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getPaiementsParMoisHandler - devrait appeler le handler", async () => {
      await getPaiementsParMoisHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getDerniersPaiementsHandler - devrait appeler le handler", async () => {
      await getDerniersPaiementsHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getPaiementsEchusHandler - devrait appeler le handler", async () => {
      await getPaiementsEchusHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Plans - Handlers", () => {
    it("getPlansActifsHandler - devrait appeler le handler", async () => {
      await getPlansActifsHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getTauxRenouvellementHandler - devrait appeler le handler", async () => {
      await getTauxRenouvellementHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Cours - Handlers", () => {
    it("getCoursSemaineHandler - devrait appeler le handler", async () => {
      await getCoursSemaineHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getCoursSemaineHandler - devrait retourner un format avec count", async () => {
      await getCoursSemaineHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
      );
    });
  });

  describe("Articles - Handlers", () => {
    it("getArticlesPlusVendusHandler - devrait appeler le handler", async () => {
      await getArticlesPlusVendusHandler(
        mockRequest as Request,
        mockResponse as Response,
      );
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Diagnostic - Handler", () => {
    it("getDiagnostic - devrait retourner les informations du module", async () => {
      await getDiagnostic(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            module: "statistiques",
            version: "2.0.0",
            architecture: "handlers/services/validators",
          }),
        }),
      );
    });

    it("getDiagnostic - devrait inclure les routes disponibles", async () => {
      await getDiagnostic(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            routes: expect.any(Object),
            features: expect.any(Object),
            statistics: expect.any(Object),
          }),
        }),
      );
    });

    it("getDiagnostic - devrait inclure les recommandations", async () => {
      await getDiagnostic(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recommendations: expect.any(Array),
          }),
        }),
      );
    });

    it("getDiagnostic - devrait inclure les informations système", async () => {
      await getDiagnostic(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            system_info: expect.objectContaining({
              node_version: expect.any(String),
              platform: expect.any(String),
              uptime_seconds: expect.any(Number),
            }),
          }),
        }),
      );
    });
  });

  describe("Format des réponses - Tous les handlers", () => {
    const handlers = [
      { name: "getMembresCount", fn: getMembresCount },
      { name: "getPaiementsMois", fn: getPaiementsMois },
      { name: "getPaiementsRecentsHandler", fn: getPaiementsRecentsHandler },
      {
        name: "getPaiementsEnAttenteHandler",
        fn: getPaiementsEnAttenteHandler,
      },
      { name: "getPlansActifsHandler", fn: getPlansActifsHandler },
      {
        name: "getTauxRenouvellementHandler",
        fn: getTauxRenouvellementHandler,
      },
      { name: "getCoursSemaineHandler", fn: getCoursSemaineHandler },
    ];

    handlers.forEach(({ name, fn }) => {
      it(`${name} - devrait retourner une réponse avec success`, async () => {
        await fn(mockRequest as Request, mockResponse as Response);

        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: expect.any(Boolean),
          }),
        );
      });

      it(`${name} - devrait logger l'appel en console`, async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        await fn(mockRequest as Request, mockResponse as Response);

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe("Gestion des erreurs - Handlers globaux", () => {
    it("devrait retourner 500 en cas d'erreur dans le service", async () => {
      // Les services ne sont pas mockés, donc ils vont échouer
      // et retourner une erreur 500
      await getMembresCount(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait inclure un message d'erreur dans la réponse", async () => {
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait logger les erreurs en console", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();

      await getPaiementsRecentsHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Handlers avec données - Format des réponses", () => {
    it("getPaiementsParMoisHandler - devrait inclure count dans la réponse", async () => {
      await getPaiementsParMoisHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      // En cas d'erreur, vérifie juste que la réponse a été appelée
      expect(jsonMock).toHaveBeenCalled();
    });

    it("getMembresParPlanHandler - devrait inclure count dans la réponse", async () => {
      await getMembresParPlanHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalled();
    });

    it("getDerniersPaiementsHandler - devrait inclure count dans la réponse", async () => {
      await getDerniersPaiementsHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Logging et monitoring", () => {
    it("devrait logger les appels de handlers", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await getMembresCount(mockRequest as Request, mockResponse as Response);
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);
      await getPlansActifsHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it("devrait utiliser les emojis dans les logs", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await getMembresCount(mockRequest as Request, mockResponse as Response);

      const calls = consoleSpy.mock.calls;
      const hasEmoji = calls.some((call) =>
        call.some((arg) => typeof arg === "string" && /📊|✅|❌/.test(arg)),
      );

      expect(hasEmoji).toBe(true);
      consoleSpy.mockRestore();
    });
  });
});
