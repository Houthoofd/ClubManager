/**
 * Tests pour les validators d'échéances de paiement
 * Test de tous les schémas Zod dans payment-schedule.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createPaymentScheduleSchema,
  updatePaymentScheduleSchema,
  bulkCreatePaymentScheduleSchema,
  searchPaymentScheduleSchema,
  markAsPaidSchema,
} from "../payment-schedule.validators.js";

describe("Payment Schedule Validators", () => {
  describe("createPaymentScheduleSchema", () => {
    it("devrait valider une échéance valide avec tous les champs", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
        statut: "en_attente",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.plan_tarifaire_id).toBe(5);
        expect(result.data.montant).toBe(50.99);
        expect(result.data.date_echeance).toBe(dateEcheance);
        expect(result.data.statut).toBe("en_attente");
      }
    });

    it("devrait valider une échéance sans statut (optionnel avec défaut)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un montant avec 2 décimales", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 99.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un montant entier (0 décimales)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 100,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un montant avec 1 décimale", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.5,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider le statut 'en_attente'", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
        statut: "en_attente",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider le statut 'paye'", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
        statut: "paye",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider le statut 'en_retard'", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
        statut: "en_retard",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider le statut 'annule'", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
        statut: "annule",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un montant égal à 0 (CHECK > 0)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 0,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });

    it("devrait rejeter un montant négatif", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: -10.50,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });

    it("devrait rejeter un montant avec plus de 2 décimales", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.999,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });

    it("devrait rejeter une date d'échéance dans le passé", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateEcheance = yesterday.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance");
      }
    });

    it("devrait rejeter une date d'échéance aujourd'hui", () => {
      const today = new Date();
      const dateEcheance = today.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance");
      }
    });

    it("devrait rejeter un format de date invalide", () => {
      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: "2024/12/31",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance");
      }
    });

    it("devrait rejeter un statut invalide", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
        statut: "invalide",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("statut");
      }
    });

    it("devrait rejeter un utilisateur_id égal à 0", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 0,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter un utilisateur_id négatif", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: -1,
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter un plan_tarifaire_id égal à 0", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 0,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("plan_tarifaire_id");
      }
    });

    it("devrait rejeter un plan_tarifaire_id négatif", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: -5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("plan_tarifaire_id");
      }
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        plan_tarifaire_id: 5,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter si plan_tarifaire_id est manquant", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        montant: 50.99,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("plan_tarifaire_id");
      }
    });

    it("devrait rejeter si montant est manquant", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });

    it("devrait rejeter si date_echeance est manquante", () => {
      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: 50.99,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance");
      }
    });

    it("devrait rejeter un montant de type string", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateEcheance = tomorrow.toISOString().split("T")[0];

      const result = createPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        montant: "50.99",
        date_echeance: dateEcheance,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant");
      }
    });
  });

  describe("updatePaymentScheduleSchema", () => {
    it("devrait valider une mise à jour complète valide", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
        statut: "paye",
        paiement_id: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.statut).toBe("paye");
        expect(result.data.paiement_id).toBe(5);
      }
    });

    it("devrait valider une mise à jour avec seulement l'id", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.statut).toBeUndefined();
        expect(result.data.paiement_id).toBeUndefined();
      }
    });

    it("devrait valider une mise à jour avec seulement le statut", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
        statut: "en_retard",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("en_retard");
      }
    });

    it("devrait valider une mise à jour avec seulement le paiement_id", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
        paiement_id: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paiement_id).toBe(10);
      }
    });

    it("devrait valider tous les statuts valides", () => {
      const statuts = ["en_attente", "paye", "en_retard", "annule"];
      statuts.forEach((statut) => {
        const result = updatePaymentScheduleSchema.safeParse({
          id: 1,
          statut,
        });
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter si id est manquant", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        statut: "paye",
        paiement_id: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un id égal à 0", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 0,
        statut: "paye",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un id négatif", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: -1,
        statut: "paye",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un statut invalide", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
        statut: "invalide_statut",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("statut");
      }
    });

    it("devrait rejeter un paiement_id égal à 0", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
        paiement_id: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });

    it("devrait rejeter un paiement_id négatif", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: 1,
        paiement_id: -5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });

    it("devrait rejeter un id de type string", () => {
      const result = updatePaymentScheduleSchema.safeParse({
        id: "1",
        statut: "paye",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });
  });

  describe("bulkCreatePaymentScheduleSchema", () => {
    it("devrait valider une création en masse valide", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.plan_tarifaire_id).toBe(5);
        expect(result.data.nombre_echeances).toBe(12);
        expect(result.data.date_debut).toBe(dateDebut);
      }
    });

    it("devrait valider avec 1 échéance (minimum)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 1,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 24 échéances (maximum)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 24,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 12 échéances (valeur courante)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter 0 échéance", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 0,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nombre_echeances");
      }
    });

    it("devrait rejeter un nombre d'échéances négatif", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: -5,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nombre_echeances");
      }
    });

    it("devrait rejeter plus de 24 échéances", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 25,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nombre_echeances");
      }
    });

    it("devrait rejeter un nombre d'échéances décimal", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12.5,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nombre_echeances");
      }
    });

    it("devrait rejeter une date de début dans le passé", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateDebut = yesterday.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
      }
    });

    it("devrait rejeter une date de début aujourd'hui", () => {
      const today = new Date();
      const dateDebut = today.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
      }
    });

    it("devrait rejeter un format de date invalide", () => {
      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: "2024/12/31",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
      }
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter si plan_tarifaire_id est manquant", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("plan_tarifaire_id");
      }
    });

    it("devrait rejeter si nombre_echeances est manquant", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nombre_echeances");
      }
    });

    it("devrait rejeter si date_debut est manquante", () => {
      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
      }
    });

    it("devrait rejeter un utilisateur_id égal à 0", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 0,
        plan_tarifaire_id: 5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter un plan_tarifaire_id négatif", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateDebut = tomorrow.toISOString().split("T")[0];

      const result = bulkCreatePaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: -5,
        nombre_echeances: 12,
        date_debut: dateDebut,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("plan_tarifaire_id");
      }
    });
  });

  describe("searchPaymentScheduleSchema", () => {
    it("devrait valider une recherche avec tous les filtres", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
        plan_tarifaire_id: 5,
        statut: "en_attente",
        date_echeance_debut: "2024-01-01",
        date_echeance_fin: "2024-12-31",
        montant_min: 10.0,
        montant_max: 100.0,
        en_retard: true,
        search: "paiement",
        sort_by: "date_echeance",
        sort_order: "asc",
        page: 1,
        limit: 20,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.statut).toBe("en_attente");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("devrait valider une recherche sans filtres (seulement pagination par défaut)", () => {
      const result = searchPaymentScheduleSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBeDefined();
        expect(result.data.limit).toBeDefined();
      }
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        utilisateur_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement statut", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        statut: "paye",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider tous les statuts valides", () => {
      const statuts = ["en_attente", "paye", "en_retard", "annule"];
      statuts.forEach((statut) => {
        const result = searchPaymentScheduleSchema.safeParse({ statut });
        expect(result.success).toBe(true);
      });
    });

    it("devrait valider avec une plage de dates valide", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        date_echeance_debut: "2024-01-01",
        date_echeance_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des dates identiques", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        date_echeance_debut: "2024-06-15",
        date_echeance_fin: "2024-06-15",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une plage de montants valide", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_min: 10.0,
        montant_max: 100.0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des montants identiques", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_min: 50.0,
        montant_max: 50.0,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec en_retard true", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        en_retard: true,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec en_retard false", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        en_retard: false,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider tous les champs sort_by valides", () => {
      const sortByOptions = [
        "date_echeance",
        "montant",
        "statut",
        "utilisateur_id",
        "created_at",
      ];
      sortByOptions.forEach((sort_by) => {
        const result = searchPaymentScheduleSchema.safeParse({ sort_by });
        expect(result.success).toBe(true);
      });
    });

    it("devrait valider sort_order 'asc'", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        sort_order: "asc",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_order 'desc'", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        sort_order: "desc",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec page et limit personnalisés", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        page: 5,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec search", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        search: "janvier",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une date_echeance_fin avant date_echeance_debut", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        date_echeance_debut: "2024-12-31",
        date_echeance_fin: "2024-01-01",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance_fin");
      }
    });

    it("devrait rejeter un montant_max inférieur au montant_min", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_min: 100.0,
        montant_max: 10.0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_max");
      }
    });

    it("devrait rejeter un format de date invalide pour date_echeance_debut", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        date_echeance_debut: "2024/01/01",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance_debut");
      }
    });

    it("devrait rejeter un format de date invalide pour date_echeance_fin", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        date_echeance_fin: "31-12-2024",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_echeance_fin");
      }
    });

    it("devrait rejeter un statut invalide", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        statut: "inconnu",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("statut");
      }
    });

    it("devrait rejeter un montant_min négatif", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_min: -10.0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_min");
      }
    });

    it("devrait rejeter un montant_min égal à 0", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_min: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_min");
      }
    });

    it("devrait rejeter un montant_max négatif", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_max: -50.0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_max");
      }
    });

    it("devrait rejeter un montant_max égal à 0", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        montant_max: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("montant_max");
      }
    });

    it("devrait rejeter un en_retard de type string", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        en_retard: "true",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("en_retard");
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        sort_by: "invalid_field",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_by");
      }
    });

    it("devrait rejeter un sort_order invalide", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        sort_order: "invalid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_order");
      }
    });

    it("devrait rejeter un page égal à 0", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        page: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("page");
      }
    });

    it("devrait rejeter un page négatif", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        page: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("page");
      }
    });

    it("devrait rejeter un limit égal à 0", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        limit: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("limit");
      }
    });

    it("devrait rejeter un utilisateur_id égal à 0", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        utilisateur_id: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("utilisateur_id");
      }
    });

    it("devrait rejeter un plan_tarifaire_id négatif", () => {
      const result = searchPaymentScheduleSchema.safeParse({
        plan_tarifaire_id: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("plan_tarifaire_id");
      }
    });
  });

  describe("markAsPaidSchema", () => {
    it("devrait valider un marquage comme payé valide", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1,
        paiement_id: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.paiement_id).toBe(5);
      }
    });

    it("devrait valider avec des IDs élevés", () => {
      const result = markAsPaidSchema.safeParse({
        id: 999999,
        paiement_id: 888888,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999);
        expect(result.data.paiement_id).toBe(888888);
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const result = markAsPaidSchema.safeParse({
        paiement_id: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si paiement_id est manquant", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });

    it("devrait rejeter un id égal à 0", () => {
      const result = markAsPaidSchema.safeParse({
        id: 0,
        paiement_id: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un id négatif", () => {
      const result = markAsPaidSchema.safeParse({
        id: -1,
        paiement_id: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un paiement_id égal à 0", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1,
        paiement_id: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });

    it("devrait rejeter un paiement_id négatif", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1,
        paiement_id: -5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });

    it("devrait rejeter un id de type string", () => {
      const result = markAsPaidSchema.safeParse({
        id: "1",
        paiement_id: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un paiement_id de type string", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1,
        paiement_id: "5",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });

    it("devrait rejeter un id décimal", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1.5,
        paiement_id: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un paiement_id décimal", () => {
      const result = markAsPaidSchema.safeParse({
        id: 1,
        paiement_id: 5.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("paiement_id");
      }
    });
  });
});
