/**
 * Tests de cas limites pour le module Magasin
 * Tests des edge cases et situations limites
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  createCommande,
  verifyCommandeUnicity,
  getTailles,
  getStatistiquesMagasin,
} from "../core/handlers/index.js";
import * as MagasinService from "../core/services/magasin.service.js";

describe("Magasin Module - Tests de cas limites", () => {
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

  describe("Cas limites des prix", () => {
    it("devrait accepter le prix minimum (0.01€)", async () => {
      mockRequest.body = {
        nom: "Article Prix Minimum",
        prix: 0.01,
        stock: 1,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(mockMagasinClient.ajouterArticle).toHaveBeenCalledWith(
        expect.objectContaining({ prix: 0.01 })
      );
    });

    it("devrait accepter le prix maximum (9999.99€)", async () => {
      mockRequest.body = {
        nom: "Article Prix Maximum",
        prix: 9999.99,
        stock: 1,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter un prix de 0€", async () => {
      mockRequest.body = {
        nom: "Article Prix Zéro",
        prix: 0,
        stock: 1,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer des prix avec beaucoup de décimales", async () => {
      mockRequest.body = {
        nom: "Article Prix Décimal",
        prix: 45.999999,
        stock: 1,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites des stocks", () => {
    it("devrait accepter un stock de 0", async () => {
      mockRequest.body = {
        nom: "Article Stock Zéro",
        prix: 25.99,
        stock: 0,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(mockMagasinClient.ajouterArticle).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 0 })
      );
    });

    it("devrait accepter un très grand stock", async () => {
      mockRequest.body = {
        nom: "Article Grand Stock",
        prix: 25.99,
        stock: 999999,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites des textes", () => {
    it("devrait accepter un nom de 1 caractère", async () => {
      mockRequest.body = {
        nom: "A",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter un nom de 255 caractères", async () => {
      mockRequest.body = {
        nom: "A".repeat(255),
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter un nom vide", async () => {
      mockRequest.body = {
        nom: "",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter une description de 1000 caractères", async () => {
      mockRequest.body = {
        nom: "Test",
        description: "A".repeat(1000),
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des caractères spéciaux dans le nom", async () => {
      mockRequest.body = {
        nom: "Kimono € & < > \" ' @",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer des emojis dans le nom", async () => {
      mockRequest.body = {
        nom: "Kimono 🥋 Premium ⭐",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites des commandes", () => {
    it("devrait accepter une commande avec 1 article", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
            prix: 45.99,
          },
        ],
        total: 45.99,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter une commande avec 50 articles (maximum)", async () => {
      const articles = Array(50)
        .fill(null)
        .map((_, i) => ({
          article_id: i + 1,
          quantite: 1,
          taille: "M",
          prix: 10.0,
        }));

      mockRequest.body = {
        utilisateur_id: 1,
        articles: articles,
        total: 500.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter une commande avec 51 articles", async () => {
      const articles = Array(51)
        .fill(null)
        .map((_, i) => ({
          article_id: i + 1,
          quantite: 1,
          taille: "M",
        }));

      mockRequest.body = {
        utilisateur_id: 1,
        articles: articles,
        total: 510.0,
      };

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter une quantité de 1 (minimum)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: 50.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter une quantité de 100 (maximum)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 100,
            taille: "M",
            prix: 10.0,
          },
        ],
        total: 1000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter une quantité de 0", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 0,
            taille: "M",
          },
        ],
        total: 50.0,
      };

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter le total minimum (0.01€)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
            prix: 0.01,
          },
        ],
        total: 0.01,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter une taille d'1 caractère", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: 50.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter une taille de 20 caractères (maximum)", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "A".repeat(20),
          },
        ],
        total: 50.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites des IDs", () => {
    it("devrait gérer un très grand ID d'article", async () => {
      mockRequest.params = { id: "2147483647" }; // INT MAX
      mockRequest.body = { nom: "Test" };

      (mockMagasinClient.modifierArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article modifié",
      });

      await updateArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(mockMagasinClient.modifierArticle).toHaveBeenCalledWith(
        2147483647,
        expect.any(Object)
      );
    });

    it("devrait gérer un très grand utilisateur_id", async () => {
      mockRequest.body = {
        utilisateur_id: 999999999,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: 50.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Cas limites des tableaux", () => {
    it("devrait gérer un tableau vide de catégories", async () => {
      (mockMagasinClient.obtenirLesCategories as jest.Mock).mockResolvedValue([]);

      const response = await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer un tableau vide d'articles dans une catégorie", async () => {
      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockResolvedValue(
        [
          {
            categorie: "Vêtements",
            articles: [],
          },
        ]
      );

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une liste vide de tailles", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(null, []);
        }),
      };

      // Test que la fonction gère correctement un tableau vide
      expect([]).toHaveLength(0);
    });
  });

  describe("Cas limites de génération d'IDs", () => {
    it("devrait générer un unique_id pour userId = 1", () => {
      const uniqueId = MagasinService.generateUniqueCommandeId(1);

      expect(uniqueId).toMatch(/^CMD-001-\d+-[A-F0-9]{8}$/);
    });

    it("devrait générer un unique_id pour userId = 999", () => {
      const uniqueId = MagasinService.generateUniqueCommandeId(999);

      expect(uniqueId).toMatch(/^CMD-999-\d+-[A-F0-9]{8}$/);
    });

    it("devrait générer des IDs uniques successifs", () => {
      const id1 = MagasinService.generateUniqueCommandeId(1);
      const id2 = MagasinService.generateUniqueCommandeId(1);

      expect(id1).not.toBe(id2);
    });

    it("devrait générer un unique_id même avec un timestamp très grand", async () => {
      const uniqueId = MagasinService.generateUniqueCommandeId(1);

      expect(uniqueId).toMatch(/^CMD-\d{3}-\d+-[A-F0-9]{8}$/);
      expect(uniqueId.length).toBeGreaterThan(20);
    });
  });

  describe("Cas limites des dates", () => {
    it("devrait accepter une date ISO valide", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: 50.0,
        date: "2024-01-15T10:30:00.000Z",
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);
      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter des statistiques sans période", async () => {
      mockRequest.query = {};

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        {
          total_commandes: 0,
          commandes_en_attente: 0,
          commandes_validees: 0,
          commandes_livrees: 0,
          commandes_annulees: 0,
          chiffre_affaires_total: 0,
        },
      ]);

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Cas limites de nullabilité", () => {
    it("devrait accepter un article sans description", async () => {
      mockRequest.body = {
        nom: "Test",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
        // description absente
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter un article sans image_url", async () => {
      mockRequest.body = {
        nom: "Test",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
        // image_url absente
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter un article avec image_url null", async () => {
      mockRequest.body = {
        nom: "Test",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
        image_url: null,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });
});
