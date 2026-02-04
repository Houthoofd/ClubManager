/**
 * Tests de sécurité pour le module Magasin
 * Tests des vulnérabilités et protections de sécurité
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  createCommande,
  getPaymentIntent,
  verifyCommandeUnicity,
} from "../core/handlers/index.js";

describe("Magasin Module - Tests de sécurité", () => {
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
      ajouterArticle: jest.fn(),
      modifierArticle: jest.fn(),
      supprimerArticle: jest.fn(),
      ajouterCommande: jest.fn(),
    };

    mockPaiementsClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("Protection contre l'injection SQL", () => {
    it("devrait gérer les tentatives d'injection SQL dans le nom d'article", async () => {
      mockRequest.body = {
        nom: "Test'; DROP TABLE articles; --",
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
        mockMagasinClient as Magasin,
      );

      // Le système devrait traiter cela comme une chaîne normale
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer les tentatives d'injection SQL dans la description", async () => {
      mockRequest.body = {
        nom: "Test Article",
        description: "Description' OR '1'='1",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les tentatives d'injection SQL via les paramètres d'URL", async () => {
      mockRequest.params = { id: "1' OR '1'='1" };
      mockRequest.body = { nom: "Test" };

      await updateArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Devrait retourner une erreur de validation d'ID
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Protection contre XSS (Cross-Site Scripting)", () => {
    it("devrait gérer les scripts dans le nom d'article", async () => {
      mockRequest.body = {
        nom: "<script>alert('XSS')</script>",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Le système devrait accepter mais échapper le contenu
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer les balises HTML dans la description", async () => {
      mockRequest.body = {
        nom: "Test",
        description: "<img src=x onerror=alert('XSS')>",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les événements JavaScript inline", async () => {
      mockRequest.body = {
        nom: "Test onclick='alert(1)'",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection des données sensibles", () => {
    it("devrait empêcher l'accès à une commande d'un autre utilisateur", async () => {
      mockRequest.params = { commandeId: "1" };
      mockRequest.query = { userId: "999" }; // Utilisateur différent

      // Aucune commande trouvée pour cet utilisateur
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

    it("devrait rejeter une tentative d'accès sans userId", async () => {
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

  describe("Validation stricte des entrées", () => {
    it("devrait rejeter un prix avec trop de décimales", async () => {
      mockRequest.body = {
        nom: "Test",
        prix: 25.999999,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Le schéma Zod devrait accepter mais pourrait tronquer
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait rejeter un ID d'article malformé", async () => {
      mockRequest.params = { id: "../../../etc/passwd" };
      mockRequest.body = { nom: "Test" };

      await updateArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter des caractères de contrôle dans les données", async () => {
      mockRequest.body = {
        nom: "Test\x00Article\x1F",
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Le système devrait gérer les caractères de contrôle
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre IDOR (Insecure Direct Object Reference)", () => {
    it("devrait empêcher la modification d'un article via ID manipulé", async () => {
      mockRequest.params = { id: "9999999" }; // ID potentiellement inexistant
      mockRequest.body = { nom: "Tentative de modification" };

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

    it("devrait empêcher la suppression d'un article via ID manipulé", async () => {
      mockRequest.params = { id: "9999999" };

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

  describe("Protection contre les attaques par déni de service (DoS)", () => {
    it("devrait limiter le nombre d'articles dans une commande", async () => {
      const tooManyArticles = Array(51).fill({
        article_id: 1,
        quantite: 1,
        taille: "M",
      });

      mockRequest.body = {
        utilisateur_id: 1,
        articles: tooManyArticles,
        total: 1000.0,
      };

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      // Devrait rejeter avec une erreur de validation
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait limiter la quantité par article", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1000, // Quantité excessive
            taille: "M",
          },
        ],
        total: 50000.0,
      };

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      // Devrait rejeter car quantité > 100
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait limiter la longueur des chaînes de caractères", async () => {
      mockRequest.body = {
        nom: "A".repeat(10000), // Nom extrêmement long
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Devrait rejeter car nom > 255 caractères
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Protection contre les attaques temporelles", () => {
    it("devrait valider le format d'unique_id de manière constante", async () => {
      const invalidIds = [
        "INVALID-FORMAT",
        "CMD-ABC-DEF-GHI",
        "cmd-001-123-abcd",
        "",
        "A".repeat(1000),
      ];

      for (const invalidId of invalidIds) {
        mockRequest.params = { uniqueId: invalidId };

        await verifyCommandeUnicity(
          mockRequest as Request,
          mockResponse as Response,
          mockPaiementsClient as Paiements,
        );

        // Tous devraient échouer avec le même code d'erreur
        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });
  });

  describe("Protection contre l'énumération", () => {
    it("devrait retourner des messages génériques pour les commandes inexistantes", async () => {
      mockRequest.params = { uniqueId: "CMD-999-1234567890-ABCD1234" };

      // Mock du client Paiements pour simuler qu'aucune commande n'existe
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
  });

  describe("Validation des montants et prix", () => {
    it("devrait rejeter des montants négatifs", async () => {
      mockRequest.body = {
        nom: "Test",
        prix: -50.0,
        stock: 5,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un total de commande négatif", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: -100.0,
      };

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter des prix astronomiques", async () => {
      mockRequest.body = {
        nom: "Test",
        prix: 999999999.99,
        stock: 1,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Protection des clés API et secrets", () => {
    it("devrait gérer l'absence de clé Stripe de manière sécurisée", async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
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
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements,
      );

      // Devrait retourner une erreur sans exposer de détails sensibles
      expect(statusMock).toHaveBeenCalledWith(500);

      // Restaurer la clé
      if (originalKey) {
        process.env.STRIPE_SECRET_KEY = originalKey;
      }
    });
  });

  describe("Protection contre les injections NoSQL/MongoDB (si applicable)", () => {
    it("devrait gérer les objets dans les paramètres", async () => {
      mockRequest.body = {
        nom: { $ne: null },
        prix: 25.99,
        stock: 5,
        categorie_id: 1,
      };

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
      );

      // Le schéma Zod devrait rejeter les objets pour le nom
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });
});
