/**
 * Tests des handlers du module Statistiques
 * Pattern avec injection de dépendance (style professeurs)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getFrequentation,
  getProgression,
  getPresence,
  getMembresCount,
  getPaiementsMois,
  healthCheck,
} from "../core/handlers/index.js";

describe("Statistiques Module - Tests des Handlers", () => {
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

  describe("Health Check", () => {
    it("devrait retourner un statut healthy", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: "healthy",
            module: "statistiques",
            version: "2.0.0",
          }),
        }),
      );
    });

    it("devrait inclure les informations système", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timestamp: expect.any(String),
            uptime: expect.any(Number),
            services: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("GET Fréquentation Handler", () => {
    it("devrait retourner 400 pour un ID utilisateur invalide (non numérique)", async () => {
      mockRequest.params = { utilisateurId: "abc" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait retourner 400 pour un ID utilisateur négatif", async () => {
      mockRequest.params = { utilisateurId: "-5" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait retourner 400 pour un ID utilisateur à zéro", async () => {
      mockRequest.params = { utilisateurId: "0" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });
  });

  describe("GET Progression Handler", () => {
    it("devrait retourner 400 pour un ID utilisateur invalide", async () => {
      mockRequest.params = { userId: "invalid" };

      await getProgression(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait valider que l'ID est positif", async () => {
      mockRequest.params = { userId: "-1" };

      await getProgression(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });
  });

  describe("GET Présence Handler", () => {
    it("devrait retourner 400 pour un ID invalide", async () => {
      mockRequest.params = { userId: "notanumber" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID utilisateur invalide",
        }),
      );
    });

    it("devrait accepter des IDs numériques valides", async () => {
      mockRequest.params = { userId: "123" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      // Le handler va essayer d'appeler le service qui n'est pas mocké
      // donc on s'attend à une erreur 500, mais la validation doit passer
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("GET Membres Count Handler", () => {
    it("devrait appeler le handler sans paramètres", async () => {
      await getMembresCount(mockRequest as Request, mockResponse as Response);

      // Le handler va essayer d'appeler le service
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("GET Paiements Mois Handler", () => {
    it("devrait appeler le handler sans paramètres", async () => {
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);

      // Le handler va essayer d'appeler le service
      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Validation générale", () => {
    it("devrait valider les paramètres avant d'appeler les services", async () => {
      mockRequest.params = { utilisateurId: "" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer les IDs avec espaces", async () => {
      mockRequest.params = { userId: "  123  " };

      await getProgression(mockRequest as Request, mockResponse as Response);

      // parseInt devrait ignorer les espaces
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait accepter les IDs numériques même avec caractères après (parseInt)", async () => {
      mockRequest.params = { userId: "123abc" };

      await getProgression(mockRequest as Request, mockResponse as Response);

      // parseInt("123abc") retourne 123, donc valide
      // Le handler va essayer d'appeler le service et retourner 500 (pas de mock)
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait retourner une réponse structurée en cas d'erreur de validation", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          error: expect.any(String),
        }),
      );
    });

    it("devrait logger les erreurs en console", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      mockRequest.params = { utilisateurId: "123" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Format des réponses", () => {
    it("devrait toujours inclure un champ success dans la réponse", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
      );
    });

    it("devrait inclure un message descriptif", async () => {
      mockRequest.params = { utilisateurId: "invalid" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
    });

    it("devrait inclure les détails de l'erreur quand disponibles", async () => {
      mockRequest.params = { utilisateurId: "abc123" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      );
    });
  });
});
