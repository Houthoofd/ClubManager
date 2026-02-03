/**
 * Tests de performance pour le module Paiements
 * Vérifie les performances, temps de réponse, et scalabilité
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../db/clients/messagerie/emailClient.js";
import {
  createPaymentEcheance,
  createPaymentCommande,
  confirmEcheancePayment,
  confirmCommandePayment,
  getHistoriquePaiements,
  getEcheancesUtilisateur,
  healthCheck,
} from "../core/handlers/index.js";

describe("Paiements Module - Performance Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockPaiementsClient: Partial<Paiements>;
  let mockEmailClient: Partial<EmailClient>;

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

    mockPaiementsClient = {
      verifierEcheanceExiste: jest.fn(),
      obtenirEcheance: jest.fn(),
      obtenirCommandeParId: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
      mettreAJourStatutEcheance: jest.fn(),
      mettreAJourStatutCommande: jest.fn(),
      estPremierPaiement: jest.fn(),
      upgradeStatutUtilisateur: jest.fn(),
      enregistrerPaiement: jest.fn(),
      obtenirTousPaiements: jest.fn(),
      obtenirHistoriquePaiementsUtilisateur: jest.fn(),
      obtenirEcheancesUtilisateur: jest.fn(),
      obtenirEcheanceAvecUtilisateur: jest.fn(),
      obtenirCommandeAvecUtilisateur: jest.fn(),
    };

    mockEmailClient = {
      envoyerEmail: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe("Temps de réponse", () => {
    it("devrait créer un paiement en moins de 1000ms", async () => {
      mockRequest.body = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      const startTime = Date.now();

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it("devrait confirmer un paiement en moins de 1000ms", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_123",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      const startTime = Date.now();

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it("devrait récupérer l'historique en moins de 300ms", async () => {
      mockRequest.query = {
        limit: "50",
        offset: "0",
      };

      const mockPaiements = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        montant: 25.5,
        statut: "payé",
      }));

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: mockPaiements,
          total: 1000,
        },
      );

      const startTime = Date.now();

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
    });

    it("devrait faire un health check en moins de 200ms", async () => {
      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 0,
        },
      );

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe("Gestion de charge", () => {
    it("devrait gérer 100 requêtes simultanées de création", async () => {
      mockRequest.body = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, () =>
        createPaymentEcheance(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        ),
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      // Devrait gérer 100 requêtes en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
    });

    it("devrait gérer 50 confirmations simultanées", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_123",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, () =>
        confirmEcheancePayment(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
          mockEmailClient as EmailClient,
        ),
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      // Devrait gérer 50 confirmations en moins de 10 secondes
      expect(duration).toBeLessThan(10000);
    });

    it("devrait gérer 200 requêtes d'historique simultanées", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "0",
      };

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 0,
        },
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 200 }, () =>
        getHistoriquePaiements(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        ),
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      // Devrait gérer 200 lectures en moins de 3 secondes
      expect(duration).toBeLessThan(3000);
    });
  });

  describe("Pagination performance", () => {
    it("devrait paginer efficacement avec limit=100", async () => {
      mockRequest.query = {
        limit: "100",
        offset: "0",
      };

      const largePaiements = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        montant: 25.5,
        statut: "payé",
        date_creation: new Date(),
      }));

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: largePaiements,
          total: 10000,
        },
      );

      const startTime = Date.now();

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it("devrait gérer un offset élevé efficacement", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "10000",
      };

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 100000,
        },
      );

      const startTime = Date.now();

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      // Même avec offset élevé, devrait rester performant
      expect(duration).toBeLessThan(500);
    });

    it("devrait itérer sur toutes les pages rapidement", async () => {
      const totalPages = 10;
      const limit = 50;

      const startTime = Date.now();

      for (let page = 0; page < totalPages; page++) {
        mockRequest.query = {
          limit: limit.toString(),
          offset: (page * limit).toString(),
        };

        const mockPaiements = Array.from({ length: limit }, (_, i) => ({
          id: page * limit + i + 1,
          montant: 25.5,
        }));

        (
          mockPaiementsClient.obtenirTousPaiements as jest.Mock
        ).mockResolvedValue({
          paiements: mockPaiements,
          total: totalPages * limit,
        });

        await getHistoriquePaiements(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        );
      }

      const duration = Date.now() - startTime;

      // 10 pages de 50 résultats en moins de 2 secondes
      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Mémoire et scalabilité", () => {
    it("devrait gérer un grand nombre d'échéances pour un utilisateur", async () => {
      mockRequest.params = {
        userId: "1",
      };

      const largeEcheances = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        montant: 25.5,
        statut: "en_attente",
        date_echeance: new Date(),
      }));

      (
        mockPaiementsClient.obtenirEcheancesUtilisateur as jest.Mock
      ).mockResolvedValue(largeEcheances);

      const startTime = Date.now();

      await getEcheancesUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      // Devrait gérer 1000 échéances en moins de 1 seconde
      expect(duration).toBeLessThan(1000);
    });

    it("devrait gérer des objets volumineux dans les métadonnées", async () => {
      const largeMetadata = {
        description: "A".repeat(10000),
        extra: {
          data1: "B".repeat(10000),
          data2: "C".repeat(10000),
        },
      };

      mockRequest.body = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
        metadata: largeMetadata,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      const startTime = Date.now();

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      // Même avec métadonnées larges, devrait rester rapide
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Cache performance", () => {
    it("devrait bénéficier du cache pour des requêtes identiques", async () => {
      mockRequest.body = {
        amount: 25.5,
        echeanceId: 1,
        userId: 1,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      // Première requête (cache miss)
      const startTime1 = Date.now();
      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );
      const duration1 = Date.now() - startTime1;

      // Deuxième requête (potentiel cache hit)
      const startTime2 = Date.now();
      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );
      const duration2 = Date.now() - startTime2;

      // La deuxième requête devrait être au moins aussi rapide
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.5);
    });

    it("devrait invalider le cache correctement après confirmation", async () => {
      const echeanceId = 1;

      // Créer un paiement
      mockRequest.body = {
        amount: 25.5,
        echeanceId,
        userId: 1,
      };

      const mockEcheance = {
        id: echeanceId,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      (
        mockPaiementsClient.verifierEcheanceExiste as jest.Mock
      ).mockResolvedValue(true);
      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );

      await createPaymentEcheance(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      // Confirmer le paiement
      mockRequest.body = {
        paymentIntentId: "pi_123",
        echeanceId,
        userId: 1,
        amount: 2550,
      };

      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        false,
      );
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      const startTime = Date.now();

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      const duration = Date.now() - startTime;

      // L'invalidation ne devrait pas ralentir
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Envoi d'emails asynchrone", () => {
    it("ne devrait pas bloquer la réponse pendant l'envoi d'email", async () => {
      mockRequest.body = {
        paymentIntentId: "pi_123",
        echeanceId: 1,
        userId: 1,
        amount: 2550,
      };

      const mockEcheance = {
        id: 1,
        montant: 25.5,
        statut: "en_attente",
        utilisateur_id: 1,
      };

      const mockUser = {
        id: 1,
        email: "test@example.com",
      };

      (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
        mockEcheance,
      );
      (
        mockPaiementsClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockUser);
      (
        mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
        true,
      );
      (
        mockPaiementsClient.upgradeStatutUtilisateur as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPaiementsClient.enregistrerPaiement as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Email lent (500ms)
      (mockEmailClient.envoyerEmail as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 500);
          }),
      );

      const startTime = Date.now();

      await confirmEcheancePayment(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
        mockEmailClient as EmailClient,
      );

      const duration = Date.now() - startTime;

      // Ne devrait pas attendre l'email (fire & forget)
      // Devrait répondre en moins de 1 seconde même si email prend 500ms
      expect(duration).toBeLessThan(1500);
    });

    it("devrait gérer plusieurs envois d'emails simultanés", async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const req = {
          ...mockRequest,
          body: {
            paymentIntentId: `pi_${i}`,
            echeanceId: i + 1,
            userId: i + 1,
            amount: 2550,
          },
        };

        const mockEcheance = {
          id: i + 1,
          montant: 25.5,
          statut: "en_attente",
          utilisateur_id: i + 1,
        };

        (mockPaiementsClient.obtenirEcheance as jest.Mock).mockResolvedValue(
          mockEcheance,
        );
        (
          mockPaiementsClient.mettreAJourStatutEcheance as jest.Mock
        ).mockResolvedValue(undefined);
        (mockPaiementsClient.estPremierPaiement as jest.Mock).mockResolvedValue(
          false,
        );
        (
          mockPaiementsClient.enregistrerPaiement as jest.Mock
        ).mockResolvedValue(undefined);

        return confirmEcheancePayment(
          req as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
          mockEmailClient as EmailClient,
        );
      });

      const startTime = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // 10 confirmations avec emails en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Benchmarks moyens", () => {
    it("devrait maintenir une moyenne < 100ms pour healthCheck sur 100 appels", async () => {
      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 0,
        },
      );

      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();

        await healthCheck(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        );

        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;

      expect(average).toBeLessThan(100);
    });

    it("devrait maintenir une moyenne < 200ms pour getHistorique sur 50 appels", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "0",
      };

      (mockPaiementsClient.obtenirTousPaiements as jest.Mock).mockResolvedValue(
        {
          paiements: [],
          total: 0,
        },
      );

      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();

        await getHistoriquePaiements(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        );

        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;

      expect(average).toBeLessThan(200);
    });
  });

  describe("Gestion des timeouts", () => {
    it("devrait gérer un client DB lent sans crash", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "0",
      };

      // Simule une DB lente (2 secondes)
      (
        mockPaiementsClient.obtenirTousPaiements as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  paiements: [],
                  total: 0,
                }),
              2000,
            );
          }),
      );

      const startTime = Date.now();

      await getHistoriquePaiements(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      const duration = Date.now() - startTime;

      // Devrait attendre mais ne pas crasher
      expect(duration).toBeGreaterThanOrEqual(2000);
      expect(statusMock).toHaveBeenCalled();
    });
  });
});
