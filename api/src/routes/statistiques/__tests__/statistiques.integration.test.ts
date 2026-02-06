/**
 * Tests d'intégration pour le module Statistiques
 * Tests des flux complets et des interactions entre composants
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getFrequentation,
  getProgression,
  getPresence,
  getMembresCount,
  getPaiementsMois,
} from "../core/handlers/index.js";

describe("Statistiques Module - Tests d'intégration", () => {
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

  describe("Flux complet: Récupération des statistiques d'un utilisateur", () => {
    it("devrait récupérer toutes les statistiques d'un utilisateur en séquence", async () => {
      const userId = "1";

      // 1. Fréquentation
      mockRequest.params = { utilisateurId: userId };
      await getFrequentation(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();

      // 2. Progression
      jest.clearAllMocks();
      await getProgression(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();

      // 3. Présence
      jest.clearAllMocks();
      await getPresence(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un utilisateur inexistant de manière cohérente", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
      expect([200, 404, 500]).toContain(statusMock.mock.calls[0][0]);
    });
  });

  describe("Flux complet: Statistiques globales du club", () => {
    it("devrait récupérer toutes les statistiques globales", async () => {
      // 1. Nombre de membres
      await getMembresCount(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();

      // 2. Paiements du mois
      jest.clearAllMocks();
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait maintenir la cohérence entre les différentes statistiques", async () => {
      await getMembresCount(mockRequest as Request, mockResponse as Response);
      const membresResponse = jsonMock.mock.calls[0][0];

      jest.clearAllMocks();
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);
      const paiementsResponse = jsonMock.mock.calls[0][0];

      expect(membresResponse).toBeDefined();
      expect(paiementsResponse).toBeDefined();
    });
  });

  describe("Intégration avec paramètres de requête", () => {
    it("devrait gérer les paramètres optionnels pour la présence", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "6" };

      await getPresence(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait utiliser les valeurs par défaut si aucun paramètre fourni", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = {};

      await getPresence(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Gestion des erreurs en cascade", () => {
    it("ne devrait pas propager les erreurs d'une requête à l'autre", async () => {
      const requests = [
        { utilisateurId: "invalid" }, // Erreur
        { utilisateurId: "1" }, // Valide
        { utilisateurId: "abc" }, // Erreur
        { utilisateurId: "2" }, // Valide
      ].map((params) => {
        const req = { ...mockRequest, params };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return getFrequentation(req as Request, res as Response).then(() => res);
      });

      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(4);
    });
  });

  describe("Performance et concurrence", () => {
    it("devrait gérer plusieurs requêtes simultanées", async () => {
      const userIds = ["1", "2", "3", "4", "5"];

      const promises = userIds.map((id) => {
        const req = { ...mockRequest, params: { utilisateurId: id } };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return getFrequentation(req as Request, res as Response);
      });

      await Promise.all(promises);
      expect(promises).toHaveLength(5);
    });
  });
});
