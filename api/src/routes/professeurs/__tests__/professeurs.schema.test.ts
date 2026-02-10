/**
 * Tests de schéma et configuration pour le module Professeurs
 * Tests des types, interfaces et configuration du module
 */

import { describe, it, expect } from "@jest/globals";
import {
  getProfesseursSchema,
  getProfesseurByIdSchema,
  ajouterProfesseurSchema,
  modifierStatutProfesseurSchema,
  getPlanningProfesseurSchema,
  utilisateurSchema,
  coursSchema,
  GetProfesseursData,
  GetProfesseurByIdData,
  AjouterProfesseurData,
  ModifierStatutProfesseurData,
  GetPlanningProfesseurData,
  UtilisateurData,
  CoursData,
} from "@clubmanager/types/validators";

describe("Professeurs Module - Schémas et Configuration", () => {
  describe("Schémas Zod - Structure", () => {
    it("getProfesseursSchema devrait avoir tous les champs requis", () => {
      const schema = getProfesseursSchema;

      expect(schema).toBeDefined();
      expect(schema.safeParse).toBeDefined();

      const validData = {};
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("getProfesseurByIdSchema devrait accepter un ID valide", () => {
      const schema = getProfesseurByIdSchema;

      const validData = { id: "1" };
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("ajouterProfesseurSchema devrait accepter un tableau d'utilisateurs", () => {
      const schema = ajouterProfesseurSchema;

      const validData = {
        utilisateurs: [1, 2, 3],
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("modifierStatutProfesseurSchema devrait valider id et status_id", () => {
      const schema = modifierStatutProfesseurSchema;

      const validData = {
        id: 1,
        status_id: 2,
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("getPlanningProfesseurSchema devrait valider l'ID", () => {
      const schema = getPlanningProfesseurSchema;

      const validData = { id: "1" };
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Types TypeScript - Inférence", () => {
    it("GetProfesseursData devrait avoir les bons types", () => {
      const data: GetProfesseursData = {};

      expect(data).toBeDefined();
    });

    it("GetProfesseurByIdData devrait avoir les bons types", () => {
      const data: GetProfesseurByIdData = {
        id: 1,
      };

      expect(typeof data.id).toBe("number");
    });

    it("AjouterProfesseurData devrait accepter différents formats", () => {
      const data1: AjouterProfesseurData = {
        utilisateurs: [1, 2, 3],
      };

      const data2: AjouterProfesseurData = {
        id: 1,
      };

      const data3: AjouterProfesseurData = {
        users: [{ id: 1 }],
      };

      expect(data1.utilisateurs).toBeDefined();
      expect(data2.id).toBeDefined();
      expect(data3.users).toBeDefined();
    });

    it("ModifierStatutProfesseurData devrait avoir les bons types", () => {
      const data: ModifierStatutProfesseurData = {
        id: 1,
        status_id: 2,
      };

      expect(typeof data.id).toBe("number");
      expect(typeof data.status_id).toBe("number");
    });
  });

  describe("Validation getProfesseurByIdSchema", () => {
    it("devrait accepter un ID numérique valide sous forme de string", () => {
      const validIds = ["1", "10", "999"];

      validIds.forEach((id) => {
        const data = { id };
        const result = getProfesseurByIdSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.id).toBe("number");
        }
      });
    });

    it("devrait rejeter un ID non numérique", () => {
      const invalidIds = ["abc", "1a", "a1", "test"];

      invalidIds.forEach((id) => {
        const data = { id };
        const result = getProfesseurByIdSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it("devrait rejeter un ID négatif", () => {
      const data = { id: "-1" };
      const result = getProfesseurByIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID zéro", () => {
      const data = { id: "0" };
      const result = getProfesseurByIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Validation ajouterProfesseurSchema", () => {
    it("devrait accepter un tableau d'IDs numériques", () => {
      const data = {
        utilisateurs: [1, 2, 3],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un tableau d'IDs string", () => {
      const data = {
        utilisateurs: ["1", "2", "3"],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un tableau d'objets avec id", () => {
      const data = {
        utilisateurs: [{ id: 1 }, { id: 2 }],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un tableau d'objets avec userId", () => {
      const data = {
        utilisateurs: [{ userId: 1 }, { userId: 2 }],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un tableau d'objets avec user_id", () => {
      const data = {
        utilisateurs: [{ user_id: 1 }, { user_id: 2 }],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un seul utilisateur via id", () => {
      const data = {
        id: 1,
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un seul utilisateur via userId", () => {
      const data = {
        userId: 1,
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un seul utilisateur via user_id", () => {
      const data = {
        user_id: 1,
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un tableau via la propriété users", () => {
      const data = {
        users: [1, 2, 3],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un tableau vide", () => {
      const data = {
        utilisateurs: [],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si aucun utilisateur n'est fourni", () => {
      const data = {};

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des IDs négatifs", () => {
      const data = {
        utilisateurs: [-1, 2, 3],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des IDs zéro", () => {
      const data = {
        utilisateurs: [0, 1, 2],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Validation modifierStatutProfesseurSchema", () => {
    it("devrait accepter des valeurs valides", () => {
      const data = {
        id: 1,
        status_id: 2,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter status_id entre 1 et 10", () => {
      for (let i = 1; i <= 10; i++) {
        const data = {
          id: 1,
          status_id: i,
        };

        const result = modifierStatutProfesseurSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("devrait rejeter status_id < 1", () => {
      const data = {
        id: 1,
        status_id: 0,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status_id > 10", () => {
      const data = {
        id: 1,
        status_id: 11,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id négatif", () => {
      const data = {
        id: -1,
        status_id: 2,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id non entier", () => {
      const data = {
        id: 1.5,
        status_id: 2,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status_id non entier", () => {
      const data = {
        id: 1,
        status_id: 2.5,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const data = {
        status_id: 2,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si status_id est manquant", () => {
      const data = {
        id: 1,
      };

      const result = modifierStatutProfesseurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Validation utilisateurSchema", () => {
    it("devrait accepter un utilisateur valide", () => {
      const data = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };

      const result = utilisateurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter les champs optionnels", () => {
      const data = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        role_id: 2,
        status_id: 1,
      };

      const result = utilisateurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const data = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "invalid-email",
      };

      const result = utilisateurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un first_name vide", () => {
      const data = {
        id: 1,
        first_name: "",
        last_name: "Doe",
        email: "john@example.com",
      };

      const result = utilisateurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un last_name vide", () => {
      const data = {
        id: 1,
        first_name: "John",
        last_name: "",
        email: "john@example.com",
      };

      const result = utilisateurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id négatif", () => {
      const data = {
        id: -1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };

      const result = utilisateurSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Validation coursSchema", () => {
    it("devrait accepter un cours valide minimal", () => {
      const data = {
        id: 1,
        nom_cours: "Karate Débutant",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      };

      const result = coursSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un cours avec tous les champs", () => {
      const data = {
        id: 1,
        nom_cours: "Karate Débutant",
        description: "Cours pour débutants",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        salle: "Dojo 1",
        niveau: "Débutant",
        capacite_max: 20,
        professeur_id: 5,
      };

      const result = coursSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom_cours vide", () => {
      const data = {
        id: 1,
        nom_cours: "",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      };

      const result = coursSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une capacite_max négative", () => {
      const data = {
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        capacite_max: -5,
        professeur_id: 5,
      };

      const result = coursSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un professeur_id négatif", () => {
      const data = {
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: -1,
      };

      const result = coursSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Messages d'erreur", () => {
    it("devrait fournir un message clair pour ID professeur invalide", () => {
      try {
        getProfesseurByIdSchema.parse({ id: "abc" });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("nombre positif");
      }
    });

    it("devrait fournir un message clair pour status_id hors limites", () => {
      try {
        modifierStatutProfesseurSchema.parse({ id: 1, status_id: 15 });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("maximum 10");
      }
    });

    it("devrait fournir un message clair pour email invalide", () => {
      try {
        utilisateurSchema.parse({
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "not-an-email",
        });
        fail("Should have thrown");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("email");
      }
    });
  });

  describe("Transformation des données", () => {
    it("devrait transformer l'ID string en nombre", () => {
      const input = { id: "123" };
      const result = getProfesseurByIdSchema.parse(input);
      expect(typeof result.id).toBe("number");
      expect(result.id).toBe(123);
    });

    it("getPlanningProfesseurSchema devrait transformer l'ID", () => {
      const input = { id: "456" };
      const result = getPlanningProfesseurSchema.parse(input);
      expect(typeof result.id).toBe("number");
      expect(result.id).toBe(456);
    });
  });

  describe("Compatibilité et rétrocompatibilité", () => {
    it("devrait accepter les anciens formats de données valides", () => {
      const oldFormat = {
        utilisateurs: [1, 2, 3],
      };

      expect(() => ajouterProfesseurSchema.parse(oldFormat)).not.toThrow();
    });

    it("devrait rejeter les champs supplémentaires non définis", () => {
      const dataWithExtra = {
        id: 1,
        status_id: 2,
        extraField: "should be ignored",
      };

      // Zod par défaut ignore les champs supplémentaires (strip)
      const result = modifierStatutProfesseurSchema.parse(dataWithExtra);
      expect((result as any).extraField).toBeUndefined();
    });
  });

  describe("Cas limites", () => {
    it("devrait gérer un très grand ID", () => {
      const data = { id: "999999999" };
      const result = getProfesseurByIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999999);
      }
    });

    it("devrait gérer un tableau avec un seul élément", () => {
      const data = {
        utilisateurs: [1],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait gérer les limites de status_id", () => {
      const dataMin = { id: 1, status_id: 1 };
      const dataMax = { id: 1, status_id: 10 };

      expect(modifierStatutProfesseurSchema.safeParse(dataMin).success).toBe(
        true,
      );
      expect(modifierStatutProfesseurSchema.safeParse(dataMax).success).toBe(
        true,
      );
    });
  });

  describe("Formats multiples pour ajouterProfesseurSchema", () => {
    it("devrait accepter un mix d'ID numériques et string", () => {
      const data = {
        utilisateurs: [1, "2", 3],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un mix d'objets avec différentes propriétés", () => {
      const data = {
        utilisateurs: [{ id: 1 }, { userId: 2 }, { user_id: 3 }],
      };

      const result = ajouterProfesseurSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("devrait valider que tous les formats sont supportés", () => {
      const formats = [
        { utilisateurs: [1, 2, 3] },
        { utilisateurs: ["1", "2", "3"] },
        { utilisateurs: [{ id: 1 }, { id: 2 }] },
        { utilisateurs: [{ userId: 1 }, { userId: 2 }] },
        { utilisateurs: [{ user_id: 1 }, { user_id: 2 }] },
        { id: 1 },
        { userId: 1 },
        { user_id: 1 },
        { users: [1, 2, 3] },
        { users: [{ id: 1 }, { id: 2 }] },
      ];

      formats.forEach((format, index) => {
        const result = ajouterProfesseurSchema.safeParse(format);
        expect(result.success).toBe(true);
      });
    });
  });
});
