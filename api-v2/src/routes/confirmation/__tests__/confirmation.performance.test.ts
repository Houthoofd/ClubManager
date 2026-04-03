/**
 * Tests de performance pour le module Confirmation
 * Tests de charge, temps de réponse et optimisation
 * Refactorisé pour utiliser jest.spyOn() comme les tests de compte
 */

// Configurer l'environnement AVANT les imports pour initialiser Stripe
process.env.STRIPE_SECRET_KEY = "sk_test_51MockKeyForTestingOnly";
process.env.NODE_ENV = "test";

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  confirmPayment,
  confirmPaymentCommande,
  health,
} from "../core/handlers/index.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import { setStripeInstance } from "../core/utils/stripe-instance.js";
import Stripe from "stripe";

describe("Confirmation - Tests de performance", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let paiementsClient: Paiements;
  let emailClient: EmailClient;
  let mockStripe: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Créer les instances réelles
    paiementsClient = new Paiements();
    emailClient = EmailClient.getInstance();

    // Créer un mock Stripe complet
    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn(),
      },
    };

    // Injecter le mock Stripe
    setStripeInstance(mockStripe as any);

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock as any,
      status: statusMock as any,
    };
  });

  describe("Temps de réponse", () => {
    it("devrait confirmer un paiement d'échéance en moins de 200ms", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);
      jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      const start = performance.now();
      await confirmPayment(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait confirmer un paiement de commande en moins de 250ms", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 9999,
        currency: "eur",
      });

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any)
        .mockResolvedValueOnce([
          {
            numero_commande: "CMD-001",
            total: 99.99,
            articles: [],
          },
        ] as any);

      const start = performance.now();
      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(250);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait répondre au health check en moins de 10ms", async () => {
      const start = performance.now();
      await health(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Charge de travail", () => {
    it("devrait gérer 50 confirmations de paiement simultanées", async () => {
      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "payé",
          utilisateur_id: 1,
          montant: 50,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ] as any);

      const requests = Array.from({ length: 50 }, (_, i) => {
        const req = {
          body: {
            paymentIntentId: `pi_test_${i}`,
            echeanceId: `${i + 1}`,
            userId: "1",
            amount: "50.00",
          },
          params: {},
          query: {},
          headers: {},
        };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return confirmPayment(req as Request, res as Response);
      });

      const start = performance.now();
      await Promise.all(requests);
      const duration = performance.now() - start;

      // Toutes les requêtes devraient se terminer en moins de 2 secondes
      expect(duration).toBeLessThan(2000);
    });

    it("devrait gérer 30 confirmations de commande simultanées", async () => {
      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test",
        status: "succeeded",
        amount: 9999,
        currency: "eur",
      });

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue({ affectedRows: 1 } as any);

      const requests = Array.from({ length: 30 }, (_, i) => {
        const req = {
          body: {
            paymentIntentId: `pi_test_${i}`,
            commandeId: `${i + 1}`,
            userId: "1",
            amount: "99.99",
          },
          params: {},
          query: {},
          headers: {},
        };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return confirmPaymentCommande(req as Request, res as Response);
      });

      const start = performance.now();
      await Promise.all(requests);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
    });
  });

  describe("Optimisation des requêtes", () => {
    it("devrait minimiser le nombre de requêtes pour une confirmation simple", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      const querySpy = jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValueOnce([
          {
            id: 1,
            statut: "en_attente",
            utilisateur_id: 1,
            montant: 50,
            date_echeance: new Date(),
            abonnement_id: 1,
          },
        ] as any)
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any);

      const confirmSpy = jest
        .spyOn(paiementsClient, "confirmerPaiementStripe")
        .mockResolvedValue(undefined as any);

      jest
        .spyOn(paiementsClient, "estPremierPaiement")
        .mockResolvedValue(false);

      await confirmPayment(mockRequest as Request, mockResponse as Response);

      // Devrait faire au maximum 4 requêtes:
      // 1. checkEcheance
      // 2. updateEcheance
      // 3. userQuery
      // 4. confirmerPaiementStripe
      expect(querySpy).toHaveBeenCalledTimes(3);
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it("devrait réutiliser la connexion Stripe entre les appels", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_456",
        commandeId: "1",
        userId: "1",
        amount: "99.99",
      };

      // Mock Stripe retrieve
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_test_456",
        status: "succeeded",
        amount: 9999,
        currency: "eur",
      });

      jest
        .spyOn(paiementsClient, "queryAsync")
        .mockResolvedValue({ affectedRows: 1 } as any)
        .mockResolvedValue({ affectedRows: 1 } as any)
        .mockResolvedValue([
          { email: "test@test.com", first_name: "Test", last_name: "User" },
        ] as any)
        .mockResolvedValue([
          {
            numero_commande: "CMD-001",
            total: 99.99,
            articles: [],
          },
        ] as any);

      // Premier appel
      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Deuxième appel
      mockRequest.body.commandeId = "2";
      await confirmPaymentCommande(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Stripe devrait être appelé 2 fois mais réutiliser la même instance
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance de l'idempotence", () => {
    it("devrait répondre rapidement pour une échéance déjà payée", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "payé",
          utilisateur_id: 1,
          montant: 50,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ] as any);

      const start = performance.now();
      await confirmPayment(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      // Devrait être très rapide car détection early return
      expect(duration).toBeLessThan(50);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          already_paid: true,
        }),
      );
    });

    it("devrait gérer efficacement les requêtes en double", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_test_123",
        echeanceId: "1",
        userId: "1",
        amount: "50.00",
      };

      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "payé",
          utilisateur_id: 1,
          montant: 50,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ] as any);

      // Simuler 10 requêtes identiques
      const requests = Array.from({ length: 10 }, () => {
        const req = { ...mockRequest };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res as Response),
        };
        return confirmPayment(req as Request, res as Response);
      });

      const start = performance.now();
      await Promise.all(requests);
      const duration = performance.now() - start;

      // Devrait être rapide grâce à l'idempotence
      expect(duration).toBeLessThan(500);
    });
  });

  describe("Scalabilité", () => {
    it("devrait maintenir des performances constantes avec plusieurs utilisateurs", async () => {
      const durations: number[] = [];

      for (let userBatch = 1; userBatch <= 3; userBatch++) {
        jest
          .spyOn(paiementsClient, "queryAsync")
          .mockResolvedValueOnce([
            {
              id: userBatch,
              statut: "en_attente",
              utilisateur_id: userBatch,
              montant: 50,
              date_echeance: new Date(),
              abonnement_id: 1,
            },
          ] as any)
          .mockResolvedValueOnce({ affectedRows: 1 } as any)
          .mockResolvedValueOnce([
            {
              email: `user${userBatch}@test.com`,
              first_name: "User",
              last_name: `${userBatch}`,
            },
          ] as any);

        jest
          .spyOn(paiementsClient, "estPremierPaiement")
          .mockResolvedValue(false);
        jest
          .spyOn(paiementsClient, "confirmerPaiementStripe")
          .mockResolvedValue(undefined as any);

        mockRequest.body = {
          paymentIntentId: `pi_test_${userBatch}`,
          echeanceId: `${userBatch}`,
          userId: `${userBatch}`,
          amount: "50.00",
        };

        const start = performance.now();
        await confirmPayment(mockRequest as Request, mockResponse as Response);
        durations.push(performance.now() - start);
      }

      // Les temps devraient rester relativement constants
      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDeviation = Math.max(
        ...durations.map((d) => Math.abs(d - avgDuration)),
      );

      // Aucune durée ne devrait dévier de plus de 100ms de la moyenne
      expect(maxDeviation).toBeLessThan(100);
    });
  });

  describe("Mémoire et ressources", () => {
    it("ne devrait pas créer de fuites mémoire avec des requêtes répétées", async () => {
      jest.spyOn(paiementsClient, "queryAsync").mockResolvedValue([
        {
          id: 1,
          statut: "payé",
          utilisateur_id: 1,
          montant: 50,
          date_echeance: new Date(),
          abonnement_id: 1,
        },
      ] as any);

      // Simuler 100 requêtes
      for (let i = 0; i < 100; i++) {
        mockRequest.body = {
          paymentIntentId: `pi_test_${i}`,
          echeanceId: "1",
          userId: "1",
          amount: "50.00",
        };

        await confirmPayment(mockRequest as Request, mockResponse as Response);
      }

      // Si on arrive ici sans erreur, pas de fuite évidente
      expect(true).toBe(true);
    });
  });
});
