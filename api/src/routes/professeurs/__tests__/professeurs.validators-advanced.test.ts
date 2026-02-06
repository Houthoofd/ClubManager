/**
 * Tests avancés pour les validators du module Professeurs
 * Ces tests ciblent les branches non couvertes pour améliorer le branch coverage
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
} from "../core/validators/professeur.schema.js";

describe("Validators - Tests avancés de branch coverage", () => {
  describe("getProfesseurByIdSchema - Tests de toutes les branches", () => {
    it("devrait accepter un id valide comme string", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait accepter '1' comme id minimum valide", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait rejeter id = '0'", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id négatif", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id non numérique", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un id avec des lettres mélangées", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "123abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: null });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: undefined });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre au lieu d'une string", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: 123 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const result = getProfesseurByIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("ajouterProfesseurSchema - Validation approfondie", () => {
    it("devrait accepter utilisateurs avec ID numérique direct", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter utilisateurs avec ID string numérique", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: ["1", "2", "3"],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter utilisateurs avec objets {id}", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: [{ id: 1 }, { id: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter utilisateurs avec objets {userId}", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: [{ userId: 1 }, { userId: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter utilisateurs avec objets {user_id}", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: [{ user_id: 1 }, { user_id: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter un mix de formats dans utilisateurs", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: [1, "2", { id: 3 }, { userId: 4 }, { user_id: 5 }],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter un seul id numérique", () => {
      const result = ajouterProfesseurSchema.safeParse({ id: 1 });
      expect(result.success).toBe(true);
    });

    it("devrait accepter un seul userId", () => {
      const result = ajouterProfesseurSchema.safeParse({ userId: 1 });
      expect(result.success).toBe(true);
    });

    it("devrait accepter un seul user_id", () => {
      const result = ajouterProfesseurSchema.safeParse({ user_id: 1 });
      expect(result.success).toBe(true);
    });

    it("devrait accepter users comme tableau de nombres", () => {
      const result = ajouterProfesseurSchema.safeParse({
        users: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter users comme tableau de strings", () => {
      const result = ajouterProfesseurSchema.safeParse({
        users: ["1", "2", "3"],
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter users comme tableau d'objets", () => {
      const result = ajouterProfesseurSchema.safeParse({
        users: [{ id: 1 }, { id: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si aucune source d'utilisateur fournie", () => {
      const result = ajouterProfesseurSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("devrait rejeter utilisateurs vide", () => {
      const result = ajouterProfesseurSchema.safeParse({ utilisateurs: [] });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter users vide sans autre source", () => {
      const result = ajouterProfesseurSchema.safeParse({ users: [] });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des IDs négatifs", () => {
      const result = ajouterProfesseurSchema.safeParse({
        utilisateurs: [-1],
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des IDs zéro", () => {
      const result = ajouterProfesseurSchema.safeParse({ utilisateurs: [0] });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id négatif", () => {
      const result = ajouterProfesseurSchema.safeParse({ id: -1 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId négatif", () => {
      const result = ajouterProfesseurSchema.safeParse({ userId: -1 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter user_id négatif", () => {
      const result = ajouterProfesseurSchema.safeParse({ user_id: -1 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id zéro", () => {
      const result = ajouterProfesseurSchema.safeParse({ id: 0 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter userId zéro", () => {
      const result = ajouterProfesseurSchema.safeParse({ userId: 0 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter user_id zéro", () => {
      const result = ajouterProfesseurSchema.safeParse({ user_id: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("modifierStatutProfesseurSchema - Validation des limites", () => {
    it("devrait accepter status_id = 1 (minimum)", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter status_id = 10 (maximum)", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: 10,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter status_id = 0", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status_id = 11", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: 11,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status_id négatif", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id = 0", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 0,
        status_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id négatif", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: -1,
        status_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id non entier", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1.5,
        status_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status_id non entier", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        status_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si status_id est manquant", () => {
      const result = modifierStatutProfesseurSchema.safeParse({ id: 1 });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id comme string", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: "1",
        status_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status_id comme string", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: "1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getPlanningProfesseurSchema - Tests exhaustifs", () => {
    it("devrait accepter un id valide", () => {
      const result = getPlanningProfesseurSchema.safeParse({ id: "1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait transformer l'id string en nombre", () => {
      const result = getPlanningProfesseurSchema.safeParse({ id: "456" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
        expect(result.data.id).toBe(456);
      }
    });

    it("devrait rejeter id = '0'", () => {
      const result = getPlanningProfesseurSchema.safeParse({ id: "0" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id négatif", () => {
      const result = getPlanningProfesseurSchema.safeParse({ id: "-5" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id non numérique", () => {
      const result = getPlanningProfesseurSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id avec caractères mélangés", () => {
      const result = getPlanningProfesseurSchema.safeParse({ id: "123abc" });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const result = getPlanningProfesseurSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("utilisateurSchema - Validation complète", () => {
    it("devrait accepter un utilisateur valide minimal", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter un utilisateur avec tous les champs optionnels", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        role_id: 2,
        status_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide (sans @)", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "invalidemail",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email invalide (sans domaine)", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter first_name vide", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter last_name vide", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id = 0", () => {
      const result = utilisateurSchema.safeParse({
        id: 0,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id négatif", () => {
      const result = utilisateurSchema.safeParse({
        id: -1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id non entier", () => {
      const result = utilisateurSchema.safeParse({
        id: 1.5,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter role_id négatif", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        role_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter status_id négatif", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        status_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const result = utilisateurSchema.safeParse({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si first_name est manquant", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        last_name: "Doe",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si last_name est manquant", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si email est manquant", () => {
      const result = utilisateurSchema.safeParse({
        id: 1,
        first_name: "John",
        last_name: "Doe",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("coursSchema - Validation complète", () => {
    it("devrait accepter un cours valide minimal", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate Débutant",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter un cours avec tous les champs", () => {
      const result = coursSchema.safeParse({
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
      });
      expect(result.success).toBe(true);
    });

    it("devrait rejeter nom_cours vide", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter jour_semaine vide", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter heure_debut vide", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter heure_fin vide", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "",
        professeur_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id = 0", () => {
      const result = coursSchema.safeParse({
        id: 0,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter id négatif", () => {
      const result = coursSchema.safeParse({
        id: -1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter professeur_id = 0", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter professeur_id négatif", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter capacite_max = 0", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
        capacite_max: 0,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter capacite_max négatif", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
        capacite_max: -5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait rejeter capacite_max non entier", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
        capacite_max: 15.5,
      });
      expect(result.success).toBe(false);
    });

    it("devrait accepter description optionnelle", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter salle optionnelle", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(true);
    });

    it("devrait accepter niveau optionnel", () => {
      const result = coursSchema.safeParse({
        id: 1,
        nom_cours: "Karate",
        jour_semaine: "Lundi",
        heure_debut: "18:00",
        heure_fin: "19:00",
        professeur_id: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getProfesseursSchema - Cas limites", () => {
    it("devrait accepter un objet vide", () => {
      const result = getProfesseursSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("devrait ignorer les champs supplémentaires", () => {
      const result = getProfesseursSchema.safeParse({
        extraField: "should be ignored",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Messages d'erreur personnalisés", () => {
    it("getProfesseurByIdSchema devrait fournir un message clair", () => {
      const result = getProfesseurByIdSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("nombre positif");
      }
    });

    it("modifierStatutProfesseurSchema devrait indiquer les limites", () => {
      const result = modifierStatutProfesseurSchema.safeParse({
        id: 1,
        status_id: 15,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("maximum 10");
      }
    });

    it("ajouterProfesseurSchema devrait indiquer qu'un utilisateur est requis", () => {
      const result = ajouterProfesseurSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message).join(" ");
        expect(messages).toContain("utilisateur");
      }
    });
  });
});
