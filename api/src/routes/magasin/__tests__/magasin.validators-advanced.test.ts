/**
 * Tests de validateurs avancés pour le module Magasin
 * Tests approfondis des schémas de validation Zod
 */

import { describe, it, expect } from "@jest/globals";
import {
  createArticleSchema,
  updateArticleSchema,
  createCommandeSchema,
  articleCommandeSchema,
  getCommandeByUniqueIdSchema,
  getCommandeByNumeroSchema,
  getArticleByIdSchema,
  getCommandesUtilisateurSchema,
  getPaymentIntentSchema,
  getStatistiquesMagasinSchema,
} from "../core/validators/magasin.schema.js";

describe("Magasin Module - Tests de validateurs avancés", () => {
  describe("Transformation et coercition de types", () => {
    it("devrait transformer une chaîne d'ID en nombre", () => {
      const result = getArticleByIdSchema.safeParse({ articleId: "42" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(42);
        expect(typeof result.data.articleId).toBe("number");
      }
    });

    it("devrait transformer plusieurs IDs de chaînes en nombres", () => {
      const testCases = ["1", "100", "9999"];
      testCases.forEach((id) => {
        const result = getArticleByIdSchema.safeParse({ articleId: id });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.articleId).toBe("number");
        }
      });
    });

    it("devrait transformer userId de chaîne en nombre", () => {
      const result = getCommandesUtilisateurSchema.safeParse({ userId: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(25);
      }
    });
  });

  describe("Valeurs par défaut", () => {
    it("devrait appliquer actif=true par défaut pour un article", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait appliquer statut='en attente' par défaut pour une commande", () => {
      const commande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 45.99,
      };

      const result = createCommandeSchema.safeParse(commande);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("en attente");
      }
    });

    it("devrait permettre de surcharger la valeur par défaut d'actif", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
        actif: false,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });
  });

  describe("Validation de formats complexes", () => {
    it("devrait valider le format d'unique_id strictement", () => {
      const validFormats = [
        "CMD-001-1704123456789-ABCD1234",
        "CMD-999-9999999999999-FFFFFFFF",
        "CMD-042-1234567890123-12345678",
      ];

      validFormats.forEach((id) => {
        const result = getCommandeByUniqueIdSchema.safeParse({ uniqueId: id });
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter les formats d'unique_id invalides", () => {
      const invalidFormats = [
        "CMD-1-123-ABCD1234", // userId trop court
        "CMD-001-ABC-ABCD1234", // timestamp non numérique
        "CMD-001-123-abcd1234", // minuscules dans hex
        "CMD-001-123-ABCD123", // hex trop court
        "cmd-001-123-ABCD1234", // préfixe en minuscules
        "ORD-001-123-ABCD1234", // mauvais préfixe
      ];

      invalidFormats.forEach((id) => {
        const result = getCommandeByUniqueIdSchema.safeParse({ uniqueId: id });
        expect(result.success).toBe(false);
      });
    });

    it("devrait valider le format de numero_commande strictement", () => {
      const validFormats = ["CMD-000001", "CMD-999999", "CMD-123456"];

      validFormats.forEach((numero) => {
        const result = getCommandeByNumeroSchema.safeParse({
          numeroCommande: numero,
        });
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter les formats de numero_commande invalides", () => {
      const invalidFormats = [
        "CMD-1",
        "CMD-0000001", // trop de chiffres
        "CMD-ABCDEF", // lettres au lieu de chiffres
        "cmd-000001", // minuscules
        "ORDER-000001", // mauvais préfixe
      ];

      invalidFormats.forEach((numero) => {
        const result = getCommandeByNumeroSchema.safeParse({
          numeroCommande: numero,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation d'URL", () => {
    it("devrait accepter des URLs valides pour image_url", () => {
      const validUrls = [
        "https://example.com/image.jpg",
        "http://example.com/path/to/image.png",
        "https://cdn.example.com/images/123456.webp",
        "https://example.com/image.jpg?size=large",
      ];

      validUrls.forEach((url) => {
        const article = {
          nom: "Test",
          prix: 25.99,
          stock: 10,
          categorie_id: 1,
          image_url: url,
        };

        const result = createArticleSchema.safeParse(article);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter des URLs invalides", () => {
      const invalidUrls = [
        "not-a-url",
        "ftp://example.com/image.jpg", // protocole non supporté
        "//example.com/image.jpg", // protocole manquant
        "example.com/image.jpg", // protocole manquant
        "",
      ];

      invalidUrls.forEach((url) => {
        const article = {
          nom: "Test",
          prix: 25.99,
          stock: 10,
          categorie_id: 1,
          image_url: url,
        };

        const result = createArticleSchema.safeParse(article);
        expect(result.success).toBe(false);
      });
    });

    it("devrait accepter null pour image_url", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
        image_url: null,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });
  });

  describe("Validation de tableaux", () => {
    it("devrait valider un tableau de tailles_disponibles", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
        tailles_disponibles: ["XS", "S", "M", "L", "XL", "XXL"],
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un tableau vide de tailles", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
        tailles_disponibles: [],
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter null pour tailles_disponibles", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
        tailles_disponibles: null,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait valider la longueur du tableau d'articles dans une commande", () => {
      // Minimum 1 article
      const commandeVideInvalide = {
        utilisateur_id: 1,
        articles: [],
        total: 0,
      };

      const result1 = createCommandeSchema.safeParse(commandeVideInvalide);
      expect(result1.success).toBe(false);

      // Maximum 50 articles
      const tooManyArticles = Array(51).fill({
        article_id: 1,
        quantite: 1,
        taille: "M",
      });

      const commandeTropArticles = {
        utilisateur_id: 1,
        articles: tooManyArticles,
        total: 1000,
      };

      const result2 = createCommandeSchema.safeParse(commandeTropArticles);
      expect(result2.success).toBe(false);

      // Exactement 50 articles (valide)
      const maxArticles = Array(50).fill({
        article_id: 1,
        quantite: 1,
        taille: "M",
      });

      const commandeMaxArticles = {
        utilisateur_id: 1,
        articles: maxArticles,
        total: 1000,
      };

      const result3 = createCommandeSchema.safeParse(commandeMaxArticles);
      expect(result3.success).toBe(true);
    });
  });

  describe("Validation d'énumérations", () => {
    it("devrait valider tous les statuts de commande possibles", () => {
      const statutsValides = [
        "en attente",
        "validé",
        "préparé",
        "livré",
        "annulé",
      ];

      statutsValides.forEach((statut) => {
        const commande = {
          utilisateur_id: 1,
          articles: [{ article_id: 1, quantite: 1, taille: "M" }],
          total: 50,
          statut: statut,
        };

        const result = createCommandeSchema.safeParse(commande);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter des statuts invalides", () => {
      const statutsInvalides = [
        "pending",
        "shipped",
        "cancelled",
        "EN_ATTENTE",
        "en-attente",
        "",
      ];

      statutsInvalides.forEach((statut) => {
        const commande = {
          utilisateur_id: 1,
          articles: [{ article_id: 1, quantite: 1, taille: "M" }],
          total: 50,
          statut: statut,
        };

        const result = createCommandeSchema.safeParse(commande);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation de champs optionnels", () => {
    it("devrait accepter tous les champs optionnels manquants", () => {
      const articleMinimal = {
        nom: "Test",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(articleMinimal);
      expect(result.success).toBe(true);
    });

    it("devrait accepter une mise à jour avec un seul champ", () => {
      const updates = [
        { id: 1, nom: "Nouveau nom" },
        { id: 1, prix: 49.99 },
        { id: 1, stock: 20 },
        { id: 1, actif: false },
        { id: 1, description: "Nouvelle description" },
      ];

      updates.forEach((update) => {
        const result = updateArticleSchema.safeParse(update);
        expect(result.success).toBe(true);
      });
    });

    it("devrait accepter des dates optionnelles pour les statistiques", () => {
      const casValides = [
        {},
        { dateDebut: "2024-01-01" },
        { dateFin: "2024-12-31" },
        { dateDebut: "2024-01-01", dateFin: "2024-12-31" },
      ];

      casValides.forEach((cas) => {
        const result = getStatistiquesMagasinSchema.safeParse(cas);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Validation de dates", () => {
    it("devrait valider des formats de date ISO valides", () => {
      const datesValides = [
        "2024-01-01",
        "2024-12-31",
        "2024-06-15T10:30:00Z",
        "2024-06-15T10:30:00.000Z",
      ];

      datesValides.forEach((date) => {
        const params = { dateDebut: date };
        const result = getStatistiquesMagasinSchema.safeParse(params);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter des formats de date invalides", () => {
      const datesInvalides = [
        "not-a-date",
        "2024/01/01",
        "01-01-2024",
        "2024-13-01", // mois invalide
        "2024-01-32", // jour invalide
      ];

      datesInvalides.forEach((date) => {
        const params = { dateDebut: date };
        const result = getStatistiquesMagasinSchema.safeParse(params);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation de limites numériques", () => {
    it("devrait valider les limites de prix", () => {
      const prixValides = [
        0.01, // minimum
        9999.99, // maximum
        25.5,
        100.0,
        1234.56,
      ];

      prixValides.forEach((prix) => {
        const article = {
          nom: "Test",
          prix: prix,
          stock: 10,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(article);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter les prix hors limites", () => {
      const prixInvalides = [
        0, // zéro
        -1, // négatif
        10000, // trop élevé
        -999.99, // négatif
      ];

      prixInvalides.forEach((prix) => {
        const article = {
          nom: "Test",
          prix: prix,
          stock: 10,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(article);
        expect(result.success).toBe(false);
      });
    });

    it("devrait valider les limites de quantité dans une commande", () => {
      const quantitesValides = [1, 10, 50, 100];

      quantitesValides.forEach((quantite) => {
        const article = {
          article_id: 1,
          quantite: quantite,
          taille: "M",
        };

        const result = articleCommandeSchema.safeParse(article);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter les quantités hors limites", () => {
      const quantitesInvalides = [0, -1, 101, 1000];

      quantitesInvalides.forEach((quantite) => {
        const article = {
          article_id: 1,
          quantite: quantite,
          taille: "M",
        };

        const result = articleCommandeSchema.safeParse(article);
        expect(result.success).toBe(false);
      });
    });

    it("devrait valider les limites de stock", () => {
      const stocksValides = [0, 1, 100, 9999];

      stocksValides.forEach((stock) => {
        const article = {
          nom: "Test",
          prix: 25.99,
          stock: stock,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(article);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter les stocks négatifs ou décimaux", () => {
      const stocksInvalides = [-1, -10, 5.5, 10.9];

      stocksInvalides.forEach((stock) => {
        const article = {
          nom: "Test",
          prix: 25.99,
          stock: stock,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(article);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation de longueurs de chaînes", () => {
    it("devrait rejeter un nom d'article trop long", () => {
      const article = {
        nom: "A".repeat(256),
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un nom à la limite (255 caractères)", () => {
      const article = {
        nom: "A".repeat(255),
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une description trop longue", () => {
      const article = {
        nom: "Test",
        description: "A".repeat(1001),
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une taille vide", () => {
      const article = {
        article_id: 1,
        quantite: 1,
        taille: "",
      };

      const result = articleCommandeSchema.safeParse(article);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une taille trop longue", () => {
      const article = {
        article_id: 1,
        quantite: 1,
        taille: "A".repeat(21),
      };

      const result = articleCommandeSchema.safeParse(article);
      expect(result.success).toBe(false);
    });
  });

  describe("Messages d'erreur personnalisés", () => {
    it("devrait fournir un message d'erreur clair pour un prix invalide", () => {
      const article = {
        nom: "Test",
        prix: -10,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(false);
      if (!result.success) {
        const prixError = result.error.errors.find((e) => e.path[0] === "prix");
        expect(prixError).toBeDefined();
        expect(prixError?.message).toContain("positif");
      }
    });

    it("devrait fournir un message d'erreur pour un statut invalide", () => {
      const commande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 50,
        statut: "invalid_status",
      };

      const result = createCommandeSchema.safeParse(commande);
      expect(result.success).toBe(false);
      if (!result.success) {
        const statutError = result.error.errors.find((e) => e.path[0] === "statut");
        expect(statutError).toBeDefined();
      }
    });
  });

  describe("Validation de références croisées", () => {
    it("devrait valider commandeId et userId ensemble", () => {
      const validParams = {
        commandeId: "CMD-000001",
        userId: "5",
      };

      const result = getPaymentIntentSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si l'un des paramètres manque", () => {
      const casInvalides = [
        { commandeId: "CMD-000001" }, // userId manquant
        { userId: "5" }, // commandeId manquant
        {}, // les deux manquants
      ];

      casInvalides.forEach((params) => {
        const result = getPaymentIntentSchema.safeParse(params);
        expect(result.success).toBe(false);
      });
    });
  });
});
