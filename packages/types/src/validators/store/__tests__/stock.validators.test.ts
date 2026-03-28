/**
 * @file Stock Validators Tests
 * @description Tests unitaires pour les validators de stock
 */

import {
  stockSchema,
  createStockSchema,
  updateStockSchema,
  stockIdParamSchema,
  stocksByArticleParamSchema,
  stocksBySizeParamSchema,
  stockQuerySchema,
  adjustStockSchema,
  setStockQuantitySchema,
  bulkStockSchema,
  bulkUpdateStockSchema,
  checkStockAvailabilitySchema,
  bulkAdjustStockSchema,
} from "../stock.validators.js";
import { STOCK_CONSTRAINTS } from "../../../constants/store.constants.js";

describe("Stock Validators", () => {
  describe("stockSchema", () => {
    it("devrait valider un stock valide avec tous les champs", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 10,
        updated_at: new Date("2024-01-15T10:00:00Z"),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_minimum par défaut à 5", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: undefined,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite_minimum).toBe(
          STOCK_CONSTRAINTS.QUANTITE_MINIMUM_DEFAULT,
        );
      }
    });

    it("devrait valider avec quantite à 0 (minimum)", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 0,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_minimum à 0", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 50,
        quantite_minimum: 0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un grand nombre pour quantite", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 999999,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at à null", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 5,
        updated_at: null,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at optionnel (undefined)", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantite négative", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: -1,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_minimum négative", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 50,
        quantite_minimum: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite décimale", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 50.5,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_minimum décimale", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: 50,
        quantite_minimum: 5.5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const result = stockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = stockSchema.safeParse({
        id: 1,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquante", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const result = stockSchema.safeParse({
        id: 0,
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 0,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est 0", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 0,
        quantite: 100,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite qui n'est pas un nombre", () => {
      const result = stockSchema.safeParse({
        id: 1,
        article_id: 10,
        taille_id: 5,
        quantite: "100",
        quantite_minimum: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createStockSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: 10,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement les champs requis (quantite_minimum optionnel)", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: 100,
      });
      expect(result.success).toBe(true);
      // quantite_minimum is optional, so it can be undefined when not provided
      if (result.success) {
        expect(result.data.quantite_minimum).toBeUndefined();
      }
    });

    it("devrait valider avec quantite à 0", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: 0,
        quantite_minimum: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_minimum à 0", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: 50,
        quantite_minimum: 0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = createStockSchema.safeParse({
        taille_id: 5,
        quantite: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        quantite: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquante", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite négative", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_minimum négative", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite: 100,
        quantite_minimum: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const result = createStockSchema.safeParse({
        article_id: 0,
        taille_id: 5,
        quantite: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est 0", () => {
      const result = createStockSchema.safeParse({
        article_id: 10,
        taille_id: 0,
        quantite: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateStockSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const result = updateStockSchema.safeParse({
        quantite: 150,
        quantite_minimum: 15,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const result = updateStockSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement quantite", () => {
      const result = updateStockSchema.safeParse({
        quantite: 200,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement quantite_minimum", () => {
      const result = updateStockSchema.safeParse({
        quantite_minimum: 20,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite à 0", () => {
      const result = updateStockSchema.safeParse({
        quantite: 0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_minimum à 0", () => {
      const result = updateStockSchema.safeParse({
        quantite_minimum: 0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantite négative", () => {
      const result = updateStockSchema.safeParse({
        quantite: -10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_minimum négative", () => {
      const result = updateStockSchema.safeParse({
        quantite_minimum: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite décimale", () => {
      const result = updateStockSchema.safeParse({
        quantite: 100.5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_minimum décimale", () => {
      const result = updateStockSchema.safeParse({
        quantite_minimum: 10.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("stockIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = stockIdParamSchema.safeParse({ id: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait valider un ID de 1", () => {
      const result = stockIdParamSchema.safeParse({ id: "1" });
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const result = stockIdParamSchema.safeParse({ id: "456" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = stockIdParamSchema.safeParse({ id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = stockIdParamSchema.safeParse({ id: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const result = stockIdParamSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = stockIdParamSchema.safeParse({ id: "12.5" });
      expect(result.success).toBe(false);
    });
  });

  describe("stocksByArticleParamSchema", () => {
    it("devrait valider un article_id valide", () => {
      const result = stocksByArticleParamSchema.safeParse({ article_id: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(10);
      }
    });

    it("devrait rejeter un article_id à 0", () => {
      const result = stocksByArticleParamSchema.safeParse({ article_id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id négatif", () => {
      const result = stocksByArticleParamSchema.safeParse({ article_id: "-1" });
      expect(result.success).toBe(false);
    });
  });

  describe("stocksBySizeParamSchema", () => {
    it("devrait valider un taille_id valide", () => {
      const result = stocksBySizeParamSchema.safeParse({ taille_id: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille_id).toBe(5);
      }
    });

    it("devrait rejeter un taille_id à 0", () => {
      const result = stocksBySizeParamSchema.safeParse({ taille_id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un taille_id négatif", () => {
      const result = stocksBySizeParamSchema.safeParse({ taille_id: "-1" });
      expect(result.success).toBe(false);
    });
  });

  describe("stockQuerySchema", () => {
    it("devrait valider une query complète", () => {
      const result = stockQuerySchema.safeParse({
        article_id: "10",
        taille_id: "5",
        low_stock: "true",
        out_of_stock: "false",
        quantite_min: "0",
        quantite_max: "100",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide", () => {
      const result = stockQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("devrait transformer low_stock string en boolean", () => {
      const result = stockQuerySchema.safeParse({ low_stock: "true" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.low_stock).toBe(true);
      }
    });

    it("devrait transformer out_of_stock '1' en true", () => {
      const result = stockQuerySchema.safeParse({ out_of_stock: "1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.out_of_stock).toBe(true);
      }
    });

    it("devrait transformer out_of_stock '0' en false", () => {
      const result = stockQuerySchema.safeParse({ out_of_stock: "0" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.out_of_stock).toBe(false);
      }
    });

    it("devrait coercer quantite_min en nombre", () => {
      const result = stockQuerySchema.safeParse({ quantite_min: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.quantite_min).toBe("number");
        expect(result.data.quantite_min).toBe(50);
      }
    });

    it("devrait rejeter une quantite_min négative", () => {
      const result = stockQuerySchema.safeParse({ quantite_min: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_max négative", () => {
      const result = stockQuerySchema.safeParse({ quantite_max: "-10" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id à 0", () => {
      const result = stockQuerySchema.safeParse({ article_id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un taille_id à 0", () => {
      const result = stockQuerySchema.safeParse({ taille_id: "0" });
      expect(result.success).toBe(false);
    });
  });

  describe("adjustStockSchema", () => {
    it("devrait valider un ajustement positif", () => {
      const result = adjustStockSchema.safeParse({
        quantite: 50,
        motif: "Réapprovisionnement",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un ajustement négatif", () => {
      const result = adjustStockSchema.safeParse({
        quantite: -10,
        motif: "Correction",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans motif (optionnel)", () => {
      const result = adjustStockSchema.safeParse({
        quantite: 20,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantite à 0", () => {
      const result = adjustStockSchema.safeParse({
        quantite: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite décimale", () => {
      const result = adjustStockSchema.safeParse({
        quantite: 10.5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquante", () => {
      const result = adjustStockSchema.safeParse({
        motif: "Test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("setStockQuantitySchema", () => {
    it("devrait valider une quantité absolue valide", () => {
      const result = setStockQuantitySchema.safeParse({
        quantite: 100,
        motif: "Inventaire",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite à 0", () => {
      const result = setStockQuantitySchema.safeParse({
        quantite: 0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans motif (optionnel)", () => {
      const result = setStockQuantitySchema.safeParse({
        quantite: 50,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantite négative", () => {
      const result = setStockQuantitySchema.safeParse({
        quantite: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite décimale", () => {
      const result = setStockQuantitySchema.safeParse({
        quantite: 25.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkStockSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const result = bulkStockSchema.safeParse({
        ids: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un seul ID", () => {
      const result = bulkStockSchema.safeParse({
        ids: [1],
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un array vide", () => {
      const result = bulkStockSchema.safeParse({
        ids: [],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant 0", () => {
      const result = bulkStockSchema.safeParse({
        ids: [1, 0, 3],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const result = bulkStockSchema.safeParse({
        ids: [1, -2, 3],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkUpdateStockSchema", () => {
    it("devrait valider une mise à jour en masse valide", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [
          { id: 1, quantite: 100, quantite_minimum: 10 },
          { id: 2, quantite: 200, quantite_minimum: 20 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement quantite", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [
          { id: 1, quantite: 100 },
          { id: 2, quantite: 200 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement quantite_minimum", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [
          { id: 1, quantite_minimum: 10 },
          { id: 2, quantite_minimum: 20 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un seul stock", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [{ id: 1, quantite: 100 }],
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un array vide", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [{ quantite: 100 }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite négative", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [{ id: 1, quantite: -10 }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_minimum négative", () => {
      const result = bulkUpdateStockSchema.safeParse({
        stocks: [{ id: 1, quantite_minimum: -5 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkStockAvailabilitySchema", () => {
    it("devrait valider une vérification de disponibilité valide", () => {
      const result = checkStockAvailabilitySchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite_demandee: 3,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantite_demandee à 0", () => {
      const result = checkStockAvailabilitySchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite_demandee: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_demandee négative", () => {
      const result = checkStockAvailabilitySchema.safeParse({
        article_id: 10,
        taille_id: 5,
        quantite_demandee: -2,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = checkStockAvailabilitySchema.safeParse({
        taille_id: 5,
        quantite_demandee: 3,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant", () => {
      const result = checkStockAvailabilitySchema.safeParse({
        article_id: 10,
        quantite_demandee: 3,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkAdjustStockSchema", () => {
    it("devrait valider un ajustement en masse valide", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [
          { article_id: 10, taille_id: 5, quantite: 50 },
          { article_id: 11, taille_id: 6, quantite: -10 },
        ],
        motif: "Réapprovisionnement mensuel",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un seul ajustement", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ article_id: 10, taille_id: 5, quantite: 20 }],
        motif: "Test",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des quantités positives et négatives", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [
          { article_id: 10, taille_id: 5, quantite: 100 },
          { article_id: 11, taille_id: 6, quantite: -50 },
          { article_id: 12, taille_id: 7, quantite: 25 },
        ],
        motif: "Ajustement mixte",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un array vide", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [],
        motif: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si motif est manquant", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ article_id: 10, taille_id: 5, quantite: 20 }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif vide", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ article_id: 10, taille_id: 5, quantite: 20 }],
        motif: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite à 0", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ article_id: 10, taille_id: 5, quantite: 0 }],
        motif: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ taille_id: 5, quantite: 20 }],
        motif: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ article_id: 10, quantite: 20 }],
        motif: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquante", () => {
      const result = bulkAdjustStockSchema.safeParse({
        adjustments: [{ article_id: 10, taille_id: 5 }],
        motif: "Test",
      });
      expect(result.success).toBe(false);
    });
  });
});
