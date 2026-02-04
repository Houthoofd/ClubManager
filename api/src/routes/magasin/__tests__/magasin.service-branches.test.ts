/**
 * Tests de branches de service pour le module Magasin
 * Tests de couverture des branches logiques du service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import * as MagasinService from "../core/services/magasin.service.js";

describe("Magasin Module - Tests de branches de service", () => {
  let mockMagasinClient: Partial<Magasin>;
  let mockPaiementsClient: Partial<Paiements>;

  beforeEach(() => {
    jest.clearAllMocks();

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("obtenirArticlesParCategories", () => {
    it("devrait retourner les articles avec succès", async () => {
      const mockArticles = [
        {
          categorie: "Vêtements",
          articles: [{ id: 1, nom: "Kimono" }],
        },
      ];

      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockResolvedValue(
        mockArticles
      );

      const result = await MagasinService.obtenirArticlesParCategories(
        mockMagasinClient as Magasin
      );

      expect(result).toEqual(mockArticles);
      expect(mockMagasinClient.obtenirArticlesParCategories).toHaveBeenCalled();
    });

    it("devrait lancer une erreur en cas d'échec", async () => {
      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockRejectedValue(
        new Error("Erreur DB")
      );

      await expect(
        MagasinService.obtenirArticlesParCategories(mockMagasinClient as Magasin)
      ).rejects.toThrow("Impossible de récupérer les articles");
    });
  });

  describe("obtenirLesCategories", () => {
    it("devrait retourner les catégories avec succès", async () => {
      const mockCategories = [
        { id: 1, nom: "Vêtements" },
        { id: 2, nom: "Équipements" },
      ];

      (mockMagasinClient.obtenirLesCategories as jest.Mock).mockResolvedValue(
        mockCategories
      );

      const result = await MagasinService.obtenirLesCategories(
        mockMagasinClient as Magasin
      );

      expect(result).toEqual(mockCategories);
    });

    it("devrait gérer les erreurs", async () => {
      (mockMagasinClient.obtenirLesCategories as jest.Mock).mockRejectedValue(
        new Error("Erreur")
      );

      await expect(
        MagasinService.obtenirLesCategories(mockMagasinClient as Magasin)
      ).rejects.toThrow("Impossible de récupérer les catégories");
    });
  });

  describe("ajouterArticle", () => {
    it("devrait ajouter un article avec succès (isConfirm: true)", async () => {
      const articleData = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      const result = await MagasinService.ajouterArticle(
        articleData,
        mockMagasinClient as Magasin
      );

      expect(result.isConfirm).toBe(true);
    });

    it("devrait lancer une erreur si isConfirm est false", async () => {
      const articleData = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Erreur ajout",
      });

      await expect(
        MagasinService.ajouterArticle(articleData, mockMagasinClient as Magasin)
      ).rejects.toThrow("Erreur ajout");
    });

    it("devrait propager les erreurs", async () => {
      const articleData = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      await expect(
        MagasinService.ajouterArticle(articleData, mockMagasinClient as Magasin)
      ).rejects.toThrow("DB Error");
    });
  });

  describe("modifierArticle", () => {
    it("devrait modifier un article avec succès", async () => {
      const articleData = { nom: "Modifié" };

      (mockMagasinClient.modifierArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article modifié",
      });

      const result = await MagasinService.modifierArticle(
        1,
        articleData,
        mockMagasinClient as Magasin
      );

      expect(result.isConfirm).toBe(true);
    });

    it("devrait lancer une erreur si la modification échoue", async () => {
      (mockMagasinClient.modifierArticle as jest.Mock).mockResolvedValue({
        isConfirm: false,
        message: "Article non trouvé",
      });

      await expect(
        MagasinService.modifierArticle(1, {}, mockMagasinClient as Magasin)
      ).rejects.toThrow("Article non trouvé");
    });
  });

  describe("supprimerArticle", () => {
    it("devrait supprimer un article avec succès", async () => {
      (mockMagasinClient.supprimerArticle as jest.Mock).mockResolvedValue({
        message: "Article supprimé",
      });

      const result = await MagasinService.supprimerArticle(
        1,
        mockMagasinClient as Magasin
      );

      expect(result.message).toBe("Article supprimé");
    });

    it("devrait gérer les erreurs de suppression", async () => {
      (mockMagasinClient.supprimerArticle as jest.Mock).mockRejectedValue(
        new Error("Impossible de supprimer")
      );

      await expect(
        MagasinService.supprimerArticle(1, mockMagasinClient as Magasin)
      ).rejects.toThrow("Impossible de supprimer l'article");
    });
  });

  describe("creerCommande - Protection contre les doublons", () => {
    it("devrait créer une commande sans doublon", async () => {
      const commandeData = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 45.99,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000000" },
      ]);

      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValueOnce([
        { numero_commande: "CMD-000000" },
      ]);

      const result = await MagasinService.creerCommande(
        commandeData,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(result).toHaveProperty("unique_id");
      expect(result).toHaveProperty("numero_commande");
      expect(result.isDuplicate).toBe(false);
    });

    it("devrait gérer le cache de commandes en cours", async () => {
      // Test du système de cache
      const commandeData = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 45.99,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000000" },
      ]);

      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      // Première commande
      const result1 = await MagasinService.creerCommande(
        commandeData,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(result1).toBeDefined();
    });
  });

  describe("obtenirLesCommandes", () => {
    it("devrait retourner toutes les commandes", async () => {
      const mockCommandes = [
        { id: 1, utilisateur_id: 1, total: 45.99 },
        { id: 2, utilisateur_id: 2, total: 89.99 },
      ];

      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockResolvedValue(
        mockCommandes
      );

      const result = await MagasinService.obtenirLesCommandes(
        mockMagasinClient as Magasin
      );

      expect(result).toEqual(mockCommandes);
    });

    it("devrait gérer les erreurs", async () => {
      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockRejectedValue(
        new Error("Erreur DB")
      );

      await expect(
        MagasinService.obtenirLesCommandes(mockMagasinClient as Magasin)
      ).rejects.toThrow("Impossible de récupérer les commandes");
    });
  });

  describe("verifierUniciteCommande", () => {
    it("devrait confirmer qu'une commande existe", async () => {
      const mockCommande = {
        id: 1,
        unique_id: "CMD-001-123-ABCD1234",
        numero_commande: "CMD-000001",
        statut: "en attente",
        total: 45.99,
        utilisateur_id: 1,
        date: "2024-01-15",
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockCommande,
      ]);

      const result = await MagasinService.verifierUniciteCommande(
        "CMD-001-123-ABCD1234",
        mockPaiementsClient as Paiements
      );

      expect(result.exists).toBe(true);
      expect(result.commande).toBeDefined();
    });

    it("devrait confirmer qu'une commande n'existe pas", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      const result = await MagasinService.verifierUniciteCommande(
        "CMD-999-999-FAKE9999",
        mockPaiementsClient as Paiements
      );

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Commande non trouvée");
    });

    it("devrait gérer les erreurs de vérification", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      await expect(
        MagasinService.verifierUniciteCommande(
          "CMD-001-123-ABCD1234",
          mockPaiementsClient as Paiements
        )
      ).rejects.toThrow("Erreur lors de la vérification de l'unicité");
    });
  });

  describe("generateUniqueCommandeId", () => {
    it("devrait générer un ID unique au bon format", () => {
      const userId = 123;
      const uniqueId = MagasinService.generateUniqueCommandeId(userId);

      expect(uniqueId).toMatch(/^CMD-\d{3}-\d+-[A-F0-9]{8}$/);
      expect(uniqueId).toContain("CMD-123-");
    });

    it("devrait générer des IDs différents pour le même utilisateur", () => {
      const userId = 1;
      const id1 = MagasinService.generateUniqueCommandeId(userId);
      const id2 = MagasinService.generateUniqueCommandeId(userId);

      expect(id1).not.toBe(id2);
    });

    it("devrait générer des IDs avec le préfixe utilisateur correct", () => {
      const userId = 5;
      const uniqueId = MagasinService.generateUniqueCommandeId(userId);

      expect(uniqueId).toContain("CMD-005-");
    });
  });

  describe("generateSequentialCommandeNumber", () => {
    it("devrait générer CMD-000001 si aucune commande n'existe", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([]);

      const numero = await MagasinService.generateSequentialCommandeNumber(
        mockPaiementsClient as Paiements
      );

      expect(numero).toBe("CMD-000001");
    });

    it("devrait incrémenter le dernier numéro", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000099" },
      ]);

      const numero = await MagasinService.generateSequentialCommandeNumber(
        mockPaiementsClient as Paiements
      );

      expect(numero).toBe("CMD-000100");
    });

    it("devrait gérer les erreurs avec un fallback timestamp", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      const numero = await MagasinService.generateSequentialCommandeNumber(
        mockPaiementsClient as Paiements
      );

      expect(numero).toMatch(/^CMD-\d+$/);
      expect(numero).not.toBe("CMD-000001");
    });
  });

  describe("calculerStatistiquesMagasin", () => {
    it("devrait calculer les statistiques sans période", async () => {
      const mockStats = {
        total_commandes: 100,
        commandes_en_attente: 15,
        commandes_validees: 60,
        commandes_livrees: 20,
        commandes_annulees: 5,
        chiffre_affaires_total: 5432.1,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockStats,
      ]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(100);
      expect(result.chiffre_affaires_total).toBe(5432.1);
    });

    it("devrait calculer les statistiques avec période", async () => {
      const mockStats = {
        total_commandes: 50,
        commandes_en_attente: 5,
        commandes_validees: 30,
        commandes_livrees: 15,
        commandes_annulees: 0,
        chiffre_affaires_total: 2500.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        mockStats,
      ]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        "2024-01-01",
        "2024-12-31",
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(50);
    });

    it("devrait gérer les statistiques vides", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([{}]);

      const result = await MagasinService.calculerStatistiquesMagasin(
        undefined,
        undefined,
        mockPaiementsClient as Paiements
      );

      expect(result.total_commandes).toBe(0);
      expect(result.chiffre_affaires_total).toBe(0);
    });

    it("devrait gérer les erreurs de calcul", async () => {
      (mockPaiementsClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      await expect(
        MagasinService.calculerStatistiquesMagasin(
          undefined,
          undefined,
          mockPaiementsClient as Paiements
        )
      ).rejects.toThrow("Impossible de calculer les statistiques");
    });
  });

  describe("nettoyerCacheCommandes", () => {
    it("devrait exécuter sans erreur", () => {
      expect(() => {
        MagasinService.nettoyerCacheCommandes();
      }).not.toThrow();
    });
  });
});
