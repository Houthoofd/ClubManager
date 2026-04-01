/**
 * Tests pour les validators de plans tarifaires
 * Test de tous les schémas Zod dans pricing-plan.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createPricingPlanSchema,
  updatePricingPlanSchema,
  searchPricingPlanSchema,
  togglePricingPlanSchema,
} from "../pricing-plan.validators.js";

describe("Pricing Plan Validators", () => {
  describe("createPricingPlanSchema", () => {
    it("devrait valider un plan tarifaire valide avec tous les champs", () => {
      const validPlan = {
        nom: "Abonnement Mensuel",
        description: "Accès illimité aux cours pendant 1 mois",
        prix: 49.99,
        duree_mois: 1,
        actif: true,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Abonnement Mensuel");
        expect(result.data.prix).toBe(49.99);
        expect(result.data.duree_mois).toBe(1);
      }
    });

    it("devrait valider un plan sans description (optionnelle)", () => {
      const validPlan = {
        nom: "Plan Basique",
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait accepter actif absent (optionnel)", () => {
      const validPlan = {
        nom: "Plan Standard",
        prix: 39.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        // actif est optionnel, donc peut être undefined
        expect(result.data.actif).toBeUndefined();
      }
    });

    it("devrait valider avec actif=false explicite", () => {
      const validPlan = {
        nom: "Plan Désactivé",
        prix: 19.99,
        duree_mois: 1,
        actif: false,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    // Tests pour le champ nom
    it("devrait valider un nom de 2 caractères exactement", () => {
      const validPlan = {
        nom: "AB",
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un nom de 100 caractères exactement", () => {
      const validPlan = {
        nom: "A".repeat(100),
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom trop court (< 2 caractères)", () => {
      const invalidPlan = {
        nom: "A",
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
        expect(result.error.issues[0].message).toContain(
          "au moins 2 caractères",
        );
      }
    });

    it("devrait rejeter un nom trop long (> 100 caractères)", () => {
      const invalidPlan = {
        nom: "A".repeat(101),
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
        expect(result.error.issues[0].message).toContain("100 caractères");
      }
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidPlan = {
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
      }
    });

    it("devrait trimmer les espaces du nom", () => {
      const validPlan = {
        nom: "  Plan Standard  ",
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Plan Standard");
      }
    });

    // Tests pour le champ description
    it("devrait valider une description de 5000 caractères exactement", () => {
      const validPlan = {
        nom: "Plan Premium",
        description: "A".repeat(5000),
        prix: 99.99,
        duree_mois: 12,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une description trop longue (> 5000 caractères)", () => {
      const invalidPlan = {
        nom: "Plan Premium",
        description: "A".repeat(5001),
        prix: 99.99,
        duree_mois: 12,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("description");
        expect(result.error.issues[0].message).toContain("5000 caractères");
      }
    });

    it("devrait valider une description vide", () => {
      const validPlan = {
        nom: "Plan Standard",
        description: "",
        prix: 39.99,
        duree_mois: 3,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider une description avec texte multiligne", () => {
      const validPlan = {
        nom: "Plan Complet",
        description: "Ligne 1\nLigne 2\nLigne 3\nAccès complet aux cours",
        prix: 79.99,
        duree_mois: 6,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    // Tests pour le champ prix
    it("devrait valider un prix positif avec 2 décimales", () => {
      const validPlan = {
        nom: "Plan Standard",
        prix: 49.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un prix entier (sans décimales)", () => {
      const validPlan = {
        nom: "Plan Standard",
        prix: 50,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un prix avec 1 décimale", () => {
      const validPlan = {
        nom: "Plan Standard",
        prix: 49.5,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un très petit prix (0.01)", () => {
      const validPlan = {
        nom: "Plan Test",
        prix: 0.01,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un très grand prix", () => {
      const validPlan = {
        nom: "Plan Premium",
        prix: 9999.99,
        duree_mois: 12,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un prix de zéro", () => {
      const invalidPlan = {
        nom: "Plan Gratuit",
        prix: 0,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
        expect(result.error.issues[0].message).toContain("strictement positif");
      }
    });

    it("devrait rejeter un prix négatif", () => {
      const invalidPlan = {
        nom: "Plan Invalid",
        prix: -10.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
      }
    });

    it("devrait rejeter un prix avec plus de 2 décimales", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        prix: 49.999,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
        expect(result.error.issues[0].message).toContain("2 décimales");
      }
    });

    it("devrait rejeter si prix est manquant", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
      }
    });

    it("devrait rejeter un prix non numérique", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        prix: "49.99",
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
        expect(result.error.issues[0].message).toContain("nombre");
      }
    });

    // Tests pour le champ duree_mois
    it("devrait valider une durée de 1 mois", () => {
      const validPlan = {
        nom: "Plan Mensuel",
        prix: 29.99,
        duree_mois: 1,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider une durée de 60 mois", () => {
      const validPlan = {
        nom: "Plan Longue Durée",
        prix: 999.99,
        duree_mois: 60,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider une durée de 12 mois (annuel)", () => {
      const validPlan = {
        nom: "Plan Annuel",
        prix: 399.99,
        duree_mois: 12,
      };
      const result = createPricingPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une durée de 0 mois", () => {
      const invalidPlan = {
        nom: "Plan Invalid",
        prix: 29.99,
        duree_mois: 0,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait rejeter une durée négative", () => {
      const invalidPlan = {
        nom: "Plan Invalid",
        prix: 29.99,
        duree_mois: -1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait rejeter une durée supérieure à 60 mois", () => {
      const invalidPlan = {
        nom: "Plan Trop Long",
        prix: 1999.99,
        duree_mois: 61,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
        expect(result.error.issues[0].message).toContain("60 mois");
      }
    });

    it("devrait rejeter une durée décimale", () => {
      const invalidPlan = {
        nom: "Plan Invalid",
        prix: 29.99,
        duree_mois: 1.5,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
        expect(result.error.issues[0].message).toContain("entier");
      }
    });

    it("devrait rejeter si duree_mois est manquant", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        prix: 29.99,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait rejeter une durée non numérique", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        prix: 29.99,
        duree_mois: "12",
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
        expect(result.error.issues[0].message).toContain("nombre");
      }
    });

    // Tests pour le champ actif
    it("devrait rejeter actif non booléen (string)", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        prix: 29.99,
        duree_mois: 1,
        actif: "true",
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("actif");
      }
    });

    it("devrait rejeter actif non booléen (number)", () => {
      const invalidPlan = {
        nom: "Plan Standard",
        prix: 29.99,
        duree_mois: 1,
        actif: 1,
      };
      const result = createPricingPlanSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("actif");
      }
    });
  });

  describe("updatePricingPlanSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        id: 1,
        nom: "Abonnement Mensuel Modifié",
        description: "Description mise à jour",
        prix: 59.99,
        duree_mois: 2,
        actif: false,
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Abonnement Mensuel Modifié");
        expect(result.data.prix).toBe(59.99);
      }
    });

    it("devrait valider avec seulement l'id (aucune mise à jour)", () => {
      const validUpdate = {
        id: 5,
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (nom seulement)", () => {
      const validUpdate = {
        id: 2,
        nom: "Nouveau Nom",
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (prix seulement)", () => {
      const validUpdate = {
        id: 3,
        prix: 39.99,
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (duree_mois seulement)", () => {
      const validUpdate = {
        id: 4,
        duree_mois: 6,
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (actif seulement)", () => {
      const validUpdate = {
        id: 6,
        actif: true,
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (description seulement)", () => {
      const validUpdate = {
        id: 7,
        description: "Nouvelle description complète",
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidUpdate = {
        nom: "Nouveau Nom",
        prix: 29.99,
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidUpdate = {
        id: 0,
        nom: "Nouveau Nom",
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidUpdate = {
        id: -1,
        nom: "Nouveau Nom",
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter un nom invalide en mise à jour (trop court)", () => {
      const invalidUpdate = {
        id: 1,
        nom: "A",
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
      }
    });

    it("devrait rejeter un nom invalide en mise à jour (trop long)", () => {
      const invalidUpdate = {
        id: 1,
        nom: "A".repeat(101),
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
      }
    });

    it("devrait rejeter un prix invalide en mise à jour (négatif)", () => {
      const invalidUpdate = {
        id: 1,
        prix: -10.99,
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
      }
    });

    it("devrait rejeter un prix invalide en mise à jour (trop de décimales)", () => {
      const invalidUpdate = {
        id: 1,
        prix: 49.999,
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix");
      }
    });

    it("devrait rejeter une durée invalide en mise à jour (0)", () => {
      const invalidUpdate = {
        id: 1,
        duree_mois: 0,
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait rejeter une durée invalide en mise à jour (> 60)", () => {
      const invalidUpdate = {
        id: 1,
        duree_mois: 61,
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait rejeter une description trop longue en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        description: "A".repeat(5001),
      };
      const result = updatePricingPlanSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("description");
      }
    });

    it("devrait trimmer le nom en mise à jour", () => {
      const validUpdate = {
        id: 1,
        nom: "  Nom avec espaces  ",
      };
      const result = updatePricingPlanSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nom avec espaces");
      }
    });
  });

  describe("searchPricingPlanSchema", () => {
    it("devrait valider une recherche vide (tous les plans)", () => {
      const validSearch = {};
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche par nom", () => {
      const validSearch = {
        nom: "Mensuel",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche générale", () => {
      const validSearch = {
        search: "abonnement",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider un filtre par actif=true", () => {
      const validSearch = {
        actif: true,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider un filtre par actif=false", () => {
      const validSearch = {
        actif: false,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider un filtre par prix_min", () => {
      const validSearch = {
        prix_min: 20.0,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider un filtre par prix_max", () => {
      const validSearch = {
        prix_max: 100.0,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider un filtre par plage de prix valide", () => {
      const validSearch = {
        prix_min: 20.0,
        prix_max: 100.0,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider quand prix_min égal à prix_max", () => {
      const validSearch = {
        prix_min: 50.0,
        prix_max: 50.0,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter quand prix_max < prix_min", () => {
      const invalidSearch = {
        prix_min: 100.0,
        prix_max: 50.0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix_max");
        expect(result.error.issues[0].message).toContain("prix maximum");
        expect(result.error.issues[0].message).toContain("prix minimum");
      }
    });

    it("devrait rejeter un prix_min négatif", () => {
      const invalidSearch = {
        prix_min: -10.0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix_min");
        expect(result.error.issues[0].message).toContain("positif");
      }
    });

    it("devrait rejeter un prix_max négatif", () => {
      const invalidSearch = {
        prix_max: -10.0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix_max");
        expect(result.error.issues[0].message).toContain("positif");
      }
    });

    it("devrait rejeter un prix_min de zéro", () => {
      const invalidSearch = {
        prix_min: 0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prix_min");
      }
    });

    it("devrait valider un filtre par duree_mois", () => {
      const validSearch = {
        duree_mois: 12,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une duree_mois invalide (0)", () => {
      const invalidSearch = {
        duree_mois: 0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait rejeter une duree_mois invalide (> 60)", () => {
      const invalidSearch = {
        duree_mois: 61,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("duree_mois");
      }
    });

    it("devrait valider avec pagination par défaut", () => {
      const validSearch = {
        nom: "Plan",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBeDefined();
        expect(result.data.limit).toBeDefined();
      }
    });

    it("devrait valider avec pagination personnalisée", () => {
      const validSearch = {
        page: 2,
        limit: 50,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("devrait valider avec tri par nom", () => {
      const validSearch = {
        sort_by: "nom",
        sort_order: "asc",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tri par prix", () => {
      const validSearch = {
        sort_by: "prix",
        sort_order: "desc",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tri par duree_mois", () => {
      const validSearch = {
        sort_by: "duree_mois",
        sort_order: "asc",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tri par ordre", () => {
      const validSearch = {
        sort_by: "ordre",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tri par created_at", () => {
      const validSearch = {
        sort_by: "created_at",
        sort_order: "desc",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait accepter sort_by absent (optionnel avec défaut)", () => {
      const validSearch = {};
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        // sort_by est optionnel, peut être undefined malgré le default
        expect(result.data.sort_by).toBeUndefined();
      }
    });

    it("devrait accepter sort_order absent (optionnel avec défaut)", () => {
      const validSearch = {};
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        // sort_order est optionnel, peut être undefined malgré le default
        expect(result.data.sort_order).toBeUndefined();
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidSearch = {
        sort_by: "invalid_field",
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_by");
      }
    });

    it("devrait valider une recherche complexe avec tous les filtres", () => {
      const validSearch = {
        nom: "Premium",
        search: "illimité",
        actif: true,
        prix_min: 50.0,
        prix_max: 150.0,
        duree_mois: 12,
        sort_by: "prix",
        sort_order: "desc",
        page: 1,
        limit: 20,
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait accepter actif en string (transformation par booleanSchema)", () => {
      const validSearch = {
        actif: "true",
      };
      const result = searchPricingPlanSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        // booleanSchema transforme "true" en boolean true
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait rejeter une page invalide (0)", () => {
      const invalidSearch = {
        page: 0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("page");
      }
    });

    it("devrait rejeter une page négative", () => {
      const invalidSearch = {
        page: -1,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("page");
      }
    });

    it("devrait rejeter une limite invalide (0)", () => {
      const invalidSearch = {
        limit: 0,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("limit");
      }
    });

    it("devrait rejeter une limite trop élevée", () => {
      const invalidSearch = {
        limit: 101,
      };
      const result = searchPricingPlanSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("limit");
      }
    });
  });

  describe("togglePricingPlanSchema", () => {
    it("devrait valider l'activation d'un plan", () => {
      const validToggle = {
        id: 1,
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider la désactivation d'un plan", () => {
      const validToggle = {
        id: 5,
        actif: false,
      };
      const result = togglePricingPlanSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(5);
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec un grand ID", () => {
      const validToggle = {
        id: 999999,
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidToggle = {
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si actif est manquant", () => {
      const invalidToggle = {
        id: 1,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("actif");
        expect(result.error.issues[0].message).toContain("requis");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidToggle = {
        id: 0,
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidToggle = {
        id: -1,
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si actif n'est pas un booléen (string)", () => {
      const invalidToggle = {
        id: 1,
        actif: "true",
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("actif");
        expect(result.error.issues[0].message).toContain("boolean");
      }
    });

    it("devrait rejeter si actif n'est pas un booléen (number)", () => {
      const invalidToggle = {
        id: 1,
        actif: 1,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("actif");
      }
    });

    it("devrait rejeter si id est une string", () => {
      const invalidToggle = {
        id: "1",
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est décimal", () => {
      const invalidToggle = {
        id: 1.5,
        actif: true,
      };
      const result = togglePricingPlanSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait accepter des champs supplémentaires (Zod par défaut)", () => {
      const toggleWithExtra = {
        id: 1,
        actif: true,
        nom: "Plan Extra",
        prix: 49.99,
      };
      const result = togglePricingPlanSchema.safeParse(toggleWithExtra);
      // Zod n'utilise pas .strict() par défaut, donc accepte les champs extra
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.actif).toBe(true);
        // Les champs extra sont ignorés mais ne causent pas d'erreur
      }
    });
  });
});
