/**
 * Tests avancés pour le health handler du module Échéances
 * Ces tests ciblent les lignes non couvertes pour améliorer la couverture globale
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  healthCheck,
  getDiagnostic,
  getTableConstraints,
} from "../core/handlers/health.handler.js";

describe("Health Handler - Tests avancés de couverture", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockPaiementsClient: Partial<Paiements>;

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
      queryAsync: jest.fn(),
    };
  });

  describe("healthCheck - Tests de couverture des branches", () => {
    it("devrait retourner status 'healthy' avec DB connectée et table existante", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ test: 1 }]) // Test connexion
        .mockResolvedValueOnce([{ Tables_in_test_db: "echeances_paiements" }]); // Table existe

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "healthy",
          module: "echeances",
          version: "2.0.0",
          architecture: "handlers/services/validators",
          database: expect.objectContaining({
            connected: true,
            table_echeances_paiements: true,
          }),
        }),
      );
    });

    it("devrait retourner status 'degraded' si la DB est connectée mais la table n'existe pas", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ test: 1 }]) // DB connectée
        .mockResolvedValueOnce([]); // Table n'existe pas

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: "degraded",
          database: expect.objectContaining({
            connected: true,
            table_echeances_paiements: false,
          }),
        }),
      );
    });

    it("devrait gérer l'erreur lors de la vérification de la table", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ test: 1 }]) // DB connectée
        .mockRejectedValueOnce(new Error("Table check failed")); // Erreur vérification table

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: "degraded",
          database: expect.objectContaining({
            connected: true,
            table_echeances_paiements: false,
          }),
        }),
      );
    });

    it("devrait retourner status 'degraded' si la DB n'est pas connectée", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ test: 0 }]) // Test échoue
        .mockResolvedValueOnce([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: "degraded",
        }),
      );
    });

    it("devrait retourner 503 avec status 'unhealthy' en cas d'erreur critique", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Database connection timeout"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: "unhealthy",
          module: "echeances",
          error: "Database connection timeout",
        }),
      );
    });

    it("devrait gérer une erreur non-Error dans le catch", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        "String error",
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: "unhealthy",
          error: "Erreur inconnue",
        }),
      );
    });
  });

  describe("getDiagnostic - Tests complets de toutes les branches", () => {
    it("devrait retourner un diagnostic complet sans problème détecté", async () => {
      const mockTableStructure = [
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
        {
          Field: "utilisateur_id",
          Type: "int(11)",
          Null: "NO",
          Key: "MUL",
          Default: null,
          Extra: "",
        },
        {
          Field: "montant",
          Type: "decimal(10,2)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
      ];

      const mockConstraints = [
        {
          CONSTRAINT_NAME: "PRIMARY",
          CONSTRAINT_TYPE: "PRIMARY KEY",
          TABLE_NAME: "echeances_paiements",
          COLUMN_NAME: "id",
        },
        {
          CONSTRAINT_NAME: "fk_utilisateur",
          CONSTRAINT_TYPE: "FOREIGN KEY",
          TABLE_NAME: "echeances_paiements",
          COLUMN_NAME: "utilisateur_id",
        },
      ];

      const mockIndexes = [
        {
          Key_name: "PRIMARY",
          Column_name: "id",
          Non_unique: 0,
        },
        {
          Key_name: "idx_utilisateur",
          Column_name: "utilisateur_id",
          Non_unique: 1,
        },
      ];

      const mockStats = [
        { statut: "en attente", count: 5, total_montant: "125.50" },
        { statut: "payé", count: 10, total_montant: "500.00" },
      ];

      const mockTotal = [{ total: 15 }];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure) // DESCRIBE
        .mockResolvedValueOnce(mockConstraints) // Contraintes
        .mockResolvedValueOnce(mockIndexes) // Index
        .mockResolvedValueOnce(mockStats) // Stats par statut
        .mockResolvedValueOnce(mockTotal); // Total

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.objectContaining({
            table: "echeances_paiements",
            structure_reelle: expect.objectContaining({
              colonnes: expect.arrayContaining([
                expect.objectContaining({
                  Field: "id",
                  Type: "int(11)",
                }),
              ]),
              contraintes: expect.arrayContaining([
                expect.objectContaining({
                  name: "PRIMARY",
                  type: "PRIMARY KEY",
                }),
              ]),
              indexes: expect.arrayContaining([
                expect.objectContaining({
                  name: "PRIMARY",
                  column: "id",
                  unique: true,
                }),
              ]),
            }),
            statistiques: expect.objectContaining({
              total_echeances: 15,
              par_statut: expect.arrayContaining([
                expect.objectContaining({
                  statut: "en attente",
                  count: 5,
                  total_montant: 125.5,
                }),
              ]),
            }),
            probleme_detecte: false,
            contrainte_problematique: null,
          }),
          message: "✅ Structure de table normale",
        }),
      );
    });

    it("devrait détecter une contrainte problématique utilisateur_periode_abonnement", async () => {
      const mockTableStructure = [
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
      ];

      const mockConstraintsProblematiques = [
        {
          CONSTRAINT_NAME: "PRIMARY",
          CONSTRAINT_TYPE: "PRIMARY KEY",
          TABLE_NAME: "echeances_paiements",
          COLUMN_NAME: "id",
        },
        {
          CONSTRAINT_NAME: "uk_utilisateur_periode_abonnement",
          CONSTRAINT_TYPE: "UNIQUE",
          TABLE_NAME: "echeances_paiements",
          COLUMN_NAME: "utilisateur_id",
        },
      ];

      const mockIndexes = [
        { Key_name: "PRIMARY", Column_name: "id", Non_unique: 0 },
      ];

      const mockStats = [
        { statut: "en attente", count: 3, total_montant: "75.00" },
      ];

      const mockTotal = [{ total: 3 }];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure)
        .mockResolvedValueOnce(mockConstraintsProblematiques)
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.objectContaining({
            probleme_detecte: true,
            contrainte_problematique: expect.objectContaining({
              name: "uk_utilisateur_periode_abonnement",
              type: "UNIQUE",
              column: "utilisateur_id",
            }),
            solution:
              "Supprimer la contrainte uk_utilisateur_periode_abonnement de cette table car elle appartient à la table paiements",
            commande_fix:
              "ALTER TABLE echeances_paiements DROP INDEX uk_utilisateur_periode_abonnement;",
          }),
          message:
            "⚠️ PROBLÈME DÉTECTÉ: Contrainte inappropriée sur la table echeances_paiements",
        }),
      );
    });

    it("devrait gérer les statistiques avec total_montant null", async () => {
      const mockTableStructure = [{ Field: "id", Type: "int(11)" }];
      const mockConstraints = [];
      const mockIndexes = [];
      const mockStats = [
        { statut: "en attente", count: 2, total_montant: null },
      ];
      const mockTotal = [{ total: 2 }];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure)
        .mockResolvedValueOnce(mockConstraints)
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.objectContaining({
            statistiques: expect.objectContaining({
              par_statut: expect.arrayContaining([
                expect.objectContaining({
                  statut: "en attente",
                  count: 2,
                  total_montant: 0,
                }),
              ]),
            }),
          }),
        }),
      );
    });

    it("devrait gérer le cas où totalResult est vide", async () => {
      const mockTableStructure = [{ Field: "id", Type: "int(11)" }];
      const mockConstraints = [];
      const mockIndexes = [];
      const mockStats = [];
      const mockTotal = []; // Vide

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure)
        .mockResolvedValueOnce(mockConstraints)
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.objectContaining({
            statistiques: expect.objectContaining({
              total_echeances: 0,
            }),
          }),
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur lors du diagnostic", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Query failed"),
      );

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur lors du diagnostic",
          error: "Query failed",
        }),
      );
    });

    it("devrait gérer une erreur non-Error dans getDiagnostic", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        "Unknown error type",
      );

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur lors du diagnostic",
          error: "Erreur inconnue",
        }),
      );
    });

    it("devrait tester toutes les colonnes de la structure", async () => {
      const mockCompleteStructure = [
        {
          Field: "id",
          Type: "int(11)",
          Null: "NO",
          Key: "PRI",
          Default: null,
          Extra: "auto_increment",
        },
        {
          Field: "utilisateur_id",
          Type: "int(11)",
          Null: "NO",
          Key: "MUL",
          Default: null,
          Extra: "",
        },
        {
          Field: "abonnement_id",
          Type: "int(11)",
          Null: "YES",
          Key: "MUL",
          Default: null,
          Extra: "",
        },
        {
          Field: "date_echeance",
          Type: "date",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "montant",
          Type: "decimal(10,2)",
          Null: "NO",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "statut",
          Type: "enum('en attente','payé','échu')",
          Null: "NO",
          Key: "",
          Default: "en attente",
          Extra: "",
        },
        {
          Field: "date_creation",
          Type: "timestamp",
          Null: "NO",
          Key: "",
          Default: "CURRENT_TIMESTAMP",
          Extra: "DEFAULT_GENERATED",
        },
        {
          Field: "date_paiement",
          Type: "date",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "stripe_payment_intent_id",
          Type: "varchar(255)",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
        {
          Field: "description",
          Type: "varchar(255)",
          Null: "YES",
          Key: "",
          Default: null,
          Extra: "",
        },
      ];

      const mockConstraints = [];
      const mockIndexes = [];
      const mockStats = [];
      const mockTotal = [{ total: 0 }];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockCompleteStructure)
        .mockResolvedValueOnce(mockConstraints)
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.objectContaining({
            structure_reelle: expect.objectContaining({
              colonnes: expect.arrayContaining([
                expect.objectContaining({ Field: "id" }),
                expect.objectContaining({ Field: "utilisateur_id" }),
                expect.objectContaining({ Field: "abonnement_id" }),
                expect.objectContaining({ Field: "date_echeance" }),
                expect.objectContaining({ Field: "montant" }),
                expect.objectContaining({ Field: "statut" }),
                expect.objectContaining({ Field: "date_creation" }),
                expect.objectContaining({ Field: "date_paiement" }),
                expect.objectContaining({
                  Field: "stripe_payment_intent_id",
                }),
                expect.objectContaining({ Field: "description" }),
              ]),
            }),
          }),
        }),
      );
    });
  });

  describe("getTableConstraints - Alias de getDiagnostic", () => {
    it("devrait appeler getDiagnostic et retourner le même résultat", async () => {
      const mockTableStructure = [{ Field: "id", Type: "int(11)" }];
      const mockConstraints = [];
      const mockIndexes = [];
      const mockStats = [];
      const mockTotal = [{ total: 0 }];

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(mockTableStructure)
        .mockResolvedValueOnce(mockConstraints)
        .mockResolvedValueOnce(mockIndexes)
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockTotal);

      await getTableConstraints(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          diagnostic: expect.any(Object),
        }),
      );
    });

    it("devrait gérer les erreurs comme getDiagnostic", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Connection error"),
      );

      await getTableConstraints(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Connection error",
        }),
      );
    });
  });
});
