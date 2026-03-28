/**
 * Tests pour les validators de statistiques
 */

import { describe, it, expect } from "@jest/globals";
import {
  statisticBaseSchema,
  createStatisticSchema,
  createStatisticWithJsonSchema,
  updateStatisticSchema,
  listStatisticsSchema,
  statisticsByTypeSchema,
  statisticsByDateRangeSchema,
  statisticIdSchema,
  statisticIdStringSchema,
  statisticIdParamSchema,
  bulkCreateStatisticsSchema,
  bulkDeleteStatisticsSchema,
  statisticResponseSchema,
  statisticsListResponseSchema,
  statisticsSummarySchema,
  aggregatedStatisticsSchema,
} from "../statistic.validators.js";

describe("Statistic Validators", () => {
  describe("statisticBaseSchema", () => {
    it("devrait valider une statistique valide", () => {
      const data = {
        id: 1,
        type: "frequentation",
        cle: "total_members",
        valeur: "150",
        date_stat: new Date("2024-01-15"),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait valider avec valeur JSON", () => {
      const data = {
        id: 1,
        type: "revenue",
        cle: "monthly_revenue",
        valeur: JSON.stringify({ amount: 5000, currency: "EUR" }),
        date_stat: new Date("2024-01-31"),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait trim les espaces", () => {
      const data = {
        id: 1,
        type: "  frequentation  ",
        cle: "  total  ",
        valeur: "  150  ",
        date_stat: new Date(),
        created_at: new Date(),
      };
      const result = statisticBaseSchema.parse(data);
      expect(result.type).toBe("frequentation");
      expect(result.cle).toBe("total");
      expect(result.valeur).toBe("150");
    });

    it("devrait coercer les dates", () => {
      const data = {
        id: 1,
        type: "test",
        cle: "key",
        valeur: "value",
        date_stat: "2024-01-15",
        created_at: "2024-01-15T10:00:00Z",
      };
      const result = statisticBaseSchema.parse(data);
      expect(result.date_stat).toBeInstanceOf(Date);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it("devrait rejeter type vide", () => {
      const data = {
        id: 1,
        type: "",
        cle: "key",
        valeur: "value",
        date_stat: new Date(),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter type trop long", () => {
      const data = {
        id: 1,
        type: "a".repeat(51),
        cle: "key",
        valeur: "value",
        date_stat: new Date(),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter cle vide", () => {
      const data = {
        id: 1,
        type: "type",
        cle: "",
        valeur: "value",
        date_stat: new Date(),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter valeur vide", () => {
      const data = {
        id: 1,
        type: "type",
        cle: "key",
        valeur: "",
        date_stat: new Date(),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter ID invalide", () => {
      const data = {
        id: 0,
        type: "type",
        cle: "key",
        valeur: "value",
        date_stat: new Date(),
        created_at: new Date(),
      };
      expect(() => statisticBaseSchema.parse(data)).toThrow();
    });
  });

  describe("createStatisticSchema", () => {
    it("devrait valider une création valide", () => {
      const data = {
        type: "inscriptions",
        cle: "new_members_january",
        valeur: "25",
        date_stat: new Date("2024-01-31"),
      };
      expect(() => createStatisticSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter champ manquant", () => {
      const data = {
        type: "type",
        cle: "key",
        date_stat: new Date(),
      };
      expect(() => createStatisticSchema.parse(data)).toThrow();
    });
  });

  describe("createStatisticWithJsonSchema", () => {
    it("devrait valider avec objet JSON", () => {
      const data = {
        type: "revenue",
        cle: "monthly_breakdown",
        valeur: { jan: 1000, feb: 1200, mar: 1100 },
        date_stat: new Date(),
      };
      expect(() => createStatisticWithJsonSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter valeur non-objet", () => {
      const data = {
        type: "revenue",
        cle: "monthly_breakdown",
        valeur: "not an object",
        date_stat: new Date(),
      };
      expect(() => createStatisticWithJsonSchema.parse(data)).toThrow();
    });
  });

  describe("listStatisticsSchema", () => {
    it("devrait valider avec filtres", () => {
      const data = {
        type: "frequentation",
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
        page: 1,
        limit: 20,
      };
      expect(() => listStatisticsSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter plage de dates trop grande", () => {
      const data = {
        date_debut: new Date("2023-01-01"),
        date_fin: new Date("2024-12-31"),
        page: 1,
        limit: 20,
      };
      expect(() => listStatisticsSchema.parse(data)).toThrow();
    });
  });

  describe("statisticsByDateRangeSchema", () => {
    it("devrait valider plage valide", () => {
      const data = {
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
      };
      expect(() => statisticsByDateRangeSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter date_fin avant date_debut", () => {
      const data = {
        date_debut: new Date("2024-01-31"),
        date_fin: new Date("2024-01-01"),
      };
      expect(() => statisticsByDateRangeSchema.parse(data)).toThrow();
    });
  });

  describe("bulkCreateStatisticsSchema", () => {
    it("devrait valider création bulk", () => {
      const data = {
        statistics: [
          {
            type: "test",
            cle: "key1",
            valeur: "val1",
            date_stat: new Date(),
          },
          {
            type: "test",
            cle: "key2",
            valeur: "val2",
            date_stat: new Date(),
          },
        ],
      };
      expect(() => bulkCreateStatisticsSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter array vide", () => {
      const data = { statistics: [] };
      expect(() => bulkCreateStatisticsSchema.parse(data)).toThrow();
    });

    it("devrait rejeter plus de 100 items", () => {
      const data = {
        statistics: Array(101).fill({
          type: "test",
          cle: "key",
          valeur: "val",
          date_stat: new Date(),
        }),
      };
      expect(() => bulkCreateStatisticsSchema.parse(data)).toThrow();
    });
  });

  describe("Type inference", () => {
    it("devrait inférer le type Statistic", () => {
      type Test = typeof statisticBaseSchema._output;
      const val: Test = {
        id: 1,
        type: "test",
        cle: "key",
        valeur: "value",
        date_stat: new Date(),
        created_at: new Date(),
      };
      expect(val).toBeDefined();
    });
  });
});
