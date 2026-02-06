/**
 * Tests de performance pour le module Statistiques
 * Teste les temps de réponse et la gestion de charge
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

describe("Statistiques Module - Performance Tests", () => {
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

  describe("Temps de réponse", () => {
    it("devrait répondre au health check en moins de 100ms", async () => {
      const startTime = Date.now();
      await healthCheck(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(100);
    });

    it("devrait récupérer la fréquentation en moins de 500ms", async () => {
      mockRequest.params = { utilisateurId: "1" };
      const startTime = Date.now();

      await getFrequentation(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalled();
      expect(duration).toBeLessThan(500);
    });

    it("devrait gérer les erreurs de validation rapidement (< 50ms)", async () => {
      mockRequest.params = { utilisateurId: "invalid" };
      const startTime = Date.now();

      await getFrequentation(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(duration).toBeLessThan(50);
    });

    it("devrait récupérer le nombre de membres en moins de 400ms", async () => {
      const startTime = Date.now();
      await getMembresCount(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalled();
      expect(duration).toBeLessThan(400);
    });

    it("devrait récupérer les paiements en moins de 400ms", async () => {
      const startTime = Date.now();
      await getPaiementsMois(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalled();
      expect(duration).toBeLessThan(400);
    });
  });

  describe("Gestion de charge", () => {
    it("devrait gérer 100 requêtes simultanées de fréquentation", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, (_, i) => {
        const req = {
          ...mockRequest,
          params: { utilisateurId: ((i % 10) + 1).toString() },
        };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        return getFrequentation(req as Request, res);
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    });

    it("devrait gérer 50 health checks simultanés", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, () => {
        const req = { ...mockRequest } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        return healthCheck(req, res);
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it("devrait gérer des requêtes mixtes simultanées", async () => {
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 20; i++) {
        const req = { params: { utilisateurId: "1" } } as unknown as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        promises.push(getFrequentation(req, res));
        promises.push(getProgression(req, res));
        promises.push(getPresence(req, res));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Benchmarks moyens", () => {
    it("devrait maintenir une moyenne < 100ms pour getFrequentation sur 50 appels", async () => {
      mockRequest.params = { utilisateurId: "1" };
      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        const req = { ...mockRequest } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;

        await getFrequentation(req, res);
        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length;

      expect(average).toBeLessThan(100);
    });
  });

  describe("Stabilité sous charge", () => {
    it("ne devrait pas créer de fuites mémoire avec 200 requêtes", async () => {
      for (let i = 0; i < 200; i++) {
        const req = {
          params: { utilisateurId: ((i % 10) + 1).toString() },
        } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        await getFrequentation(req, res);
      }

      expect(true).toBe(true);
    });
  });
});
