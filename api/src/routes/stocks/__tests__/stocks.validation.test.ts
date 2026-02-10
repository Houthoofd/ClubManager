/**
 * Tests de validation Zod pour le module Stocks
 * Validation des schémas des données de stock
 */

import { describe, it, expect } from "@jest/globals";
import {
  stockSchema,
  stockUpdateSchema,
  alerteParamsSchema,
  articleIdParamSchema,
  healthCheckSchema,
  stocksArraySchema,
} from "@clubmanager/types/validators";

describe("Stocks - Tests de validation Zod", () => {
  // ==================== STOCK SCHEMA ====================
  describe("stockSchema", () => {
    it("devrait valider un stock valide complet", () => {
      const validStock = {
        id: 1,
        article_id: 5,
        quantite: 25,
        article_nom: "Kimono Judo",
        article_prix: 89.99,
        article_description: "Kimono blanc en coton",
      };

      const result = stockSchema.safeParse(validStock);
      expect(result.success).toBe(true);
    });

    it("devrait valider un stock minimal (sans informations article)", () => {
      const minimalStock = {
        article_id: 5,
        quantite: 25,
      };

      const result = stockSchema.safeParse(minimalStock);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un article_id négatif", () => {
      const invalidStock = {
        article_id: -1,
        quantite: 25,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id égal à zéro", () => {
      const invalidStock = {
        article_id: 0,
        quantite: 25,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantité négative", () => {
      const invalidStock = {
        article_id: 5,
        quantite: -10,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une quantité de 0", () => {
      const validStock = {
        article_id: 5,
        quantite: 0,
      };

      const result = stockSchema.safeParse(validStock);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un article_id décimal", () => {
      const invalidStock = {
        article_id: 5.5,
        quantite: 25,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantité décimale", () => {
      const invalidStock = {
        article_id: 5,
        quantite: 25.7,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id manquant", () => {
      const invalidStock = {
        quantite: 25,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantité manquante", () => {
      const invalidStock = {
        article_id: 5,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un prix à 0", () => {
      const validStock = {
        article_id: 5,
        quantite: 25,
        article_prix: 0,
      };

      const result = stockSchema.safeParse(validStock);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un prix négatif", () => {
      const invalidStock = {
        article_id: 5,
        quantite: 25,
        article_prix: -10,
      };

      const result = stockSchema.safeParse(invalidStock);
      expect(result.success).toBe(false);
    });
  });

  // ==================== STOCK UPDATE SCHEMA ====================
  describe("stockUpdateSchema", () => {
    it("devrait valider une mise à jour valide avec operation=set", () => {
      const validUpdate = {
        article_id: 5,
        quantite: 30,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec operation=add", () => {
      const validUpdate = {
        article_id: 5,
        quantite: 10,
        operation: "add" as const,
      };

      const result = stockUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec operation=subtract", () => {
      const validUpdate = {
        article_id: 5,
        quantite: 5,
        operation: "subtract" as const,
      };

      const result = stockUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait utiliser 'set' par défaut si operation est omise", () => {
      const updateWithoutOperation = {
        article_id: 5,
        quantite: 30,
      };

      const result = stockUpdateSchema.safeParse(updateWithoutOperation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operation).toBe("set");
      }
    });

    it("devrait rejeter une opération invalide", () => {
      const invalidUpdate = {
        article_id: 5,
        quantite: 30,
        operation: "delete",
      };

      const result = stockUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id négatif", () => {
      const invalidUpdate = {
        article_id: -5,
        quantite: 30,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une quantité négative pour certaines opérations", () => {
      const updateWithNegative = {
        article_id: 5,
        quantite: -10,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(updateWithNegative);
      // Le schéma accepte les entiers, y compris négatifs
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantité décimale", () => {
      const invalidUpdate = {
        article_id: 5,
        quantite: 30.5,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id manquant", () => {
      const invalidUpdate = {
        quantite: 30,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantité manquante", () => {
      const invalidUpdate = {
        article_id: 5,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ==================== ALERTE PARAMS SCHEMA ====================
  describe("alerteParamsSchema", () => {
    it("devrait valider un seuil valide", () => {
      const validParams = {
        seuil: 10,
      };

      const result = alerteParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("devrait utiliser 5 par défaut si seuil est omis", () => {
      const emptyParams = {};

      const result = alerteParamsSchema.safeParse(emptyParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seuil).toBe(5);
      }
    });

    it("devrait accepter un seuil de 0", () => {
      const validParams = {
        seuil: 0,
      };

      const result = alerteParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un seuil négatif", () => {
      const invalidParams = {
        seuil: -5,
      };

      const result = alerteParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un seuil décimal", () => {
      const invalidParams = {
        seuil: 5.5,
      };

      const result = alerteParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("devrait accepter de très grands seuils", () => {
      const validParams = {
        seuil: 999999,
      };

      const result = alerteParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
  });

  // ==================== ARTICLE ID PARAM SCHEMA ====================
  describe("articleIdParamSchema", () => {
    it("devrait transformer une chaîne valide en nombre", () => {
      const validParam = {
        articleId: "5",
      };

      const result = articleIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(5);
        expect(typeof result.data.articleId).toBe("number");
      }
    });

    it("devrait rejeter une chaîne non numérique", () => {
      const invalidParam = {
        articleId: "invalid",
      };

      const result = articleIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID égal à zéro", () => {
      const invalidParam = {
        articleId: "0",
      };

      const result = articleIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        articleId: "-5",
      };

      const result = articleIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait gérer les espaces autour du nombre", () => {
      const validParam = {
        articleId: "  5  ",
      };

      const result = articleIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(5);
      }
    });

    it("devrait rejeter une chaîne vide", () => {
      const invalidParam = {
        articleId: "",
      };

      const result = articleIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait transformer correctement de grands nombres", () => {
      const validParam = {
        articleId: "999999",
      };

      const result = articleIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(999999);
      }
    });
  });

  // ==================== HEALTH CHECK SCHEMA ====================
  describe("healthCheckSchema", () => {
    it("devrait valider un health check healthy", () => {
      const validHealth = {
        status: "healthy" as const,
        checks: {
          stocks: true,
          alertes: true,
        },
        message: "Tous les services sont opérationnels",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait valider un health check degraded", () => {
      const validHealth = {
        status: "degraded" as const,
        checks: {
          stocks: true,
          alertes: false,
        },
        message: "1/2 services opérationnels",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait valider un health check unhealthy", () => {
      const validHealth = {
        status: "unhealthy" as const,
        checks: {
          stocks: false,
          alertes: false,
        },
        message: "Services non opérationnels",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un status invalide", () => {
      const invalidHealth = {
        status: "broken",
        checks: {
          stocks: true,
          alertes: true,
        },
        message: "Test",
      };

      const result = healthCheckSchema.safeParse(invalidHealth);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des checks manquants", () => {
      const invalidHealth = {
        status: "healthy" as const,
        checks: {
          stocks: true,
          // alertes manquant
        },
        message: "Test",
      };

      const result = healthCheckSchema.safeParse(invalidHealth);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message manquant", () => {
      const invalidHealth = {
        status: "healthy" as const,
        checks: {
          stocks: true,
          alertes: true,
        },
      };

      const result = healthCheckSchema.safeParse(invalidHealth);
      expect(result.success).toBe(false);
    });
  });

  // ==================== STOCKS ARRAY SCHEMA ====================
  describe("stocksArraySchema", () => {
    it("devrait valider un tableau de stocks valide", () => {
      const validStocks = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono Judo",
        },
        {
          id: 2,
          article_id: 12,
          quantite: 10,
          article_nom: "Ceinture Noire",
        },
      ];

      const result = stocksArraySchema.safeParse(validStocks);
      expect(result.success).toBe(true);
    });

    it("devrait valider un tableau vide", () => {
      const emptyArray: any[] = [];

      const result = stocksArraySchema.safeParse(emptyArray);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });

    it("devrait rejeter un tableau avec un élément invalide", () => {
      const invalidStocks = [
        {
          article_id: 5,
          quantite: 25,
        },
        {
          article_id: -1, // invalide
          quantite: 10,
        },
      ];

      const result = stocksArraySchema.safeParse(invalidStocks);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un non-tableau", () => {
      const notAnArray = {
        article_id: 5,
        quantite: 25,
      };

      const result = stocksArraySchema.safeParse(notAnArray);
      expect(result.success).toBe(false);
    });
  });

  // ==================== TESTS DE COMPOSITION ====================
  describe("Composition et cas complexes", () => {
    it("devrait valider un stock complet avec tous les champs", () => {
      const fullStock = {
        id: 1,
        article_id: 5,
        quantite: 100,
        article_nom: "Kimono Judo Professionnel",
        article_prix: 150.5,
        article_description:
          "Kimono haut de gamme pour compétitions internationales",
      };

      const result = stockSchema.safeParse(fullStock);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec quantité maximale", () => {
      const maxUpdate = {
        article_id: 5,
        quantite: Number.MAX_SAFE_INTEGER,
        operation: "set" as const,
      };

      const result = stockUpdateSchema.safeParse(maxUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait gérer les caractères spéciaux dans les noms", () => {
      const stockWithSpecialChars = {
        article_id: 5,
        quantite: 25,
        article_nom: "Kimono (judogi) - 100% coton",
        article_description: "Description avec \"guillemets\" et 'apostrophes'",
      };

      const result = stockSchema.safeParse(stockWithSpecialChars);
      expect(result.success).toBe(true);
    });
  });
});
