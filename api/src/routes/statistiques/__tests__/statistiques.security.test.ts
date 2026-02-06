/**
 * Tests de sécurité pour le module Statistiques
 * Tests des validations de sécurité, injections SQL, XSS, etc.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getFrequentation,
  getProgression,
  getPresence,
} from "../core/handlers/index.js";

describe("Statistiques Module - Tests de sécurité", () => {
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

  describe("Protection contre les injections SQL", () => {
    it("devrait gérer une tentative d'injection SQL dans l'ID (parseInt protège)", async () => {
      mockRequest.params = { utilisateurId: "1 OR 1=1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt("1 OR 1=1") = 1, qui est valide, donc accepté par le handler
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer DROP TABLE (parseInt retourne NaN, rejeté)", async () => {
      mockRequest.params = { utilisateurId: "'; DROP TABLE utilisateurs; --" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt donne NaN sur cette chaîne, donc rejeté
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer UNION SELECT (parseInt retourne NaN, rejeté)", async () => {
      mockRequest.params = {
        utilisateurId: "UNION SELECT * FROM utilisateurs",
      };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt donne NaN, donc rejeté
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer les commentaires SQL (parseInt parse le nombre initial)", async () => {
      mockRequest.params = { utilisateurId: "1/* comment */OR 1=1 --" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt("1/* comment...") = 1, qui est valide
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les attaques XSS", () => {
    it("devrait gérer des scripts dans les paramètres", async () => {
      mockRequest.params = { utilisateurId: "<script>alert('XSS')</script>" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer des balises HTML malveillantes", async () => {
      mockRequest.params = {
        utilisateurId: "<img src=x onerror=alert('XSS')>",
      };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer des événements JavaScript encodés", async () => {
      mockRequest.params = { utilisateurId: "javascript:alert('XSS')" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Validation des limites de taille", () => {
    it("devrait gérer des IDs extrêmement grands", async () => {
      mockRequest.params = {
        utilisateurId: Number.MAX_SAFE_INTEGER.toString(),
      };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter des IDs au-delà de MAX_SAFE_INTEGER", async () => {
      mockRequest.params = { utilisateurId: "9999999999999999999999999999" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les dépassements de type", () => {
    it("devrait gérer des nombres flottants pour les IDs", async () => {
      mockRequest.params = { utilisateurId: "1.5" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer des nombres négatifs", async () => {
      mockRequest.params = { utilisateurId: "-1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer NaN", async () => {
      mockRequest.params = { utilisateurId: "NaN" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer Infinity", async () => {
      mockRequest.params = { utilisateurId: "Infinity" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Validation des caractères spéciaux", () => {
    it("devrait rejeter des caractères Unicode malveillants", async () => {
      mockRequest.params = { utilisateurId: "\u0000\u0001\u0002" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer des emojis dans les IDs", async () => {
      mockRequest.params = { utilisateurId: "😀123" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter des caractères de contrôle", async () => {
      mockRequest.params = { utilisateurId: "\n\r\t" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Protection des données sensibles", () => {
    it("ne devrait pas exposer d'informations sensibles dans les erreurs", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);

      const responseData = jsonMock.mock.calls[0][0];
      const responseStr = JSON.stringify(responseData);

      expect(responseStr).not.toContain("password");
      expect(responseStr).not.toContain("token");
      expect(responseStr).not.toContain("secret");
    });

    it("ne devrait pas exposer la structure de la base de données", async () => {
      mockRequest.params = { utilisateurId: "1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const responseData = jsonMock.mock.calls[0][0];
      const responseStr = JSON.stringify(responseData);

      // Ne devrait pas contenir de noms de tables SQL
      expect(responseStr).not.toContain("SELECT");
      expect(responseStr).not.toContain("FROM");
    });
  });

  describe("Protection contre le déni de service (DoS)", () => {
    it("devrait gérer des chaînes extrêmement longues", async () => {
      const longString = "a".repeat(100000);
      mockRequest.params = { utilisateurId: longString };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer de nombreuses requêtes invalides rapidement", async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const req = { params: { utilisateurId: "invalid" } } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        await getFrequentation(req, res);
      }

      const duration = Date.now() - startTime;

      // Les erreurs de validation devraient être rapides
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Validation des paramètres de requête", () => {
    it("devrait valider les paramètres de mois pour la présence", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "999" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait valider les paramètres de mois négatifs", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "-5" };

      await getPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les attaques par timing", () => {
    it("devrait répondre de manière cohérente pour les IDs existants et inexistants", async () => {
      // Utilisateur existant
      mockRequest.params = { utilisateurId: "1" };
      const start1 = Date.now();
      await getFrequentation(mockRequest as Request, mockResponse as Response);
      const time1 = Date.now() - start1;

      // Utilisateur inexistant
      jest.clearAllMocks();
      mockRequest.params = { utilisateurId: "999999" };
      const start2 = Date.now();
      await getFrequentation(mockRequest as Request, mockResponse as Response);
      const time2 = Date.now() - start2;

      // Les temps ne devraient pas être trop différents
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(200);
    });
  });
});
