/**
 * Tests pour les validators de genres
 */

import { describe, it, expect } from "@jest/globals";
import {
  genreBaseSchema,
  createGenreSchema,
  updateGenreSchema,
  listGenresSchema,
  genreIdSchema,
  genreIdStringSchema,
  genreIdParamSchema,
} from "../genre.validators.js";

describe("Genre Validators", () => {
  describe("genreBaseSchema", () => {
    it("devrait valider un genre valide", () => {
      const data = { id: 1, nom: "Homme" };
      expect(() => genreBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait trim les espaces", () => {
      const data = { id: 1, nom: "  Femme  " };
      const result = genreBaseSchema.parse(data);
      expect(result.nom).toBe("Femme");
    });

    it("devrait rejeter nom vide", () => {
      const data = { id: 1, nom: "" };
      expect(() => genreBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter nom trop long", () => {
      const data = { id: 1, nom: "a".repeat(51) };
      expect(() => genreBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter ID invalide", () => {
      const data = { id: 0, nom: "Test" };
      expect(() => genreBaseSchema.parse(data)).toThrow();
    });
  });

  describe("createGenreSchema", () => {
    it("devrait valider création valide", () => {
      const data = { nom: "Autre" };
      expect(() => createGenreSchema.parse(data)).not.toThrow();
    });
  });

  describe("updateGenreSchema", () => {
    it("devrait valider update", () => {
      const data = { nom: "Non spécifié" };
      expect(() => updateGenreSchema.parse(data)).not.toThrow();
    });

    it("devrait valider objet vide", () => {
      const data = {};
      expect(() => updateGenreSchema.parse(data)).not.toThrow();
    });
  });

  describe("listGenresSchema", () => {
    it("devrait valider avec filtres", () => {
      const data = { search: "Homme", page: 1, limit: 10 };
      expect(() => listGenresSchema.parse(data)).not.toThrow();
    });
  });

  describe("genreIdStringSchema", () => {
    it("devrait transformer string en number", () => {
      const result = genreIdStringSchema.parse("5");
      expect(result).toBe(5);
      expect(typeof result).toBe("number");
    });

    it("devrait rejeter 0", () => {
      expect(() => genreIdStringSchema.parse("0")).toThrow();
    });
  });
});
