/**
 * Tests pour les validators de cours
 * Test de tous les schémas Zod dans course.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createCourseSchema,
  updateCourseSchema,
  cancelCourseSchema,
  searchCourseSchema,
  duplicateCourseSchema,
  generateCoursesFromRecurrentSchema,
} from "../course.validators.js";

describe("Course Validators", () => {
  describe("createCourseSchema", () => {
    it("devrait valider un cours valide avec tous les champs", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:30",
        cours_recurrent_id: 5,
        annule: false,
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_cours).toBe("2024-06-15");
        expect(result.data.type_cours).toBe("Yoga");
        expect(result.data.heure_debut).toBe("10:00");
        expect(result.data.heure_fin).toBe("11:30");
      }
    });

    it("devrait valider avec annule par défaut à false", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "Pilates",
        heure_debut: "14:00",
        heure_fin: "15:00",
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.annule).toBe(false);
      }
    });

    it("devrait valider avec cours_recurrent_id optionnel", () => {
      const validCourse = {
        date_cours: "2024-07-20",
        type_cours: "CrossFit",
        heure_debut: "09:00",
        heure_fin: "10:00",
        annule: false,
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec cours_recurrent_id à null", () => {
      const validCourse = {
        date_cours: "2024-07-20",
        type_cours: "CrossFit",
        heure_debut: "09:00",
        heure_fin: "10:00",
        cours_recurrent_id: null,
        annule: false,
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un type de cours de 1 caractère", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "A",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un type de cours de 50 caractères", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "A".repeat(50),
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec heure_debut à minuit (00:00)", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "Cours matinal",
        heure_debut: "00:00",
        heure_fin: "01:00",
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec heure_fin à 23:59", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "Cours tardif",
        heure_debut: "22:00",
        heure_fin: "23:59",
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si heure_fin <= heure_debut (même heure)", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "10:00",
        annule: false,
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
        expect(result.error.issues[0].message).toContain(
          "supérieure à l'heure de début",
        );
      }
    });

    it("devrait rejeter si heure_fin < heure_debut", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "15:00",
        heure_fin: "14:00",
        annule: false,
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter si heure_fin est 1 minute avant heure_debut", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:30",
        heure_fin: "10:29",
        annule: false,
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait valider si heure_fin est 1 minute après heure_debut", () => {
      const validCourse = {
        date_cours: "2024-06-15",
        type_cours: "Cours court",
        heure_debut: "10:00",
        heure_fin: "10:01",
      };
      const result = createCourseSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une date au format DD/MM/YYYY", () => {
      const invalidCourse = {
        date_cours: "15/06/2024",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_cours");
      }
    });

    it("devrait rejeter une date au format MM/DD/YYYY", () => {
      const invalidCourse = {
        date_cours: "06/15/2024",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date au format YYYY/MM/DD", () => {
      const invalidCourse = {
        date_cours: "2024/06/15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date sans zéros padding", () => {
      const invalidCourse = {
        date_cours: "2024-6-5",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type_cours vide", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
      }
    });

    it("devrait rejeter un type_cours trop long (> 50 caractères)", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "A".repeat(51),
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
        expect(result.error.issues[0].message).toContain("50 caractères");
      }
    });

    it("devrait rejeter une heure_debut avec format invalide (HH:MM:SS)", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter une heure_debut avec format invalide (H:MM)", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "9:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une heure_debut avec heures >= 24", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "24:00",
        heure_fin: "25:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une heure_debut avec minutes >= 60", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:60",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une heure_fin avec format invalide", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11h00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter si date_cours est manquante", () => {
      const invalidCourse = {
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_cours est manquant", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si heure_debut est manquante", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_fin: "11:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si heure_fin est manquante", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_recurrent_id à 0", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
        cours_recurrent_id: 0,
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_recurrent_id négatif", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
        cours_recurrent_id: -5,
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un annule qui n'est pas un boolean", () => {
      const invalidCourse = {
        date_cours: "2024-06-15",
        type_cours: "Yoga",
        heure_debut: "10:00",
        heure_fin: "11:00",
        annule: "false",
      };
      const result = createCourseSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCourseSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        id: 1,
        date_cours: "2024-07-20",
        type_cours: "Pilates",
        heure_debut: "14:00",
        heure_fin: "15:30",
        cours_recurrent_id: 3,
        annule: true,
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.type_cours).toBe("Pilates");
      }
    });

    it("devrait valider avec seulement l'id", () => {
      const validUpdate = {
        id: 5,
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (id + date_cours)", () => {
      const validUpdate = {
        id: 2,
        date_cours: "2024-08-15",
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (id + type_cours)", () => {
      const validUpdate = {
        id: 3,
        type_cours: "Zumba",
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (id + annule)", () => {
      const validUpdate = {
        id: 4,
        annule: true,
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec cours_recurrent_id à null", () => {
      const validUpdate = {
        id: 6,
        cours_recurrent_id: null,
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec heure_debut et heure_fin valides", () => {
      const validUpdate = {
        id: 7,
        heure_debut: "09:00",
        heure_fin: "10:30",
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si heure_fin <= heure_debut quand les deux sont présentes", () => {
      const invalidUpdate = {
        id: 1,
        heure_debut: "10:00",
        heure_fin: "09:00",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter si heure_fin == heure_debut quand les deux sont présentes", () => {
      const invalidUpdate = {
        id: 1,
        heure_debut: "10:00",
        heure_fin: "10:00",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec seulement heure_debut (sans heure_fin)", () => {
      const validUpdate = {
        id: 8,
        heure_debut: "11:00",
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement heure_fin (sans heure_debut)", () => {
      const validUpdate = {
        id: 9,
        heure_fin: "12:00",
      };
      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidUpdate = {
        type_cours: "Yoga",
        date_cours: "2024-06-15",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidUpdate = {
        id: 0,
        type_cours: "Yoga",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidUpdate = {
        id: -1,
        type_cours: "Yoga",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type_cours vide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        type_cours: "",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type_cours trop long en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        type_cours: "A".repeat(51),
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        date_cours: "15/06/2024",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une heure_debut invalide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        heure_debut: "25:00",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une heure_fin invalide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        heure_fin: "10:70",
      };
      const result = updateCourseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("cancelCourseSchema", () => {
    it("devrait valider une annulation avec raison", () => {
      const validCancel = {
        id: 1,
        annule: true,
        raison_annulation: "Professeur malade, annulation du cours",
      };
      const result = cancelCourseSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.annule).toBe(true);
        expect(result.data.raison_annulation).toBe(
          "Professeur malade, annulation du cours",
        );
      }
    });

    it("devrait valider une annulation sans raison (optionnelle)", () => {
      const validCancel = {
        id: 2,
        annule: true,
      };
      const result = cancelCourseSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider une réactivation (annule: false) sans raison", () => {
      const validCancel = {
        id: 3,
        annule: false,
      };
      const result = cancelCourseSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider une raison de 10 caractères exactement", () => {
      const validCancel = {
        id: 4,
        annule: true,
        raison_annulation: "0123456789",
      };
      const result = cancelCourseSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait valider une raison de 500 caractères exactement", () => {
      const validCancel = {
        id: 5,
        annule: true,
        raison_annulation: "A".repeat(500),
      };
      const result = cancelCourseSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une raison trop courte (< 10 caractères)", () => {
      const invalidCancel = {
        id: 1,
        annule: true,
        raison_annulation: "Court",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("raison_annulation");
        expect(result.error.issues[0].message).toContain("10 caractères");
      }
    });

    it("devrait rejeter une raison de 9 caractères", () => {
      const invalidCancel = {
        id: 1,
        annule: true,
        raison_annulation: "123456789",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une raison trop longue (> 500 caractères)", () => {
      const invalidCancel = {
        id: 1,
        annule: true,
        raison_annulation: "A".repeat(501),
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("raison_annulation");
        expect(result.error.issues[0].message).toContain("500 caractères");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidCancel = {
        annule: true,
        raison_annulation: "Raison valide pour annulation",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si annule est manquant", () => {
      const invalidCancel = {
        id: 1,
        raison_annulation: "Raison valide pour annulation",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidCancel = {
        id: 0,
        annule: true,
        raison_annulation: "Raison valide",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidCancel = {
        id: -5,
        annule: true,
        raison_annulation: "Raison valide",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si annule n'est pas un boolean", () => {
      const invalidCancel = {
        id: 1,
        annule: "true",
        raison_annulation: "Raison valide",
      };
      const result = cancelCourseSchema.safeParse(invalidCancel);
      expect(result.success).toBe(false);
    });
  });

  describe("searchCourseSchema", () => {
    it("devrait valider une recherche complète", () => {
      const validSearch = {
        type_cours: "Yoga",
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        annule: false,
        cours_recurrent_id: 5,
        professeur_id: 10,
        sort_by: "date_cours",
        sort_order: "asc",
        page: 1,
        limit: 20,
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type_cours).toBe("Yoga");
        expect(result.data.date_debut).toBe("2024-01-01");
        expect(result.data.date_fin).toBe("2024-12-31");
      }
    });

    it("devrait valider avec seulement les champs obligatoires (aucun requis)", () => {
      const validSearch = {};
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec valeurs par défaut", () => {
      const validSearch = {
        type_cours: "Pilates",
        sort_by: "date_cours",
        sort_order: "desc",
        page: 1,
        limit: 10,
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_cours");
        expect(result.data.sort_order).toBe("desc");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it("devrait valider avec date_debut seulement", () => {
      const validSearch = {
        date_debut: "2024-06-01",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_fin seulement", () => {
      const validSearch = {
        date_fin: "2024-12-31",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_debut == date_fin", () => {
      const validSearch = {
        date_debut: "2024-06-15",
        date_fin: "2024-06-15",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec annule true", () => {
      const validSearch = {
        annule: true,
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by = 'type_cours'", () => {
      const validSearch = {
        sort_by: "type_cours",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by = 'heure_debut'", () => {
      const validSearch = {
        sort_by: "heure_debut",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by = 'created_at'", () => {
      const validSearch = {
        sort_by: "created_at",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order = 'asc'", () => {
      const validSearch = {
        sort_order: "asc",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec cours_recurrent_id", () => {
      const validSearch = {
        cours_recurrent_id: 3,
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec professeur_id", () => {
      const validSearch = {
        professeur_id: 7,
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec pagination page=5, limit=50", () => {
      const validSearch = {
        page: 5,
        limit: 50,
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si date_fin < date_debut", () => {
      const invalidSearch = {
        date_debut: "2024-12-31",
        date_fin: "2024-01-01",
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_fin");
        expect(result.error.issues[0].message).toContain(
          "supérieure ou égale à la date de début",
        );
      }
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidSearch = {
        date_debut: "01/06/2024",
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidSearch = {
        date_fin: "2024/12/31",
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type_cours vide", () => {
      const invalidSearch = {
        type_cours: "",
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type_cours trop long (> 100 caractères)", () => {
      const invalidSearch = {
        type_cours: "A".repeat(101),
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidSearch = {
        sort_by: "invalid_field",
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidSearch = {
        sort_order: "ascending",
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un cours_recurrent_id à 0", () => {
      const invalidSearch = {
        cours_recurrent_id: 0,
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un professeur_id négatif", () => {
      const invalidSearch = {
        professeur_id: -1,
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une page à 0", () => {
      const invalidSearch = {
        page: 0,
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une page négative", () => {
      const invalidSearch = {
        page: -1,
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une limit > 100", () => {
      const invalidSearch = {
        limit: 101,
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une limit à 0", () => {
      const invalidSearch = {
        limit: 0,
      };
      const result = searchCourseSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider et transformer annule string en boolean", () => {
      const validSearch = {
        annule: "true",
      };
      const result = searchCourseSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.annule).toBe(true);
      }
    });
  });

  describe("duplicateCourseSchema", () => {
    it("devrait valider une duplication valide", () => {
      const validDuplicate = {
        id: 10,
        nouvelle_date: "2024-08-20",
      };
      const result = duplicateCourseSchema.safeParse(validDuplicate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(10);
        expect(result.data.nouvelle_date).toBe("2024-08-20");
      }
    });

    it("devrait valider avec un grand ID", () => {
      const validDuplicate = {
        id: 999999,
        nouvelle_date: "2024-12-31",
      };
      const result = duplicateCourseSchema.safeParse(validDuplicate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une date future", () => {
      const validDuplicate = {
        id: 5,
        nouvelle_date: "2030-01-01",
      };
      const result = duplicateCourseSchema.safeParse(validDuplicate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une date passée", () => {
      const validDuplicate = {
        id: 5,
        nouvelle_date: "2020-01-01",
      };
      const result = duplicateCourseSchema.safeParse(validDuplicate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidDuplicate = {
        nouvelle_date: "2024-08-20",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nouvelle_date est manquante", () => {
      const invalidDuplicate = {
        id: 10,
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidDuplicate = {
        id: 0,
        nouvelle_date: "2024-08-20",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidDuplicate = {
        id: -1,
        nouvelle_date: "2024-08-20",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une nouvelle_date au format DD/MM/YYYY", () => {
      const invalidDuplicate = {
        id: 10,
        nouvelle_date: "20/08/2024",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nouvelle_date");
      }
    });

    it("devrait rejeter une nouvelle_date au format MM/DD/YYYY", () => {
      const invalidDuplicate = {
        id: 10,
        nouvelle_date: "08/20/2024",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une nouvelle_date invalide", () => {
      const invalidDuplicate = {
        id: 10,
        nouvelle_date: "invalid-date",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une nouvelle_date vide", () => {
      const invalidDuplicate = {
        id: 10,
        nouvelle_date: "",
      };
      const result = duplicateCourseSchema.safeParse(invalidDuplicate);
      expect(result.success).toBe(false);
    });
  });

  describe("generateCoursesFromRecurrentSchema", () => {
    it("devrait valider une génération valide", () => {
      const validGenerate = {
        cours_recurrent_id: 3,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(validGenerate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_recurrent_id).toBe(3);
        expect(result.data.date_debut).toBe("2024-01-01");
        expect(result.data.date_fin).toBe("2024-12-31");
      }
    });

    it("devrait valider avec date_debut == date_fin", () => {
      const validGenerate = {
        cours_recurrent_id: 5,
        date_debut: "2024-06-15",
        date_fin: "2024-06-15",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(validGenerate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un grand cours_recurrent_id", () => {
      const validGenerate = {
        cours_recurrent_id: 999999,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(validGenerate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une plage de dates future", () => {
      const validGenerate = {
        cours_recurrent_id: 7,
        date_debut: "2030-01-01",
        date_fin: "2030-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(validGenerate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec une courte plage de dates", () => {
      const validGenerate = {
        cours_recurrent_id: 2,
        date_debut: "2024-06-01",
        date_fin: "2024-06-07",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(validGenerate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si cours_recurrent_id est manquant", () => {
      const invalidGenerate = {
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si date_debut est manquante", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si date_fin est manquante", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "2024-01-01",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_recurrent_id est 0", () => {
      const invalidGenerate = {
        cours_recurrent_id: 0,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si cours_recurrent_id est négatif", () => {
      const invalidGenerate = {
        cours_recurrent_id: -5,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut au format DD/MM/YYYY", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "01/01/2024",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
      }
    });

    it("devrait rejeter une date_fin au format MM/DD/YYYY", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "2024-01-01",
        date_fin: "12/31/2024",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_fin");
      }
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "invalid-date",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "2024-01-01",
        date_fin: "not-a-date",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut vide", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "",
        date_fin: "2024-12-31",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin vide", () => {
      const invalidGenerate = {
        cours_recurrent_id: 3,
        date_debut: "2024-01-01",
        date_fin: "",
      };
      const result =
        generateCoursesFromRecurrentSchema.safeParse(invalidGenerate);
      expect(result.success).toBe(false);
    });
  });
});
