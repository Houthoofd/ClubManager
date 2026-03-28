/**
 * Tests pour les validators de commandes du store
 * Test de tous les schémas Zod dans order.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  orderSchema,
  createOrderSchema,
  updateOrderSchema,
  orderIdParamSchema,
  orderUniqueIdParamSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
  bulkOrderSchema,
  bulkUpdateOrderStatusSchema,
  cancelOrderSchema,
  orderStatsQuerySchema,
  validateOrderNumberSchema,
} from "../order.validators.js";
import { ORDER_CONSTRAINTS } from "../../../constants/store.constants.js";
import { OrderStatus } from "../../../enums/store.enums.js";

describe("Order Validators", () => {
  describe("orderSchema", () => {
    it("devrait valider une commande valide avec tous les champs", () => {
      const validOrder = {
        id: 1,
        unique_id: "550e8400-e29b-41d4-a716-446655440000",
        numero_commande: "CMD-2024-001",
        utilisateur_id: 10,
        total: 149.99,
        date_commande: new Date("2024-01-15T10:00:00Z"),
        statut: OrderStatus.PAID,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-16T10:00:00Z"),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.unique_id).toBe(
          "550e8400-e29b-41d4-a716-446655440000",
        );
        expect(result.data.numero_commande).toBe("CMD-2024-001");
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.total).toBe(149.99);
        expect(result.data.statut).toBe(OrderStatus.PAID);
        expect(result.data.ip_address).toBe("192.168.1.1");
      }
    });

    it("devrait valider avec unique_id à null", () => {
      const validOrder = {
        id: 2,
        unique_id: null,
        numero_commande: "CMD-2024-002",
        utilisateur_id: 5,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec unique_id optionnel (undefined)", () => {
      const validOrder = {
        id: 3,
        numero_commande: "CMD-2024-003",
        utilisateur_id: 8,
        total: 25.5,
        date_commande: new Date(),
        statut: OrderStatus.SHIPPED,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec numero_commande à null", () => {
      const validOrder = {
        id: 4,
        numero_commande: null,
        utilisateur_id: 12,
        total: 100.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec numero_commande optionnel (undefined)", () => {
      const validOrder = {
        id: 5,
        utilisateur_id: 15,
        total: 75.0,
        date_commande: new Date(),
        statut: OrderStatus.DELIVERED,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec ip_address à null", () => {
      const validOrder = {
        id: 6,
        utilisateur_id: 20,
        total: 200.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        ip_address: null,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec ip_address optionnel (undefined)", () => {
      const validOrder = {
        id: 7,
        utilisateur_id: 25,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec user_agent à null", () => {
      const validOrder = {
        id: 8,
        utilisateur_id: 30,
        total: 150.0,
        date_commande: new Date(),
        statut: OrderStatus.SHIPPED,
        user_agent: null,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec user_agent optionnel (undefined)", () => {
      const validOrder = {
        id: 9,
        utilisateur_id: 35,
        total: 99.99,
        date_commande: new Date(),
        statut: OrderStatus.DELIVERED,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at à null", () => {
      const validOrder = {
        id: 10,
        utilisateur_id: 40,
        total: 45.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
        updated_at: null,
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at optionnel (undefined)", () => {
      const validOrder = {
        id: 11,
        utilisateur_id: 45,
        total: 120.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total par défaut à 0", () => {
      const validOrder = {
        id: 12,
        utilisateur_id: 50,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
      }
    });

    it("devrait valider avec statut par défaut à en_attente", () => {
      const validOrder = {
        id: 13,
        utilisateur_id: 55,
        total: 100.0,
        date_commande: new Date(),
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe(OrderStatus.PENDING);
      }
    });

    it("devrait valider avec tous les statuts possibles - en_attente", () => {
      const validOrder = {
        id: 14,
        utilisateur_id: 60,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("en_attente");
      }
    });

    it("devrait valider avec statut payee", () => {
      const validOrder = {
        id: 15,
        utilisateur_id: 65,
        total: 75.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("payee");
      }
    });

    it("devrait valider avec statut expediee", () => {
      const validOrder = {
        id: 16,
        utilisateur_id: 70,
        total: 100.0,
        date_commande: new Date(),
        statut: OrderStatus.SHIPPED,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("expediee");
      }
    });

    it("devrait valider avec statut livree", () => {
      const validOrder = {
        id: 17,
        utilisateur_id: 75,
        total: 125.0,
        date_commande: new Date(),
        statut: OrderStatus.DELIVERED,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("livree");
      }
    });

    it("devrait valider avec statut annulee", () => {
      const validOrder = {
        id: 18,
        utilisateur_id: 80,
        total: 150.0,
        date_commande: new Date(),
        statut: OrderStatus.CANCELLED,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("annulee");
      }
    });

    it("devrait valider avec total à 0 (minimum)", () => {
      const validOrder = {
        id: 19,
        utilisateur_id: 85,
        total: 0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total à 99999999.99 (maximum)", () => {
      const validOrder = {
        id: 20,
        utilisateur_id: 90,
        total: 99999999.99,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total entier sans décimales", () => {
      const validOrder = {
        id: 21,
        utilisateur_id: 95,
        total: 100,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total à 1 décimale", () => {
      const validOrder = {
        id: 22,
        utilisateur_id: 100,
        total: 49.5,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total à 2 décimales", () => {
      const validOrder = {
        id: 23,
        utilisateur_id: 105,
        total: 149.99,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec unique_id de longueur maximale (255 caractères)", () => {
      const maxUniqueId = "a".repeat(ORDER_CONSTRAINTS.UNIQUE_ID_MAX_LENGTH);
      const validOrder = {
        id: 24,
        unique_id: maxUniqueId,
        utilisateur_id: 110,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec numero_commande de longueur maximale (100 caractères)", () => {
      const maxNumero = "C".repeat(
        ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH,
      );
      const validOrder = {
        id: 25,
        numero_commande: maxNumero,
        utilisateur_id: 115,
        total: 75.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une adresse IPv4 valide", () => {
      const validOrder = {
        id: 26,
        utilisateur_id: 120,
        total: 100.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        ip_address: "192.168.0.1",
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une adresse IPv6 valide", () => {
      const validOrder = {
        id: 27,
        utilisateur_id: 125,
        total: 125.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        ip_address: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une adresse IPv6 compressée", () => {
      const validOrder = {
        id: 28,
        utilisateur_id: 130,
        total: 150.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        ip_address: "2001:db8::1",
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec user_agent de longueur maximale (65535 caractères)", () => {
      const maxUserAgent = "a".repeat(ORDER_CONSTRAINTS.USER_AGENT_MAX_LENGTH);
      const validOrder = {
        id: 29,
        utilisateur_id: 135,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        user_agent: maxUserAgent,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter unique_id trop long (> 255 caractères)", () => {
      const longUniqueId = "a".repeat(
        ORDER_CONSTRAINTS.UNIQUE_ID_MAX_LENGTH + 1,
      );
      const invalidOrder = {
        id: 30,
        unique_id: longUniqueId,
        utilisateur_id: 140,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("255");
      }
    });

    it("devrait rejeter numero_commande trop long (> 100 caractères)", () => {
      const longNumero = "C".repeat(
        ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH + 1,
      );
      const invalidOrder = {
        id: 31,
        numero_commande: longNumero,
        utilisateur_id: 145,
        total: 75.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("100");
      }
    });

    it("devrait rejeter un total négatif", () => {
      const invalidOrder = {
        id: 32,
        utilisateur_id: 150,
        total: -10.5,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("0");
      }
    });

    it("devrait rejeter un total supérieur au maximum", () => {
      const invalidOrder = {
        id: 33,
        utilisateur_id: 155,
        total: 100000000.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("99999999.99");
      }
    });

    it("devrait rejeter un total avec 3 décimales", () => {
      const invalidOrder = {
        id: 34,
        utilisateur_id: 160,
        total: 49.999,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("2 décimales");
      }
    });

    it("devrait rejeter un total avec 4 décimales", () => {
      const invalidOrder = {
        id: 35,
        utilisateur_id: 165,
        total: 149.9999,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une adresse IP invalide", () => {
      const invalidOrder = {
        id: 36,
        utilisateur_id: 170,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        ip_address: "256.256.256.256",
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une adresse IP en format texte", () => {
      const invalidOrder = {
        id: 37,
        utilisateur_id: 175,
        total: 75.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        ip_address: "not-an-ip",
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter ip_address trop longue (> 45 caractères)", () => {
      const longIp = "a".repeat(ORDER_CONSTRAINTS.IP_ADDRESS_MAX_LENGTH + 1);
      const invalidOrder = {
        id: 38,
        utilisateur_id: 180,
        total: 100.0,
        date_commande: new Date(),
        statut: OrderStatus.PAID,
        ip_address: longIp,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter user_agent trop long (> 65535 caractères)", () => {
      const longUserAgent = "a".repeat(
        ORDER_CONSTRAINTS.USER_AGENT_MAX_LENGTH + 1,
      );
      const invalidOrder = {
        id: 39,
        utilisateur_id: 185,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        user_agent: longUserAgent,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("65535");
      }
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidOrder = {
        id: 40,
        utilisateur_id: 190,
        total: 50.0,
        date_commande: new Date(),
        statut: "invalide",
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidOrder = {
        utilisateur_id: 195,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidOrder = {
        id: 41,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si created_at est manquant", () => {
      const invalidOrder = {
        id: 42,
        utilisateur_id: 200,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidOrder = {
        id: 0,
        utilisateur_id: 205,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidOrder = {
        id: -1,
        utilisateur_id: 210,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidOrder = {
        id: 43,
        utilisateur_id: 0,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidOrder = {
        id: 44,
        utilisateur_id: -5,
        total: 50.0,
        date_commande: new Date(),
        statut: OrderStatus.PENDING,
        created_at: new Date(),
      };
      const result = orderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe("createOrderSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        unique_id: "550e8400-e29b-41d4-a716-446655440000",
        numero_commande: "CMD-2024-001",
        utilisateur_id: 10,
        total: 149.99,
        date_commande: new Date("2024-01-15T10:00:00Z"),
        statut: OrderStatus.PAID,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.total).toBe(149.99);
        expect(result.data.statut).toBe(OrderStatus.PAID);
      }
    });

    it("devrait valider avec seulement utilisateur_id (champ requis)", () => {
      const validCreate = {
        utilisateur_id: 15,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et total", () => {
      const validCreate = {
        utilisateur_id: 20,
        total: 99.99,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et statut", () => {
      const validCreate = {
        utilisateur_id: 25,
        statut: OrderStatus.PENDING,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et ip_address", () => {
      const validCreate = {
        utilisateur_id: 30,
        ip_address: "10.0.0.1",
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et user_agent", () => {
      const validCreate = {
        utilisateur_id: 35,
        user_agent: "Chrome/120.0",
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec unique_id à null", () => {
      const validCreate = {
        utilisateur_id: 40,
        unique_id: null,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec numero_commande à null", () => {
      const validCreate = {
        utilisateur_id: 45,
        numero_commande: null,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec ip_address à null", () => {
      const validCreate = {
        utilisateur_id: 50,
        ip_address: null,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec user_agent à null", () => {
      const validCreate = {
        utilisateur_id: 55,
        user_agent: null,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total à 0", () => {
      const validCreate = {
        utilisateur_id: 60,
        total: 0,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total maximum", () => {
      const validCreate = {
        utilisateur_id: 65,
        total: 99999999.99,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total à 2 décimales", () => {
      const validCreate = {
        utilisateur_id: 70,
        total: 49.99,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les statuts - en_attente", () => {
      const validCreate = {
        utilisateur_id: 75,
        statut: OrderStatus.PENDING,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut payee", () => {
      const validCreate = {
        utilisateur_id: 80,
        statut: OrderStatus.PAID,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut expediee", () => {
      const validCreate = {
        utilisateur_id: 85,
        statut: OrderStatus.SHIPPED,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut livree", () => {
      const validCreate = {
        utilisateur_id: 90,
        statut: OrderStatus.DELIVERED,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut annulee", () => {
      const validCreate = {
        utilisateur_id: 95,
        statut: OrderStatus.CANCELLED,
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une adresse IPv4", () => {
      const validCreate = {
        utilisateur_id: 100,
        ip_address: "192.168.1.100",
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une adresse IPv6", () => {
      const validCreate = {
        utilisateur_id: 105,
        ip_address: "2001:db8::1",
      };
      const result = createOrderSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidCreate = {
        total: 50.0,
        statut: OrderStatus.PENDING,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un total négatif", () => {
      const invalidCreate = {
        utilisateur_id: 110,
        total: -10.5,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un total supérieur au maximum", () => {
      const invalidCreate = {
        utilisateur_id: 115,
        total: 100000000.0,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un total avec 3 décimales", () => {
      const invalidCreate = {
        utilisateur_id: 120,
        total: 49.999,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une IP invalide", () => {
      const invalidCreate = {
        utilisateur_id: 125,
        ip_address: "256.256.256.256",
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidCreate = {
        utilisateur_id: 130,
        statut: "invalide",
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter unique_id trop long", () => {
      const longUniqueId = "a".repeat(
        ORDER_CONSTRAINTS.UNIQUE_ID_MAX_LENGTH + 1,
      );
      const invalidCreate = {
        utilisateur_id: 135,
        unique_id: longUniqueId,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter numero_commande trop long", () => {
      const longNumero = "C".repeat(
        ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH + 1,
      );
      const invalidCreate = {
        utilisateur_id: 140,
        numero_commande: longNumero,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidCreate = {
        utilisateur_id: 0,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidCreate = {
        utilisateur_id: -5,
      };
      const result = createOrderSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        unique_id: "550e8400-e29b-41d4-a716-446655440000",
        numero_commande: "CMD-2024-002",
        total: 199.99,
        statut: OrderStatus.SHIPPED,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(199.99);
        expect(result.data.statut).toBe(OrderStatus.SHIPPED);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement unique_id", () => {
      const validUpdate = {
        unique_id: "new-unique-id-123",
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement numero_commande", () => {
      const validUpdate = {
        numero_commande: "CMD-2024-003",
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement total", () => {
      const validUpdate = {
        total: 75.5,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement statut", () => {
      const validUpdate = {
        statut: OrderStatus.DELIVERED,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec unique_id et numero_commande", () => {
      const validUpdate = {
        unique_id: "unique-123",
        numero_commande: "CMD-123",
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total et statut", () => {
      const validUpdate = {
        total: 150.0,
        statut: OrderStatus.PAID,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total à 0", () => {
      const validUpdate = {
        total: 0,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total maximum", () => {
      const validUpdate = {
        total: 99999999.99,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les statuts - en_attente", () => {
      const validUpdate = {
        statut: OrderStatus.PENDING,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut payee", () => {
      const validUpdate = {
        statut: OrderStatus.PAID,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut expediee", () => {
      const validUpdate = {
        statut: OrderStatus.SHIPPED,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut livree", () => {
      const validUpdate = {
        statut: OrderStatus.DELIVERED,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut annulee", () => {
      const validUpdate = {
        statut: OrderStatus.CANCELLED,
      };
      const result = updateOrderSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un total négatif", () => {
      const invalidUpdate = {
        total: -50.0,
      };
      const result = updateOrderSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un total supérieur au maximum", () => {
      const invalidUpdate = {
        total: 100000000.0,
      };
      const result = updateOrderSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un total avec 3 décimales", () => {
      const invalidUpdate = {
        total: 49.999,
      };
      const result = updateOrderSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidUpdate = {
        statut: "statut_invalide",
      };
      const result = updateOrderSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter unique_id trop long", () => {
      const longUniqueId = "a".repeat(
        ORDER_CONSTRAINTS.UNIQUE_ID_MAX_LENGTH + 1,
      );
      const invalidUpdate = {
        unique_id: longUniqueId,
      };
      const result = updateOrderSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter numero_commande trop long", () => {
      const longNumero = "C".repeat(
        ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH + 1,
      );
      const invalidUpdate = {
        numero_commande: longNumero,
      };
      const result = updateOrderSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("orderIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "42",
      };
      const result = orderIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
      }
    });

    it("devrait valider un ID de 1", () => {
      const validParam = {
        id: "1",
      };
      const result = orderIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = orderIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "123",
      };
      const result = orderIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-5",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères alphanumériques", () => {
      const invalidParam = {
        id: "123abc",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "12.34",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const invalidParam = {
        id: " 123 ",
      };
      const result = orderIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  describe("orderUniqueIdParamSchema", () => {
    it("devrait valider un unique_id valide", () => {
      const validParam = {
        unique_id: "550e8400-e29b-41d4-a716-446655440000",
      };
      const result = orderUniqueIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unique_id).toBe(
          "550e8400-e29b-41d4-a716-446655440000",
        );
      }
    });

    it("devrait valider un unique_id simple", () => {
      const validParam = {
        unique_id: "order-123",
      };
      const result = orderUniqueIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait valider un unique_id d'un seul caractère", () => {
      const validParam = {
        unique_id: "a",
      };
      const result = orderUniqueIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait valider un unique_id avec caractères spéciaux", () => {
      const validParam = {
        unique_id: "order_2024-01-15_user@123",
      };
      const result = orderUniqueIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces autour de unique_id", () => {
      const validParam = {
        unique_id: "  order-123  ",
      };
      const result = orderUniqueIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unique_id).toBe("order-123");
      }
    });

    it("devrait rejeter si unique_id est manquant", () => {
      const invalidParam = {};
      const result = orderUniqueIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        unique_id: "",
      };
      const result = orderUniqueIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une string qui devient vide après trim (comportement Zod)", () => {
      const validParam = {
        unique_id: "   ",
      };
      const result = orderUniqueIdParamSchema.safeParse(validParam);
      // Dans Zod, min(1) est appliqué AVANT trim(), donc "   " passe min(1) (longueur 3)
      // puis trim() transforme en ""
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unique_id).toBe("");
      }
    });
  });

  describe("orderQuerySchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        utilisateur_id: "10",
        statut: OrderStatus.PAID,
        numero_commande: "CMD-2024-001",
        date_min: "2024-01-01",
        date_max: "2024-12-31",
        total_min: "50",
        total_max: "500",
        sort_by: "date_commande",
        sort_order: "desc",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.statut).toBe(OrderStatus.PAID);
        expect(result.data.sort_by).toBe("date_commande");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: "25",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(25);
      }
    });

    it("devrait valider avec seulement statut", () => {
      const validQuery = {
        statut: OrderStatus.SHIPPED,
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement numero_commande", () => {
      const validQuery = {
        numero_commande: "CMD-123",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement date_min", () => {
      const validQuery = {
        date_min: "2024-01-01",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_min).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec seulement date_max", () => {
      const validQuery = {
        date_max: "2024-12-31",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_max).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec date_min et date_max", () => {
      const validQuery = {
        date_min: "2024-01-01",
        date_max: "2024-12-31",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement total_min", () => {
      const validQuery = {
        total_min: "10",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_min).toBe(10);
      }
    });

    it("devrait valider avec seulement total_max", () => {
      const validQuery = {
        total_max: "1000",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_max).toBe(1000);
      }
    });

    it("devrait valider avec total_min et total_max", () => {
      const validQuery = {
        total_min: "50",
        total_max: "500",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total_min à 0", () => {
      const validQuery = {
        total_min: "0",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec total_max à 0", () => {
      const validQuery = {
        total_max: "0",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by date_commande", () => {
      const validQuery = {
        sort_by: "date_commande",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by total", () => {
      const validQuery = {
        sort_by: "total",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by statut", () => {
      const validQuery = {
        sort_by: "statut",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by updated_at", () => {
      const validQuery = {
        sort_by: "updated_at",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by et sort_order", () => {
      const validQuery = {
        sort_by: "total",
        sort_order: "asc",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces de numero_commande", () => {
      const validQuery = {
        numero_commande: "  CMD-123  ",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numero_commande).toBe("CMD-123");
      }
    });

    it("devrait coercer une string en nombre pour utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: "42",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(42);
      }
    });

    it("devrait coercer une string en nombre pour total_min", () => {
      const validQuery = {
        total_min: "100.50",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_min).toBe(100.5);
      }
    });

    it("devrait coercer une string en nombre pour total_max", () => {
      const validQuery = {
        total_max: "999.99",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_max).toBe(999.99);
      }
    });

    it("devrait coercer une string en Date pour date_min", () => {
      const validQuery = {
        date_min: "2024-06-15",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_min).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour date_max", () => {
      const validQuery = {
        date_max: "2024-12-31",
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_max).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec tous les statuts - en_attente", () => {
      const validQuery = {
        statut: OrderStatus.PENDING,
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut payee", () => {
      const validQuery = {
        statut: OrderStatus.PAID,
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut expediee", () => {
      const validQuery = {
        statut: OrderStatus.SHIPPED,
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut livree", () => {
      const validQuery = {
        statut: OrderStatus.DELIVERED,
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut annulee", () => {
      const validQuery = {
        statut: OrderStatus.CANCELLED,
      };
      const result = orderQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter total_min négatif", () => {
      const invalidQuery = {
        total_min: "-10",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter total_max négatif", () => {
      const invalidQuery = {
        total_max: "-50",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id à 0", () => {
      const invalidQuery = {
        utilisateur_id: "0",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id négatif", () => {
      const invalidQuery = {
        utilisateur_id: "-5",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter statut invalide", () => {
      const invalidQuery = {
        statut: "invalide",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter sort_by avec une valeur invalide", () => {
      const invalidQuery = {
        sort_by: "invalid_field",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter sort_order avec une valeur invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id qui n'est pas numérique", () => {
      const invalidQuery = {
        utilisateur_id: "abc",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter total_min qui n'est pas numérique", () => {
      const invalidQuery = {
        total_min: "not-a-number",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter total_max qui n'est pas numérique", () => {
      const invalidQuery = {
        total_max: "not-a-number",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter date_min invalide", () => {
      const invalidQuery = {
        date_min: "not-a-date",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter date_max invalide", () => {
      const invalidQuery = {
        date_max: "invalid-date",
      };
      const result = orderQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderStatusSchema", () => {
    it("devrait valider avec statut en_attente", () => {
      const validStatus = {
        statut: OrderStatus.PENDING,
      };
      const result = updateOrderStatusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("en_attente");
      }
    });

    it("devrait valider avec statut payee", () => {
      const validStatus = {
        statut: OrderStatus.PAID,
      };
      const result = updateOrderStatusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("payee");
      }
    });

    it("devrait valider avec statut expediee", () => {
      const validStatus = {
        statut: OrderStatus.SHIPPED,
      };
      const result = updateOrderStatusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("expediee");
      }
    });

    it("devrait valider avec statut livree", () => {
      const validStatus = {
        statut: OrderStatus.DELIVERED,
      };
      const result = updateOrderStatusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("livree");
      }
    });

    it("devrait valider avec statut annulee", () => {
      const validStatus = {
        statut: OrderStatus.CANCELLED,
      };
      const result = updateOrderStatusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("annulee");
      }
    });

    it("devrait rejeter si statut est manquant", () => {
      const invalidStatus = {};
      const result = updateOrderStatusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidStatus = {
        statut: "statut_invalide",
      };
      const result = updateOrderStatusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidStatus = {
        statut: "",
      };
      const result = updateOrderStatusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const invalidStatus = {
        statut: null,
      };
      const result = updateOrderStatusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const invalidStatus = {
        statut: undefined,
      };
      const result = updateOrderStatusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkOrderSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        ids: [1, 2, 3, 4, 5],
      };
      const result = bulkOrderSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        ids: [42],
      };
      const result = bulkOrderSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        ids: [1, 5, 10, 15, 20, 25],
      };
      const result = bulkOrderSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux IDs", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        ids: manyIds,
      };
      const result = bulkOrderSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        ids: [5, 2, 8, 1, 10],
      };
      const result = bulkOrderSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués (pas de contrainte unique)", () => {
      const validBulk = {
        ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkOrderSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        ids: [],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Au moins un ID");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        ids: [1, 2, 0, 3],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        ids: [1, 2, -5, 3],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        ids: [1, 2, "3", 4],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        ids: [1, 2.5, 3],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        ids: [1, null, 3],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        ids: [1, undefined, 3],
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ids n'est pas un array", () => {
      const invalidBulk = {
        ids: "1,2,3",
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ids est un nombre", () => {
      const invalidBulk = {
        ids: 123,
      };
      const result = bulkOrderSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkUpdateOrderStatusSchema", () => {
    it("devrait valider une mise à jour en masse valide", () => {
      const validBulkUpdate = {
        order_ids: [1, 2, 3],
        statut: OrderStatus.SHIPPED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order_ids).toEqual([1, 2, 3]);
        expect(result.data.statut).toBe(OrderStatus.SHIPPED);
      }
    });

    it("devrait valider avec un seul order_id", () => {
      const validBulkUpdate = {
        order_ids: [10],
        statut: OrderStatus.PAID,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs order_ids", () => {
      const validBulkUpdate = {
        order_ids: [1, 5, 10, 15, 20],
        statut: OrderStatus.DELIVERED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les statuts - en_attente", () => {
      const validBulkUpdate = {
        order_ids: [1, 2],
        statut: OrderStatus.PENDING,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut payee", () => {
      const validBulkUpdate = {
        order_ids: [1, 2],
        statut: OrderStatus.PAID,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut expediee", () => {
      const validBulkUpdate = {
        order_ids: [1, 2],
        statut: OrderStatus.SHIPPED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut livree", () => {
      const validBulkUpdate = {
        order_ids: [1, 2],
        statut: OrderStatus.DELIVERED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut annulee", () => {
      const validBulkUpdate = {
        order_ids: [1, 2],
        statut: OrderStatus.CANCELLED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux order_ids", () => {
      const manyIds = Array.from({ length: 50 }, (_, i) => i + 1);
      const validBulkUpdate = {
        order_ids: manyIds,
        statut: OrderStatus.SHIPPED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(validBulkUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si order_ids est manquant", () => {
      const invalidBulkUpdate = {
        statut: OrderStatus.PAID,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si statut est manquant", () => {
      const invalidBulkUpdate = {
        order_ids: [1, 2, 3],
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array order_ids vide", () => {
      const invalidBulkUpdate = {
        order_ids: [],
        statut: OrderStatus.PAID,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "Au moins une commande",
        );
      }
    });

    it("devrait rejeter si order_ids contient 0", () => {
      const invalidBulkUpdate = {
        order_ids: [1, 0, 3],
        statut: OrderStatus.SHIPPED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si order_ids contient un ID négatif", () => {
      const invalidBulkUpdate = {
        order_ids: [1, -5, 3],
        statut: OrderStatus.DELIVERED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidBulkUpdate = {
        order_ids: [1, 2, 3],
        statut: "statut_invalide",
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si order_ids contient des strings", () => {
      const invalidBulkUpdate = {
        order_ids: [1, "2", 3],
        statut: OrderStatus.PAID,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si order_ids contient des décimaux", () => {
      const invalidBulkUpdate = {
        order_ids: [1, 2.5, 3],
        statut: OrderStatus.SHIPPED,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si order_ids n'est pas un array", () => {
      const invalidBulkUpdate = {
        order_ids: "1,2,3",
        statut: OrderStatus.PAID,
      };
      const result = bulkUpdateOrderStatusSchema.safeParse(invalidBulkUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("cancelOrderSchema", () => {
    it("devrait valider un motif valide", () => {
      const validCancel = {
        motif: "Client a demandé l'annulation",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motif).toBe("Client a demandé l'annulation");
      }
    });

    it("devrait valider un motif d'un seul caractère", () => {
      const validCancel = {
        motif: "A",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider un motif de longueur maximale (1000 caractères)", () => {
      const maxMotif = "A".repeat(1000);
      const validCancel = {
        motif: maxMotif,
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider un motif avec des caractères spéciaux", () => {
      const validCancel = {
        motif:
          "Annulation pour raison: erreur de commande! (problème d'adresse)",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider un motif avec des sauts de ligne", () => {
      const validCancel = {
        motif: "Première ligne\nDeuxième ligne\nTroisième ligne",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider un motif avec des accents", () => {
      const validCancel = {
        motif: "Erreur de sélection, produit non désiré par l'utilisateur",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces autour du motif", () => {
      const validCancel = {
        motif: "  Motif d'annulation  ",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motif).toBe("Motif d'annulation");
      }
    });

    it("devrait rejeter si motif est manquant", () => {
      const invalidCancel = {};
      const result = cancelOrderSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidCancel = {
        motif: "",
      };
      const result = cancelOrderSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("requis");
      }
    });

    it("devrait accepter une string avec seulement des espaces (comportement Zod)", () => {
      const validCancel = {
        motif: "   ",
      };
      const result = cancelOrderSchema.safeParse(validCancel);
      // Dans Zod, min(1) est appliqué AVANT trim(), donc "   " passe min(1) (longueur 3)
      // puis trim() transforme en ""
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motif).toBe("");
      }
    });

    it("devrait rejeter un motif trop long (> 1000 caractères)", () => {
      const longMotif = "A".repeat(1001);
      const invalidCancel = {
        motif: longMotif,
      };
      const result = cancelOrderSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("1000");
      }
    });

    it("devrait rejeter null", () => {
      const invalidCancel = {
        motif: null,
      };
      const result = cancelOrderSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const invalidCancel = {
        motif: undefined,
      };
      const result = cancelOrderSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const invalidCancel = {
        motif: 123,
      };
      const result = cancelOrderSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });
  });

  describe("orderStatsQuerySchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        utilisateur_id: "10",
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        statut: OrderStatus.PAID,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
        expect(result.data.statut).toBe(OrderStatus.PAID);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: "25",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(25);
      }
    });

    it("devrait valider avec seulement date_debut", () => {
      const validQuery = {
        date_debut: "2024-01-01",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec seulement date_fin", () => {
      const validQuery = {
        date_fin: "2024-12-31",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec seulement statut", () => {
      const validQuery = {
        statut: OrderStatus.SHIPPED,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_debut et date_fin", () => {
      const validQuery = {
        date_debut: "2024-01-01",
        date_fin: "2024-06-30",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et statut", () => {
      const validQuery = {
        utilisateur_id: "50",
        statut: OrderStatus.DELIVERED,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait coercer une string en nombre pour utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: "42",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(42);
      }
    });

    it("devrait coercer une string en Date pour date_debut", () => {
      const validQuery = {
        date_debut: "2024-03-15",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour date_fin", () => {
      const validQuery = {
        date_fin: "2024-09-30",
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec tous les statuts - en_attente", () => {
      const validQuery = {
        statut: OrderStatus.PENDING,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut payee", () => {
      const validQuery = {
        statut: OrderStatus.PAID,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut expediee", () => {
      const validQuery = {
        statut: OrderStatus.SHIPPED,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut livree", () => {
      const validQuery = {
        statut: OrderStatus.DELIVERED,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut annulee", () => {
      const validQuery = {
        statut: OrderStatus.CANCELLED,
      };
      const result = orderStatsQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter utilisateur_id à 0", () => {
      const invalidQuery = {
        utilisateur_id: "0",
      };
      const result = orderStatsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id négatif", () => {
      const invalidQuery = {
        utilisateur_id: "-5",
      };
      const result = orderStatsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_id qui n'est pas numérique", () => {
      const invalidQuery = {
        utilisateur_id: "abc",
      };
      const result = orderStatsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "not-a-date",
      };
      const result = orderStatsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "invalid-date",
      };
      const result = orderStatsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter statut invalide", () => {
      const invalidQuery = {
        statut: "statut_invalide",
      };
      const result = orderStatsQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe("validateOrderNumberSchema", () => {
    it("devrait valider un numero_commande valide", () => {
      const validOrderNumber = {
        numero_commande: "CMD-2024-001",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numero_commande).toBe("CMD-2024-001");
      }
    });

    it("devrait valider avec uniquement des lettres majuscules", () => {
      const validOrderNumber = {
        numero_commande: "ABCDEF",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec uniquement des chiffres", () => {
      const validOrderNumber = {
        numero_commande: "123456",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec uniquement des tirets", () => {
      const validOrderNumber = {
        numero_commande: "---",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec lettres majuscules et chiffres", () => {
      const validOrderNumber = {
        numero_commande: "ORDER123",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec lettres, chiffres et tirets", () => {
      const validOrderNumber = {
        numero_commande: "CMD-2024-ABC-123",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait valider un numero_commande d'un seul caractère", () => {
      const validOrderNumber = {
        numero_commande: "A",
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait valider un numero_commande de longueur maximale", () => {
      const maxNumero = "A".repeat(
        ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH,
      );
      const validOrderNumber = {
        numero_commande: maxNumero,
      };
      const result = validateOrderNumberSchema.safeParse(validOrderNumber);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un numero_commande avec espaces (même autour)", () => {
      const invalidOrderNumber = {
        numero_commande: "  CMD-123  ",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      // La regex /^[A-Z0-9-]+$/ est appliquée AVANT le trim dans Zod
      // donc les espaces font échouer la validation regex
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si numero_commande est manquant", () => {
      const invalidOrderNumber = {};
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidOrderNumber = {
        numero_commande: "",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string qui devient vide après trim", () => {
      const invalidOrderNumber = {
        numero_commande: "   ",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un numero_commande trop long", () => {
      const longNumero = "A".repeat(
        ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH + 1,
      );
      const invalidOrderNumber = {
        numero_commande: longNumero,
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des lettres minuscules", () => {
      const invalidOrderNumber = {
        numero_commande: "cmd-2024-001",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("lettres majuscules");
      }
    });

    it("devrait rejeter des lettres minuscules mélangées", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD-2024-abc",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des caractères spéciaux non autorisés", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD_2024_001",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des espaces dans le numero_commande", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD 2024 001",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des points", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD.2024.001",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des slashes", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD/2024/001",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des caractères accentués", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD-2024-ÉÀÈ",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des symboles", () => {
      const invalidOrderNumber = {
        numero_commande: "CMD@2024#001",
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const invalidOrderNumber = {
        numero_commande: null,
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const invalidOrderNumber = {
        numero_commande: undefined,
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const invalidOrderNumber = {
        numero_commande: 123456,
      };
      const result = validateOrderNumberSchema.safeParse(invalidOrderNumber);
      expect(result.success).toBe(false);
    });
  });
});
