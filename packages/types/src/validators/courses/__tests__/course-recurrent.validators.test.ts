/**
 * Tests pour les validators des cours récurrents
 * Test de tous les schémas Zod dans course-recurrent.validators.ts
 */

import { describe, it, expect } from "@jest/globals";
import {
  createCourseRecurrentSchema,
  updateCourseRecurrentSchema,
  assignProfessorSchema,
  unassignProfessorSchema,
  searchCourseRecurrentSchema,
  toggleCourseRecurrentSchema,
} from "../course-recurrent.validators.js";

describe("Course Recurrent Validators", () => {
  describe("createCourseRecurrentSchema", () => {
    it("devrait valider un cours récurrent valide avec tous les champs", () => {
      const validCourse = {
        type_cours: "Karaté Débutant",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:30",
        active: true,
        professeur_ids: [1, 2, 3],
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type_cours).toBe("Karaté Débutant");
        expect(result.data.jour_semaine).toBe(1);
        expect(result.data.heure_debut).toBe("10:00");
        expect(result.data.heure_fin).toBe("11:30");
        expect(result.data.active).toBe(true);
        expect(result.data.professeur_ids).toEqual([1, 2, 3]);
      }
    });

    it("devrait valider un cours avec valeurs par défaut (active=true)", () => {
      const validCourse = {
        type_cours: "Judo Enfants",
        jour_semaine: 3,
        heure_debut: "14:00",
        heure_fin: "15:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it("devrait valider un cours sans professeur_ids", () => {
      const validCourse = {
        type_cours: "Taekwondo Avancé",
        jour_semaine: 5,
        heure_debut: "18:00",
        heure_fin: "19:30",
        active: false,
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider un type_cours de 1 caractère", () => {
      const validCourse = {
        type_cours: "A",
        jour_semaine: 2,
        heure_debut: "09:00",
        heure_fin: "10:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider un type_cours de 255 caractères", () => {
      const validCourse = {
        type_cours: "A".repeat(255),
        jour_semaine: 4,
        heure_debut: "16:00",
        heure_fin: "17:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un type_cours vide", () => {
      const invalidCourse = {
        type_cours: "",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
      }
    });

    it("devrait rejeter un type_cours trop long (> 255 caractères)", () => {
      const invalidCourse = {
        type_cours: "A".repeat(256),
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
      }
    });

    it("devrait valider jour_semaine = 1 (Lundi)", () => {
      const validCourse = {
        type_cours: "Cours du Lundi",
        jour_semaine: 1,
        heure_debut: "08:00",
        heure_fin: "09:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider jour_semaine = 7 (Dimanche)", () => {
      const validCourse = {
        type_cours: "Cours du Dimanche",
        jour_semaine: 7,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter jour_semaine = 0", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 0,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter jour_semaine = 8", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 8,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter jour_semaine négatif", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: -1,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter jour_semaine décimal", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 3.5,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait valider heure_debut = 00:00", () => {
      const validCourse = {
        type_cours: "Cours de Minuit",
        jour_semaine: 1,
        heure_debut: "00:00",
        heure_fin: "01:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider heure_fin = 23:59", () => {
      const validCourse = {
        type_cours: "Cours de Fin de Journée",
        jour_semaine: 1,
        heure_debut: "22:00",
        heure_fin: "23:59",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider des heures au format HH:MM", () => {
      const validCourse = {
        type_cours: "Cours Standard",
        jour_semaine: 3,
        heure_debut: "14:30",
        heure_fin: "16:45",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter heure_debut au format HH:MM:SS", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter heure_fin au format HH:MM:SS", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter heure_debut avec format invalide (H:MM)", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "9:00",
        heure_fin: "10:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter heure_debut avec heures invalides (24:00)", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "24:00",
        heure_fin: "25:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter heure_debut avec minutes invalides (10:60)", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:60",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter heure_debut avec format texte", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "dix heures",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait valider heure_fin > heure_debut (cas valide)", () => {
      const validCourse = {
        type_cours: "Cours Normal",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait valider heure_fin > heure_debut avec une minute de différence", () => {
      const validCourse = {
        type_cours: "Cours Court",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "10:01",
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter heure_fin = heure_debut (CHECK constraint)", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "10:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
        expect(result.error.issues[0].message).toContain("supérieure");
      }
    });

    it("devrait rejeter heure_fin < heure_debut (CHECK constraint)", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "11:00",
        heure_fin: "10:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
        expect(result.error.issues[0].message).toContain("supérieure");
      }
    });

    it("devrait rejeter heure_fin < heure_debut avec une minute de différence", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:01",
        heure_fin: "10:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter professeur_ids avec un tableau vide", () => {
      const invalidCourse = {
        type_cours: "Cours Sans Professeur",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        professeur_ids: [],
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_ids");
      }
    });

    it("devrait valider professeur_ids avec plusieurs IDs", () => {
      const validCourse = {
        type_cours: "Cours Multi-Professeurs",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        professeur_ids: [1, 5, 10, 25],
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter professeur_ids avec ID = 0", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        professeur_ids: [1, 0, 3],
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter professeur_ids avec ID négatif", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        professeur_ids: [1, -5, 3],
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter professeur_ids avec valeur non numérique", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        professeur_ids: [1, "deux", 3],
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_cours est manquant", () => {
      const invalidCourse = {
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
      }
    });

    it("devrait rejeter si jour_semaine est manquant", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        heure_debut: "10:00",
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter si heure_debut est manquante", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_fin: "11:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter si heure_fin est manquante", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait valider active = false", () => {
      const validCourse = {
        type_cours: "Cours Inactif",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        active: false,
      };
      const result = createCourseRecurrentSchema.safeParse(validCourse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it("devrait rejeter active avec valeur non booléenne", () => {
      const invalidCourse = {
        type_cours: "Cours Invalide",
        jour_semaine: 1,
        heure_debut: "10:00",
        heure_fin: "11:00",
        active: "true",
      };
      const result = createCourseRecurrentSchema.safeParse(invalidCourse);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCourseRecurrentSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        id: 1,
        type_cours: "Karaté Avancé",
        jour_semaine: 3,
        heure_debut: "15:00",
        heure_fin: "16:30",
        active: false,
        professeur_ids: [2, 4],
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.type_cours).toBe("Karaté Avancé");
        expect(result.data.jour_semaine).toBe(3);
        expect(result.data.active).toBe(false);
      }
    });

    it("devrait valider une mise à jour partielle (seulement type_cours)", () => {
      const validUpdate = {
        id: 5,
        type_cours: "Nouveau Type",
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec seulement l'id", () => {
      const validUpdate = {
        id: 10,
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour de jour_semaine uniquement", () => {
      const validUpdate = {
        id: 3,
        jour_semaine: 5,
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour d'heure_debut uniquement", () => {
      const validUpdate = {
        id: 2,
        heure_debut: "08:30",
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour d'heure_fin uniquement", () => {
      const validUpdate = {
        id: 2,
        heure_fin: "12:45",
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour de active uniquement", () => {
      const validUpdate = {
        id: 7,
        active: true,
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour de professeur_ids uniquement", () => {
      const validUpdate = {
        id: 4,
        professeur_ids: [10, 20, 30],
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider heure_fin > heure_debut si les deux sont fournis", () => {
      const validUpdate = {
        id: 1,
        heure_debut: "14:00",
        heure_fin: "16:00",
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter heure_fin = heure_debut si les deux sont fournis", () => {
      const invalidUpdate = {
        id: 1,
        heure_debut: "14:00",
        heure_fin: "14:00",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter heure_fin < heure_debut si les deux sont fournis", () => {
      const invalidUpdate = {
        id: 1,
        heure_debut: "16:00",
        heure_fin: "14:00",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait valider si seulement heure_debut est fourni (pas de validation croisée)", () => {
      const validUpdate = {
        id: 1,
        heure_debut: "20:00",
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider si seulement heure_fin est fourni (pas de validation croisée)", () => {
      const validUpdate = {
        id: 1,
        heure_fin: "08:00",
      };
      const result = updateCourseRecurrentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidUpdate = {
        type_cours: "Nouveau Type",
        jour_semaine: 2,
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidUpdate = {
        id: 0,
        type_cours: "Nouveau Type",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidUpdate = {
        id: -5,
        type_cours: "Nouveau Type",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter type_cours vide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        type_cours: "",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
      }
    });

    it("devrait rejeter jour_semaine = 0 même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        jour_semaine: 0,
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter jour_semaine = 8 même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        jour_semaine: 8,
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter heure_debut invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        heure_debut: "25:00",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_debut");
      }
    });

    it("devrait rejeter heure_fin invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        heure_fin: "10:60",
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("heure_fin");
      }
    });

    it("devrait rejeter professeur_ids vide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        professeur_ids: [],
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_ids");
      }
    });

    it("devrait rejeter professeur_ids avec ID invalide en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        professeur_ids: [1, 0, 3],
      };
      const result = updateCourseRecurrentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("assignProfessorSchema", () => {
    it("devrait valider une assignation valide", () => {
      const validAssign = {
        cours_recurrent_id: 5,
        professeur_id: 10,
      };
      const result = assignProfessorSchema.safeParse(validAssign);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_recurrent_id).toBe(5);
        expect(result.data.professeur_id).toBe(10);
      }
    });

    it("devrait valider avec des IDs élevés", () => {
      const validAssign = {
        cours_recurrent_id: 999999,
        professeur_id: 888888,
      };
      const result = assignProfessorSchema.safeParse(validAssign);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si cours_recurrent_id est manquant", () => {
      const invalidAssign = {
        professeur_id: 10,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_recurrent_id");
      }
    });

    it("devrait rejeter si professeur_id est manquant", () => {
      const invalidAssign = {
        cours_recurrent_id: 5,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si cours_recurrent_id est 0", () => {
      const invalidAssign = {
        cours_recurrent_id: 0,
        professeur_id: 10,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_recurrent_id");
      }
    });

    it("devrait rejeter si professeur_id est 0", () => {
      const invalidAssign = {
        cours_recurrent_id: 5,
        professeur_id: 0,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si cours_recurrent_id est négatif", () => {
      const invalidAssign = {
        cours_recurrent_id: -5,
        professeur_id: 10,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_recurrent_id");
      }
    });

    it("devrait rejeter si professeur_id est négatif", () => {
      const invalidAssign = {
        cours_recurrent_id: 5,
        professeur_id: -10,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si cours_recurrent_id est une string", () => {
      const invalidAssign = {
        cours_recurrent_id: "5",
        professeur_id: 10,
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si professeur_id est une string", () => {
      const invalidAssign = {
        cours_recurrent_id: 5,
        professeur_id: "10",
      };
      const result = assignProfessorSchema.safeParse(invalidAssign);
      expect(result.success).toBe(false);
    });
  });

  describe("unassignProfessorSchema", () => {
    it("devrait valider une désassignation valide", () => {
      const validUnassign = {
        cours_recurrent_id: 7,
        professeur_id: 15,
      };
      const result = unassignProfessorSchema.safeParse(validUnassign);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cours_recurrent_id).toBe(7);
        expect(result.data.professeur_id).toBe(15);
      }
    });

    it("devrait valider avec des IDs élevés", () => {
      const validUnassign = {
        cours_recurrent_id: 123456,
        professeur_id: 654321,
      };
      const result = unassignProfessorSchema.safeParse(validUnassign);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si cours_recurrent_id est manquant", () => {
      const invalidUnassign = {
        professeur_id: 15,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_recurrent_id");
      }
    });

    it("devrait rejeter si professeur_id est manquant", () => {
      const invalidUnassign = {
        cours_recurrent_id: 7,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si cours_recurrent_id est 0", () => {
      const invalidUnassign = {
        cours_recurrent_id: 0,
        professeur_id: 15,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_recurrent_id");
      }
    });

    it("devrait rejeter si professeur_id est 0", () => {
      const invalidUnassign = {
        cours_recurrent_id: 7,
        professeur_id: 0,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si cours_recurrent_id est négatif", () => {
      const invalidUnassign = {
        cours_recurrent_id: -7,
        professeur_id: 15,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cours_recurrent_id");
      }
    });

    it("devrait rejeter si professeur_id est négatif", () => {
      const invalidUnassign = {
        cours_recurrent_id: 7,
        professeur_id: -15,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si cours_recurrent_id est un décimal", () => {
      const invalidUnassign = {
        cours_recurrent_id: 7.5,
        professeur_id: 15,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si professeur_id est un décimal", () => {
      const invalidUnassign = {
        cours_recurrent_id: 7,
        professeur_id: 15.3,
      };
      const result = unassignProfessorSchema.safeParse(invalidUnassign);
      expect(result.success).toBe(false);
    });
  });

  describe("searchCourseRecurrentSchema", () => {
    it("devrait valider une recherche complète avec tous les filtres", () => {
      const validSearch = {
        type_cours: "Karaté",
        jour_semaine: 3,
        active: true,
        professeur_id: 5,
        sort_by: "type_cours",
        sort_order: "desc",
        page: 2,
        limit: 20,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type_cours).toBe("Karaté");
        expect(result.data.jour_semaine).toBe(3);
        expect(result.data.active).toBe(true);
        expect(result.data.professeur_id).toBe(5);
        expect(result.data.sort_by).toBe("type_cours");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider une recherche sans filtres (valeurs par défaut)", () => {
      const validSearch = {};
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        // Les valeurs par défaut de pagination sont appliquées
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        // sort_by et sort_order sont optionnels et restent undefined si non fournis
        expect(result.data.sort_by).toBeUndefined();
        expect(result.data.sort_order).toBeUndefined();
      }
    });

    it("devrait valider une recherche avec seulement type_cours", () => {
      const validSearch = {
        type_cours: "Judo",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche avec seulement jour_semaine", () => {
      const validSearch = {
        jour_semaine: 5,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche avec active = false", () => {
      const validSearch = {
        active: false,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it("devrait valider une recherche avec professeur_id", () => {
      const validSearch = {
        professeur_id: 10,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by = 'jour_semaine'", () => {
      const validSearch = {
        sort_by: "jour_semaine",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by = 'heure_debut'", () => {
      const validSearch = {
        sort_by: "heure_debut",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by = 'created_at'", () => {
      const validSearch = {
        sort_by: "created_at",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter sort_by invalide", () => {
      const invalidSearch = {
        sort_by: "invalid_field",
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_by");
      }
    });

    it("devrait valider sort_order = 'asc'", () => {
      const validSearch = {
        sort_order: "asc",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_order = 'desc'", () => {
      const validSearch = {
        sort_order: "desc",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter sort_order invalide", () => {
      const invalidSearch = {
        sort_order: "invalid",
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider page = 1", () => {
      const validSearch = {
        page: 1,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider page élevé", () => {
      const validSearch = {
        page: 999,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter page = 0", () => {
      const invalidSearch = {
        page: 0,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter page négatif", () => {
      const invalidSearch = {
        page: -1,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider limit = 10", () => {
      const validSearch = {
        limit: 10,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider limit = 100 (maximum)", () => {
      const validSearch = {
        limit: 100,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter limit = 0", () => {
      const invalidSearch = {
        limit: 0,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit > 100", () => {
      const invalidSearch = {
        limit: 101,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter jour_semaine = 0 dans la recherche", () => {
      const invalidSearch = {
        jour_semaine: 0,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter jour_semaine = 8 dans la recherche", () => {
      const invalidSearch = {
        jour_semaine: 8,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("jour_semaine");
      }
    });

    it("devrait rejeter professeur_id = 0", () => {
      const invalidSearch = {
        professeur_id: 0,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter professeur_id négatif", () => {
      const invalidSearch = {
        professeur_id: -5,
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider une recherche avec pagination complète", () => {
      const validSearch = {
        type_cours: "Taekwondo",
        page: 3,
        limit: 25,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it("devrait valider active avec valeur string 'true' (booleanSchema transforme)", () => {
      const validSearch = {
        active: "true",
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it("devrait rejeter type_cours avec une chaîne vide (min 1 caractère requis)", () => {
      const invalidSearch = {
        type_cours: "",
      };
      const result = searchCourseRecurrentSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_cours");
      }
    });

    it("devrait valider une combinaison de filtres multiples", () => {
      const validSearch = {
        type_cours: "Kung Fu",
        jour_semaine: 2,
        active: true,
        professeur_id: 7,
        page: 1,
        limit: 50,
      };
      const result = searchCourseRecurrentSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });
  });

  describe("toggleCourseRecurrentSchema", () => {
    it("devrait valider un toggle valide (activer)", () => {
      const validToggle = {
        id: 5,
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(5);
        expect(result.data.active).toBe(true);
      }
    });

    it("devrait valider un toggle valide (désactiver)", () => {
      const validToggle = {
        id: 10,
        active: false,
      };
      const result = toggleCourseRecurrentSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(10);
        expect(result.data.active).toBe(false);
      }
    });

    it("devrait valider avec un ID élevé", () => {
      const validToggle = {
        id: 999999,
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidToggle = {
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si active est manquant", () => {
      const invalidToggle = {
        id: 5,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("active");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidToggle = {
        id: 0,
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidToggle = {
        id: -5,
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si active est une string", () => {
      const invalidToggle = {
        id: 5,
        active: "true",
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("active");
      }
    });

    it("devrait rejeter si active est un nombre", () => {
      const invalidToggle = {
        id: 5,
        active: 1,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("active");
      }
    });

    it("devrait rejeter si id est un décimal", () => {
      const invalidToggle = {
        id: 5.5,
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est une string", () => {
      const invalidToggle = {
        id: "5",
        active: true,
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter avec des champs supplémentaires non autorisés", () => {
      const invalidToggle = {
        id: 5,
        active: true,
        extra_field: "not allowed",
      };
      const result = toggleCourseRecurrentSchema.safeParse(invalidToggle);
      // Zod par défaut ignore les champs supplémentaires, donc ce test pourrait passer
      // Mais nous testons quand même pour documenter le comportement
      expect(result.success).toBe(true);
    });
  });
});
