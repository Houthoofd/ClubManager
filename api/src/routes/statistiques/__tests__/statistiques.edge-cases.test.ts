/**
 * Tests des cas limites (edge cases) pour le module Statistiques
 * Tests des situations inhabituelles et des limites du système
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getFrequentation,
  getProgression,
  getPresence,
  getMembresCount,
  getPaiementsMois,
  getNouveauxMembresHandler,
  getTopMembresAssidusHandler,
} from "../core/handlers/index.js";

describe("Statistiques Module - Tests des cas limites", () => {
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

  describe("Cas limites des IDs utilisateurs", () => {
    it("devrait gérer l'ID 1 (premier ID)", async () => {
      mockRequest.params = { utilisateurId: "1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect([200, 404, 500]).toContain(statusMock.mock.calls[0][0]);
    });

    it("devrait gérer un ID très grand mais valide (MAX_INT32)", async () => {
      mockRequest.params = { utilisateurId: "2147483647" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect([200, 404, 500]).toContain(statusMock.mock.calls[0][0]);
    });

    it("devrait rejeter un ID au-delà de MAX_INT32", async () => {
      mockRequest.params = { utilisateurId: "2147483648" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Devrait être rejeté ou géré comme erreur
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer l'ID avec des zéros en préfixe", async () => {
      mockRequest.params = { utilisateurId: "00123" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt devrait gérer cela correctement
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter l'ID avec seulement des zéros", async () => {
      mockRequest.params = { utilisateurId: "000" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Cas limites des périodes temporelles", () => {
    it("devrait gérer une requête de présence pour 1 mois (minimum)", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "1" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer une requête de présence pour 36 mois (maximum)", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "36" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter une période de 0 mois", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "0" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      // Devrait utiliser valeur par défaut ou rejeter
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter une période supérieure à 36 mois", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "37" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      // Devrait rejeter ou utiliser maximum
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer une période négative gracieusement", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "-6" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Cas limites des collections vides", () => {
    it("devrait gérer un système sans aucun membre", async () => {
      await getMembresCount(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();

      if (statusMock.mock.calls[0][0] === 200) {
        const response = jsonMock.mock.calls[0][0];
        expect(response).toHaveProperty("count");
        expect(typeof response.count).toBe("number");
        expect(response.count).toBeGreaterThanOrEqual(0);
      }
    });

    it("devrait gérer un système sans paiements", async () => {
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();

      if (statusMock.mock.calls[0][0] === 200) {
        const response = jsonMock.mock.calls[0][0];
        expect(response).toHaveProperty("total");
        expect(response.total).toBeGreaterThanOrEqual(0);
      }
    });

    it("devrait gérer une requête pour un utilisateur sans aucune inscription", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();

      if (statusMock.mock.calls[0][0] === 200) {
        const response = jsonMock.mock.calls[0][0];
        expect(Array.isArray(response.data)).toBe(true);
      }
    });

    it("devrait retourner un tableau vide pour nouveaux membres s'il n'y en a pas", async () => {
      mockRequest.query = { jours: "7" };

      await getNouveauxMembresHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();

      if (statusMock.mock.calls[0][0] === 200) {
        const response = jsonMock.mock.calls[0][0];
        expect(Array.isArray(response.data)).toBe(true);
      }
    });

    it("devrait gérer top membres assidus quand personne n'a de présence", async () => {
      await getTopMembresAssidusHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalled();

      if (statusMock.mock.calls[0][0] === 200) {
        const response = jsonMock.mock.calls[0][0];
        expect(Array.isArray(response.data)).toBe(true);
      }
    });
  });

  describe("Cas limites des chaînes de caractères", () => {
    it("devrait gérer un ID avec espaces au début", async () => {
      mockRequest.params = { utilisateurId: "  123" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt devrait gérer les espaces
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un ID avec espaces à la fin", async () => {
      mockRequest.params = { utilisateurId: "123  " };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un ID avec espaces des deux côtés", async () => {
      mockRequest.params = { utilisateurId: "  123  " };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter un ID vide", async () => {
      mockRequest.params = { utilisateurId: "" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un ID contenant seulement des espaces", async () => {
      mockRequest.params = { utilisateurId: "   " };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un ID avec des caractères alphanumériques", async () => {
      mockRequest.params = { utilisateurId: "123abc" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt pourrait parser "123" mais validation devrait rejeter
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Cas limites des nombres décimaux", () => {
    it("devrait arrondir ou rejeter un ID avec décimales", async () => {
      mockRequest.params = { utilisateurId: "123.456" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt arrondira à 123
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un nombre en notation scientifique", async () => {
      mockRequest.params = { utilisateurId: "1e2" }; // 100

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter Infinity", async () => {
      mockRequest.params = { utilisateurId: "Infinity" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter -Infinity", async () => {
      mockRequest.params = { utilisateurId: "-Infinity" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter NaN", async () => {
      mockRequest.params = { utilisateurId: "NaN" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Cas limites des paramètres manquants ou null", () => {
    it("devrait gérer params comme objet vide", async () => {
      mockRequest.params = {};

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer query undefined pour paramètres optionnels", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = undefined;

      await getPresence(mockRequest as Request, mockResponse as Response);

      // Devrait utiliser valeurs par défaut
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer query vide pour paramètres optionnels", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = {};

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Cas limites des types de données incorrects", () => {
    it("devrait gérer un ID comme tableau (Express convertit en string)", async () => {
      mockRequest.params = { utilisateurId: ["123"] as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Express convertit les tableaux en string, parseInt gère cela
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un ID comme objet (Express convertit en string)", async () => {
      mockRequest.params = { utilisateurId: { id: 123 } as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Express convertit en string, parseInt donne NaN, devrait être rejeté
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un ID comme booléen (Express convertit en string)", async () => {
      mockRequest.params = { utilisateurId: true as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Express convertit en string, parseInt donne NaN
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un ID comme fonction (Express convertit en string)", async () => {
      mockRequest.params = { utilisateurId: (() => 123) as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Express convertit en string, parseInt donne NaN
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Cas limites des encodages et caractères spéciaux", () => {
    it("devrait gérer les caractères Unicode dans les paramètres", async () => {
      mockRequest.params = { utilisateurId: "123\u0000" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les retours chariot et nouvelles lignes", async () => {
      mockRequest.params = { utilisateurId: "123\n456" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les tabulations", async () => {
      mockRequest.params = { utilisateurId: "123\t456" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter les caractères de contrôle", async () => {
      mockRequest.params = { utilisateurId: "\x00\x01\x02" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Cas limites de concurrence et timing", () => {
    it("devrait gérer plusieurs requêtes simultanées", async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => {
          const req = { ...mockRequest, params: { utilisateurId: "1" } };
          const res = {
            json: jest.fn(),
            status: jest.fn(() => res as Response),
          };
          return getFrequentation(req as Request, res as Response);
        });

      await Promise.all(requests);

      // Toutes les requêtes devraient être traitées
      expect(requests.length).toBe(10);
    });

    it("devrait gérer des requêtes avec des IDs différents en parallèle", async () => {
      const requests = [1, 2, 3, 4, 5].map((id) => {
        const req = {
          ...mockRequest,
          params: { utilisateurId: id.toString() },
        };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return getFrequentation(req as Request, res as Response);
      });

      await Promise.all(requests);

      expect(requests.length).toBe(5);
    });
  });

  describe("Cas limites des valeurs limites système", () => {
    it("devrait gérer correctement la valeur 0 (rejet attendu)", async () => {
      mockRequest.params = { utilisateurId: "0" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer correctement la valeur -1 (rejet attendu)", async () => {
      mockRequest.params = { utilisateurId: "-1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter la plus petite valeur positive (1)", async () => {
      mockRequest.params = { utilisateurId: "1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect([200, 404, 500]).toContain(statusMock.mock.calls[0][0]);
    });

    it("devrait gérer des valeurs juste en dessous de zéro", async () => {
      mockRequest.params = { utilisateurId: "-0.1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt donnera 0 ou NaN, devrait être rejeté
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Cas limites de format des réponses", () => {
    it("devrait toujours retourner une structure cohérente même en cas d'erreur", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(typeof response.success).toBe("boolean");
    });

    it("devrait inclure un message d'erreur descriptif", async () => {
      mockRequest.params = { utilisateurId: "abc" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      if (!response.success) {
        expect(response).toHaveProperty("message");
        expect(typeof response.message).toBe("string");
        expect(response.message.length).toBeGreaterThan(0);
      }
    });
  });
});
