/**
 * Tests de validation pour le module Commandes
 * Validation des données entrantes et des règles métier
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getCommande,
  updateStatut,
  batchUpdateStatuts,
  paymentConfirmation,
} from "../core/handlers/index.js";

// Mock du connector MySQL
jest.mock("../../../db/connector/mysqlconnector.js", () => {
  return {
    default: {
      getInstance: jest.fn(() => ({
        query: jest.fn(),
      })),
    },
  };
});

describe("Commandes - Tests de validation", () => {
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
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe("Validation des statuts", () => {
    it("devrait accepter les statuts valides", async () => {
      const statutsValides = ["en attente", "payée", "expédiée", "annulée"];

      for (const statut of statutsValides) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "en attente",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          },
        );

        await updateStatut(mockRequest as Request, mockResponse as Response);

        expect(statusMock).not.toHaveBeenCalledWith(400);
      }
    });

    it("devrait rejeter les statuts invalides", async () => {
      const statutsInvalides = [
        "livree",
        "complete",
        "pending",
        "shipped",
        "",
        null,
        undefined,
      ];

      for (const statut of statutsInvalides) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut };

        await updateStatut(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("Statut invalide"),
          }),
        );
      }
    });

    it("devrait être sensible à la casse pour les statuts", async () => {
      const statutsCasse = ["Payée", "PAYÉE", "PayÉe", "en Attente"];

      for (const statut of statutsCasse) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut };

        await updateStatut(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });
  });

  describe("Validation des IDs", () => {
    it("devrait accepter les IDs numériques valides", async () => {
      const idsValides = ["1", "42", "999", "123456"];

      for (const id of idsValides) {
        jest.clearAllMocks();
        mockRequest.params = { id };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, []);
          },
        );

        await getCommande(mockRequest as Request, mockResponse as Response);

        // Devrait retourner 404 (commande non trouvée) mais pas 400 (validation)
        expect(statusMock).toHaveBeenCalledWith(404);
      }
    });

    it("devrait accepter les UUIDs", async () => {
      mockRequest.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait accepter les numéros de commande", async () => {
      mockRequest.params = { id: "CMD-2024-001" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe("Validation batch update", () => {
    it("devrait valider que updates est un tableau", async () => {
      mockRequest.body = { updates: "not an array" };

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider que updates n'est pas vide", async () => {
      mockRequest.body = { updates: [] };

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("vide"),
        }),
      );
    });

    it("devrait valider la structure de chaque update", async () => {
      mockRequest.body = {
        updates: [
          { commandeId: 1, statut: "payée" }, // Valide
          { commandeId: 2 }, // Manque statut
          { statut: "expédiée" }, // Manque commandeId
        ],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Devrait traiter au moins une commande avec succès
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer les IDs manquants", async () => {
      mockRequest.body = {
        updates: [{ commandeId: null, statut: "payée" }],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Invalid ID"));
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCount: 1,
        }),
      );
    });
  });

  describe("Validation paiement", () => {
    it("devrait valider la présence de commandeId", async () => {
      mockRequest.body = {};

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "ID de commande requis",
        }),
      );
    });

    it("devrait valider que commandeId n'est pas null", async () => {
      mockRequest.body = { commandeId: null };

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider que commandeId n'est pas undefined", async () => {
      mockRequest.body = { commandeId: undefined };

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter les commandeId numériques", async () => {
      mockRequest.body = { commandeId: 123 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          status: 200,
          statusText: "OK",
          url: "http://localhost:3000/paiements",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });

    it("devrait accepter les commandeId en chaîne", async () => {
      mockRequest.body = { commandeId: "123" };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          status: 200,
          statusText: "OK",
          url: "http://localhost:3000/paiements",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });
  });

  describe("Validation des données métier", () => {
    it("devrait valider les transitions de statut logiques", async () => {
      // Une commande expédiée ne devrait pas pouvoir revenir en "en attente"
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "en attente" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [
            {
              commande_id: 1,
              ancien_statut: "expédiée",
              article_id: 1,
              taille_id: 1,
              quantite_commandee: 1,
              stock_actuel: 10,
            },
          ]);
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      // Le système devrait permettre cette transition (pour corrections/annulations)
      // mais devrait gérer les stocks correctement
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait accepter l'annulation d'une commande quel que soit son statut", async () => {
      const statutsSource = ["en attente", "payée", "expédiée"];

      for (const ancienStatut of statutsSource) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut: "annulée" };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: ancienStatut,
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          },
        );

        await updateStatut(mockRequest as Request, mockResponse as Response);

        expect(statusMock).not.toHaveBeenCalledWith(400);
      }
    });

    it("devrait rejeter la transition d'une commande expédiée vers en attente", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "en_attente" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [
            {
              commande_id: 1,
              ancien_statut: "exp_di_e", // Statut expédiée
              article_id: 1,
              taille_id: 1,
              quantite_commandee: 1,
              stock_actuel: 10,
            },
          ]);
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      // Une commande expédiée ne peut pas revenir en "en_attente"
      // Le système devrait rejeter cette transition (sauf pour annulation)
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter la transition d'une commande annulée vers expédiée", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "exp_di_e" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [
            {
              commande_id: 1,
              ancien_statut: "annul_e", // Statut annulée
              article_id: 1,
              taille_id: 1,
              quantite_commandee: 1,
              stock_actuel: 10,
            },
          ]);
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      // Une commande annulée ne peut pas être expédiée
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter la transition d'une commande annulée vers payée", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "pay_e" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [
            {
              commande_id: 1,
              ancien_statut: "annul_e", // Statut annulée
              article_id: 1,
              taille_id: 1,
              quantite_commandee: 1,
              stock_actuel: 10,
            },
          ]);
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      // Une commande annulée ne peut pas être payée
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter uniquement les transitions logiques valides", async () => {
      // Transitions valides:
      // en_attente -> pay_e (paiement)
      // en_attente -> annul_e (annulation)
      // pay_e -> exp_di_e (expédition)
      // pay_e -> annul_e (annulation)
      // exp_di_e -> annul_e (annulation exceptionnelle)

      const transitionsValides = [
        { from: "en_attente", to: "pay_e", shouldPass: true },
        { from: "en_attente", to: "annul_e", shouldPass: true },
        { from: "pay_e", to: "exp_di_e", shouldPass: true },
        { from: "pay_e", to: "annul_e", shouldPass: true },
        { from: "exp_di_e", to: "annul_e", shouldPass: true },
      ];

      const transitionsInvalides = [
        { from: "exp_di_e", to: "en_attente", shouldPass: false },
        { from: "exp_di_e", to: "pay_e", shouldPass: false },
        { from: "annul_e", to: "en_attente", shouldPass: false },
        { from: "annul_e", to: "pay_e", shouldPass: false },
        { from: "annul_e", to: "exp_di_e", shouldPass: false },
      ];

      const toutesTransitions = [
        ...transitionsValides,
        ...transitionsInvalides,
      ];

      for (const transition of toutesTransitions) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut: transition.to };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: transition.from,
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          },
        );

        await updateStatut(mockRequest as Request, mockResponse as Response);

        if (transition.shouldPass) {
          // Transitions valides ne devraient pas retourner 400
          expect(statusMock).not.toHaveBeenCalledWith(400);
        } else {
          // Transitions invalides devraient retourner 400
          expect(statusMock).toHaveBeenCalledWith(400);
        }
      }
    });
  });

  describe("Validation des quantités", () => {
    it("devrait gérer les quantités négatives en les mettant à 0", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 100,
                stock_actuel: 5,
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            // Vérifier que le stock est bien à 0 et non négatif
            expect(params[0]).toBeGreaterThanOrEqual(0);
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer les stocks null", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: null,
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            // Devrait traiter null comme 0
            expect(params[0]).toBeGreaterThanOrEqual(0);
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Validation des limites", () => {
    it("devrait gérer un grand nombre de mises à jour en batch", async () => {
      const largeUpdates = Array.from({ length: 100 }, (_, i) => ({
        commandeId: i + 1,
        statut: "payée",
      }));

      mockRequest.body = { updates: largeUpdates };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 100,
        }),
      );
    });

    it("devrait gérer les IDs très grands", async () => {
      mockRequest.params = { id: "999999999999" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});
