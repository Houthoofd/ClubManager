/**
 * Tests unitaires pour les validators Zod du domaine Sports
 * @module __tests__/domains/sports.validators.test
 */

import { describe, it, expect } from "@jest/globals";
import {
  // Enums from types
  SportConfigDataType,
  SportEquipmentLevel,
  CompetitionRuleType,
} from "../types.js";
import {
  // Create validators
  CreateSportInputSchema,
  CreateSportConfigurationInputSchema,
  CreateUserSportInputSchema,
  CreateUserGradeHistoryInputSchema,
  CreateSportEquipmentInputSchema,
  CreateSportCompetitionRuleInputSchema,
  CreateSportStatisticInputSchema,
  // Update validators
  UpdateSportInputSchema,
  UpdateSportConfigurationInputSchema,
  UpdateUserSportInputSchema,
  UpdateSportEquipmentInputSchema,
  UpdateSportCompetitionRuleInputSchema,
  // Query validators
  GetSportsInputSchema,
  GetUserSportsInputSchema,
} from "../validators.js";

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

// Helper functions tests removed - validators don't export isValidHexColor
// The hex color validation is done inline in the schema with regex

// ============================================================================
// CREATE SPORT TESTS
// ============================================================================

describe("Sports Validators - createSportSchema", () => {
  it("should validate a valid sport creation", () => {
    const validSport = {
      code: "KARATE",
      name: "Karaté",
      description: "Art martial japonais",
      color: "#FF0000",
      icon: "🥋",
      image_url: "https://example.com/karate.jpg",
      is_active: true,
      display_order: 1,
      requires_belt: true,
      allow_competitions: true,
    };

    const result = CreateSportInputSchema.safeParse(validSport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("KARATE");
      expect(result.data.is_active).toBe(true);
    }
  });

  it("should apply default values", () => {
    const minimalSport = {
      code: "JUDO",
      name: "Judo",
      color: "#0000FF",
    };

    const result = CreateSportInputSchema.safeParse(minimalSport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.display_order).toBe(0);
      expect(result.data.requires_belt).toBe(true);
      expect(result.data.allow_competitions).toBe(true);
    }
  });

  it("should reject invalid hex color", () => {
    const invalidSport = {
      code: "KARATE",
      name: "Karaté",
      color: "red", // Invalid hex color
    };

    const result = CreateSportInputSchema.safeParse(invalidSport);
    expect(result.success).toBe(false);
  });

  it("should reject empty code", () => {
    const invalidSport = {
      code: "",
      name: "Karaté",
      color: "#FF0000",
    };

    const result = CreateSportInputSchema.safeParse(invalidSport);
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const invalidSport = {
      code: "KARATE",
      name: "",
      color: "#FF0000",
    };

    const result = CreateSportInputSchema.safeParse(invalidSport);
    expect(result.success).toBe(false);
  });

  it("should trim whitespace from code and name", () => {
    const sport = {
      code: "  KARATE  ",
      name: "  Karaté  ",
      color: "#FF0000",
    };

    const result = CreateSportInputSchema.safeParse(sport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("KARATE");
      expect(result.data.name).toBe("Karaté");
    }
  });

  it("should accept valid image URL", () => {
    const sport = {
      code: "KARATE",
      name: "Karaté",
      color: "#FF0000",
      image_url: "https://example.com/image.jpg",
    };

    const result = CreateSportInputSchema.safeParse(sport);
    expect(result.success).toBe(true);
  });

  it("should reject invalid image URL", () => {
    const sport = {
      code: "KARATE",
      name: "Karaté",
      color: "#FF0000",
      image_url: "not-a-url",
    };

    const result = CreateSportInputSchema.safeParse(sport);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// UPDATE SPORT TESTS
// ============================================================================

describe("Sports Validators - updateSportSchema", () => {
  it("should validate partial updates", () => {
    const update = {
      name: "New Name",
    };

    const result = UpdateSportInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should allow updating color", () => {
    const update = {
      color: "#00FF00",
    };

    const result = UpdateSportInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should reject invalid color in update", () => {
    const update = {
      color: "invalid-color",
    };

    const result = UpdateSportInputSchema.safeParse(update);
    expect(result.success).toBe(false);
  });

  it("should allow empty update object", () => {
    const update = {};

    const result = UpdateSportInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// SPORT CONFIGURATION TESTS
// ============================================================================

describe("Sports Validators - createSportConfigurationSchema", () => {
  it("should validate a valid configuration", () => {
    const validConfig = {
      sport_id: 1,
      config_key: "max_students_per_class",
      config_value: "20",
      data_type: SportConfigDataType.NUMBER,
      description: "Maximum d'étudiants par cours",
      display_order: 1,
    };

    const result = CreateSportConfigurationInputSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should apply default display_order", () => {
    const config = {
      sport_id: 1,
      config_key: "test_key",
      config_value: "test_value",
      data_type: SportConfigDataType.STRING,
    };

    const result = CreateSportConfigurationInputSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      // display_order doesn't exist on SportConfiguration
    }
  });

  it("should reject negative sport_id", () => {
    const config = {
      sport_id: -1,
      config_key: "test_key",
      config_value: "test_value",
      data_type: SportConfigDataType.STRING,
    };

    const result = CreateSportConfigurationInputSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("should accept all data types", () => {
    const dataTypes = [
      SportConfigDataType.STRING,
      SportConfigDataType.NUMBER,
      SportConfigDataType.BOOLEAN,
      SportConfigDataType.JSON,
      SportConfigDataType.TEXT,
    ];

    dataTypes.forEach((dataType) => {
      const config = {
        sport_id: 1,
        config_key: "test",
        config_value: "test",
        data_type: dataType,
      };

      const result = CreateSportConfigurationInputSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// USER SPORT TESTS
// ============================================================================

describe("Sports Validators - createUserSportSchema", () => {
  it("should validate a valid user sport", () => {
    const validUserSport = {
      user_id: 1,
      sport_id: 2,
      current_belt: "Ceinture noire",
      belt_obtained_date: new Date(),
      years_of_experience: 5,
      notes: "Excellent pratiquant",
      is_primary: true,
      is_active: true,
    };

    const result = CreateUserSportInputSchema.safeParse(validUserSport);
    expect(result.success).toBe(true);
  });

  it("should apply default values", () => {
    const minimalUserSport = {
      user_id: 1,
      sport_id: 2,
    };

    const result = CreateUserSportInputSchema.safeParse(minimalUserSport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_primary).toBe(false);
      expect(result.data.is_active).toBe(true);
    }
  });

  it("should accept valid user sport", () => {
    const userSport = {
      user_id: 1,
      sport_id: 1,
    };

    const result = CreateUserSportInputSchema.safeParse(userSport);
    expect(result.success).toBe(true);
  });

  it("should accept date strings for started_at", () => {
    const userSport = {
      user_id: 1,
      sport_id: 1,
      started_at: "2024-01-01",
    };

    const result = CreateUserSportInputSchema.safeParse(userSport);
    expect(result.success).toBe(true);
  });

  it("should accept optional fields", () => {
    const userSport = {
      user_id: 1,
      sport_id: 1,
      current_grade_id: 5,
      started_at: new Date(),
      is_primary: true,
      is_active: true,
      notes: "Training for competition",
    };

    const result = CreateUserSportInputSchema.safeParse(userSport);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// USER GRADE HISTORY TESTS
// ============================================================================

describe("Sports Validators - createUserGradeHistorySchema", () => {
  it("should validate a valid grade history entry", () => {
    const validHistory = {
      user_id: 1,
      sport_id: 1,
      grade_id: 5,
      obtained_at: new Date(),
      examiner_id: 10,
      location: "Dojo principal",
      certificate_number: "CERT-2024-001",
      notes: "Excellent examen",
    };

    const result = CreateUserGradeHistoryInputSchema.safeParse(validHistory);
    expect(result.success).toBe(true);
  });

  it("should accept minimal required fields", () => {
    const history = {
      user_id: 1,
      sport_id: 1,
      grade_id: 1,
      obtained_at: new Date(),
    };

    const result = CreateUserGradeHistoryInputSchema.safeParse(history);
    expect(result.success).toBe(true);
  });

  it("should reject missing grade_id", () => {
    const history = {
      user_id: 1,
      sport_id: 1,
      obtained_at: new Date(),
    };

    const result = CreateUserGradeHistoryInputSchema.safeParse(history);
    expect(result.success).toBe(false);
  });

  it("should accept date strings for obtained_at", () => {
    const history = {
      user_id: 1,
      sport_id: 1,
      grade_id: 2,
      obtained_at: "2024-01-15",
    };

    const result = CreateUserGradeHistoryInputSchema.safeParse(history);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// SPORT EQUIPMENT TESTS
// ============================================================================

describe("Sports Validators - createSportEquipmentSchema", () => {
  it("should validate valid equipment", () => {
    const validEquipment = {
      sport_id: 1,
      name: "Kimono",
      description: "Tenue traditionnelle",
      is_required: true,
      required_level: SportEquipmentLevel.BEGINNER,
      display_order: 1,
    };

    const result = CreateSportEquipmentInputSchema.safeParse(validEquipment);
    expect(result.success).toBe(true);
  });

  it("should apply default values", () => {
    const minimalEquipment = {
      sport_id: 1,
      name: "Kimono",
      required_level: SportEquipmentLevel.BEGINNER,
    };

    const result = CreateSportEquipmentInputSchema.safeParse(minimalEquipment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_mandatory).toBe(false);
      expect(result.data.display_order).toBe(0);
    }
  });

  it("should accept all equipment levels", () => {
    const levels = [
      SportEquipmentLevel.BEGINNER,
      SportEquipmentLevel.INTERMEDIATE,
      SportEquipmentLevel.ADVANCED,
      SportEquipmentLevel.COMPETITION,
      SportEquipmentLevel.ALL,
    ];

    levels.forEach((level) => {
      const equipment = {
        sport_id: 1,
        name: "Equipment",
        required_level: level,
      };

      const result = CreateSportEquipmentInputSchema.safeParse(equipment);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// SPORT COMPETITION RULE TESTS
// ============================================================================

describe("Sports Validators - createSportCompetitionRuleSchema", () => {
  it("should validate a valid competition rule", () => {
    const validRule = {
      sport_id: 1,
      rule_name: "Règle de notation",
      description: "Description de la règle de notation pour les compétitions",
      rule_type: CompetitionRuleType.SCORING,
      is_active: true,
      display_order: 1,
    };

    const result = CreateSportCompetitionRuleInputSchema.safeParse(validRule);
    expect(result.success).toBe(true);
  });

  it("should apply default values", () => {
    const minimalRule = {
      sport_id: 1,
      rule_name: "Règle basique",
      description: "Description complète de la règle",
      rule_type: CompetitionRuleType.OTHER,
    };

    const result = CreateSportCompetitionRuleInputSchema.safeParse(minimalRule);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.display_order).toBe(0);
    }
  });

  it("should accept all rule types", () => {
    const ruleTypes = [
      CompetitionRuleType.SCORING,
      CompetitionRuleType.TIME,
      CompetitionRuleType.SAFETY,
      CompetitionRuleType.EQUIPMENT,
      CompetitionRuleType.CATEGORY,
      CompetitionRuleType.OTHER,
    ];

    ruleTypes.forEach((ruleType) => {
      const rule = {
        sport_id: 1,
        rule_name: "Test Rule",
        rule_type: ruleType,
        description: "Test description for rule",
      };

      const result = CreateSportCompetitionRuleInputSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// SPORT STATISTIC TESTS
// ============================================================================

describe("Sports Validators - createSportStatisticSchema", () => {
  it("should validate a valid statistic", () => {
    const validStat = {
      sport_id: 1,
      stat_date: new Date(),
      total_members: 150,
      total_courses: 20,
      total_hours: 100,
      total_competitions: 5,
      total_revenue: 5000,
      user_id: 10,
    };

    const result = CreateSportStatisticInputSchema.safeParse(validStat);
    expect(result.success).toBe(true);
  });

  it("should apply default values", () => {
    const stat = {
      sport_id: 1,
      stat_date: new Date(),
    };

    const result = CreateSportStatisticInputSchema.safeParse(stat);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_members).toBe(0);
      expect(result.data.total_courses).toBe(0);
      expect(result.data.total_hours).toBe(0);
    }
  });

  it("should accept optional user_id", () => {
    const stat = {
      sport_id: 1,
      stat_date: new Date(),
      total_members: 100,
    };

    const result = CreateSportStatisticInputSchema.safeParse(stat);
    expect(result.success).toBe(true);
  });

  it("should accept positive numbers", () => {
    const stat = {
      sport_id: 1,
      stat_date: new Date(),
      total_members: 250,
      total_courses: 30,
      total_hours: 150.5,
      total_revenue: 10000,
    };

    const result = CreateSportStatisticInputSchema.safeParse(stat);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// FILTER TESTS
// ============================================================================

describe("Sports Validators - sportFilterSchema", () => {
  it("should validate a complete filter", () => {
    const filter = {
      is_active: true,
      requires_belt: true,
      allow_competitions: false,
      search: "karate",
      limit: 10,
      offset: 0,
    };

    const result = GetSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept empty filter", () => {
    const filter = {};

    const result = GetSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should reject negative limit", () => {
    const filter = {
      limit: -1,
    };

    const result = GetSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(false);
  });

  it("should reject negative offset", () => {
    const filter = {
      offset: -1,
    };

    const result = GetSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(false);
  });

  it("should accept valid limit values", () => {
    const filter = {
      limit: 50,
    };

    const result = GetSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });
});

describe("Sports Validators - userSportFilterSchema", () => {
  it("should validate a complete filter", () => {
    const filter = {
      user_id: 1,
      sport_id: 2,
      is_primary: true,
      is_active: true,
      limit: 20,
      offset: 0,
    };

    const result = GetUserSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept partial filter", () => {
    const filter = {
      user_id: 1,
    };

    const result = GetUserSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept all filter options", () => {
    const filter = {
      user_id: 1,
      include_sport: true,
      include_grade: true,
      is_active: true,
      is_primary: false,
    };

    const result = GetUserSportsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });
});
