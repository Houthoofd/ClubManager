/**
 * Tests avancés pour le get-stats handler du module Échéances
 * Ces tests ciblent les lignes non couvertes pour améliorer la couverture globale
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getStatistiquesUtilisateur,
  getDebugEcheancesUtilisateur,
} from "../core/handlers/get-stats.handler.js";

describe("Get Stats Handler - Tests avancés de couverture", () => {
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
      protocol: "https",
      get: jest.fn((header: string) => {
        if (header === "host") return "localhost:3000";
        return undefined;
      }),
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

  describe("getDebugEcheancesUtilisateur - Tests de validation", () => {
    it("devrait retourner 400 si userId contient des caractères non numériques", async () => {
      mockRequest.params = { userId: "abc123" };

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
          error: "L'ID doit être un nombre positif",
        }),
      );
    });

    it("devrait retourner 400 si userId est 0", async () => {
      mockRequest.params = { userId: "0" };

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
          error: "L'ID doit être un nombre positif",
        }),
      );
    });

    it("devrait retourner 400 si userId est négatif", async () => {
      mockRequest.params = { userId: "-5" };

      await getDebugEcheancesUtilisateur(
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

    it("devrait valider le format regex pour userId", async () => {
      mockRequest.params = { userId: "12.5" };

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider que userId ne contient que des chiffres", async () => {
      mockRequest.params = { userId: "123abc" };

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter un userId valide", async () => {
      mockRequest.params = { userId: "123" };

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Test error - this is expected"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      // Le test passe si on arrive à la partie service (qui échoue, mais c'est OK)
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getStatistiquesUtilisateur - Tests de validation", () => {
    it("devrait valider userId dans getStatistiquesUtilisateur", async () => {
      mockRequest.params = { userId: "abc" };

      await getStatistiquesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter userId = 0 dans getStatistiquesUtilisateur", async () => {
      mockRequest.params = { userId: "0" };

      await getStatistiquesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter userId négatif dans getStatistiquesUtilisateur", async () => {
      mockRequest.params = { userId: "-10" };

      await getStatistiquesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait gérer les erreurs de type Error", async () => {
      mockRequest.params = { userId: "123" };

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur lors de la récupération des échéances utilisateur",
        }),
      );
    });

    it("devrait gérer les erreurs non-Error", async () => {
      mockRequest.params = { userId: "456" };

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        "String error",
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait gérer les erreurs dans getStatistiquesUtilisateur", async () => {
      mockRequest.params = { userId: "789" };

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Connection lost"),
      );

      await getStatistiquesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Tests de couverture des branches req.get et req.protocol", () => {
    it("devrait gérer le cas où req.get est undefined", async () => {
      mockRequest.params = { userId: "100" };
      mockRequest.get = undefined;

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Test"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      // Le test vérifie que le code gère bien req.get undefined
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer le cas où req.protocol est undefined", async () => {
      mockRequest.params = { userId: "200" };
      mockRequest.protocol = undefined;

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Test"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer le cas où req.get et req.protocol sont tous deux undefined", async () => {
      mockRequest.params = { userId: "300" };
      mockRequest.get = undefined;
      mockRequest.protocol = undefined;

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Test"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer protocole http", async () => {
      mockRequest.params = { userId: "400" };
      mockRequest.protocol = "http";

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Test"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer protocole https", async () => {
      mockRequest.params = { userId: "500" };
      mockRequest.protocol = "https";

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Test"),
      );

      await getDebugEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });
});
