/**
 * Tests de gestion d'erreurs pour le module Magasin
 * Tests des cas d'erreur et exceptions
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories,
  createCommande,
  getCommandes,
  verifyCommandeUnicity,
  getTailles,
  getPaymentIntent,
  getStatistiquesMagasin,
} from "../core/handlers/index.js";

describe("Magasin Module - Tests de gestion d'erreurs", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMagasinClient: Partial<Magasin>;
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

    mockMagasinClient = {
      obtenirArticlesParCategories: jest.fn(),
      obtenirLesCategories: jest.fn(),
      ajouterArticle: jest.fn(),
      modifierArticle: jest.fn(),
      supprimerArticle: jest.fn(),
      ajouterCommande: jest.fn(),
      obtenirLesCommandes: jest.fn(),
    };

    mockPaiementsClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion DB lors de la récupération des articles", async () => {
      (
        mockMagasinClient.obtenirArticlesParCategories as jest.Mock
      ).mockRejectedValue(new Error("ECONNREFUSED: Connection refused"));

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Erreur"),
          error: "ECONNREFUSED: Connection refused",
        }),
      );
    });

    it("devrait gérer une erreur de timeout DB", async () => {
      (mockMagasinClient.ajouterArticle as jest.Mock).mockRejectedValue(
        new Error("Query timeout exceeded"),
      );

      mockRequest.body = {
        nom: "Test Article",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Erreur"),
        }),
      );
    });

    it("devrait gérer une erreur de contrainte de clé étrangère", async () => {
      (mockMagasinClient.ajouterArticle as jest.Mock).mockRejectedValue(
        new Error("ER_NO_REFERENCED_ROW_2: Cannot add or update a child row"),
      );

      mockRequest.body = {
        nom: "Test",
        prix: 25.99,
        stock: 5,
        categorie_id: 9999, // ID de catégorie inexistant
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur de table inexistante", async () => {
      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockRejectedValue(
        new Error("ER_NO_SUCH_TABLE: Table doesn't exist"),
      );

      await getCommandes(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Erreurs de validation", () => {
    it("devrait gérer des données invalides avec messages clairs pour article", async () => {
      mockRequest.body = {
        nom: "", // Nom vide (invalide)
        prix: -10, // Prix négatif (invalide)
        stock: "abc", // Stock non numérique (invalide)
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur de validation des données",
          errors: expect.any(Array),
        }),
      );
    });

    it("devrait gérer des données invalides pour une commande", async () => {
      mockRequest.body = {
        utilisateur_id: "invalid", // Devrait être un nombre
        articles: [], // Tableau vide (invalide)
        total: -50, // Total négatif (invalide)
      };

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Données de commande invalides",
          errors: expect.any(Array),
        }),
      );
    });

    it("devrait gérer un ID d'article invalide (non numérique)", async () => {
      mockRequest.params = { id: "abc123" };
      mockRequest.body = { nom: "Test" };

      await updateArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "ID invalide",
        }),
      );
    });

    it("devrait gérer un unique_id de commande au mauvais format", async () => {
      mockRequest.params = { uniqueId: "INVALID-FORMAT-123" };

      await verifyCommandeUnicity(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("validation"),
        }),
      );
    });
  });

  describe("Erreurs métier", () => {
    it("devrait gérer l'échec d'ajout d'article (isConfirm: false)", async () => {
      mockRequest.body = {
        nom: "Test Article",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Erreur lors de l'ajout de l'article",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur lors de l'ajout de l'article",
        }),
      );
    });

    it("devrait gérer l'échec de modification d'article", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { nom: "Nouveau nom" };

      (mockMagasinClient.modifierArticle as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Article non trouvé",
      });

      await updateArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Article non trouvé",
        }),
      );
    });

    it("devrait gérer la suppression d'un article inexistant", async () => {
      mockRequest.params = { id: "99999" };

      (mockMagasinClient.supprimerArticle as jest.Mock).mockRejectedValue(
        new Error("Article non trouvé"),
      );

      await deleteArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe("Erreurs réseau et externes", () => {
    it("devrait gérer une erreur Stripe lors de la récupération du PaymentIntent", async () => {
      mockRequest.params = { commandeId: "1" };
      mockRequest.query = { userId: "1" };

      // Mock commande existante
      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            unique_id: "CMD-001-123-ABCD1234",
            numero_commande: "CMD-000001",
            utilisateur_id: 1,
          },
        ])
        .mockResolvedValueOnce([
          {
            stripe_payment_intent_id: "pi_test123",
            statut: "en attente",
            montant: 50.0,
          },
        ]);

      // Mock erreur Stripe (sera gérée dans le service)
      await getPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      // Le test vérifie que la fonction ne crash pas
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer l'absence de clé API Stripe", async () => {
      const originalEnv = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      mockRequest.params = { commandeId: "1" };
      mockRequest.query = { userId: "1" };

      (mockPaiementsClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            unique_id: "CMD-001-123-ABCD1234",
            utilisateur_id: 1,
          },
        ])
        .mockResolvedValueOnce([
          {
            stripe_payment_intent_id: "pi_test123",
          },
        ]);

      await getPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);

      // Restaurer la variable d'environnement
      if (originalEnv) {
        process.env.STRIPE_SECRET_KEY = originalEnv;
      }
    });
  });

  describe("Erreurs de permissions et sécurité", () => {
    it("devrait rejeter une commande n'appartenant pas à l'utilisateur", async () => {
      mockRequest.params = { commandeId: "1" };
      mockRequest.query = { userId: "1" };

      // Commande n'appartenant pas à l'utilisateur
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      await getPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("non trouvée"),
        }),
      );
    });

    it("devrait gérer une tentative d'accès sans userId", async () => {
      mockRequest.params = { commandeId: "1" };
      mockRequest.query = {}; // userId manquant

      await getPaymentIntent(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Erreurs inattendues", () => {
    it("devrait gérer une exception non prévue gracieusement", async () => {
      (
        mockMagasinClient.obtenirArticlesParCategories as jest.Mock
      ).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer une erreur sans message", async () => {
      (mockMagasinClient.ajouterArticle as jest.Mock).mockRejectedValue(
        new Error(),
      );

      mockRequest.body = {
        nom: "Test",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur de type inconnu", async () => {
      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockRejectedValue(
        "String error instead of Error object",
      );

      await getCommandes(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Erreurs de données corrompues", () => {
    it("devrait gérer une réponse DB avec structure inattendue", async () => {
      (
        mockMagasinClient.obtenirArticlesParCategories as jest.Mock
      ).mockResolvedValue(
        null, // Au lieu d'un tableau
      );

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Devrait gérer sans crash
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer des données JSON malformées", async () => {
      mockRequest.body = undefined;

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Gestion des erreurs de statistiques", () => {
    it("devrait gérer une erreur lors du calcul des statistiques", async () => {
      mockRequest.query = {};

      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Erreur calcul statistiques"),
      );

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("statistiques"),
        }),
      );
    });

    it("devrait gérer des paramètres de date invalides pour les statistiques", async () => {
      mockRequest.query = {
        dateDebut: "invalid-date",
        dateFin: "2024-12-31",
      };

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });
});
