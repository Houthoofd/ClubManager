/**
 * Tests pour les validators d'inscription aux cours
 * Test de tous les schémas Zod dans inscription.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createInscriptionSchema,
  updateInscriptionSchema,
  updatePresenceSchema,
  bulkCreateInscriptionSchema,
  searchInscriptionSchema,
  cancelInscriptionSchema,
  getUserInscriptionsSchema,
  getCourseInscriptionsSchema,
  bulkUpdatePresenceSchema,
} from "../inscription.validators.js";

describe("Inscription Validators", () => {
  describe("createInscriptionSchema", () => {
    it("devrait valider une inscription complète valide", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        status_id: 2,
        commentaire: "Inscription confirmée par le professeur",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.cours_id).toBe(10);
        expect(result.data.status_id).toBe(2);
        expect(result.data.commentaire).toBe(
          "Inscription confirmée par le professeur",
        );
      }
    });

    it("devrait valider une inscription sans status_id (nullable)", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        status_id: null,
        commentaire: "En attente",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_id).toBeNull();
      }
    });

    it("devrait valider une inscription sans status_id (omis)", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        commentaire: "Inscription simple",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_id).toBeUndefined();
      }
    });

    it("devrait valider une inscription sans commentaire (optionnel)", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        status_id: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commentaire).toBeUndefined();
      }
    });

    it("devrait valider une inscription minimale (sans status_id ni commentaire)", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 5,
        cours_id: 20,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un commentaire de 1 caractère (minimum)", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        commentaire: "A",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider un commentaire de 1000 caractères (maximum)", () => {
      const longComment = "A".repeat(1000);
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        commentaire: longComment,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un commentaire trop long (> 1000 caractères)", () => {
      const tooLongComment = "A".repeat(1001);
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        commentaire: tooLongComment,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire vide", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        commentaire: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id négatif", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: -1,
        cours_id: 10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id égal à 0", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 0,
        cours_id: 10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id négatif", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status_id négatif", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        status_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id décimal", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1.5,
        cours_id: 10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id manquant", () => {
      const result = createInscriptionSchema.safeParse({
        cours_id: 10,
        status_id: 2,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id manquant", () => {
      const result = createInscriptionSchema.safeParse({
        utilisateur_id: 1,
        status_id: 2,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateInscriptionSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 1,
        status_id: 3,
        commentaire: "Mise à jour du statut",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.status_id).toBe(3);
        expect(result.data.commentaire).toBe("Mise à jour du statut");
      }
    });

    it("devrait valider une mise à jour avec seulement l'ID et status_id", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 5,
        status_id: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commentaire).toBeUndefined();
      }
    });

    it("devrait valider une mise à jour avec seulement l'ID et commentaire", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 5,
        commentaire: "Nouveau commentaire",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_id).toBeUndefined();
      }
    });

    it("devrait valider une mise à jour avec status_id null", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 5,
        status_id: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_id).toBeNull();
      }
    });

    it("devrait valider une mise à jour avec seulement l'ID (partial update)", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 10,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = updateInscriptionSchema.safeParse({
        id: -1,
        status_id: 2,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID égal à 0", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 0,
        status_id: 2,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID manquant", () => {
      const result = updateInscriptionSchema.safeParse({
        status_id: 2,
        commentaire: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status_id négatif", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 1,
        status_id: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire vide", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 1,
        commentaire: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire trop long", () => {
      const result = updateInscriptionSchema.safeParse({
        id: 1,
        commentaire: "A".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePresenceSchema", () => {
    it("devrait valider une mise à jour de présence avec present=true", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 1,
        present: true,
        commentaire: "Présent à la séance",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inscription_id).toBe(1);
        expect(result.data.present).toBe(true);
        expect(result.data.commentaire).toBe("Présent à la séance");
      }
    });

    it("devrait valider une mise à jour de présence avec present=false", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 2,
        present: false,
        commentaire: "Absent pour raison médicale",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.present).toBe(false);
      }
    });

    it("devrait valider une présence sans commentaire", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 3,
        present: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commentaire).toBeUndefined();
      }
    });

    it("devrait rejeter un inscription_id négatif", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: -1,
        present: true,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un inscription_id manquant", () => {
      const result = updatePresenceSchema.safeParse({
        present: true,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un champ present manquant", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un champ present non-booléen", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 1,
        present: "true",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire vide", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 1,
        present: true,
        commentaire: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire trop long", () => {
      const result = updatePresenceSchema.safeParse({
        inscription_id: 1,
        present: true,
        commentaire: "A".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkCreateInscriptionSchema", () => {
    it("devrait valider une création en masse avec plusieurs utilisateurs", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 2, 3, 4, 5],
        status_id: 1,
        commentaire: "Inscription en groupe",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(10);
        expect(result.data.utilisateur_ids).toHaveLength(5);
        expect(result.data.utilisateur_ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider une création en masse avec un seul utilisateur", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_ids).toHaveLength(1);
      }
    });

    it("devrait valider sans status_id (optionnel)", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 2],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_id).toBeUndefined();
      }
    });

    it("devrait valider avec status_id null", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 2],
        status_id: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status_id).toBeNull();
      }
    });

    it("devrait valider sans commentaire (optionnel)", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 2, 3],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commentaire).toBeUndefined();
      }
    });

    it("devrait rejeter un tableau vide d'utilisateur_ids", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id négatif", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: -10,
        utilisateur_ids: [1, 2],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id manquant", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        utilisateur_ids: [1, 2],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateur_ids manquant", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id négatif dans le tableau", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, -2, 3],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id égal à 0 dans le tableau", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 0, 3],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire vide", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 2],
        commentaire: "",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire trop long", () => {
      const result = bulkCreateInscriptionSchema.safeParse({
        cours_id: 10,
        utilisateur_ids: [1, 2],
        commentaire: "A".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("searchInscriptionSchema", () => {
    it("devrait valider une recherche avec tous les filtres", () => {
      const result = searchInscriptionSchema.safeParse({
        utilisateur_id: 1,
        cours_id: 10,
        status_id: 2,
        present: true,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        sort_by: "created_at",
        sort_order: "desc",
        page: 1,
        limit: 20,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.cours_id).toBe(10);
        expect(result.data.status_id).toBe(2);
        expect(result.data.present).toBe(true);
        expect(result.data.date_debut).toBe("2024-01-01");
        expect(result.data.date_fin).toBe("2024-12-31");
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider une recherche sans filtres (valeurs par défaut)", () => {
      const result = searchInscriptionSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        // Les valeurs par défaut sont appliquées seulement si les champs sont présents
        // sort_by et sort_order sont optionnels avec .optional()
        expect(result.data.sort_by).toBeUndefined();
        expect(result.data.sort_order).toBeUndefined();
      }
    });

    it("devrait valider avec sort_by=date_cours", () => {
      const result = searchInscriptionSchema.safeParse({
        sort_by: "date_cours",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_cours");
      }
    });

    it("devrait valider avec sort_by=utilisateur_id", () => {
      const result = searchInscriptionSchema.safeParse({
        sort_by: "utilisateur_id",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by=status_id", () => {
      const result = searchInscriptionSchema.safeParse({
        sort_by: "status_id",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order=asc", () => {
      const result = searchInscriptionSchema.safeParse({
        sort_order: "asc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec present=false", () => {
      const result = searchInscriptionSchema.safeParse({
        present: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.present).toBe(false);
      }
    });

    it("devrait valider avec seulement date_debut", () => {
      const result = searchInscriptionSchema.safeParse({
        date_debut: "2024-01-01",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement date_fin", () => {
      const result = searchInscriptionSchema.safeParse({
        date_fin: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider une plage de dates valide (date_fin >= date_debut)", () => {
      const result = searchInscriptionSchema.safeParse({
        date_debut: "2024-01-01",
        date_fin: "2024-01-01",
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une plage de dates invalide (date_fin < date_debut)", () => {
      const result = searchInscriptionSchema.safeParse({
        date_debut: "2024-12-31",
        date_fin: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide pour date_debut", () => {
      const result = searchInscriptionSchema.safeParse({
        date_debut: "01/01/2024",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide pour date_fin", () => {
      const result = searchInscriptionSchema.safeParse({
        date_fin: "31-12-2024",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const result = searchInscriptionSchema.safeParse({
        sort_by: "invalid_field",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const result = searchInscriptionSchema.safeParse({
        sort_order: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id négatif", () => {
      const result = searchInscriptionSchema.safeParse({
        utilisateur_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id égal à 0", () => {
      const result = searchInscriptionSchema.safeParse({
        cours_id: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancelInscriptionSchema", () => {
    it("devrait valider une annulation avec raison", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: 1,
        raison_annulation: "Problème de santé empêchant la participation",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.raison_annulation).toBe(
          "Problème de santé empêchant la participation",
        );
      }
    });

    it("devrait valider une annulation sans raison (optionnel)", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.raison_annulation).toBeUndefined();
      }
    });

    it("devrait valider une raison de 10 caractères (minimum)", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: 1,
        raison_annulation: "Maladie!!!", // 10 caractères exactement
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider une raison de 500 caractères (maximum)", () => {
      const longReason = "A".repeat(500);
      const result = cancelInscriptionSchema.safeParse({
        id: 1,
        raison_annulation: longReason,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une raison trop courte (< 10 caractères)", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: 1,
        raison_annulation: "Maladie",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison trop longue (> 500 caractères)", () => {
      const tooLongReason = "A".repeat(501);
      const result = cancelInscriptionSchema.safeParse({
        id: 1,
        raison_annulation: tooLongReason,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: -1,
        raison_annulation: "Raison valide pour annulation",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID égal à 0", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: 0,
        raison_annulation: "Raison valide pour annulation",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID manquant", () => {
      const result = cancelInscriptionSchema.safeParse({
        raison_annulation: "Raison valide pour annulation",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison vide", () => {
      const result = cancelInscriptionSchema.safeParse({
        id: 1,
        raison_annulation: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getUserInscriptionsSchema", () => {
    it("devrait valider une requête complète avec tous les filtres", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        status_id: 2,
        page: 1,
        limit: 20,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(1);
        expect(result.data.date_debut).toBe("2024-01-01");
        expect(result.data.date_fin).toBe("2024-12-31");
        expect(result.data.status_id).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("devrait valider une requête avec seulement utilisateur_id", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(5);
        expect(result.data.date_debut).toBeUndefined();
        expect(result.data.date_fin).toBeUndefined();
      }
    });

    it("devrait valider avec date_debut uniquement", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        date_debut: "2024-06-01",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_fin uniquement", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        date_fin: "2024-06-30",
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec status_id", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        status_id: 3,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec page et limit", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("devrait rejeter un utilisateur_id négatif", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id égal à 0", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un utilisateur_id manquant", () => {
      const result = getUserInscriptionsSchema.safeParse({
        date_debut: "2024-01-01",
        status_id: 2,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide pour date_debut", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        date_debut: "01-01-2024",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide pour date_fin", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        date_fin: "2024/12/31",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status_id négatif", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        status_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une page négative", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        page: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une limit égale à 0", () => {
      const result = getUserInscriptionsSchema.safeParse({
        utilisateur_id: 1,
        limit: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getCourseInscriptionsSchema", () => {
    it("devrait valider une requête complète avec tous les filtres", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        status_id: 2,
        present: true,
        page: 1,
        limit: 30,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(10);
        expect(result.data.status_id).toBe(2);
        expect(result.data.present).toBe(true);
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(30);
      }
    });

    it("devrait valider une requête avec seulement cours_id", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 15,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(15);
        expect(result.data.status_id).toBeUndefined();
        expect(result.data.present).toBeUndefined();
      }
    });

    it("devrait valider avec status_id uniquement", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        status_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it("devrait valider avec present=false", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        present: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.present).toBe(false);
      }
    });

    it("devrait valider avec page et limit", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        page: 3,
        limit: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(10);
      }
    });

    it("devrait valider avec status_id et present combinés", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        status_id: 2,
        present: true,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un cours_id négatif", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: -10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id égal à 0", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id manquant", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        status_id: 2,
        present: true,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status_id négatif", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        status_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une page négative", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        page: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une limit trop élevée", () => {
      const result = getCourseInscriptionsSchema.safeParse({
        cours_id: 10,
        limit: 1001,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkUpdatePresenceSchema", () => {
    it("devrait valider une mise à jour en masse de présences", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [
          { inscription_id: 1, present: true, commentaire: "Présent" },
          { inscription_id: 2, present: false, commentaire: "Absent justifié" },
          { inscription_id: 3, present: true },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_id).toBe(10);
        expect(result.data.presences).toHaveLength(3);
        expect(result.data.presences[0].inscription_id).toBe(1);
        expect(result.data.presences[0].present).toBe(true);
        expect(result.data.presences[1].present).toBe(false);
      }
    });

    it("devrait valider avec une seule présence", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [{ inscription_id: 5, present: true }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.presences).toHaveLength(1);
      }
    });

    it("devrait valider avec plusieurs présences sans commentaires", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [
          { inscription_id: 1, present: true },
          { inscription_id: 2, present: false },
          { inscription_id: 3, present: true },
          { inscription_id: 4, present: true },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.presences).toHaveLength(4);
      }
    });

    it("devrait valider un commentaire de 1000 caractères", () => {
      const longComment = "A".repeat(1000);
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [
          { inscription_id: 1, present: true, commentaire: longComment },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un cours_id négatif", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: -10,
        presences: [{ inscription_id: 1, present: true }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_id manquant", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        presences: [{ inscription_id: 1, present: true }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter un tableau de présences vide (pas de contrainte min)", () => {
      // Le schéma n'a pas de contrainte .min(1) sur le tableau presences
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [],
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter presences manquant", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un inscription_id négatif dans une présence", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [{ inscription_id: -1, present: true }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un inscription_id manquant dans une présence", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [{ present: true }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un champ present manquant dans une présence", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [{ inscription_id: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire vide dans une présence", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [{ inscription_id: 1, present: true, commentaire: "" }],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un commentaire trop long dans une présence", () => {
      const tooLongComment = "A".repeat(1001);
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [
          { inscription_id: 1, present: true, commentaire: tooLongComment },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si une présence est invalide parmi plusieurs", () => {
      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences: [
          { inscription_id: 1, present: true },
          { inscription_id: -2, present: false }, // Invalid
          { inscription_id: 3, present: true },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("devrait valider un grand nombre de présences", () => {
      const presences = Array.from({ length: 50 }, (_, i) => ({
        inscription_id: i + 1,
        present: i % 2 === 0,
        commentaire: i % 3 === 0 ? `Commentaire ${i}` : undefined,
      }));

      const result = bulkUpdatePresenceSchema.safeParse({
        cours_id: 10,
        presences,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.presences).toHaveLength(50);
      }
    });
  });
});
