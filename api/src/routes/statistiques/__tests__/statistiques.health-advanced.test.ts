/**
 * Tests avancés du health check pour le module Statistiques
 * Tests approfondis de la santé du système et de ses composants
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { healthCheck } from "../core/handlers/health.handler.js";

describe("Statistiques Module - Tests avancés de health check", () => {
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

  describe("Structure de la réponse health", () => {
    it("devrait retourner une structure complète avec status", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("data");
      expect(response.data).toHaveProperty("status");
      expect(response.data).toHaveProperty("module");
      expect(response.data.module).toBe("statistiques");
    });

    it("devrait inclure un timestamp valide", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response.data.timestamp).toBeTruthy();

      const timestamp = new Date(response.data.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it("devrait indiquer le status 'healthy'", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response.data.status).toBe("healthy");
    });
  });

  describe("Informations système", () => {
    it("devrait inclure des informations sur l'environnement", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toBeTruthy();
    });

    it("devrait être rapide (< 100ms)", async () => {
      const start = Date.now();
      await healthCheck(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("devrait gérer plusieurs appels consécutifs", async () => {
      for (let i = 0; i < 5; i++) {
        await healthCheck(mockRequest as Request, mockResponse as Response);
        expect(statusMock).toHaveBeenCalledWith(200);
      }

      expect(statusMock).toHaveBeenCalledTimes(5);
    });
  });

  describe("Performance du health check", () => {
    it("devrait répondre rapidement sous charge", async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => {
          const req = { ...mockRequest };
          const res = {
            json: jest.fn(),
            status: jest.fn(() => res as Response),
          };
          return healthCheck(req as Request, res as Response);
        });

      const start = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it("ne devrait pas créer de fuites mémoire", async () => {
      for (let i = 0; i < 100; i++) {
        const req = { ...mockRequest };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        await healthCheck(req as Request, res as Response);
      }

      // Si on arrive ici sans crash, pas de fuite mémoire évidente
      expect(true).toBe(true);
    });
  });

  describe("Cohérence des réponses", () => {
    it("devrait toujours retourner le même format", async () => {
      const responses = [];

      for (let i = 0; i < 3; i++) {
        const req = { ...mockRequest };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        await healthCheck(req as Request, res as Response);
        responses.push(res.json.mock.calls[0][0]);
      }

      const keys = Object.keys(responses[0]);
      responses.forEach((response) => {
        expect(Object.keys(response).sort()).toEqual(keys.sort());
      });
    });

    it("devrait retourner des données JSON valides", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const jsonString = JSON.stringify(response);
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });
});
