/**
 * Validateurs Zod pour le domaine Sports
 * Schémas de validation des données
 *
 * @module sports/validators
 */

import { z } from "zod";

// ============================================================================
// ENUMS SCHEMAS
// ============================================================================

/**
 * Schéma pour SportConfigDataType
 */
export const SportConfigDataTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "json",
  "text",
]);

/**
 * Schéma pour SportEquipmentLevel
 */
export const SportEquipmentLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "competition",
  "all",
]);

/**
 * Schéma pour CompetitionRuleType
 */
export const CompetitionRuleTypeSchema = z.enum([
  "scoring",
  "time",
  "safety",
  "equipment",
  "category",
  "other",
]);

// ============================================================================
// SPORT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour Sport
 */
export const SportSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .default("#3B82F6"),
  icon: z.string().max(100).nullable().optional(),
  image_url: z.string().url().max(255).nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  requires_belt: z.boolean().default(true),
  allow_competitions: z.boolean().default(true),
  min_age: z.number().int().min(0).max(150).nullable().optional(),
  max_age: z.number().int().min(0).max(150).nullable().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateSportInput
 */
export const CreateSportInputSchema = z
  .object({
    code: z.string().min(1).max(50).toUpperCase().trim(),
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).trim().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .default("#3B82F6"),
    icon: z.string().max(100).trim().optional(),
    image_url: z.string().url().max(255).trim().optional(),
    is_active: z.boolean().default(true),
    display_order: z.number().int().min(0).default(0),
    requires_belt: z.boolean().default(true),
    allow_competitions: z.boolean().default(true),
    min_age: z.number().int().min(0).max(150).optional(),
    max_age: z.number().int().min(0).max(150).optional(),
  })
  .refine(
    (data) => {
      if (data.min_age !== undefined && data.max_age !== undefined) {
        return data.min_age <= data.max_age;
      }
      return true;
    },
    {
      message: "min_age doit être inférieur ou égal à max_age",
      path: ["min_age"],
    },
  );

/**
 * Schéma de validation pour UpdateSportInput
 */
export const UpdateSportInputSchema = z
  .object({
    code: z.string().min(1).max(50).toUpperCase().trim().optional(),
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .optional(),
    icon: z.string().max(100).trim().optional(),
    image_url: z.string().url().max(255).trim().optional(),
    is_active: z.boolean().optional(),
    display_order: z.number().int().min(0).optional(),
    requires_belt: z.boolean().optional(),
    allow_competitions: z.boolean().optional(),
    min_age: z.number().int().min(0).max(150).optional(),
    max_age: z.number().int().min(0).max(150).optional(),
  })
  .refine(
    (data) => {
      if (data.min_age !== undefined && data.max_age !== undefined) {
        return data.min_age <= data.max_age;
      }
      return true;
    },
    {
      message: "min_age doit être inférieur ou égal à max_age",
      path: ["min_age"],
    },
  );

// ============================================================================
// SPORT CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour SportConfiguration
 */
export const SportConfigurationSchema = z.object({
  id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  config_key: z.string().min(1).max(100),
  config_value: z.string().nullable().optional(),
  data_type: SportConfigDataTypeSchema,
  description: z.string().max(255).nullable().optional(),
  is_public: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateSportConfigurationInput
 */
export const CreateSportConfigurationInputSchema = z.object({
  sport_id: z.number().int().positive(),
  config_key: z.string().min(1).max(100).trim(),
  config_value: z.string().trim().optional(),
  data_type: SportConfigDataTypeSchema,
  description: z.string().max(255).trim().optional(),
  is_public: z.boolean().default(false),
});

/**
 * Schéma de validation pour UpdateSportConfigurationInput
 */
export const UpdateSportConfigurationInputSchema =
  CreateSportConfigurationInputSchema.partial().omit({ sport_id: true });

// ============================================================================
// USER SPORT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour UserSport
 */
export const UserSportSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  current_grade_id: z.number().int().positive().nullable().optional(),
  started_at: z.date().nullable().optional(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: z.string().max(1000).nullable().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateUserSportInput
 */
export const CreateUserSportInputSchema = z.object({
  user_id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  current_grade_id: z.number().int().positive().optional(),
  started_at: z.coerce.date().optional(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: z.string().max(1000).trim().optional(),
});

/**
 * Schéma de validation pour UpdateUserSportInput
 */
export const UpdateUserSportInputSchema =
  CreateUserSportInputSchema.partial().omit({
    user_id: true,
    sport_id: true,
  });

// ============================================================================
// USER GRADE HISTORY SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour UserGradeHistory
 */
export const UserGradeHistorySchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  grade_id: z.number().int().positive(),
  obtained_at: z.date(),
  examiner_id: z.number().int().positive().nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  certificate_number: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  created_at: z.date(),
});

/**
 * Schéma de validation pour CreateUserGradeHistoryInput
 */
export const CreateUserGradeHistoryInputSchema = z.object({
  user_id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  grade_id: z.number().int().positive(),
  obtained_at: z.coerce.date(),
  examiner_id: z.number().int().positive().optional(),
  location: z.string().max(255).trim().optional(),
  certificate_number: z.string().max(100).trim().optional(),
  notes: z.string().max(1000).trim().optional(),
});

// ============================================================================
// SPORT EQUIPMENT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour SportEquipment
 */
export const SportEquipmentSchema = z.object({
  id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  is_mandatory: z.boolean().default(false),
  for_level: SportEquipmentLevelSchema,
  category_id: z.number().int().positive().nullable().optional(),
  display_order: z.number().int().min(0).default(0),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateSportEquipmentInput
 */
export const CreateSportEquipmentInputSchema = z.object({
  sport_id: z.number().int().positive(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  is_mandatory: z.boolean().default(false),
  for_level: SportEquipmentLevelSchema.default("all"),
  category_id: z.number().int().positive().optional(),
  display_order: z.number().int().min(0).default(0),
});

/**
 * Schéma de validation pour UpdateSportEquipmentInput
 */
export const UpdateSportEquipmentInputSchema =
  CreateSportEquipmentInputSchema.partial().omit({ sport_id: true });

// ============================================================================
// SPORT COMPETITION RULE SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour SportCompetitionRule
 */
export const SportCompetitionRuleSchema = z.object({
  id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  rule_name: z.string().min(1).max(100),
  rule_type: CompetitionRuleTypeSchema,
  description: z.string().min(1),
  applies_to: z.string().max(100).nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateSportCompetitionRuleInput
 */
export const CreateSportCompetitionRuleInputSchema = z.object({
  sport_id: z.number().int().positive(),
  rule_name: z.string().min(1).max(100).trim(),
  rule_type: CompetitionRuleTypeSchema,
  description: z.string().min(1).trim(),
  applies_to: z.string().max(100).trim().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
});

/**
 * Schéma de validation pour UpdateSportCompetitionRuleInput
 */
export const UpdateSportCompetitionRuleInputSchema =
  CreateSportCompetitionRuleInputSchema.partial().omit({ sport_id: true });

// ============================================================================
// SPORT STATISTICS SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour SportStatistic
 */
export const SportStatisticSchema = z.object({
  id: z.number().int().positive(),
  sport_id: z.number().int().positive(),
  user_id: z.number().int().positive().nullable().optional(),
  stat_date: z.date(),
  total_members: z.number().int().min(0).default(0),
  total_courses: z.number().int().min(0).default(0),
  total_hours: z.number().min(0).default(0),
  total_competitions: z.number().int().min(0).default(0),
  total_revenue: z.number().min(0).default(0),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateSportStatisticInput
 */
export const CreateSportStatisticInputSchema = z.object({
  sport_id: z.number().int().positive(),
  user_id: z.number().int().positive().optional(),
  stat_date: z.coerce.date(),
  total_members: z.number().int().min(0).default(0),
  total_courses: z.number().int().min(0).default(0),
  total_hours: z.number().min(0).default(0),
  total_competitions: z.number().int().min(0).default(0),
  total_revenue: z.number().min(0).default(0),
});

/**
 * Schéma de validation pour UpdateSportStatisticInput
 */
export const UpdateSportStatisticInputSchema =
  CreateSportStatisticInputSchema.partial().omit({
    sport_id: true,
    user_id: true,
    stat_date: true,
  });

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour GetSportsInput
 */
export const GetSportsInputSchema = z.object({
  is_active: z.boolean().optional(),
  requires_belt: z.boolean().optional(),
  allow_competitions: z.boolean().optional(),
  include_configurations: z.boolean().default(false),
  include_stats: z.boolean().default(false),
  search: z.string().trim().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Schéma de validation pour GetUserSportsInput
 */
export const GetUserSportsInputSchema = z.object({
  user_id: z.number().int().positive(),
  is_active: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  include_sport: z.boolean().default(true),
  include_grade: z.boolean().default(true),
});

/**
 * Schéma de validation pour SportStatsQuery
 */
export const SportStatsQuerySchema = z
  .object({
    sport_id: z.number().int().positive(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    include_user_stats: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date;
      }
      return true;
    },
    {
      message: "start_date doit être antérieure à end_date",
      path: ["start_date"],
    },
  );
