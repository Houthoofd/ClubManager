/**
 * Tests pour les validators de paiements
 * Test de tous les schémas Zod dans payment.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createPaymentSchema,
  updatePaymentSchema,
  refundPaymentSchema,
  searchPaymentSchema,
  stripePaymentIntentSchema,
} from "../payment.validators.js";

describe("Payment Validators", () => {
  describe("createPaymentSchema", () => {
    it("devrait valider un paiement valide avec tous les champs", () => {
      const validPayment = {
        utilisateur_id: 1,
        montant: 49.99,
        methode_paiement: "stripe" as const,
        plan_tarifaire_id: 5,
        description: "Abonnement mensuel premium",
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.montant).toBe(49.99);
        expect(result.data.methode_paiement).toBe("stripe");
      }
    });

    it("devrait valider un paiement avec champs optionnels absents", () => {
      const validPayment = {
        utilisateur_id: 2,
        montant: 25.0,
        methode_paiement: "especes" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider un paiement avec montant décimal (2 décimales)", () => {
      const validPayment = {
        utilisateur_id: 3,
        montant: 99.99,
        methode_paiement: "virement" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider un paiement avec montant entier", () => {
      const validPayment = {
        utilisateur_id: 4,
        montant: 100.0,
        methode_paiement: "autre" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider un paiement avec 1 décimale", () => {
      const validPayment = {
        utilisateur_id: 5,
        montant: 50.5,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider toutes les méthodes de paiement enum - stripe", () => {
      const validPayment = {
        utilisateur_id: 1,
        montant: 10.0,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider toutes les méthodes de paiement enum - especes", () => {
      const validPayment = {
        utilisateur_id: 1,
        montant: 10.0,
        methode_paiement: "especes" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider toutes les méthodes de paiement enum - virement", () => {
      const validPayment = {
        utilisateur_id: 1,
        montant: 10.0,
        methode_paiement: "virement" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider toutes les méthodes de paiement enum - autre", () => {
      const validPayment = {
        utilisateur_id: 1,
        montant: 10.0,
        methode_paiement: "autre" as const,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait valider une description de longueur maximale (1000 caractères)", () => {
      const maxDescription = "a".repeat(1000);
      const validPayment = {
        utilisateur_id: 6,
        montant: 75.0,
        methode_paiement: "stripe" as const,
        description: maxDescription,
      };
      const result = createPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un montant de 0 (CHECK constraint: montant > 0)", () => {
      const invalidPayment = {
        utilisateur_id: 7,
        montant: 0,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
        expect(result.error.issues[0].message).toContain("strictement positif");
      }
    });

    it("devrait rejeter un montant négatif (CHECK constraint: montant > 0)", () => {
      const invalidPayment = {
        utilisateur_id: 8,
        montant: -10.5,
        methode_paiement: "especes" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });

    it("devrait rejeter un montant avec plus de 2 décimales", () => {
      const invalidPayment = {
        utilisateur_id: 9,
        montant: 49.999,
        methode_paiement: "virement" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
        expect(result.error.issues[0].message).toContain("2 décimales");
      }
    });

    it("devrait rejeter un montant avec 3 décimales", () => {
      const invalidPayment = {
        utilisateur_id: 10,
        montant: 100.123,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une méthode de paiement invalide", () => {
      const invalidPayment = {
        utilisateur_id: 11,
        montant: 50.0,
        methode_paiement: "paypal",
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("methode_paiement");
      }
    });

    it("devrait rejeter une description trop longue (> 1000 caractères)", () => {
      const longDescription = "a".repeat(1001);
      const invalidPayment = {
        utilisateur_id: 12,
        montant: 30.0,
        methode_paiement: "especes" as const,
        description: longDescription,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("description");
        expect(result.error.issues[0].message).toContain("1000 caractères");
      }
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidPayment = {
        montant: 50.0,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter si montant est manquant", () => {
      const invalidPayment = {
        utilisateur_id: 13,
        methode_paiement: "virement" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });

    it("devrait rejeter si methode_paiement est manquante", () => {
      const invalidPayment = {
        utilisateur_id: 14,
        montant: 75.0,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("methode_paiement");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidPayment = {
        utilisateur_id: 0,
        montant: 50.0,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidPayment = {
        utilisateur_id: -1,
        montant: 50.0,
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si montant est une string", () => {
      const invalidPayment = {
        utilisateur_id: 15,
        montant: "50.00",
        methode_paiement: "stripe" as const,
      };
      const result = createPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre");
      }
    });
  });

  describe("updatePaymentSchema", () => {
    it("devrait valider une mise à jour valide avec statut", () => {
      const validUpdate = {
        id: 1,
        statut: "valide" as const,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.statut).toBe("valide");
      }
    });

    it("devrait valider une mise à jour avec seulement l'id", () => {
      const validUpdate = {
        id: 2,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec description", () => {
      const validUpdate = {
        id: 3,
        description: "Paiement reçu et validé",
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec statut et description", () => {
      const validUpdate = {
        id: 4,
        statut: "rembourse" as const,
        description: "Remboursement effectué suite à annulation",
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider tous les statuts enum - en_attente", () => {
      const validUpdate = {
        id: 5,
        statut: "en_attente" as const,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider tous les statuts enum - valide", () => {
      const validUpdate = {
        id: 6,
        statut: "valide" as const,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider tous les statuts enum - echoue", () => {
      const validUpdate = {
        id: 7,
        statut: "echoue" as const,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider tous les statuts enum - rembourse", () => {
      const validUpdate = {
        id: 8,
        statut: "rembourse" as const,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une description de longueur maximale (1000 caractères)", () => {
      const maxDescription = "b".repeat(1000);
      const validUpdate = {
        id: 9,
        description: maxDescription,
      };
      const result = updatePaymentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidUpdate = {
        statut: "valide" as const,
      };
      const result = updatePaymentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidUpdate = {
        id: 0,
        statut: "valide" as const,
      };
      const result = updatePaymentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidUpdate = {
        id: -5,
        statut: "echoue" as const,
      };
      const result = updatePaymentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidUpdate = {
        id: 10,
        statut: "annule",
      };
      const result = updatePaymentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("statut");
      }
    });

    it("devrait rejeter une description trop longue (> 1000 caractères)", () => {
      const longDescription = "c".repeat(1001);
      const invalidUpdate = {
        id: 11,
        description: longDescription,
      };
      const result = updatePaymentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("description");
      }
    });
  });

  describe("refundPaymentSchema", () => {
    it("devrait valider un remboursement valide", () => {
      const validRefund = {
        id: 1,
        raison: "Client insatisfait du service",
        montant_rembourse: 49.99,
      };
      const result = refundPaymentSchema.safeParse(validRefund);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.montant_rembourse).toBe(49.99);
      }
    });

    it("devrait valider une raison de 10 caractères exactement", () => {
      const validRefund = {
        id: 2,
        raison: "Raison ok!",
        montant_rembourse: 25.0,
      };
      const result = refundPaymentSchema.safeParse(validRefund);
      expect(result.success).toBe(true);
    });

    it("devrait valider une raison de 500 caractères exactement", () => {
      const maxRaison = "a".repeat(500);
      const validRefund = {
        id: 3,
        raison: maxRaison,
        montant_rembourse: 100.0,
      };
      const result = refundPaymentSchema.safeParse(validRefund);
      expect(result.success).toBe(true);
    });

    it("devrait valider un montant remboursé avec décimales", () => {
      const validRefund = {
        id: 4,
        raison: "Remboursement partiel demandé",
        montant_rembourse: 15.75,
      };
      const result = refundPaymentSchema.safeParse(validRefund);
      expect(result.success).toBe(true);
    });

    it("devrait valider un montant remboursé entier", () => {
      const validRefund = {
        id: 5,
        raison: "Remboursement complet effectué",
        montant_rembourse: 50.0,
      };
      const result = refundPaymentSchema.safeParse(validRefund);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une raison trop courte (< 10 caractères)", () => {
      const invalidRefund = {
        id: 6,
        raison: "Trop",
        montant_rembourse: 30.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("raison");
        expect(result.error.issues[0].message).toContain(
          "au moins 10 caractères",
        );
      }
    });

    it("devrait rejeter une raison de 9 caractères", () => {
      const invalidRefund = {
        id: 7,
        raison: "123456789",
        montant_rembourse: 40.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison trop longue (> 500 caractères)", () => {
      const longRaison = "a".repeat(501);
      const invalidRefund = {
        id: 8,
        raison: longRaison,
        montant_rembourse: 60.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("raison");
        expect(result.error.issues[0].message).toContain("500 caractères");
      }
    });

    it("devrait rejeter un montant_rembourse de 0", () => {
      const invalidRefund = {
        id: 9,
        raison: "Montant remboursé nul",
        montant_rembourse: 0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_rembourse");
      }
    });

    it("devrait rejeter un montant_rembourse négatif", () => {
      const invalidRefund = {
        id: 10,
        raison: "Montant négatif invalide",
        montant_rembourse: -25.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_rembourse");
      }
    });

    it("devrait rejeter un montant_rembourse avec plus de 2 décimales", () => {
      const invalidRefund = {
        id: 11,
        raison: "Trop de décimales dans le montant",
        montant_rembourse: 49.999,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_rembourse");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidRefund = {
        raison: "ID manquant pour ce remboursement",
        montant_rembourse: 70.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si raison est manquante", () => {
      const invalidRefund = {
        id: 12,
        montant_rembourse: 80.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("raison");
      }
    });

    it("devrait rejeter si montant_rembourse est manquant", () => {
      const invalidRefund = {
        id: 13,
        raison: "Montant remboursé non spécifié",
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_rembourse");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidRefund = {
        id: 0,
        raison: "ID invalide (zéro)",
        montant_rembourse: 90.0,
      };
      const result = refundPaymentSchema.safeParse(invalidRefund);
      expect(result.success).toBe(false);
    });
  });

  describe("searchPaymentSchema", () => {
    it("devrait valider une recherche avec tous les filtres", () => {
      const validSearch = {
        utilisateur_id: 1,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        statut: "valide" as const,
        methode_paiement: "stripe" as const,
        plan_tarifaire_id: 5,
        montant_min: 10.0,
        montant_max: 500.0,
        search: "abonnement",
        sort_by: "montant" as const,
        sort_order: "asc" as const,
        page: 1,
        limit: 20,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche avec seulement la pagination", () => {
      const validSearch = {
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche avec filtres de date", () => {
      const validSearch = {
        date_debut: "2024-06-01",
        date_fin: "2024-06-30",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider date_debut égale à date_fin", () => {
      const validSearch = {
        date_debut: "2024-06-15",
        date_fin: "2024-06-15",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche avec filtres de montant", () => {
      const validSearch = {
        montant_min: 20.0,
        montant_max: 100.0,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider montant_min égal à montant_max", () => {
      const validSearch = {
        montant_min: 50.0,
        montant_max: 50.0,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les statuts possibles", () => {
      const statuts = ["en_attente", "valide", "echoue", "rembourse"] as const;
      statuts.forEach((statut) => {
        const validSearch = {
          statut,
          page: 1,
          limit: 10,
        };
        const result = searchPaymentSchema.safeParse(validSearch);
        expect(result.success).toBe(true);
      });
    });

    it("devrait valider avec toutes les méthodes de paiement possibles", () => {
      const methodes = ["stripe", "especes", "virement", "autre"] as const;
      methodes.forEach((methode) => {
        const validSearch = {
          methode_paiement: methode,
          page: 1,
          limit: 10,
        };
        const result = searchPaymentSchema.safeParse(validSearch);
        expect(result.success).toBe(true);
      });
    });

    it("devrait valider avec tous les champs sort_by possibles", () => {
      const sortFields = [
        "date_paiement",
        "montant",
        "statut",
        "methode_paiement",
      ] as const;
      sortFields.forEach((field) => {
        const validSearch = {
          sort_by: field,
          page: 1,
          limit: 10,
        };
        const result = searchPaymentSchema.safeParse(validSearch);
        expect(result.success).toBe(true);
      });
    });

    it("devrait valider avec sort_order asc et desc", () => {
      const validSearchAsc = {
        sort_order: "asc" as const,
        page: 1,
        limit: 10,
      };
      const resultAsc = searchPaymentSchema.safeParse(validSearchAsc);
      expect(resultAsc.success).toBe(true);

      const validSearchDesc = {
        sort_order: "desc" as const,
        page: 1,
        limit: 10,
      };
      const resultDesc = searchPaymentSchema.safeParse(validSearchDesc);
      expect(resultDesc.success).toBe(true);
    });

    it("devrait appliquer les valeurs par défaut pour pagination uniquement", () => {
      const validSearch = {};
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        // Les valeurs par défaut de pagination sont appliquées
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        // sort_by et sort_order utilisent .default().optional() donc les defaults ne sont pas appliqués
        // quand les champs sont absents (comportement Zod)
        expect(result.data.sort_by).toBeUndefined();
        expect(result.data.sort_order).toBeUndefined();
      }
    });

    it("devrait rejeter si date_fin est avant date_debut", () => {
      const invalidSearch = {
        date_debut: "2024-12-31",
        date_fin: "2024-01-01",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        const dateFinError = result.error.issues.find((issue) =>
          issue.path.includes("date_fin"),
        );
        expect(dateFinError).toBeDefined();
        expect(dateFinError?.message).toContain(
          "supérieure ou égale à la date de début",
        );
      }
    });

    it("devrait rejeter si montant_max est inférieur à montant_min", () => {
      const invalidSearch = {
        montant_min: 100.0,
        montant_max: 50.0,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_max");
        expect(result.error.issues[0].message).toContain(
          "supérieur ou égal au montant minimum",
        );
      }
    });

    it("devrait rejeter un montant_min de 0", () => {
      const invalidSearch = {
        montant_min: 0,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_min");
        expect(result.error.issues[0].message).toContain("positif");
      }
    });

    it("devrait rejeter un montant_max de 0", () => {
      const invalidSearch = {
        montant_max: 0,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_max");
      }
    });

    it("devrait rejeter un montant_min négatif", () => {
      const invalidSearch = {
        montant_min: -10.0,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidSearch = {
        statut: "annule",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("statut");
      }
    });

    it("devrait rejeter une méthode de paiement invalide", () => {
      const invalidSearch = {
        methode_paiement: "cheque",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("methode_paiement");
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidSearch = {
        sort_by: "utilisateur_id",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_by");
      }
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidSearch = {
        sort_order: "ascending",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_order");
      }
    });

    it("devrait rejeter une date_debut invalide (format incorrect)", () => {
      const invalidSearch = {
        date_debut: "2024/01/01",
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
      }
    });

    it("devrait valider avec utilisateur_id spécifique", () => {
      const validSearch = {
        utilisateur_id: 42,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plan_tarifaire_id spécifique", () => {
      const validSearch = {
        plan_tarifaire_id: 15,
        page: 1,
        limit: 10,
      };
      const result = searchPaymentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });
  });

  describe("stripePaymentIntentSchema", () => {
    it("devrait valider un payment intent Stripe valide", () => {
      const validIntent = {
        payment_intent_id: "pi_1234567890abcdefghij",
        amount: 49.99,
      };
      const result = stripePaymentIntentSchema.safeParse(validIntent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.payment_intent_id).toBe("pi_1234567890abcdefghij");
        expect(result.data.amount).toBe(49.99);
      }
    });

    it("devrait valider un payment_intent_id avec préfixe pi_", () => {
      const validIntent = {
        payment_intent_id: "pi_test",
        amount: 100.0,
      };
      const result = stripePaymentIntentSchema.safeParse(validIntent);
      expect(result.success).toBe(true);
    });

    it("devrait valider un amount avec décimales", () => {
      const validIntent = {
        payment_intent_id: "pi_3N1234567890",
        amount: 25.75,
      };
      const result = stripePaymentIntentSchema.safeParse(validIntent);
      expect(result.success).toBe(true);
    });

    it("devrait valider un amount entier", () => {
      const validIntent = {
        payment_intent_id: "pi_987654321",
        amount: 150.0,
      };
      const result = stripePaymentIntentSchema.safeParse(validIntent);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 2 décimales maximum", () => {
      const validIntent = {
        payment_intent_id: "pi_abcdefghij",
        amount: 99.99,
      };
      const result = stripePaymentIntentSchema.safeParse(validIntent);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un payment_intent_id ne commençant pas par pi_", () => {
      const invalidIntent = {
        payment_intent_id: "ch_1234567890",
        amount: 50.0,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("payment_intent_id");
        expect(result.error.issues[0].message).toContain("pi_");
      }
    });

    it("devrait rejeter un payment_intent_id vide", () => {
      const invalidIntent = {
        payment_intent_id: "",
        amount: 50.0,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("payment_intent_id");
      }
    });

    it("devrait rejeter un payment_intent_id sans préfixe", () => {
      const invalidIntent = {
        payment_intent_id: "1234567890",
        amount: 75.0,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("pi_");
      }
    });

    it("devrait rejeter un amount de 0", () => {
      const invalidIntent = {
        payment_intent_id: "pi_validid123",
        amount: 0,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("amount");
        expect(result.error.issues[0].message).toContain("strictement positif");
      }
    });

    it("devrait rejeter un amount négatif", () => {
      const invalidIntent = {
        payment_intent_id: "pi_validid456",
        amount: -25.0,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("amount");
      }
    });

    it("devrait rejeter un amount avec plus de 2 décimales", () => {
      const invalidIntent = {
        payment_intent_id: "pi_validid789",
        amount: 49.999,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("amount");
        expect(result.error.issues[0].message).toContain("2 décimales");
      }
    });

    it("devrait rejeter si payment_intent_id est manquant", () => {
      const invalidIntent = {
        amount: 100.0,
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("payment_intent_id");
      }
    });

    it("devrait rejeter si amount est manquant", () => {
      const invalidIntent = {
        payment_intent_id: "pi_complete123",
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("amount");
      }
    });

    it("devrait rejeter un amount qui est une string", () => {
      const invalidIntent = {
        payment_intent_id: "pi_string123",
        amount: "50.00",
      };
      const result = stripePaymentIntentSchema.safeParse(invalidIntent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre");
      }
    });

    it("devrait accepter un payment_intent_id avec seulement pi_ (car c'est techniquement valide)", () => {
      const validIntent = {
        payment_intent_id: "pi_",
        amount: 60.0,
      };
      const result = stripePaymentIntentSchema.safeParse(validIntent);
      // Note: pi_ seul est accepté car le schema vérifie seulement startsWith("pi_")
      // et min(1) qui sont tous deux satisfaits
      expect(result.success).toBe(true);
    });
  });
});
