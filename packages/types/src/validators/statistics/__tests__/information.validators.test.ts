/**
 * Tests pour les validators d'informations
 */

import { describe, it, expect } from "@jest/globals";
import {
  informationBaseSchema,
  createInformationSchema,
  updateInformationSchema,
  listInformationsSchema,
  getInformationByKeySchema,
  informationIdSchema,
  informationIdStringSchema,
  informationIdParamSchema,
  informationKeyParamSchema,
  bulkUpsertInformationsSchema,
  bulkDeleteInformationsSchema,
  informationResponseSchema,
  informationsListResponseSchema,
  informationStatsSchema,
  groupedInformationsSchema,
} from "../information.validators.js";

describe("Information Validators", () => {
  describe("informationBaseSchema", () => {
    it("devrait valider une information valide", () => {
      const data = {
        id: 1,
        cle: "club_name",
        valeur: "Club de Jiu-Jitsu",
        description: "Nom du club",
        updated_at: new Date(),
      };
      expect(() => informationBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait valider sans description", () => {
      const data = {
        id: 1,
        cle: "club_email",
        valeur: "contact@club.com",
        description: null,
        updated_at: null,
      };
      expect(() => informationBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait trim les espaces", () => {
      const data = {
        id: 1,
        cle: "  club_name  ",
        valeur: "  My Club  ",
        description: "  Description  ",
        updated_at: new Date(),
      };
      const result = informationBaseSchema.parse(data);
      expect(result.cle).toBe("club_name");
      expect(result.valeur).toBe("My Club");
      expect(result.description).toBe("Description");
    });

    it("devrait rejeter cle vide", () => {
      const data = {
        id: 1,
        cle: "",
        valeur: "value",
      };
      expect(() => informationBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter cle trop longue", () => {
      const data = {
        id: 1,
        cle: "a".repeat(101),
        valeur: "value",
      };
      expect(() => informationBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter valeur vide", () => {
      const data = {
        id: 1,
        cle: "key",
        valeur: "",
      };
      expect(() => informationBaseSchema.parse(data)).toThrow();
    });
  });

  describe("createInformationSchema", () => {
    it("devrait valider création valide", () => {
      const data = {
        cle: "opening_hours",
        valeur: "Lundi-Vendredi: 18h-21h",
        description: "Horaires d'ouverture",
      };
      expect(() => createInformationSchema.parse(data)).not.toThrow();
    });

    it("devrait valider sans description", () => {
      const data = {
        cle: "phone",
        valeur: "+32 123 45 67 89",
      };
      expect(() => createInformationSchema.parse(data)).not.toThrow();
    });
  });

  describe("updateInformationSchema", () => {
    it("devrait valider update partiel", () => {
      const data = {
        valeur: "Nouvelle valeur",
      };
      expect(() => updateInformationSchema.parse(data)).not.toThrow();
    });

    it("devrait valider update description seulement", () => {
      const data = {
        description: "Nouvelle description",
      };
      expect(() => updateInformationSchema.parse(data)).not.toThrow();
    });

    it("devrait valider objet vide (tout optionnel)", () => {
      const data = {};
      expect(() => updateInformationSchema.parse(data)).not.toThrow();
    });
  });

  describe("listInformationsSchema", () => {
    it("devrait valider avec filtres", () => {
      const data = {
        search: "club",
        cle: "club_name",
        page: 1,
        limit: 20,
        sort_by: "cle",
        sort_order: "asc",
      };
      expect(() => listInformationsSchema.parse(data)).not.toThrow();
    });

    it("devrait valider sans filtres", () => {
      const data = {
        page: 1,
        limit: 10,
      };
      expect(() => listInformationsSchema.parse(data)).not.toThrow();
    });
  });

  describe("getInformationByKeySchema", () => {
    it("devrait valider cle valide", () => {
      const data = { cle: "club_name" };
      expect(() => getInformationByKeySchema.parse(data)).not.toThrow();
    });

    it("devrait trim la cle", () => {
      const data = { cle: "  club_name  " };
      const result = getInformationByKeySchema.parse(data);
      expect(result.cle).toBe("club_name");
    });

    it("devrait rejeter cle vide", () => {
      const data = { cle: "" };
      expect(() => getInformationByKeySchema.parse(data)).toThrow();
    });
  });

  describe("bulkUpsertInformationsSchema", () => {
    it("devrait valider upsert bulk", () => {
      const data = {
        informations: [
          { cle: "key1", valeur: "val1" },
          { cle: "key2", valeur: "val2" },
        ],
      };
      expect(() => bulkUpsertInformationsSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter array vide", () => {
      const data = { informations: [] };
      expect(() => bulkUpsertInformationsSchema.parse(data)).toThrow();
    });

    it("devrait rejeter plus de 50 items", () => {
      const data = {
        informations: Array(51).fill({ cle: "key", valeur: "val" }),
      };
      expect(() => bulkUpsertInformationsSchema.parse(data)).toThrow();
    });
  });

  describe("informationStatsSchema", () => {
    it("devrait valider stats valides", () => {
      const data = {
        total: 25,
        with_description: 20,
        without_description: 5,
        recently_updated: 3,
      };
      expect(() => informationStatsSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter valeurs négatives", () => {
      const data = {
        total: -1,
        with_description: 20,
        without_description: 5,
        recently_updated: 3,
      };
      expect(() => informationStatsSchema.parse(data)).toThrow();
    });
  });

  describe("Type inference", () => {
    it("devrait inférer le type Information", () => {
      type Test = typeof informationBaseSchema._output;
      const val: Test = {
        id: 1,
        cle: "key",
        valeur: "value",
        description: null,
        updated_at: null,
      };
      expect(val).toBeDefined();
    });
  });
});
