/**
 * Tests de base pour le module Magasin
 * Tests des fonctionnalités principales (happy path)
 * Pattern avec injection de dépendance
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
  healthCheck,
  getDiagnostic,
} from "../core/handlers/index.js";

describe("Magasin Module - Tests de base", () => {
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

    // Mock du client Magasin
    mockMagasinClient = {
      obtenirArticlesParCategories: jest.fn(),
      obtenirLesCategories: jest.fn(),
      ajouterArticle: jest.fn(),
      modifierArticle: jest.fn(),
      supprimerArticle: jest.fn(),
      ajouterCommande: jest.fn(),
      obtenirLesCommandes: jest.fn(),
    };

    // Mock du client Paiements
    mockPaiementsClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("getArticles - GET /api/magasin/articles", () => {
    it("devrait retourner tous les articles par catégories", async () => {
      const mockArticles = [
        {
          categorie: "Vêtements",
          articles: [
            {
              id: 1,
              nom: "Kimono Blanc",
              prix: 45.99,
              stock: 10,
              categorie_id: 1,
              actif: true,
            },
            {
              id: 2,
              nom: "Kimono Noir",
              prix: 45.99,
              stock: 5,
              categorie_id: 1,
              actif: true,
            },
          ],
        },
        {
          categorie: "Équipements",
          articles: [
            {
              id: 3,
              nom: "Protège-tibias",
              prix: 15.99,
              stock: 20,
              categorie_id: 2,
              actif: true,
            },
          ],
        },
      ];

      (
        mockMagasinClient.obtenirArticlesParCategories as jest.Mock
      ).mockResolvedValue(mockArticles);

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(mockMagasinClient.obtenirArticlesParCategories).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockArticles);
    });

    it("devrait gérer les erreurs lors de la récupération des articles", async () => {
      const errorMessage = "Erreur de connexion à la base de données";
      (
        mockMagasinClient.obtenirArticlesParCategories as jest.Mock
      ).mockRejectedValue(new Error(errorMessage));

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur lors de la récupération des articles",
          error: errorMessage,
        }),
      );
    });
  });

  describe("getCategories - GET /api/magasin/articles/categories", () => {
    it("devrait retourner toutes les catégories", async () => {
      const mockCategories = [
        { id: 1, nom: "Vêtements", description: "Kimonos et vêtements" },
        { id: 2, nom: "Équipements", description: "Protections et matériel" },
        { id: 3, nom: "Accessoires", description: "Ceintures et badges" },
      ];

      (mockMagasinClient.obtenirLesCategories as jest.Mock).mockResolvedValue(
        mockCategories,
      );

      await getCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(mockMagasinClient.obtenirLesCategories).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCategories);
    });

    it("devrait gérer les erreurs lors de la récupération des catégories", async () => {
      (mockMagasinClient.obtenirLesCategories as jest.Mock).mockRejectedValue(
        new Error("Erreur DB"),
      );

      await getCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur lors de la récupération des catégories",
        }),
      );
    });
  });

  describe("createArticle - POST /api/magasin/articles/ajouter", () => {
    it("devrait créer un nouvel article avec succès", async () => {
      mockRequest.body = {
        nom: "Nouveau Kimono",
        description: "Kimono de qualité supérieure",
        prix: 59.99,
        stock: 15,
        categorie_id: 1,
        actif: true,
      };

      const mockResult = {
        isConfirm: true,
        message: "Article ajouté avec succès",
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(mockMagasinClient.ajouterArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: "Nouveau Kimono",
          prix: 59.99,
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Article ajouté avec succès",
        }),
      );
    });

    it("devrait retourner 400 si les données sont invalides", async () => {
      mockRequest.body = {
        nom: "Test",
        // prix manquant (requis)
        stock: 10,
        categorie_id: 1,
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

    it("devrait gérer l'échec de l'ajout d'article", async () => {
      mockRequest.body = {
        nom: "Test Article",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      const mockResult = {
        isConfirm: false,
        message: "Erreur lors de l'ajout",
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur lors de l'ajout",
        }),
      );
    });
  });

  describe("updateArticle - PUT /api/magasin/articles/:id", () => {
    it("devrait modifier un article existant", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        nom: "Kimono Modifié",
        prix: 49.99,
      };

      const mockResult = {
        isConfirm: true,
        message: "Article modifié avec succès",
      };

      (mockMagasinClient.modifierArticle as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await updateArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(mockMagasinClient.modifierArticle).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          nom: "Kimono Modifié",
          prix: 49.99,
        }),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Article modifié avec succès",
        }),
      );
    });

    it("devrait retourner 400 si l'ID est invalide", async () => {
      mockRequest.params = { id: "abc" };
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

    it("devrait gérer l'échec de la modification", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { nom: "Test" };

      const mockResult = {
        isConfirm: false,
        message: "Article non trouvé",
      };

      (mockMagasinClient.modifierArticle as jest.Mock).mockResolvedValue(
        mockResult,
      );

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
  });

  describe("deleteArticle - DELETE /api/magasin/articles/:id", () => {
    it("devrait supprimer un article", async () => {
      mockRequest.params = { id: "5" };

      const mockResult = {
        message: "Article supprimé avec succès",
      };

      (mockMagasinClient.supprimerArticle as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await deleteArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(mockMagasinClient.supprimerArticle).toHaveBeenCalledWith(5);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Article supprimé avec succès",
        }),
      );
    });

    it("devrait retourner 400 si l'ID est invalide", async () => {
      mockRequest.params = { id: "invalid" };

      await deleteArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur de validation des paramètres",
        }),
      );
    });
  });

  describe("createCommande - POST /api/magasin/commandes/ajouter", () => {
    it("devrait créer une nouvelle commande", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            nom: "Kimono Blanc",
            quantite: 1,
            taille: "M",
            prix: 45.99,
          },
        ],
        total: 45.99,
        statut: "en attente",
        date: new Date().toISOString(),
      };

      const mockResult = {
        isConfirm: true,
        id: 1,
        unique_id: "CMD-001-1234567890-ABCD1234",
        numero_commande: "CMD-000001",
        message: "Commande créée avec succès",
        isDuplicate: false,
      };

      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000000" },
      ]);

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Commande créée avec succès",
          commande: expect.objectContaining({
            unique_id: expect.stringContaining("CMD-"),
            numero_commande: expect.stringContaining("CMD-"),
          }),
          isDuplicate: false,
        }),
      );
    });

    it("devrait retourner 400 si les données sont invalides", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [], // Tableau vide (invalide)
        total: 0,
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

    it("devrait valider la structure des articles dans la commande", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 0, // Quantité invalide (doit être >= 1)
            taille: "M",
          },
        ],
        total: 10,
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
        }),
      );
    });
  });

  describe("getCommandes - GET /api/magasin/commandes", () => {
    it("devrait retourner toutes les commandes", async () => {
      const mockCommandes = [
        {
          id: 1,
          utilisateur_id: 1,
          unique_id: "CMD-001-1234567890-ABCD1234",
          numero_commande: "CMD-000001",
          total: 45.99,
          statut: "en attente",
          date: "2024-01-15",
        },
        {
          id: 2,
          utilisateur_id: 2,
          unique_id: "CMD-002-1234567891-EFGH5678",
          numero_commande: "CMD-000002",
          total: 89.99,
          statut: "validé",
          date: "2024-01-16",
        },
      ];

      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockResolvedValue(
        mockCommandes,
      );

      await getCommandes(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(mockMagasinClient.obtenirLesCommandes).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          commandes: mockCommandes,
        }),
      );
    });

    it("devrait gérer les erreurs", async () => {
      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockRejectedValue(
        new Error("Erreur DB"),
      );

      await getCommandes(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur lors de la récupération des commandes",
        }),
      );
    });
  });

  describe("verifyCommandeUnicity - GET /api/magasin/commande/:uniqueId/verify", () => {
    it("devrait confirmer qu'une commande existe", async () => {
      mockRequest.params = { uniqueId: "CMD-001-1234567890-ABCD1234" };

      const mockCommande = {
        id: 1,
        unique_id: "CMD-001-1234567890-ABCD1234",
        numero_commande: "CMD-000001",
        statut: "en attente",
        total: 45.99,
        utilisateur_id: 1,
        date: "2024-01-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockCommande,
      ]);

      await verifyCommandeUnicity(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(mockPaiementsClient.queryAsync).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exists: true,
          commande: expect.objectContaining({
            unique_id: "CMD-001-1234567890-ABCD1234",
          }),
        }),
      );
    });

    it("devrait retourner 404 si la commande n'existe pas", async () => {
      mockRequest.params = { uniqueId: "CMD-999-9999999999-ABCD9999" };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      await verifyCommandeUnicity(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exists: false,
          message: "Commande non trouvée",
        }),
      );
    });

    it("devrait valider le format de l'unique_id", async () => {
      mockRequest.params = { uniqueId: "INVALID-FORMAT" };

      await verifyCommandeUnicity(
        mockRequest as Request,
        mockResponse as Response,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Erreur de validation des paramètres",
        }),
      );
    });
  });

  describe("healthCheck - GET /api/magasin/health", () => {
    it("devrait retourner le statut de santé du module", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          module: "magasin",
          version: "1.0.0",
          features: expect.objectContaining({
            articles: true,
            categories: true,
            commandes: true,
            paiements: true,
            tailles: true,
            statistiques: true,
          }),
        }),
      );
    });
  });

  describe("getStatistiquesMagasin - GET /api/magasin/statistiques", () => {
    it("devrait retourner les statistiques du magasin", async () => {
      mockRequest.query = {};

      const mockStats = {
        total_commandes: 150,
        commandes_en_attente: 25,
        commandes_validees: 80,
        commandes_livrees: 40,
        commandes_annulees: 5,
        chiffre_affaires_total: 8450.75,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockStats,
      ]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total_commandes: expect.any(Number),
            chiffre_affaires_total: expect.any(Number),
          }),
        }),
      );
    });

    it("devrait accepter des paramètres de date", async () => {
      mockRequest.query = {
        dateDebut: "2024-01-01",
        dateFin: "2024-01-31",
      };

      const mockStats = {
        total_commandes: 50,
        commandes_en_attente: 10,
        commandes_validees: 30,
        commandes_livrees: 10,
        commandes_annulees: 0,
        chiffre_affaires_total: 2850.5,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockStats,
      ]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          periode: expect.objectContaining({
            debut: "2024-01-01",
            fin: "2024-01-31",
          }),
        }),
      );
    });
  });
});
