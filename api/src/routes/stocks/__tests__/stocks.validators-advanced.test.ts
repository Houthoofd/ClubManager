/**
 * Tests avancés des validators Zod pour le module Stocks
 * Couverture à 100% des branches - Tests exhaustifs
 */

import { describe, it, expect } from "@jest/globals";
import {
  stockSchema,
  stockUpdateSchema,
  alerteParamsSchema,
  articleIdParamSchema,
  healthCheckSchema,
  stocksArraySchema,
} from "../core/validators/stocks.schema.js";

describe("Stocks - Tests avancés des validators (Branch Coverage 100%)", () => {
  // ==================== STOCK SCHEMA - ADVANCED ====================
  describe("stockSchema - Branch Coverage", () => {
    it("devrait accepter un article_id très grand", () => {
      const stock = { article_id: 999999999, quantite: 100 };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un article_id null", () => {
      const stock = { article_id: null, quantite: 25 };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id undefined", () => {
      const stock = { article_id: undefined, quantite: 25 };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id string", () => {
      const stock = { article_id: "5", quantite: 25 };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite null", () => {
      const stock = { article_id: 5, quantite: null };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite undefined", () => {
      const stock = { article_id: 5, quantite: undefined };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite string", () => {
      const stock = { article_id: 5, quantite: "25" };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait accepter article_nom avec caractères unicode", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        article_nom: "Kimono 柔道着 🥋",
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait accepter article_nom vide (string)", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        article_nom: "",
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait accepter article_prix à 0", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        article_prix: 0,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait accepter article_prix très grand", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        article_prix: 999999.99,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter article_prix négatif", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        article_prix: -10,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait accepter article_description null si optionnel", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        article_description: undefined,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet vide", () => {
      const stock = {};
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = stockSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = stockSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un objet avec propriétés supplémentaires", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
        extra_field: "ignored",
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });

    it("devrait accepter id optionnel manquant", () => {
      const stock = {
        article_id: 5,
        quantite: 25,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it("devrait rejeter un id négatif si présent", () => {
      const stock = {
        id: -1,
        article_id: 5,
        quantite: 25,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une quantite maximale", () => {
      const stock = {
        article_id: 5,
        quantite: Number.MAX_SAFE_INTEGER,
      };
      const result = stockSchema.safeParse(stock);
      expect(result.success).toBe(true);
    });
  });

  // ==================== STOCK UPDATE SCHEMA - ADVANCED ====================
  describe("stockUpdateSchema - Branch Coverage", () => {
    it("devrait accepter operation en minuscules strictes", () => {
      const update = { article_id: 5, quantite: 30, operation: "set" as const };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter operation en majuscules", () => {
      const update = { article_id: 5, quantite: 30, operation: "SET" };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter operation mixte", () => {
      const update = { article_id: 5, quantite: 30, operation: "Set" };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une operation vide", () => {
      const update = { article_id: 5, quantite: 30, operation: "" };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter operation null", () => {
      const update = { article_id: 5, quantite: 30, operation: null };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait accepter quantite négative (pour certains cas)", () => {
      const update = { article_id: 5, quantite: -100, operation: "set" as const };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("devrait accepter quantite à 0", () => {
      const update = { article_id: 5, quantite: 0, operation: "set" as const };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter quantite Infinity", () => {
      const update = {
        article_id: 5,
        quantite: Infinity,
        operation: "set" as const,
      };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite NaN", () => {
      const update = { article_id: 5, quantite: NaN, operation: "set" as const };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_id à 0", () => {
      const update = { article_id: 0, quantite: 30, operation: "set" as const };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_id Infinity", () => {
      const update = {
        article_id: Infinity,
        quantite: 30,
        operation: "set" as const,
      };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const update = {};
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = stockUpdateSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait appliquer la valeur par défaut 'set' correctement", () => {
      const update = { article_id: 5, quantite: 30 };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operation).toBe("set");
      }
    });

    it("devrait rejeter une operation avec espace", () => {
      const update = { article_id: 5, quantite: 30, operation: "set " };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });

  // ==================== ALERTE PARAMS SCHEMA - ADVANCED ====================
  describe("alerteParamsSchema - Branch Coverage", () => {
    it("devrait accepter un seuil très grand", () => {
      const params = { seuil: 999999999 };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un seuil Infinity", () => {
      const params = { seuil: Infinity };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un seuil NaN", () => {
      const params = { seuil: NaN };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un seuil null", () => {
      const params = { seuil: null };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un seuil string", () => {
      const params = { seuil: "5" };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it("devrait appliquer la valeur par défaut 5", () => {
      const params = {};
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seuil).toBe(5);
      }
    });

    it("devrait appliquer la valeur par défaut pour undefined", () => {
      const params = { seuil: undefined };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seuil).toBe(5);
      }
    });

    it("devrait accepter un seuil à 1", () => {
      const params = { seuil: 1 };
      const result = alerteParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });

  // ==================== ARTICLE ID PARAM SCHEMA - ADVANCED ====================
  describe("articleIdParamSchema - Branch Coverage", () => {
    it("devrait transformer '999999' en 999999", () => {
      const param = { articleId: "999999" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(999999);
      }
    });

    it("devrait rejeter '0' (ID à zéro)", () => {
      const param = { articleId: "0" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter '-1' (ID négatif)", () => {
      const param = { articleId: "-1" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter 'abc' (non numérique)", () => {
      const param = { articleId: "abc" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter '5.5' (décimal)", () => {
      const param = { articleId: "5.5" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait gérer les espaces avant/après", () => {
      const param = { articleId: "  10  " };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(10);
      }
    });

    it("devrait rejeter une chaîne vide", () => {
      const param = { articleId: "" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un espace seul", () => {
      const param = { articleId: "   " };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter '5e2' (notation scientifique)", () => {
      const param = { articleId: "5e2" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter '0x10' (hexadécimal)", () => {
      const param = { articleId: "0x10" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter articleId manquant", () => {
      const param = {};
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter articleId null", () => {
      const param = { articleId: null };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter articleId undefined", () => {
      const param = { articleId: undefined };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter articleId number", () => {
      const param = { articleId: 5 };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });
  });

  // ==================== HEALTH CHECK SCHEMA - ADVANCED ====================
  describe("healthCheckSchema - Branch Coverage", () => {
    it("devrait accepter healthy avec tous checks true", () => {
      const health = {
        status: "healthy" as const,
        checks: { stocks: true, alertes: true },
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(true);
    });

    it("devrait accepter degraded avec checks mixtes", () => {
      const health = {
        status: "degraded" as const,
        checks: { stocks: true, alertes: false },
        message: "Partial",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(true);
    });

    it("devrait accepter unhealthy avec tous checks false", () => {
      const health = {
        status: "unhealthy" as const,
        checks: { stocks: false, alertes: false },
        message: "Down",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un status invalide", () => {
      const health = {
        status: "ok",
        checks: { stocks: true, alertes: true },
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status null", () => {
      const health = {
        status: null,
        checks: { stocks: true, alertes: true },
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter checks.stocks manquant", () => {
      const health = {
        status: "healthy" as const,
        checks: { alertes: true },
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter checks.alertes manquant", () => {
      const health = {
        status: "healthy" as const,
        checks: { stocks: true },
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter checks manquant", () => {
      const health = {
        status: "healthy" as const,
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter message vide", () => {
      const health = {
        status: "healthy" as const,
        checks: { stocks: true, alertes: true },
        message: "",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter message null", () => {
      const health = {
        status: "healthy" as const,
        checks: { stocks: true, alertes: true },
        message: null,
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter message manquant", () => {
      const health = {
        status: "healthy" as const,
        checks: { stocks: true, alertes: true },
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter checks avec valeurs non-boolean", () => {
      const health = {
        status: "healthy" as const,
        checks: { stocks: 1, alertes: 0 },
        message: "OK",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });
  });

  // ==================== STOCKS ARRAY SCHEMA - ADVANCED ====================
  describe("stocksArraySchema - Branch Coverage", () => {
    it("devrait accepter un grand tableau", () => {
      const stocks = Array(100)
        .fill(null)
        .map((_, i) => ({
          article_id: i + 1,
          quantite: i * 10,
        }));
      const result = stocksArraySchema.safeParse(stocks);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un tableau avec un élément null", () => {
      const stocks = [{ article_id: 5, quantite: 25 }, null];
      const result = stocksArraySchema.safeParse(stocks);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un tableau avec un élément undefined", () => {
      const stocks = [{ article_id: 5, quantite: 25 }, undefined];
      const result = stocksArraySchema.safeParse(stocks);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = stocksArraySchema.safeParse("not an array");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const result = stocksArraySchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = stocksArraySchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un tableau avec un seul élément", () => {
      const stocks = [{ article_id: 5, quantite: 25 }];
      const result = stocksArraySchema.safeParse(stocks);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un tableau d'objets invalides", () => {
      const stocks = [{ wrong: "structure" }, { bad: "data" }];
      const result = stocksArraySchema.safeParse(stocks);
      expect(result.success).toBe(false);
    });
  });

  // ==================== TESTS DE TRANSFORMATION ====================
  describe("Transformations et coercition", () => {
    it("devrait transformer articleId string en number", () => {
      const param = { articleId: "42" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.articleId).toBe("number");
        expect(result.data.articleId).toBe(42);
      }
    });

    it("devrait appliquer les valeurs par défaut", () => {
      const update = { article_id: 5, quantite: 30 };
      const result = stockUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operation).toBe("set");
      }
    });

    it("ne devrait pas transformer si validation échoue", () => {
      const param = { articleId: "invalid" };
      const result = articleIdParamSchema.safeParse(param);
      expect(result.success).toBe(false);
    });
  });
});
