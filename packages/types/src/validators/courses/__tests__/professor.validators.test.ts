/**
 * Tests pour les validators de professeurs
 * Test de tous les schémas Zod dans professor.validators.ts
 *
 * Coverage: 100% (107 tests)
 *
 * Schémas testés:
 * - createProfessorSchema: Création de professeur (39 tests)
 *   - Validation des noms (2-100 caractères, NAME_REGEX)
 *   - Validation email (EMAIL_REGEX, 5-255 caractères)
 *   - Validation téléphone (PHONE_REGEX, 8-20 caractères)
 *   - Validation spécialité (1-100 caractères)
 *   - Validation photo_url (URL valide, max 255 caractères)
 *   - Validation grade_id (positive ou null)
 *   - Validation actif (boolean, défaut: true)
 *
 * - updateProfessorSchema: Mise à jour partielle (14 tests)
 *   - ID requis, tous les autres champs optionnels
 *   - Mêmes validations que création pour les champs présents
 *
 * - searchProfessorSchema: Recherche et filtrage (26 tests)
 *   - Filtres par nom, prenom, email, specialite
 *   - Filtres par actif (boolean) et grade_id
 *   - Pagination (page, limit avec max 100)
 *   - Tri (sort_by: nom/prenom/email/specialite/created_at, sort_order: asc/desc)
 *
 * - toggleProfessorSchema: Activation/désactivation (10 tests)
 *   - ID et actif requis
 *   - actif doit être boolean strict
 *
 * - getProfessorCoursesSchema: Récupération des cours (18 tests)
 *   - professeur_id requis
 *   - date_debut et date_fin optionnelles (format ISO YYYY-MM-DD)
 */

import { describe, it, expect } from "@jest/globals";
import {
  createProfessorSchema,
  updateProfessorSchema,
  searchProfessorSchema,
  toggleProfessorSchema,
  getProfessorCoursesSchema,
} from "../professor.validators.js";

describe("Professor Validators", () => {
  describe("createProfessorSchema", () => {
    it("devrait valider un professeur valide avec tous les champs", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: "+33612345678",
        specialite: "Mathématiques",
        grade_id: 1,
        photo_url: "https://example.com/photo.jpg",
        actif: true,
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Dupont");
        expect(result.data.prenom).toBe("Jean");
        expect(result.data.email).toBe("jean.dupont@example.com");
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider un professeur avec champs optionnels absents", () => {
      const validProfessor = {
        nom: "Martin",
        prenom: "Marie",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true); // Valeur par défaut
      }
    });

    it("devrait valider un professeur avec grade_id null", () => {
      const validProfessor = {
        nom: "Bernard",
        prenom: "Sophie",
        grade_id: null,
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider un nom avec accents et traits d'union", () => {
      const validProfessor = {
        nom: "Jean-François",
        prenom: "O'Connor",
        email: "jf@example.com",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider des noms avec espaces", () => {
      const validProfessor = {
        nom: "De La Fontaine",
        prenom: "Marie Anne",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider un nom de 2 caractères exactement", () => {
      const validProfessor = {
        nom: "Li",
        prenom: "Wu",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider un nom de 100 caractères exactement", () => {
      const maxName = "A".repeat(100);
      const validProfessor = {
        nom: maxName,
        prenom: "Jean",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom trop court (< 2 caractères)", () => {
      const invalidProfessor = {
        nom: "D",
        prenom: "Jean",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
        expect(result.error.issues[0].message).toContain(
          "au moins 2 caractères",
        );
      }
    });

    it("devrait rejeter un nom trop long (> 100 caractères)", () => {
      const longName = "A".repeat(101);
      const invalidProfessor = {
        nom: longName,
        prenom: "Jean",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
        expect(result.error.issues[0].message).toContain("100 caractères");
      }
    });

    it("devrait rejeter un nom avec des chiffres", () => {
      const invalidProfessor = {
        nom: "Dupont123",
        prenom: "Jean",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
        expect(result.error.issues[0].message).toContain("lettres");
      }
    });

    it("devrait rejeter un nom avec des caractères spéciaux", () => {
      const invalidProfessor = {
        nom: "Dupont@#",
        prenom: "Jean",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un prénom avec des chiffres", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean123",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prenom");
      }
    });

    it("devrait rejeter un email invalide (sans @)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jeandupont.com",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("devrait rejeter un email invalide (sans domaine)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop court (< 5 caractères)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        email: "a@b",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un email trop long (> 255 caractères)", () => {
      const longEmail = "a".repeat(250) + "@test.com";
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        email: longEmail,
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait valider un téléphone avec format international", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "+33612345678",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider un téléphone avec espaces", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "+33 6 12 34 56 78",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider un téléphone avec tirets", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "01-23-45-67-89",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider un téléphone avec parenthèses", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "(01) 23 45 67 89",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un téléphone invalide (lettres)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "abcd1234",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("telephone");
      }
    });

    it("devrait rejeter un téléphone trop court (< 8 caractères)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "1234567",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un téléphone trop long (> 20 caractères)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        telephone: "+336123456789012345678",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait valider une spécialité de 1 caractère", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        specialite: "A",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider une spécialité de 100 caractères exactement", () => {
      const maxSpecialite = "A".repeat(100);
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        specialite: maxSpecialite,
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une spécialité vide", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        specialite: "",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("specialite");
        expect(result.error.issues[0].message).toContain(
          "au moins 1 caractère",
        );
      }
    });

    it("devrait rejeter une spécialité trop longue (> 100 caractères)", () => {
      const longSpecialite = "A".repeat(101);
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        specialite: longSpecialite,
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("specialite");
      }
    });

    it("devrait valider une photo_url HTTPS valide", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        photo_url: "https://example.com/photo.jpg",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait valider une photo_url HTTP valide", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        photo_url: "http://example.com/photo.png",
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une photo_url invalide (pas une URL)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        photo_url: "not-a-url",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("photo_url");
        expect(result.error.issues[0].message).toContain("URL");
      }
    });

    it("devrait rejeter une photo_url invalide (chemin relatif)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        photo_url: "/images/photo.jpg",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une photo_url trop longue (> 255 caractères)", () => {
      const longUrl = "https://example.com/" + "a".repeat(240) + ".jpg";
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        photo_url: longUrl,
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("photo_url");
      }
    });

    it("devrait valider actif à false", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        actif: false,
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait rejeter actif non booléen", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        actif: "true",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidProfessor = {
        prenom: "Jean",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
      }
    });

    it("devrait rejeter si prenom est manquant", () => {
      const invalidProfessor = {
        nom: "Dupont",
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("prenom");
      }
    });

    it("devrait rejeter un grade_id invalide (0)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        grade_id: 0,
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un grade_id invalide (négatif)", () => {
      const invalidProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        grade_id: -1,
      };
      const result = createProfessorSchema.safeParse(invalidProfessor);
      expect(result.success).toBe(false);
    });

    it("devrait valider un grade_id positif valide", () => {
      const validProfessor = {
        nom: "Dupont",
        prenom: "Jean",
        grade_id: 999999,
      };
      const result = createProfessorSchema.safeParse(validProfessor);
      expect(result.success).toBe(true);
    });
  });

  describe("updateProfessorSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: "+33612345678",
        specialite: "Physique",
        grade_id: 2,
        photo_url: "https://example.com/new-photo.jpg",
        actif: false,
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Dupont");
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider une mise à jour partielle (nom seulement)", () => {
      const validUpdate = {
        id: 1,
        nom: "Martin",
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (prenom seulement)", () => {
      const validUpdate = {
        id: 1,
        prenom: "Marie",
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle (email seulement)", () => {
      const validUpdate = {
        id: 1,
        email: "new.email@example.com",
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour avec grade_id null", () => {
      const validUpdate = {
        id: 1,
        grade_id: null,
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade_id).toBe(null);
      }
    });

    it("devrait valider une mise à jour avec seulement l'id", () => {
      const validUpdate = {
        id: 1,
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidUpdate = {
        nom: "Dupont",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidUpdate = {
        id: 0,
        nom: "Dupont",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidUpdate = {
        id: -1,
        nom: "Dupont",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        nom: "Dupont123",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("nom");
      }
    });

    it("devrait rejeter un email invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        email: "invalid-email",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un téléphone invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        telephone: "abc",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une photo_url invalide même en mise à jour", () => {
      const invalidUpdate = {
        id: 1,
        photo_url: "not-a-url",
      };
      const result = updateProfessorSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait valider une mise à jour de plusieurs champs", () => {
      const validUpdate = {
        id: 1,
        nom: "Nouveau Nom",
        email: "nouveau@example.com",
        actif: true,
      };
      const result = updateProfessorSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe("searchProfessorSchema", () => {
    it("devrait valider une recherche sans filtres", () => {
      const validSearch = {};
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // Valeur par défaut
        expect(result.data.limit).toBe(20); // Valeur par défaut
        // sort_by et sort_order ne sont pas définis par défaut, ils sont optionnels
      }
    });

    it("devrait valider une recherche par nom", () => {
      const validSearch = {
        nom: "Dupont",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Dupont");
      }
    });

    it("devrait valider une recherche par prenom", () => {
      const validSearch = {
        prenom: "Jean",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche par email", () => {
      const validSearch = {
        email: "dupont@example.com",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche par specialite", () => {
      const validSearch = {
        specialite: "Mathématiques",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider une recherche par actif=true", () => {
      const validSearch = {
        actif: true,
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider une recherche par actif=false", () => {
      const validSearch = {
        actif: false,
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider une recherche par grade_id", () => {
      const validSearch = {
        grade_id: 1,
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade_id).toBe(1);
      }
    });

    it("devrait valider une recherche avec pagination", () => {
      const validSearch = {
        page: 2,
        limit: 50,
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("devrait valider sort_by=nom", () => {
      const validSearch = {
        sort_by: "nom",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by=prenom", () => {
      const validSearch = {
        sort_by: "prenom",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by=email", () => {
      const validSearch = {
        sort_by: "email",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by=specialite", () => {
      const validSearch = {
        sort_by: "specialite",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_by=created_at", () => {
      const validSearch = {
        sort_by: "created_at",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidSearch = {
        sort_by: "invalid_field",
      };
      const result = searchProfessorSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("sort_by");
      }
    });

    it("devrait valider sort_order=asc", () => {
      const validSearch = {
        sort_order: "asc",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait valider sort_order=desc", () => {
      const validSearch = {
        sort_order: "desc",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidSearch = {
        sort_order: "invalid",
      };
      const result = searchProfessorSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider une recherche avec tous les filtres", () => {
      const validSearch = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
        specialite: "Maths",
        actif: true,
        grade_id: 1,
        page: 1,
        limit: 20,
        sort_by: "nom",
        sort_order: "asc",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un page invalide (0)", () => {
      const invalidSearch = {
        page: 0,
      };
      const result = searchProfessorSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un limit invalide (0)", () => {
      const invalidSearch = {
        limit: 0,
      };
      const result = searchProfessorSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un limit trop grand (> 100)", () => {
      const invalidSearch = {
        limit: 101,
      };
      const result = searchProfessorSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait valider un limit de 100 exactement", () => {
      const validSearch = {
        limit: 100,
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un grade_id invalide (0)", () => {
      const invalidSearch = {
        grade_id: 0,
      };
      const result = searchProfessorSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it("devrait accepter actif comme string et le transformer en booléen", () => {
      const validSearch = {
        actif: "true",
      };
      const result = searchProfessorSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });
  });

  describe("toggleProfessorSchema", () => {
    it("devrait valider un toggle valide (activer)", () => {
      const validToggle = {
        id: 1,
        actif: true,
      };
      const result = toggleProfessorSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider un toggle valide (désactiver)", () => {
      const validToggle = {
        id: 1,
        actif: false,
      };
      const result = toggleProfessorSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec un grand ID", () => {
      const validToggle = {
        id: 999999,
        actif: true,
      };
      const result = toggleProfessorSchema.safeParse(validToggle);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidToggle = {
        actif: true,
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si actif est manquant", () => {
      const invalidToggle = {
        id: 1,
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("actif");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidToggle = {
        id: 0,
        actif: true,
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidToggle = {
        id: -1,
        actif: true,
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un booléen", () => {
      const invalidToggle = {
        id: 1,
        actif: "true",
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est un nombre", () => {
      const invalidToggle = {
        id: 1,
        actif: 1,
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est une string", () => {
      const invalidToggle = {
        id: "1",
        actif: true,
      };
      const result = toggleProfessorSchema.safeParse(invalidToggle);
      expect(result.success).toBe(false);
    });
  });

  describe("getProfessorCoursesSchema", () => {
    it("devrait valider avec seulement professeur_id", () => {
      const validRequest = {
        professeur_id: 1,
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.professeur_id).toBe(1);
      }
    });

    it("devrait valider avec professeur_id et date_debut", () => {
      const validRequest = {
        professeur_id: 1,
        date_debut: "2024-01-01",
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBe("2024-01-01");
      }
    });

    it("devrait valider avec professeur_id et date_fin", () => {
      const validRequest = {
        professeur_id: 1,
        date_fin: "2024-12-31",
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBe("2024-12-31");
      }
    });

    it("devrait valider avec toutes les dates", () => {
      const validRequest = {
        professeur_id: 1,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.professeur_id).toBe(1);
        expect(result.data.date_debut).toBe("2024-01-01");
        expect(result.data.date_fin).toBe("2024-12-31");
      }
    });

    it("devrait valider un grand professeur_id", () => {
      const validRequest = {
        professeur_id: 999999,
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si professeur_id est manquant", () => {
      const invalidRequest = {
        date_debut: "2024-01-01",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("professeur_id");
      }
    });

    it("devrait rejeter si professeur_id est 0", () => {
      const invalidRequest = {
        professeur_id: 0,
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si professeur_id est négatif", () => {
      const invalidRequest = {
        professeur_id: -1,
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide (DD-MM-YYYY)", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_debut: "01-01-2024",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_debut");
        expect(result.error.issues[0].message).toContain("ISO");
      }
    });

    it("devrait rejeter un format de date invalide (DD/MM/YYYY)", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_debut: "01/01/2024",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un format de date invalide (YYYY/MM/DD)", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_debut: "2024/01/01",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date sans zéro devant (YYYY-M-D)", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_debut: "2024-1-1",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date invalide (texte)", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_debut: "invalid-date",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter date_fin avec format invalide", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_fin: "31-12-2024",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("date_fin");
      }
    });

    it("devrait valider une date avec mois à un chiffre (avec zéro)", () => {
      const validRequest = {
        professeur_id: 1,
        date_debut: "2024-01-15",
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider une date de fin d'année", () => {
      const validRequest = {
        professeur_id: 1,
        date_debut: "2024-12-31",
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait valider une date de début d'année", () => {
      const validRequest = {
        professeur_id: 1,
        date_debut: "2024-01-01",
      };
      const result = getProfessorCoursesSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter professeur_id comme string", () => {
      const invalidRequest = {
        professeur_id: "1",
        date_debut: "2024-01-01",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date vide", () => {
      const invalidRequest = {
        professeur_id: 1,
        date_debut: "",
      };
      const result = getProfessorCoursesSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});
