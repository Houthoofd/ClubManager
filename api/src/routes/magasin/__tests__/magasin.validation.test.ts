/**
 * Tests de validation pour le module Magasin
 * Tests des schémas Zod et validation des données
 */

import { describe, it, expect } from "@jest/globals";
import {
  getArticlesSchema,
  getArticleByIdSchema,
  createArticleSchema,
  updateArticleSchema,
  deleteArticleSchema,
  articleCommandeSchema,
  createCommandeSchema,
  getCommandesUtilisateurSchema,
  getCommandeByUniqueIdSchema,
  getCommandeByNumeroSchema,
  getPaymentIntentSchema,
  getTaillesSchema,
  getStatistiquesMagasinSchema,
} from "../core/validators/magasin.schema.js";

describe("Magasin Module - Tests de validation", () => {
  describe("Validation des schémas d'articles", () => {
    describe("createArticleSchema", () => {
      it("devrait valider un article valide", () => {
        const validArticle = {
          nom: "Kimono Blanc",
          description: "Kimono de qualité supérieure",
          prix: 45.99,
          stock: 10,
          categorie_id: 1,
          actif: true,
          tailles_disponibles: ["S", "M", "L", "XL"],
        };

        const result = createArticleSchema.safeParse(validArticle);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter un article sans nom", () => {
        const invalidArticle = {
          prix: 45.99,
          stock: 10,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                path: ["nom"],
              }),
            ])
          );
        }
      });

      it("devrait rejeter un article avec un prix négatif", () => {
        const invalidArticle = {
          nom: "Test",
          prix: -10,
          stock: 5,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                path: ["prix"],
              }),
            ])
          );
        }
      });

      it("devrait rejeter un article avec un prix trop élevé", () => {
        const invalidArticle = {
          nom: "Test",
          prix: 10000,
          stock: 5,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un article avec un stock négatif", () => {
        const invalidArticle = {
          nom: "Test",
          prix: 25.99,
          stock: -5,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                path: ["stock"],
              }),
            ])
          );
        }
      });

      it("devrait rejeter un article avec un stock décimal", () => {
        const invalidArticle = {
          nom: "Test",
          prix: 25.99,
          stock: 5.5,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un article avec une URL d'image invalide", () => {
        const invalidArticle = {
          nom: "Test",
          prix: 25.99,
          stock: 5,
          categorie_id: 1,
          image_url: "not-a-valid-url",
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait accepter une URL d'image valide", () => {
        const validArticle = {
          nom: "Test",
          prix: 25.99,
          stock: 5,
          categorie_id: 1,
          image_url: "https://example.com/image.jpg",
        };

        const result = createArticleSchema.safeParse(validArticle);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter un nom d'article trop long", () => {
        const invalidArticle = {
          nom: "a".repeat(256),
          prix: 25.99,
          stock: 5,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter une description trop longue", () => {
        const invalidArticle = {
          nom: "Test",
          description: "a".repeat(1001),
          prix: 25.99,
          stock: 5,
          categorie_id: 1,
        };

        const result = createArticleSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });
    });

    describe("updateArticleSchema", () => {
      it("devrait valider une mise à jour partielle", () => {
        const validUpdate = {
          id: 1,
          nom: "Nouveau nom",
        };

        const result = updateArticleSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter une mise à jour sans ID", () => {
        const invalidUpdate = {
          nom: "Nouveau nom",
        };

        const result = updateArticleSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
      });

      it("devrait valider une mise à jour de plusieurs champs", () => {
        const validUpdate = {
          id: 1,
          nom: "Nouveau nom",
          prix: 49.99,
          stock: 15,
        };

        const result = updateArticleSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
      });
    });

    describe("deleteArticleSchema", () => {
      it("devrait valider un ID valide", () => {
        const validParams = { articleId: "123" };

        const result = deleteArticleSchema.safeParse(validParams);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.articleId).toBe(123);
        }
      });

      it("devrait rejeter un ID invalide", () => {
        const invalidParams = { articleId: "abc" };

        const result = deleteArticleSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un ID négatif", () => {
        const invalidParams = { articleId: "-5" };

        const result = deleteArticleSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un ID égal à zéro", () => {
        const invalidParams = { articleId: "0" };

        const result = deleteArticleSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation des schémas de commandes", () => {
    describe("articleCommandeSchema", () => {
      it("devrait valider un article de commande valide", () => {
        const validArticle = {
          article_id: 1,
          nom: "Kimono",
          quantite: 2,
          taille: "M",
          prix: 45.99,
        };

        const result = articleCommandeSchema.safeParse(validArticle);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter une quantité nulle", () => {
        const invalidArticle = {
          article_id: 1,
          quantite: 0,
          taille: "M",
        };

        const result = articleCommandeSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter une quantité négative", () => {
        const invalidArticle = {
          article_id: 1,
          quantite: -2,
          taille: "M",
        };

        const result = articleCommandeSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter une quantité trop élevée", () => {
        const invalidArticle = {
          article_id: 1,
          quantite: 101,
          taille: "M",
        };

        const result = articleCommandeSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un article sans taille", () => {
        const invalidArticle = {
          article_id: 1,
          quantite: 1,
        };

        const result = articleCommandeSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter une taille vide", () => {
        const invalidArticle = {
          article_id: 1,
          quantite: 1,
          taille: "",
        };

        const result = articleCommandeSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter une taille trop longue", () => {
        const invalidArticle = {
          article_id: 1,
          quantite: 1,
          taille: "a".repeat(21),
        };

        const result = articleCommandeSchema.safeParse(invalidArticle);
        expect(result.success).toBe(false);
      });
    });

    describe("createCommandeSchema", () => {
      it("devrait valider une commande valide", () => {
        const validCommande = {
          utilisateur_id: 1,
          articles: [
            {
              article_id: 1,
              quantite: 2,
              taille: "M",
              prix: 45.99,
            },
          ],
          total: 91.98,
          statut: "en attente",
          date: new Date().toISOString(),
        };

        const result = createCommandeSchema.safeParse(validCommande);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter une commande sans articles", () => {
        const invalidCommande = {
          utilisateur_id: 1,
          articles: [],
          total: 0,
        };

        const result = createCommandeSchema.safeParse(invalidCommande);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter une commande avec trop d'articles", () => {
        const articles = Array(51).fill({
          article_id: 1,
          quantite: 1,
          taille: "M",
        });

        const invalidCommande = {
          utilisateur_id: 1,
          articles: articles,
          total: 100,
        };

        const result = createCommandeSchema.safeParse(invalidCommande);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un total négatif", () => {
        const invalidCommande = {
          utilisateur_id: 1,
          articles: [
            {
              article_id: 1,
              quantite: 1,
              taille: "M",
            },
          ],
          total: -10,
        };

        const result = createCommandeSchema.safeParse(invalidCommande);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un total trop élevé", () => {
        const invalidCommande = {
          utilisateur_id: 1,
          articles: [
            {
              article_id: 1,
              quantite: 1,
              taille: "M",
            },
          ],
          total: 100000,
        };

        const result = createCommandeSchema.safeParse(invalidCommande);
        expect(result.success).toBe(false);
      });

      it("devrait valider différents statuts", () => {
        const statuts = ["en attente", "validé", "préparé", "livré", "annulé"];

        statuts.forEach((statut) => {
          const commande = {
            utilisateur_id: 1,
            articles: [
              {
                article_id: 1,
                quantite: 1,
                taille: "M",
              },
            ],
            total: 50,
            statut: statut,
          };

          const result = createCommandeSchema.safeParse(commande);
          expect(result.success).toBe(true);
        });
      });

      it("devrait rejeter un statut invalide", () => {
        const invalidCommande = {
          utilisateur_id: 1,
          articles: [
            {
              article_id: 1,
              quantite: 1,
              taille: "M",
            },
          ],
          total: 50,
          statut: "statut_invalide",
        };

        const result = createCommandeSchema.safeParse(invalidCommande);
        expect(result.success).toBe(false);
      });

      it("devrait utiliser le statut par défaut si non fourni", () => {
        const commande = {
          utilisateur_id: 1,
          articles: [
            {
              article_id: 1,
              quantite: 1,
              taille: "M",
            },
          ],
          total: 50,
        };

        const result = createCommandeSchema.safeParse(commande);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.statut).toBe("en attente");
        }
      });
    });

    describe("getCommandeByUniqueIdSchema", () => {
      it("devrait valider un unique_id au bon format", () => {
        const validParams = {
          uniqueId: "CMD-001-1704123456789-ABCD1234",
        };

        const result = getCommandeByUniqueIdSchema.safeParse(validParams);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter un format d'unique_id invalide", () => {
        const invalidParams = {
          uniqueId: "INVALID-FORMAT",
        };

        const result = getCommandeByUniqueIdSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un unique_id avec des minuscules", () => {
        const invalidParams = {
          uniqueId: "CMD-001-1704123456789-abcd1234",
        };

        const result = getCommandeByUniqueIdSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un unique_id avec un mauvais préfixe", () => {
        const invalidParams = {
          uniqueId: "ORD-001-1704123456789-ABCD1234",
        };

        const result = getCommandeByUniqueIdSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });
    });

    describe("getCommandeByNumeroSchema", () => {
      it("devrait valider un numéro de commande au bon format", () => {
        const validParams = {
          numeroCommande: "CMD-000001",
        };

        const result = getCommandeByNumeroSchema.safeParse(validParams);
        expect(result.success).toBe(true);
      });

      it("devrait valider différents numéros", () => {
        const numeros = ["CMD-000001", "CMD-999999", "CMD-123456"];

        numeros.forEach((numero) => {
          const result = getCommandeByNumeroSchema.safeParse({
            numeroCommande: numero,
          });
          expect(result.success).toBe(true);
        });
      });

      it("devrait rejeter un format invalide", () => {
        const invalidParams = {
          numeroCommande: "CMD-1",
        };

        const result = getCommandeByNumeroSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter un numéro avec des lettres", () => {
        const invalidParams = {
          numeroCommande: "CMD-ABCDEF",
        };

        const result = getCommandeByNumeroSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation des schémas de requêtes", () => {
    describe("getArticleByIdSchema", () => {
      it("devrait transformer une chaîne en nombre", () => {
        const params = { articleId: "42" };

        const result = getArticleByIdSchema.safeParse(params);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.articleId).toBe(42);
          expect(typeof result.data.articleId).toBe("number");
        }
      });
    });

    describe("getCommandesUtilisateurSchema", () => {
      it("devrait transformer une chaîne en nombre", () => {
        const params = { userId: "10" };

        const result = getCommandesUtilisateurSchema.safeParse(params);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.userId).toBe(10);
        }
      });

      it("devrait rejeter un userId égal à zéro", () => {
        const params = { userId: "0" };

        const result = getCommandesUtilisateurSchema.safeParse(params);
        expect(result.success).toBe(false);
      });
    });

    describe("getPaymentIntentSchema", () => {
      it("devrait valider des paramètres valides", () => {
        const params = {
          commandeId: "CMD-000001",
          userId: "5",
        };

        const result = getPaymentIntentSchema.safeParse(params);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter si userId est manquant", () => {
        const params = {
          commandeId: "CMD-000001",
        };

        const result = getPaymentIntentSchema.safeParse(params);
        expect(result.success).toBe(false);
      });

      it("devrait rejeter si commandeId est manquant", () => {
        const params = {
          userId: "5",
        };

        const result = getPaymentIntentSchema.safeParse(params);
        expect(result.success).toBe(false);
      });
    });

    describe("getStatistiquesMagasinSchema", () => {
      it("devrait valider des dates valides", () => {
        const params = {
          dateDebut: "2024-01-01",
          dateFin: "2024-12-31",
        };

        const result = getStatistiquesMagasinSchema.safeParse(params);
        expect(result.success).toBe(true);
      });

      it("devrait accepter des paramètres vides", () => {
        const params = {};

        const result = getStatistiquesMagasinSchema.safeParse(params);
        expect(result.success).toBe(true);
      });

      it("devrait rejeter des dates invalides", () => {
        const params = {
          dateDebut: "not-a-date",
          dateFin: "2024-12-31",
        };

        const result = getStatistiquesMagasinSchema.safeParse(params);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Cas limites et valeurs extrêmes", () => {
    it("devrait accepter le prix minimum valide", () => {
      const article = {
        nom: "Test",
        prix: 0.01,
        stock: 1,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter le prix maximum valide", () => {
      const article = {
        nom: "Test",
        prix: 9999.99,
        stock: 1,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un stock de zéro", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        stock: 0,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter une quantité de 1 dans une commande", () => {
      const article = {
        article_id: 1,
        quantite: 1,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter une quantité de 100 dans une commande", () => {
      const article = {
        article_id: 1,
        quantite: 100,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter le total minimum valide", () => {
      const commande = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: 0.01,
      };

      const result = createCommandeSchema.safeParse(commande);
      expect(result.success).toBe(true);
    });
  });
});
