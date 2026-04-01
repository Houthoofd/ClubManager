/**
 * @file Stock Movement Validators Tests
 * @description Tests unitaires pour les validators de mouvements de stock
 */

import {
  stockMovementSchema,
  createStockMovementSchema,
  stockMovementIdParamSchema,
  stockMovementsByArticleParamSchema,
  stockMovementQuerySchema,
  recordStockAdjustmentSchema,
  recordOrderMovementSchema,
  recordDeliveryMovementSchema,
  recordInventoryMovementSchema,
  stockMovementStatsQuerySchema,
  bulkStockMovementQuerySchema,
} from "../stock-movement.validators.js";
import { STOCK_MOVEMENT_CONSTRAINTS } from "../../../constants/store.constants.js";
import {
  STOCK_MOVEMENT_TYPES,
  StockMovementType,
} from "../../../enums/store.enums.js";

describe("Stock Movement Validators", () => {
  describe("stockMovementSchema", () => {
    it("devrait valider un mouvement de stock valide avec tous les champs", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        commande_id: "CMD-123",
        motif: "Commande client",
        effectue_par: 5,
        created_at: new Date("2024-01-15T10:00:00Z"),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec les champs obligatoires seulement", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "L",
        type_mouvement: "ajustement",
        quantite_avant: 100,
        quantite_apres: 120,
        quantite_mouvement: 20,
        created_at: new Date("2024-01-15T10:00:00Z"),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec taille à 1 caractère (minimum)", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "S",
        type_mouvement: "inventaire",
        quantite_avant: 30,
        quantite_apres: 28,
        quantite_mouvement: -2,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec taille à 10 caractères (maximum)", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "1234567890",
        type_mouvement: "livraison",
        quantite_avant: 10,
        quantite_apres: 50,
        quantite_mouvement: 40,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les types de mouvement - commande", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec type_mouvement livraison", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "livraison",
        quantite_avant: 10,
        quantite_apres: 50,
        quantite_mouvement: 40,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec type_mouvement annulation", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "annulation",
        quantite_avant: 45,
        quantite_apres: 50,
        quantite_mouvement: 5,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec type_mouvement retour", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "retour",
        quantite_avant: 45,
        quantite_apres: 48,
        quantite_mouvement: 3,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec type_mouvement ajustement", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "ajustement",
        quantite_avant: 50,
        quantite_apres: 48,
        quantite_mouvement: -2,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec type_mouvement inventaire", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "inventaire",
        quantite_avant: 50,
        quantite_apres: 47,
        quantite_mouvement: -3,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_mouvement négatif", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 40,
        quantite_mouvement: -10,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_mouvement positif", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "livraison",
        quantite_avant: 40,
        quantite_apres: 90,
        quantite_mouvement: 50,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec commande_id null", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "ajustement",
        quantite_avant: 50,
        quantite_apres: 55,
        quantite_mouvement: 5,
        commande_id: null,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec motif null", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        motif: null,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec effectue_par null", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        effectue_par: null,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec commande_id à la longueur maximale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        commande_id: "A".repeat(
          STOCK_MOVEMENT_CONSTRAINTS.COMMANDE_ID_MAX_LENGTH,
        ),
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec motif à la longueur maximale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "ajustement",
        quantite_avant: 50,
        quantite_apres: 55,
        quantite_mouvement: 5,
        motif: "A".repeat(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH),
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("devrait trimmer la taille", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "  M  ",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille).toBe("M");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const result = stockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est manquante", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est vide après trim", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "   ",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille dépasse 10 caractères", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "12345678901",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_mouvement est invalide", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "invalid_type",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_avant est décimale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50.5,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_apres est décimale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45.7,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_mouvement est décimale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5.5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_mouvement est zéro", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 50,
        quantite_mouvement: 0,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id dépasse la longueur maximale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        commande_id: "A".repeat(
          STOCK_MOVEMENT_CONSTRAINTS.COMMANDE_ID_MAX_LENGTH + 1,
        ),
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si motif dépasse la longueur maximale", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "ajustement",
        quantite_avant: 50,
        quantite_apres: 55,
        quantite_mouvement: 5,
        motif: "A".repeat(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH + 1),
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const result = stockMovementSchema.safeParse({
        id: 0,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est 0", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 0,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est 0", () => {
      const result = stockMovementSchema.safeParse({
        id: 1,
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        effectue_par: 0,
        created_at: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createStockMovementSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        commande_id: "CMD-123",
        motif: "Commande client",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement les champs requis", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "L",
        type_mouvement: "ajustement",
        quantite_avant: 100,
        quantite_apres: 120,
        quantite_mouvement: 20,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans commande_id (optionnel)", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "ajustement",
        quantite_avant: 50,
        quantite_apres: 55,
        quantite_mouvement: 5,
        motif: "Correction inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans motif (optionnel)", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        commande_id: "CMD-123",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans effectue_par (optionnel)", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
        commande_id: "CMD-123",
        motif: "Vente en ligne",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = createStockMovementSchema.safeParse({
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est manquante", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_mouvement est manquant", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        quantite_mouvement: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_avant est manquante", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_apres: 45,
        quantite_mouvement: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_apres est manquante", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_mouvement: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_mouvement est manquante", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 45,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_mouvement est zéro", () => {
      const result = createStockMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        type_mouvement: "commande",
        quantite_avant: 50,
        quantite_apres: 50,
        quantite_mouvement: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("stockMovementIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait valider un ID de 1", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "1" });
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "456" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
        expect(result.data.id).toBe(456);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = stockMovementIdParamSchema.safeParse({ id: "12.5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const result = stockMovementIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("stockMovementsByArticleParamSchema", () => {
    it("devrait valider un article_id valide", () => {
      const result = stockMovementsByArticleParamSchema.safeParse({
        article_id: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(10);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const result = stockMovementsByArticleParamSchema.safeParse({
        article_id: "25",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.article_id).toBe("number");
      }
    });

    it("devrait rejeter un article_id à 0", () => {
      const result = stockMovementsByArticleParamSchema.safeParse({
        article_id: "0",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id négatif", () => {
      const result = stockMovementsByArticleParamSchema.safeParse({
        article_id: "-1",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = stockMovementsByArticleParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("stockMovementQuerySchema", () => {
    it("devrait valider une query complète", () => {
      const result = stockMovementQuerySchema.safeParse({
        article_id: "10",
        taille: "M",
        type_mouvement: "commande",
        commande_id: "CMD-123",
        effectue_par: "5",
        date_debut: "2024-01-01",
        date_fin: "2024-01-31",
        quantite_mouvement_min: "-10",
        quantite_mouvement_max: "100",
        sort_by: "created_at",
        sort_order: "desc",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const result = stockMovementQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement article_id", () => {
      const result = stockMovementQuerySchema.safeParse({ article_id: "15" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(15);
      }
    });

    it("devrait valider avec seulement taille", () => {
      const result = stockMovementQuerySchema.safeParse({ taille: "L" });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement type_mouvement", () => {
      const result = stockMovementQuerySchema.safeParse({
        type_mouvement: "livraison",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement commande_id", () => {
      const result = stockMovementQuerySchema.safeParse({
        commande_id: "CMD-999",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement effectue_par", () => {
      const result = stockMovementQuerySchema.safeParse({ effectue_par: "3" });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement les dates", () => {
      const result = stockMovementQuerySchema.safeParse({
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("devrait coercer date_debut en Date", () => {
      const result = stockMovementQuerySchema.safeParse({
        date_debut: "2024-01-01",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer date_fin en Date", () => {
      const result = stockMovementQuerySchema.safeParse({
        date_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer quantite_mouvement_min en nombre", () => {
      const result = stockMovementQuerySchema.safeParse({
        quantite_mouvement_min: "-50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite_mouvement_min).toBe(-50);
      }
    });

    it("devrait coercer quantite_mouvement_max en nombre", () => {
      const result = stockMovementQuerySchema.safeParse({
        quantite_mouvement_max: "200",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantite_mouvement_max).toBe(200);
      }
    });

    it("devrait valider sort_by avec created_at", () => {
      const result = stockMovementQuerySchema.safeParse({
        sort_by: "created_at",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by avec quantite_mouvement", () => {
      const result = stockMovementQuerySchema.safeParse({
        sort_by: "quantite_mouvement",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by avec type_mouvement", () => {
      const result = stockMovementQuerySchema.safeParse({
        sort_by: "type_mouvement",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_order avec asc", () => {
      const result = stockMovementQuerySchema.safeParse({ sort_order: "asc" });
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_order avec desc", () => {
      const result = stockMovementQuerySchema.safeParse({ sort_order: "desc" });
      expect(result.success).toBe(true);
    });

    it("devrait trimmer la taille", () => {
      const result = stockMovementQuerySchema.safeParse({ taille: "  XL  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille).toBe("XL");
      }
    });

    it("devrait trimmer commande_id", () => {
      const result = stockMovementQuerySchema.safeParse({
        commande_id: "  CMD-123  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe("CMD-123");
      }
    });

    it("devrait rejeter un type_mouvement invalide", () => {
      const result = stockMovementQuerySchema.safeParse({
        type_mouvement: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const result = stockMovementQuerySchema.safeParse({
        sort_by: "invalid_field",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const result = stockMovementQuerySchema.safeParse({
        sort_order: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id à 0", () => {
      const result = stockMovementQuerySchema.safeParse({ article_id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un effectue_par à 0", () => {
      const result = stockMovementQuerySchema.safeParse({ effectue_par: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite_mouvement_min décimale", () => {
      const result = stockMovementQuerySchema.safeParse({
        quantite_mouvement_min: "10.5",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter quantite_mouvement_max décimale", () => {
      const result = stockMovementQuerySchema.safeParse({
        quantite_mouvement_max: "20.7",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("recordStockAdjustmentSchema", () => {
    it("devrait valider un ajustement avec tous les champs", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 55,
        motif: "Correction inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans effectue_par (optionnel)", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "L",
        quantite_avant: 100,
        quantite_apres: 95,
        motif: "Produit endommagé",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_avant à 0", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "S",
        quantite_avant: 0,
        quantite_apres: 10,
        motif: "Stock initial",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_apres à 0", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "S",
        quantite_avant: 5,
        quantite_apres: 0,
        motif: "Épuisement stock",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec taille à 1 caractère", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "S",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "Ajustement",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec taille à 10 caractères", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "1234567890",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "Ajustement",
      });
      expect(result.success).toBe(true);
    });

    it("devrait trimmer la taille", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "  XL  ",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "Ajustement",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille).toBe("XL");
      }
    });

    it("devrait trimmer le motif", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "  Correction  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motif).toBe("Correction");
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est manquante", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_avant est manquante", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_apres: 45,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_apres est manquante", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si motif est manquant", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif vide", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif vide après trim", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_avant négative", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: -5,
        quantite_apres: 45,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_apres négative", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: -10,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_avant décimale", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50.5,
        quantite_apres: 45,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_apres décimale", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45.7,
        motif: "Correction",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif dépassant la longueur maximale", () => {
      const result = recordStockAdjustmentSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        motif: "A".repeat(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH + 1),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("recordOrderMovementSchema", () => {
    it("devrait valider un mouvement de commande avec tous les champs", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "CMD-123",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans effectue_par (optionnel)", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "L",
        quantite_avant: 100,
        quantite_apres: 95,
        commande_id: "CMD-456",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_avant à 0", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "S",
        quantite_avant: 0,
        quantite_apres: 0,
        commande_id: "CMD-789",
      });
      expect(result.success).toBe(true);
    });

    it("devrait trimmer la taille", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "  XL  ",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille).toBe("XL");
      }
    });

    it("devrait trimmer commande_id", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "  CMD-999  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commande_id).toBe("CMD-999");
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = recordOrderMovementSchema.safeParse({
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est manquante", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_avant est manquante", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_apres: 45,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_apres est manquante", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si commande_id est manquant", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commande_id vide", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commande_id vide après trim", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_avant négative", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: -5,
        quantite_apres: 45,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_apres négative", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: -10,
        commande_id: "CMD-123",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commande_id dépassant la longueur maximale", () => {
      const result = recordOrderMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 45,
        commande_id: "A".repeat(
          STOCK_MOVEMENT_CONSTRAINTS.COMMANDE_ID_MAX_LENGTH + 1,
        ),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("recordDeliveryMovementSchema", () => {
    it("devrait valider un mouvement de livraison avec tous les champs", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 100,
        motif: "Livraison fournisseur",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans motif (optionnel)", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "L",
        quantite_avant: 20,
        quantite_apres: 70,
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans effectue_par (optionnel)", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "S",
        quantite_avant: 10,
        quantite_apres: 60,
        motif: "Réapprovisionnement",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sans motif ni effectue_par", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "XL",
        quantite_avant: 5,
        quantite_apres: 55,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_avant à 0", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 0,
        quantite_apres: 50,
        motif: "Première livraison",
      });
      expect(result.success).toBe(true);
    });

    it("devrait trimmer la taille", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "  M  ",
        quantite_avant: 50,
        quantite_apres: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille).toBe("M");
      }
    });

    it("devrait trimmer le motif", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 100,
        motif: "  Livraison urgente  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motif).toBe("Livraison urgente");
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est manquante", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        quantite_avant: 50,
        quantite_apres: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_avant est manquante", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_apres: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_apres est manquante", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_avant négative", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: -5,
        quantite_apres: 100,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_apres négative", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: -10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif dépassant la longueur maximale", () => {
      const result = recordDeliveryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 100,
        motif: "A".repeat(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH + 1),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("recordInventoryMovementSchema", () => {
    it("devrait valider un mouvement d'inventaire avec tous les champs", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "Inventaire annuel",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_avant à 0", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "S",
        quantite_avant: 0,
        quantite_apres: 0,
        motif: "Vérification stock",
        effectue_par: 3,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec quantite_apres à 0", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "L",
        quantite_avant: 5,
        quantite_apres: 0,
        motif: "Stock épuisé constaté",
        effectue_par: 7,
      });
      expect(result.success).toBe(true);
    });

    it("devrait trimmer la taille", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "  XL  ",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taille).toBe("XL");
      }
    });

    it("devrait trimmer le motif", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "  Contrôle qualité  ",
        effectue_par: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motif).toBe("Contrôle qualité");
      }
    });

    it("devrait rejeter si article_id est manquant", () => {
      const result = recordInventoryMovementSchema.safeParse({
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si taille est manquante", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_avant est manquante", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_apres: 48,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si quantite_apres est manquante", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si motif est manquant", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est manquant", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "Inventaire",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif vide", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif vide après trim", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "   ",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_avant négative", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: -5,
        quantite_apres: 48,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantite_apres négative", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: -10,
        motif: "Inventaire",
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un motif dépassant la longueur maximale", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "A".repeat(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH + 1),
        effectue_par: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter effectue_par à 0", () => {
      const result = recordInventoryMovementSchema.safeParse({
        article_id: 10,
        taille: "M",
        quantite_avant: 50,
        quantite_apres: 48,
        motif: "Inventaire",
        effectue_par: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("stockMovementStatsQuerySchema", () => {
    it("devrait valider une query de stats complète", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        article_id: "10",
        type_mouvement: "commande",
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        effectue_par: "5",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const result = stockMovementStatsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement article_id", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        article_id: "15",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.article_id).toBe(15);
      }
    });

    it("devrait valider avec seulement type_mouvement", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        type_mouvement: "livraison",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement les dates", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement effectue_par", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        effectue_par: "7",
      });
      expect(result.success).toBe(true);
    });

    it("devrait coercer date_debut en Date", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        date_debut: "2024-06-15",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer date_fin en Date", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        date_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider tous les types de mouvement", () => {
      const types: Array<(typeof STOCK_MOVEMENT_TYPES)[number]> = [
        "commande",
        "livraison",
        "annulation",
        "retour",
        "ajustement",
        "inventaire",
      ];
      types.forEach((type) => {
        const result = stockMovementStatsQuerySchema.safeParse({
          type_mouvement: type,
        });
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un type_mouvement invalide", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        type_mouvement: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un article_id à 0", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        article_id: "0",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un effectue_par à 0", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        effectue_par: "0",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        date_debut: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const result = stockMovementStatsQuerySchema.safeParse({
        date_fin: "invalid-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkStockMovementQuerySchema", () => {
    it("devrait valider une query bulk complète", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [1, 2, 3],
        type_mouvements: ["commande", "livraison"],
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        limit: 500,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const result = bulkStockMovementQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement article_ids", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [10, 20, 30],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un seul article_id", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [5],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement type_mouvements", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        type_mouvements: ["ajustement", "inventaire"],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un seul type_mouvement", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        type_mouvements: ["retour"],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les types de mouvement", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        type_mouvements: [
          "commande",
          "livraison",
          "annulation",
          "retour",
          "ajustement",
          "inventaire",
        ],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement les dates", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement limit", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: 100 });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec limit à 1", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: 1 });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec limit à 1000 (maximum)", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: 1000 });
      expect(result.success).toBe(true);
    });

    it("devrait coercer limit string en nombre", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: "250" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(250);
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("devrait coercer date_debut en Date", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        date_debut: "2024-03-15",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer date_fin en Date", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        date_fin: "2024-09-30",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec plusieurs article_ids", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [1, 5, 10, 15, 20, 25, 30],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un array article_ids vide (optionnel)", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [],
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un array type_mouvements vide (optionnel)", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        type_mouvements: [],
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter article_ids contenant 0", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [1, 0, 3],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter article_ids contenant un ID négatif", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        article_ids: [1, -5, 3],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter type_mouvements avec un type invalide", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        type_mouvements: ["commande", "invalid_type"],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit à 0", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit négatif", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: -10 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit supérieur à 1000", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: 1001 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit décimal", () => {
      const result = bulkStockMovementQuerySchema.safeParse({ limit: 50.5 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        date_debut: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const result = bulkStockMovementQuerySchema.safeParse({
        date_fin: "invalid-date",
      });
      expect(result.success).toBe(false);
    });
  });
});
