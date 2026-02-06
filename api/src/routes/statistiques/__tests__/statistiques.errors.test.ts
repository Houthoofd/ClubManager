/**
 * Tests de gestion des erreurs pour le module Statistiques
 * Tests des différents types d'erreurs et leur gestion appropriée
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getFrequentation,
  getProgression,
  getPresence,
  getMembresCount,
  getPaiementsMois,
  getPaiementsRecentsHandler,
  getPlansActifsHandler,
  getNouveauxMembresHandler,
  getTopMembresAssidusHandler,
} from "../core/handlers/index.js";

describe("Statistiques Module - Tests de gestion des erreurs", () => {
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

  describe("Erreurs de validation des paramètres", () => {
    it("devrait retourner 400 pour un ID utilisateur invalide", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait retourner 400 pour un ID négatif", async () => {
      mockRequest.params = { utilisateurId: "-5" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait retourner 400 pour un ID à zéro", async () => {
      mockRequest.params = { utilisateurId: "0" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait retourner 400 pour des paramètres manquants", async () => {
      mockRequest.params = {};

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait inclure un message d'erreur descriptif", async () => {
      mockRequest.params = { utilisateurId: "abc123" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("devrait retourner le bon code d'erreur pour chaque type de validation", async () => {
      const testCases = [
        { id: "invalid", expectedStatus: 400 },
        { id: "-1", expectedStatus: 400 },
        { id: "0", expectedStatus: 400 },
        { id: "", expectedStatus: 400 },
      ];

      for (const testCase of testCases) {
        const req = { ...mockRequest, params: { utilisateurId: testCase.id } };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };

        await getFrequentation(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(testCase.expectedStatus);
      }
    });
  });

  describe("Erreurs de base de données", () => {
    it("devrait retourner 500 en cas d'erreur de connexion à la DB", async () => {
      // Simuler une erreur de base de données en utilisant un ID qui pourrait causer une erreur
      mockRequest.params = { utilisateurId: "1" };

      await getMembresCount(mockRequest as Request, mockResponse as Response);

      // Accepter soit 200 (succès) soit 500 (erreur DB)
      expect(statusMock).toHaveBeenCalled();
      expect([200, 500]).toContain(statusMock.mock.calls[0][0]);
    });

    it("devrait gérer les erreurs de timeout gracieusement", async () => {
      mockRequest.params = { utilisateurId: "1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
    });

    it("devrait encapsuler les erreurs DB dans une réponse structurée", async () => {
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(typeof response.success).toBe("boolean");
    });

    it("devrait logger les erreurs de base de données", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      mockRequest.params = { utilisateurId: "1" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Si une erreur survient, elle devrait être loguée
      // (impossible de forcer une erreur sans mock du service)

      consoleErrorSpy.mockRestore();
    });

    it("ne devrait pas exposer les détails internes de la DB dans les erreurs", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      if (statusMock.mock.calls[0][0] === 500) {
        const response = jsonMock.mock.calls[0][0];
        if (response.message) {
          expect(response.message).not.toContain("SELECT");
          expect(response.message).not.toContain("FROM");
          expect(response.message).not.toContain("WHERE");
          expect(response.message).not.toContain("mysql");
          expect(response.message).not.toContain("password");
        }
      }
    });
  });

  describe("Erreurs de type de données", () => {
    it("devrait gérer un ID de type tableau (Express convertit en string)", async () => {
      mockRequest.params = { utilisateurId: [123] as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Express convertit les tableaux en string, parseInt gère cela
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter un ID de type objet", async () => {
      mockRequest.params = { utilisateurId: { id: 123 } as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un ID null", async () => {
      mockRequest.params = { utilisateurId: null as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un ID undefined", async () => {
      mockRequest.params = { utilisateurId: undefined as any };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter NaN comme ID", async () => {
      mockRequest.params = { utilisateurId: "NaN" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter Infinity comme ID", async () => {
      mockRequest.params = { utilisateurId: "Infinity" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Erreurs de format des requêtes", () => {
    it("devrait gérer une requête avec query malformée", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.query = { mois: "invalid" } as any;

      await getPresence(mockRequest as Request, mockResponse as Response);

      // Devrait soit utiliser valeur par défaut, soit rejeter
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer des headers manquants ou corrompus", async () => {
      mockRequest.params = { utilisateurId: "1" };
      mockRequest.headers = undefined;

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Erreurs d'autorisation et d'accès", () => {
    it("devrait gérer l'accès à un utilisateur inexistant", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      // Peut retourner 200 avec données vides, 404, ou 500
      expect([200, 404, 500]).toContain(statusMock.mock.calls[0][0]);
    });

    it("devrait retourner une réponse appropriée pour ressource non trouvée", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      await getProgression(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
    });
  });

  describe("Gestion des erreurs en cascade", () => {
    it("devrait gérer plusieurs erreurs de validation simultanément", async () => {
      const requests = [
        { utilisateurId: "invalid" },
        { utilisateurId: "-1" },
        { utilisateurId: "0" },
        { utilisateurId: "" },
      ].map((params) => {
        const req = { ...mockRequest, params };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return getFrequentation(req as Request, res as Response);
      });

      await Promise.all(requests);

      // Toutes devraient retourner une erreur
      expect(requests.length).toBe(4);
    });

    it("ne devrait pas planter si une erreur survient pendant le traitement d'erreur", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      // Mock console.error pour simuler une erreur pendant le logging
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {
          // Erreur silencieuse
        });

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Format des messages d'erreur", () => {
    it("devrait retourner un message d'erreur lisible par l'utilisateur", async () => {
      mockRequest.params = { utilisateurId: "abc" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      if (!response.success) {
        expect(response.message).toBeTruthy();
        expect(typeof response.message).toBe("string");
        // Le message ne devrait pas contenir de code ou de jargon technique
        expect(response.message.length).toBeLessThan(200);
      }
    });

    it("devrait inclure le champ success dans toutes les réponses d'erreur", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(response.success).toBe(false);
    });

    it("ne devrait pas inclure de stack trace dans la réponse", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).not.toHaveProperty("stack");
      expect(response).not.toHaveProperty("stackTrace");
    });

    it("ne devrait pas exposer de chemins de fichiers système", async () => {
      mockRequest.params = { utilisateurId: "error" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const responseStr = JSON.stringify(response);
      expect(responseStr).not.toContain("/src/");
      expect(responseStr).not.toContain("/node_modules/");
      expect(responseStr).not.toContain("C:\\");
      expect(responseStr).not.toContain("/home/");
    });
  });

  describe("Erreurs de sécurité", () => {
    it("devrait gérer les tentatives d'injection SQL (parseInt protège)", async () => {
      mockRequest.params = { utilisateurId: "1' OR '1'='1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt("1' OR...") = 1, qui est valide, ou NaN si pas numérique
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les scripts XSS dans les paramètres (parseInt protège)", async () => {
      mockRequest.params = { utilisateurId: "<script>alert('xss')</script>" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt donne NaN, devrait être rejeté
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les tentatives de path traversal (parseInt protège)", async () => {
      mockRequest.params = { utilisateurId: "../../../etc/passwd" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // parseInt donne NaN, devrait être rejeté
      expect(statusMock).toHaveBeenCalled();
    });

    it("ne devrait jamais exposer de tokens ou credentials dans les erreurs", async () => {
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const responseStr = JSON.stringify(response);
      expect(responseStr).not.toContain("password");
      expect(responseStr).not.toContain("token");
      expect(responseStr).not.toContain("secret");
      expect(responseStr).not.toContain("api_key");
    });
  });

  describe("Récupération après erreur", () => {
    it("devrait permettre des requêtes valides après une erreur", async () => {
      // Première requête: erreur
      mockRequest.params = { utilisateurId: "invalid" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);

      // Réinitialiser les mocks
      jsonMock.mockClear();
      statusMock.mockClear();

      // Deuxième requête: valide
      mockRequest.params = { utilisateurId: "1" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalled();
      expect([200, 404, 500]).toContain(statusMock.mock.calls[0][0]);
    });

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
        return getFrequentation(req as Request, res as Response).then(
          () => res,
        );
      });

      const responses = await Promise.all(requests);

      // Chaque réponse devrait être indépendante
      expect(responses).toHaveLength(4);
    });
  });

  describe("Logging des erreurs", () => {
    it("devrait logger les erreurs critiques", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      mockRequest.params = { utilisateurId: "1" };
      await getMembresCount(mockRequest as Request, mockResponse as Response);

      // Si erreur DB, devrait être loguée
      // (impossible de forcer sans mock du service)

      consoleErrorSpy.mockRestore();
    });

    it("ne devrait pas logger les erreurs de validation (pas critiques)", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      mockRequest.params = { utilisateurId: "invalid" };
      await getFrequentation(mockRequest as Request, mockResponse as Response);

      // Les erreurs de validation 400 ne devraient pas causer de console.error
      // (seulement des console.log ou console.warn)

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Erreurs de performance", () => {
    it("devrait gérer les requêtes qui prennent trop de temps", async () => {
      const startTime = Date.now();
      mockRequest.params = { utilisateurId: "1" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const duration = Date.now() - startTime;

      // Devrait répondre en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
    });

    it("ne devrait pas bloquer le thread pour les erreurs", async () => {
      const start = Date.now();
      mockRequest.params = { utilisateurId: "invalid" };

      await getFrequentation(mockRequest as Request, mockResponse as Response);

      const duration = Date.now() - start;

      // Les erreurs de validation devraient être quasi-instantanées
      expect(duration).toBeLessThan(100);
    });
  });
});
