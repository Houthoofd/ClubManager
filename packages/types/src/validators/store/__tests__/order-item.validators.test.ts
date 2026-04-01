/**
 * Tests pour les validators d'order items du store
 * Test de tous les schémas Zod dans order-item.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  orderItemSchema,
  createOrderItemSchema,
  updateOrderItemSchema,
  orderItemIdParamSchema,
  orderItemsByOrderParamSchema,
  orderItemsByArticleParamSchema,
  orderItemQuerySchema,
  bulkOrderItemSchema,
  addOrderItemsSchema,
  updateOrderItemQuantitySchema,
  calculateOrderItemTotalSchema,
  validateOrderItemsSchema,
} from "../order-item.validators.js";
import { ORDER_ITEM_CONSTRAINTS } from "../../../constants/store.constants.js";

describe("OrderItem Validators", () => {
  describe("orderItemSchema", () => {
    it("devrait valider un order item valide avec tous les champs", () => {
      const validOrderItem = {
        id: 1,
        commande_id: 10,
        article_id: 5,
        taille_id: 2,
        quantite: 3,
        prix: 49.99,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.commande_id).toBe(10);
        expect(result.data.article_id).toBe(5);
        expect(result.data.taille_id).toBe(2);
        expect(result.data.quantite).toBe(3);
        expect(result.data.prix).toBe(49.99);
      }
    });

    it("devrait valider avec quantite à 1 (minimum)", () => {
      const validOrderItem = {
        id: 2,
        commande_id: 11,
        article_id: 6,
        taille_id: 3,
        quantite: 1,
        prix: 25.5,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(1);
      }
    });

    it("devrait valider avec une grande quantite", () => {
      const validOrderItem = {
        id: 3,
        commande_id: 12,
        article_id: 7,
        taille_id: 4,
        quantite: 1000,
        prix: 10.0,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(1000);
      }
    });

    it("devrait valider avec prix à 0 (minimum)", () => {
      const validOrderItem = {
        id: 4,
        commande_id: 13,
        article_id: 8,
        taille_id: 5,
        quantite: 1,
        prix: 0,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(0);
      }
    });

    it("devrait valider avec prix à 99999999.99 (maximum)", () => {
      const validOrderItem = {
        id: 5,
        commande_id: 14,
        article_id: 9,
        taille_id: 6,
        quantite: 1,
        prix: 99999999.99,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(99999999.99);
      }
    });

    it("devrait valider avec prix entier sans décimales", () => {
      const validOrderItem = {
        id: 6,
        commande_id: 15,
        article_id: 10,
        taille_id: 7,
        quantite: 2,
        prix: 50,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(50);
      }
    });

    it("devrait valider avec prix à 1 décimale", () => {
      const validOrderItem = {
        id: 7,
        commande_id: 16,
        article_id: 11,
        taille_id: 8,
        quantite: 5,
        prix: 19.5,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(19.5);
      }
    });

    it("devrait valider avec prix à 2 décimales", () => {
      const validOrderItem = {
        id: 8,
        commande_id: 17,
        article_id: 12,
        taille_id: 9,
        quantite: 3,
        prix: 99.99,
      };
      const result = orderItemSchema.safeParse(validOrderItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(99.99);
      }
    });

    it("devrait rejeter un prix avec 3 décimales", () => {
      const invalidOrderItem = {
        id: 9,
        commande_id: 18,
        article_id: 13,
        taille_id: 10,
        quantite: 1,
        prix: 49.999,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("2 décimales");
      }
    });

    it("devrait rejeter un prix avec 4 décimales", () => {
      const invalidOrderItem = {
        id: 10,
        commande_id: 19,
        article_id: 14,
        taille_id: 11,
        quantite: 2,
        prix: 25.1234,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("2 décimales");
      }
    });

    it("devrait rejeter un prix négatif", () => {
      const invalidOrderItem = {
        id: 11,
        commande_id: 20,
        article_id: 15,
        taille_id: 12,
        quantite: 1,
        prix: -10.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("supérieur ou égal à 0");
      }
    });

    it("devrait rejeter un prix supérieur au maximum", () => {
      const invalidOrderItem = {
        id: 12,
        commande_id: 21,
        article_id: 16,
        taille_id: 13,
        quantite: 1,
        prix: 100000000,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ne peut pas dépasser 99999999.99");
      }
    });

    it("devrait rejeter quantite à 0", () => {
      const invalidOrderItem = {
        id: 13,
        commande_id: 22,
        article_id: 17,
        taille_id: 14,
        quantite: 0,
        prix: 20.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("supérieure ou égale à 1");
      }
    });

    it("devrait rejeter quantite négative", () => {
      const invalidOrderItem = {
        id: 14,
        commande_id: 23,
        article_id: 18,
        taille_id: 15,
        quantite: -5,
        prix: 30.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("supérieure ou égale à 1");
      }
    });

    it("devrait rejeter quantite décimale", () => {
      const invalidOrderItem = {
        id: 15,
        commande_id: 24,
        article_id: 19,
        taille_id: 16,
        quantite: 2.5,
        prix: 15.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre entier");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidOrderItem = {
        commande_id: 25,
        article_id: 20,
        taille_id: 17,
        quantite: 1,
        prix: 40.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id est manquant", () => {
      const invalidOrderItem = {
        id: 16,
        article_id: 21,
        taille_id: 18,
        quantite: 1,
        prix: 50.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidOrderItem = {
        id: 17,
        commande_id: 26,
        taille_id: 19,
        quantite: 1,
        prix: 60.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant", () => {
      const invalidOrderItem = {
        id: 18,
        commande_id: 27,
        article_id: 22,
        quantite: 1,
        prix: 70.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquant", () => {
      const invalidOrderItem = {
        id: 19,
        commande_id: 28,
        article_id: 23,
        taille_id: 20,
        prix: 80.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix est manquant", () => {
      const invalidOrderItem = {
        id: 20,
        commande_id: 29,
        article_id: 24,
        taille_id: 21,
        quantite: 1,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidOrderItem = {
        id: 0,
        commande_id: 30,
        article_id: 25,
        taille_id: 22,
        quantite: 1,
        prix: 90.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidOrderItem = {
        id: -1,
        commande_id: 31,
        article_id: 26,
        taille_id: 23,
        quantite: 1,
        prix: 100.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id est 0", () => {
      const invalidOrderItem = {
        id: 21,
        commande_id: 0,
        article_id: 27,
        taille_id: 24,
        quantite: 1,
        prix: 110.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id est négatif", () => {
      const invalidOrderItem = {
        id: 22,
        commande_id: -5,
        article_id: 28,
        taille_id: 25,
        quantite: 1,
        prix: 120.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const invalidOrderItem = {
        id: 23,
        commande_id: 32,
        article_id: 0,
        taille_id: 26,
        quantite: 1,
        prix: 130.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est négatif", () => {
      const invalidOrderItem = {
        id: 24,
        commande_id: 33,
        article_id: -3,
        taille_id: 27,
        quantite: 1,
        prix: 140.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est 0", () => {
      const invalidOrderItem = {
        id: 25,
        commande_id: 34,
        article_id: 29,
        taille_id: 0,
        quantite: 1,
        prix: 150.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est négatif", () => {
      const invalidOrderItem = {
        id: 26,
        commande_id: 35,
        article_id: 30,
        taille_id: -2,
        quantite: 1,
        prix: 160.0,
      };
      const result = orderItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
    });
  });

  describe("createOrderItemSchema", () => {
    it("devrait valider une création avec tous les champs requis", () => {
      const validCreate = {
        commande_id: 10,
        article_id: 5,
        taille_id: 2,
        quantite: 3,
        prix: 49.99,
      };
      const result = createOrderItemSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe(10);
        expect(result.data.article_id).toBe(5);
        expect(result.data.taille_id).toBe(2);
        expect(result.data.quantite).toBe(3);
        expect(result.data.prix).toBe(49.99);
      }
    });

    it("devrait valider avec quantite minimum (1)", () => {
      const validCreate = {
        commande_id: 11,
        article_id: 6,
        taille_id: 3,
        quantite: 1,
        prix: 25.0,
      };
      const result = createOrderItemSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix minimum (0)", () => {
      const validCreate = {
        commande_id: 12,
        article_id: 7,
        taille_id: 4,
        quantite: 1,
        prix: 0,
      };
      const result = createOrderItemSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix maximum (99999999.99)", () => {
      const validCreate = {
        commande_id: 13,
        article_id: 8,
        taille_id: 5,
        quantite: 1,
        prix: 99999999.99,
      };
      const result = createOrderItemSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix à 2 décimales", () => {
      const validCreate = {
        commande_id: 14,
        article_id: 9,
        taille_id: 6,
        quantite: 2,
        prix: 19.99,
      };
      const result = createOrderItemSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec grande quantite", () => {
      const validCreate = {
        commande_id: 15,
        article_id: 10,
        taille_id: 7,
        quantite: 500,
        prix: 10.0,
      };
      const result = createOrderItemSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si commande_id est manquant", () => {
      const invalidCreate = {
        article_id: 11,
        taille_id: 8,
        quantite: 1,
        prix: 30.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidCreate = {
        commande_id: 16,
        taille_id: 9,
        quantite: 1,
        prix: 40.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant", () => {
      const invalidCreate = {
        commande_id: 17,
        article_id: 12,
        quantite: 1,
        prix: 50.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquant", () => {
      const invalidCreate = {
        commande_id: 18,
        article_id: 13,
        taille_id: 10,
        prix: 60.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix est manquant", () => {
      const invalidCreate = {
        commande_id: 19,
        article_id: 14,
        taille_id: 11,
        quantite: 1,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite à 0", () => {
      const invalidCreate = {
        commande_id: 20,
        article_id: 15,
        taille_id: 12,
        quantite: 0,
        prix: 70.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite négative", () => {
      const invalidCreate = {
        commande_id: 21,
        article_id: 16,
        taille_id: 13,
        quantite: -1,
        prix: 80.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix négatif", () => {
      const invalidCreate = {
        commande_id: 22,
        article_id: 17,
        taille_id: 14,
        quantite: 1,
        prix: -10.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix supérieur au maximum", () => {
      const invalidCreate = {
        commande_id: 23,
        article_id: 18,
        taille_id: 15,
        quantite: 1,
        prix: 100000000,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix avec 3 décimales", () => {
      const invalidCreate = {
        commande_id: 24,
        article_id: 19,
        taille_id: 16,
        quantite: 1,
        prix: 19.999,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id est 0", () => {
      const invalidCreate = {
        commande_id: 0,
        article_id: 20,
        taille_id: 17,
        quantite: 1,
        prix: 90.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const invalidCreate = {
        commande_id: 25,
        article_id: 0,
        taille_id: 18,
        quantite: 1,
        prix: 100.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est 0", () => {
      const invalidCreate = {
        commande_id: 26,
        article_id: 21,
        taille_id: 0,
        quantite: 1,
        prix: 110.0,
      };
      const result = createOrderItemSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderItemSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        quantite: 5,
        prix: 39.99,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(5);
        expect(result.data.prix).toBe(39.99);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement quantite", () => {
      const validUpdate = {
        quantite: 10,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(10);
      }
    });

    it("devrait valider avec seulement prix", () => {
      const validUpdate = {
        prix: 29.99,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix).toBe(29.99);
      }
    });

    it("devrait valider avec quantite à 1 (minimum)", () => {
      const validUpdate = {
        quantite: 1,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix à 0 (minimum)", () => {
      const validUpdate = {
        prix: 0,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix maximum", () => {
      const validUpdate = {
        prix: 99999999.99,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix à 2 décimales", () => {
      const validUpdate = {
        prix: 45.75,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec grande quantite", () => {
      const validUpdate = {
        quantite: 999,
      };
      const result = updateOrderItemSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter quantite à 0", () => {
      const invalidUpdate = {
        quantite: 0,
      };
      const result = updateOrderItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite négative", () => {
      const invalidUpdate = {
        quantite: -3,
      };
      const result = updateOrderItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite décimale", () => {
      const invalidUpdate = {
        quantite: 2.5,
      };
      const result = updateOrderItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix négatif", () => {
      const invalidUpdate = {
        prix: -5.0,
      };
      const result = updateOrderItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix supérieur au maximum", () => {
      const invalidUpdate = {
        prix: 100000000,
      };
      const result = updateOrderItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix avec 3 décimales", () => {
      const invalidUpdate = {
        prix: 25.999,
      };
      const result = updateOrderItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("orderItemIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "123",
      };
      const result = orderItemIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait valider un ID de 1", () => {
      const validParam = {
        id: "1",
      };
      const result = orderItemIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = orderItemIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "456",
      };
      const result = orderItemIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
        expect(result.data.id).toBe(456);
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-5",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères alphanumériques", () => {
      const invalidParam = {
        id: "12abc",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "12.5",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const invalidParam = {
        id: "  123  ",
      };
      const result = orderItemIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("orderItemsByOrderParamSchema", () => {
    it("devrait valider un commande_id valide en string", () => {
      const validParam = {
        commande_id: "50",
      };
      const result = orderItemsByOrderParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe(50);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        commande_id: "100",
      };
      const result = orderItemsByOrderParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.commande_id).toBe("number");
      }
    });

    it("devrait rejeter si commande_id est manquant", () => {
      const invalidParam = {};
      const result = orderItemsByOrderParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter commande_id à 0", () => {
      const invalidParam = {
        commande_id: "0",
      };
      const result = orderItemsByOrderParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter commande_id négatif", () => {
      const invalidParam = {
        commande_id: "-10",
      };
      const result = orderItemsByOrderParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter commande_id non numérique", () => {
      const invalidParam = {
        commande_id: "abc",
      };
      const result = orderItemsByOrderParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("orderItemsByArticleParamSchema", () => {
    it("devrait valider un article_id valide en string", () => {
      const validParam = {
        article_id: "25",
      };
      const result = orderItemsByArticleParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(25);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        article_id: "75",
      };
      const result = orderItemsByArticleParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.article_id).toBe("number");
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const invalidParam = {};
      const result = orderItemsByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_id à 0", () => {
      const invalidParam = {
        article_id: "0",
      };
      const result = orderItemsByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_id négatif", () => {
      const invalidParam = {
        article_id: "-5",
      };
      const result = orderItemsByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_id non numérique", () => {
      const invalidParam = {
        article_id: "xyz",
      };
      const result = orderItemsByArticleParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("orderItemQuerySchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        commande_id: "10",
        article_id: "5",
        taille_id: "2",
        quantite_min: "1",
        quantite_max: "10",
        prix_min: "10.00",
        prix_max: "100.00",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe(10);
        expect(result.data.article_id).toBe(5);
        expect(result.data.taille_id).toBe(2);
        expect(result.data.quantite_min).toBe(1);
        expect(result.data.quantite_max).toBe(10);
        expect(result.data.prix_min).toBe(10);
        expect(result.data.prix_max).toBe(100);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement commande_id", () => {
      const validQuery = {
        commande_id: "15",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe(15);
      }
    });

    it("devrait valider avec seulement article_id", () => {
      const validQuery = {
        article_id: "20",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(20);
      }
    });

    it("devrait valider avec seulement taille_id", () => {
      const validQuery = {
        taille_id: "3",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille_id).toBe(3);
      }
    });

    it("devrait valider avec seulement quantite_min", () => {
      const validQuery = {
        quantite_min: "5",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite_min).toBe(5);
      }
    });

    it("devrait valider avec seulement quantite_max", () => {
      const validQuery = {
        quantite_max: "50",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite_max).toBe(50);
      }
    });

    it("devrait valider avec seulement prix_min", () => {
      const validQuery = {
        prix_min: "20.00",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix_min).toBe(20);
      }
    });

    it("devrait valider avec seulement prix_max", () => {
      const validQuery = {
        prix_max: "200.00",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix_max).toBe(200);
      }
    });

    it("devrait valider avec quantite_min et quantite_max", () => {
      const validQuery = {
        quantite_min: "1",
        quantite_max: "100",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite_min).toBe(1);
        expect(result.data.quantite_max).toBe(100);
      }
    });

    it("devrait valider avec prix_min et prix_max", () => {
      const validQuery = {
        prix_min: "10.00",
        prix_max: "50.00",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prix_min).toBe(10);
        expect(result.data.prix_max).toBe(50);
      }
    });

    it("devrait coercer une string en nombre pour commande_id", () => {
      const validQuery = {
        commande_id: "25",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.commande_id).toBe("number");
        expect(result.data.commande_id).toBe(25);
      }
    });

    it("devrait coercer une string en nombre pour article_id", () => {
      const validQuery = {
        article_id: "30",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.article_id).toBe("number");
      }
    });

    it("devrait coercer une string en nombre pour quantite_min", () => {
      const validQuery = {
        quantite_min: "2",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.quantite_min).toBe("number");
      }
    });

    it("devrait coercer une string en nombre pour prix_max", () => {
      const validQuery = {
        prix_max: "99.99",
      };
      const result = orderItemQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.prix_max).toBe("number");
      }
    });

    it("devrait rejeter commande_id à 0", () => {
      const invalidQuery = {
        commande_id: "0",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter commande_id négatif", () => {
      const invalidQuery = {
        commande_id: "-5",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_id à 0", () => {
      const invalidQuery = {
        article_id: "0",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter taille_id à 0", () => {
      const invalidQuery = {
        taille_id: "0",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite_min à 0", () => {
      const invalidQuery = {
        quantite_min: "0",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite_max à 0", () => {
      const invalidQuery = {
        quantite_max: "0",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix_min négatif", () => {
      const invalidQuery = {
        prix_min: "-10",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix_max négatif", () => {
      const invalidQuery = {
        prix_max: "-20",
      };
      const result = orderItemQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkOrderItemSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        ids: [1, 2, 3, 4, 5],
      };
      const result = bulkOrderItemSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        ids: [1],
      };
      const result = bulkOrderItemSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids.length).toBe(1);
      }
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        ids: [10, 20, 30, 40],
      };
      const result = bulkOrderItemSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux IDs", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        ids: manyIds,
      };
      const result = bulkOrderItemSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids.length).toBe(100);
      }
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        ids: [5, 2, 8, 1, 3],
      };
      const result = bulkOrderItemSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués (pas de contrainte unique dans le schéma)", () => {
      const validBulk = {
        ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkOrderItemSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        ids: [],
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins un ID est requis");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        ids: [1, 2, 0, 3],
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        ids: [1, 2, -5, 3],
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        ids: [1, 2, "3", 4],
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        ids: [1, 2, 3.5, 4],
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        ids: [1, 2, null, 3],
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ids n'est pas un array", () => {
      const invalidBulk = {
        ids: 123,
      };
      const result = bulkOrderItemSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  describe("addOrderItemsSchema", () => {
    it("devrait valider un ajout d'items valide", () => {
      const validAdd = {
        commande_id: 10,
        items: [
          { article_id: 1, taille_id: 2, quantite: 3, prix: 49.99 },
          { article_id: 2, taille_id: 3, quantite: 1, prix: 25.0 },
        ],
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe(10);
        expect(result.data.items.length).toBe(2);
        expect(result.data.items[0].article_id).toBe(1);
        expect(result.data.items[0].quantite).toBe(3);
        expect(result.data.items[0].prix).toBe(49.99);
      }
    });

    it("devrait valider avec un seul item", () => {
      const validAdd = {
        commande_id: 15,
        items: [{ article_id: 5, taille_id: 6, quantite: 2, prix: 30.0 }],
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
      }
    });

    it("devrait valider avec plusieurs items", () => {
      const validAdd = {
        commande_id: 20,
        items: [
          { article_id: 1, taille_id: 1, quantite: 1, prix: 10.0 },
          { article_id: 2, taille_id: 2, quantite: 2, prix: 20.0 },
          { article_id: 3, taille_id: 3, quantite: 3, prix: 30.0 },
        ],
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(3);
      }
    });

    it("devrait valider avec 100 items (maximum)", () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        article_id: i + 1,
        taille_id: 1,
        quantite: 1,
        prix: 10.0,
      }));
      const validAdd = {
        commande_id: 25,
        items,
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(100);
      }
    });

    it("devrait valider avec prix à 0", () => {
      const validAdd = {
        commande_id: 30,
        items: [{ article_id: 10, taille_id: 5, quantite: 1, prix: 0 }],
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix maximum", () => {
      const validAdd = {
        commande_id: 35,
        items: [
          { article_id: 15, taille_id: 7, quantite: 1, prix: 99999999.99 },
        ],
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix à 2 décimales", () => {
      const validAdd = {
        commande_id: 40,
        items: [{ article_id: 20, taille_id: 8, quantite: 2, prix: 45.75 }],
      };
      const result = addOrderItemsSchema.safeParse(validAdd);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si commande_id est manquant", () => {
      const invalidAdd = {
        items: [{ article_id: 1, taille_id: 2, quantite: 1, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si items est manquant", () => {
      const invalidAdd = {
        commande_id: 45,
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array items vide", () => {
      const invalidAdd = {
        commande_id: 50,
        items: [],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Au moins un article est requis"
        );
      }
    });

    it("devrait rejeter avec plus de 100 items", () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        article_id: i + 1,
        taille_id: 1,
        quantite: 1,
        prix: 10.0,
      }));
      const invalidAdd = {
        commande_id: 55,
        items,
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Maximum 100 articles par commande"
        );
      }
    });

    it("devrait rejeter si article_id est manquant dans un item", () => {
      const invalidAdd = {
        commande_id: 60,
        items: [{ taille_id: 2, quantite: 1, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant dans un item", () => {
      const invalidAdd = {
        commande_id: 65,
        items: [{ article_id: 1, quantite: 1, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquant dans un item", () => {
      const invalidAdd = {
        commande_id: 70,
        items: [{ article_id: 1, taille_id: 2, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix est manquant dans un item", () => {
      const invalidAdd = {
        commande_id: 75,
        items: [{ article_id: 1, taille_id: 2, quantite: 1 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id est 0", () => {
      const invalidAdd = {
        commande_id: 0,
        items: [{ article_id: 1, taille_id: 2, quantite: 1, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0 dans un item", () => {
      const invalidAdd = {
        commande_id: 80,
        items: [{ article_id: 0, taille_id: 2, quantite: 1, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est 0 dans un item", () => {
      const invalidAdd = {
        commande_id: 85,
        items: [{ article_id: 1, taille_id: 0, quantite: 1, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est 0 dans un item", () => {
      const invalidAdd = {
        commande_id: 90,
        items: [{ article_id: 1, taille_id: 2, quantite: 0, prix: 10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix est négatif dans un item", () => {
      const invalidAdd = {
        commande_id: 95,
        items: [{ article_id: 1, taille_id: 2, quantite: 1, prix: -10.0 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix dépasse le maximum dans un item", () => {
      const invalidAdd = {
        commande_id: 100,
        items: [{ article_id: 1, taille_id: 2, quantite: 1, prix: 100000000 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix a 3 décimales dans un item", () => {
      const invalidAdd = {
        commande_id: 105,
        items: [{ article_id: 1, taille_id: 2, quantite: 1, prix: 10.999 }],
      };
      const result = addOrderItemsSchema.safeParse(invalidAdd);
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderItemQuantitySchema", () => {
    it("devrait valider une mise à jour de quantité valide", () => {
      const validUpdate = {
        quantite: 5,
      };
      const result = updateOrderItemQuantitySchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(5);
      }
    });

    it("devrait valider avec quantite à 1 (minimum)", () => {
      const validUpdate = {
        quantite: 1,
      };
      const result = updateOrderItemQuantitySchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(1);
      }
    });

    it("devrait valider avec une grande quantite", () => {
      const validUpdate = {
        quantite: 1000,
      };
      const result = updateOrderItemQuantitySchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite).toBe(1000);
      }
    });

    it("devrait rejeter si quantite est manquant", () => {
      const invalidUpdate = {};
      const result = updateOrderItemQuantitySchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite à 0", () => {
      const invalidUpdate = {
        quantite: 0,
      };
      const result = updateOrderItemQuantitySchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "supérieure ou égale à 1"
        );
      }
    });

    it("devrait rejeter quantite négative", () => {
      const invalidUpdate = {
        quantite: -5,
      };
      const result = updateOrderItemQuantitySchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "supérieure ou égale à 1"
        );
      }
    });

    it("devrait rejeter quantite décimale", () => {
      const invalidUpdate = {
        quantite: 3.5,
      };
      const result = updateOrderItemQuantitySchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre entier");
      }
    });

    it("devrait rejeter quantite en string", () => {
      const invalidUpdate = {
        quantite: "10",
      };
      const result = updateOrderItemQuantitySchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("calculateOrderItemTotalSchema", () => {
    it("devrait valider un calcul de total valide", () => {
      const validCalculation = {
        items: [
          { quantite: 2, prix: 49.99 },
          { quantite: 1, prix: 25.0 },
          { quantite: 3, prix: 15.5 },
        ],
      };
      const result = calculateOrderItemTotalSchema.safeParse(validCalculation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(3);
        expect(result.data.items[0].quantite).toBe(2);
        expect(result.data.items[0].prix).toBe(49.99);
      }
    });

    it("devrait valider avec un seul item", () => {
      const validCalculation = {
        items: [{ quantite: 5, prix: 19.99 }],
      };
      const result = calculateOrderItemTotalSchema.safeParse(validCalculation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
      }
    });

    it("devrait valider avec plusieurs items", () => {
      const validCalculation = {
        items: [
          { quantite: 1, prix: 10.0 },
          { quantite: 2, prix: 20.0 },
          { quantite: 3, prix: 30.0 },
          { quantite: 4, prix: 40.0 },
        ],
      };
      const result = calculateOrderItemTotalSchema.safeParse(validCalculation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(4);
      }
    });

    it("devrait valider avec quantite à 1", () => {
      const validCalculation = {
        items: [{ quantite: 1, prix: 50.0 }],
      };
      const result = calculateOrderItemTotalSchema.safeParse(validCalculation);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec prix à 0", () => {
      const validCalculation = {
        items: [{ quantite: 5, prix: 0 }],
      };
      const result = calculateOrderItemTotalSchema.safeParse(validCalculation);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux items", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        quantite: i + 1,
        prix: (i + 1) * 10,
      }));
      const validCalculation = {
        items,
      };
      const result = calculateOrderItemTotalSchema.safeParse(validCalculation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(50);
      }
    });

    it("devrait rejeter si items est manquant", () => {
      const invalidCalculation = {};
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array items vide", () => {
      const invalidCalculation = {
        items: [],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Au moins un article est requis"
        );
      }
    });

    it("devrait rejeter si quantite est manquant dans un item", () => {
      const invalidCalculation = {
        items: [{ prix: 10.0 }],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si prix est manquant dans un item", () => {
      const invalidCalculation = {
        items: [{ quantite: 1 }],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite à 0", () => {
      const invalidCalculation = {
        items: [{ quantite: 0, prix: 10.0 }],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite négative", () => {
      const invalidCalculation = {
        items: [{ quantite: -5, prix: 10.0 }],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite décimale", () => {
      const invalidCalculation = {
        items: [{ quantite: 2.5, prix: 10.0 }],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter prix négatif", () => {
      const invalidCalculation = {
        items: [{ quantite: 1, prix: -10.0 }],
      };
      const result =
        calculateOrderItemTotalSchema.safeParse(invalidCalculation);
      expect(result.success).toBe(false);
    });
  });

  describe("validateOrderItemsSchema", () => {
    it("devrait valider une validation d'items valide", () => {
      const validValidation = {
        items: [
          { article_id: 1, taille_id: 2, quantite: 3 },
          { article_id: 2, taille_id: 3, quantite: 1 },
        ],
      };
      const result = validateOrderItemsSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.items[0].article_id).toBe(1);
        expect(result.data.items[0].taille_id).toBe(2);
        expect(result.data.items[0].quantite).toBe(3);
      }
    });

    it("devrait valider avec un seul item", () => {
      const validValidation = {
        items: [{ article_id: 5, taille_id: 6, quantite: 2 }],
      };
      const result = validateOrderItemsSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(1);
      }
    });

    it("devrait valider avec plusieurs items", () => {
      const validValidation = {
        items: [
          { article_id: 1, taille_id: 1, quantite: 1 },
          { article_id: 2, taille_id: 2, quantite: 2 },
          { article_id: 3, taille_id: 3, quantite: 3 },
        ],
      };
      const result = validateOrderItemsSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(3);
      }
    });

    it("devrait valider avec quantite minimum (1)", () => {
      const validValidation = {
        items: [{ article_id: 10, taille_id: 5, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec grande quantite", () => {
      const validValidation = {
        items: [{ article_id: 15, taille_id: 7, quantite: 1000 }],
      };
      const result = validateOrderItemsSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux items", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        article_id: i + 1,
        taille_id: 1,
        quantite: 1,
      }));
      const validValidation = {
        items,
      };
      const result = validateOrderItemsSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(50);
      }
    });

    it("devrait rejeter si items est manquant", () => {
      const invalidValidation = {};
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array items vide", () => {
      const invalidValidation = {
        items: [],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Au moins un article est requis"
        );
      }
    });

    it("devrait rejeter si article_id est manquant dans un item", () => {
      const invalidValidation = {
        items: [{ taille_id: 2, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est manquant dans un item", () => {
      const invalidValidation = {
        items: [{ article_id: 1, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est manquant dans un item", () => {
      const invalidValidation = {
        items: [{ article_id: 1, taille_id: 2 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const invalidValidation = {
        items: [{ article_id: 0, taille_id: 2, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est 0", () => {
      const invalidValidation = {
        items: [{ article_id: 1, taille_id: 0, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est 0", () => {
      const invalidValidation = {
        items: [{ article_id: 1, taille_id: 2, quantite: 0 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est négative", () => {
      const invalidValidation = {
        items: [{ article_id: 1, taille_id: 2, quantite: -5 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite est décimale", () => {
      const invalidValidation = {
        items: [{ article_id: 1, taille_id: 2, quantite: 2.5 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est négatif", () => {
      const invalidValidation = {
        items: [{ article_id: -1, taille_id: 2, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille_id est négatif", () => {
      const invalidValidation = {
        items: [{ article_id: 1, taille_id: -2, quantite: 1 }],
      };
      const result = validateOrderItemsSchema.safeParse(invalidValidation);
      expect(result.success).toBe(false);
    });
  });
});
