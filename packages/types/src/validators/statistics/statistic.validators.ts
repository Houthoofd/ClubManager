/**
 * @fileoverview Statistic Validators
 * @module @clubmanager/types/validators/statistics/statistic
 *
 * Zod schemas for validating club statistics tracking.
 *
 * DB Table: statistiques
 * Columns: id, type, cle, valeur, date_stat, created_at
 *
 * Business Rules:
 * - Type: required, 1-50 chars (e.g., 'frequentation', 'revenue', 'inscriptions')
 * - Key (cle): required, 1-100 chars (identifier for the statistic)
 * - Value (valeur): required, 1-65535 chars (JSON or simple text)
 * - date_stat: required DATE field
 * - Value can be JSON or plain text depending on statistic type
 */

import { z } from 'zod';
import {
  STATISTIC_TYPE_MAX_LENGTH,
  STATISTIC_TYPE_MIN_LENGTH,
  STATISTIC_KEY_MAX_LENGTH,
  STATISTIC_KEY_MIN_LENGTH,
  STATISTIC_VALUE_MAX_LENGTH,
  STATISTIC_VALUE_MIN_LENGTH,
  STATISTICS_DEFAULT_PAGE_SIZE,
  STATISTICS_MAX_PAGE_SIZE,
  STATISTICS_MIN_PAGE_SIZE,
  STATISTICS_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
  MAX_STATISTICS_DATE_RANGE_DAYS,
} from '../../constants/statistics.constants.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base statistic schema with all fields
 */
export const statisticBaseSchema = z.object({
  id: idSchema,
  type: z
    .string()
    .trim()
    .min(STATISTIC_TYPE_MIN_LENGTH, {
      message: `Le type doit contenir au moins ${STATISTIC_TYPE_MIN_LENGTH} caractère`,
    })
    .max(STATISTIC_TYPE_MAX_LENGTH, {
      message: `Le type ne peut pas dépasser ${STATISTIC_TYPE_MAX_LENGTH} caractères`,
    }),
  cle: z
    .string()
    .trim()
    .min(STATISTIC_KEY_MIN_LENGTH, {
      message: `La clé doit contenir au moins ${STATISTIC_KEY_MIN_LENGTH} caractère`,
    })
    .max(STATISTIC_KEY_MAX_LENGTH, {
      message: `La clé ne peut pas dépasser ${STATISTIC_KEY_MAX_LENGTH} caractères`,
    }),
  valeur: z
    .string()
    .trim()
    .min(STATISTIC_VALUE_MIN_LENGTH, {
      message: `La valeur doit contenir au moins ${STATISTIC_VALUE_MIN_LENGTH} caractère`,
    })
    .max(STATISTIC_VALUE_MAX_LENGTH, {
      message: `La valeur ne peut pas dépasser ${STATISTIC_VALUE_MAX_LENGTH} caractères`,
    }),
  date_stat: z.coerce.date(),
  created_at: z.coerce.date(),
});

/**
 * Inferred TypeScript type for Statistic
 */
export type Statistic = z.infer<typeof statisticBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new statistic
 * Required: type, cle, valeur, date_stat
 */
export const createStatisticSchema = statisticBaseSchema.pick({
  type: true,
  cle: true,
  valeur: true,
  date_stat: true,
});

/**
 * Inferred TypeScript type for CreateStatistic
 */
export type CreateStatistic = z.infer<typeof createStatisticSchema>;

// ============================================================================
// CREATE WITH JSON SCHEMA
// ============================================================================

/**
 * Schema for creating a statistic with JSON value
 * Validates that valeur is valid JSON
 */
export const createStatisticWithJsonSchema = z.object({
  type: z
    .string()
    .trim()
    .min(STATISTIC_TYPE_MIN_LENGTH)
    .max(STATISTIC_TYPE_MAX_LENGTH),
  cle: z
    .string()
    .trim()
    .min(STATISTIC_KEY_MIN_LENGTH)
    .max(STATISTIC_KEY_MAX_LENGTH),
  valeur: z.record(z.unknown()),
  date_stat: z.coerce.date(),
});

/**
 * Inferred TypeScript type for CreateStatisticWithJson
 */
export type CreateStatisticWithJson = z.infer<typeof createStatisticWithJsonSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a statistic
 * All fields except date_stat are optional
 */
export const updateStatisticSchema = statisticBaseSchema
  .pick({
    type: true,
    cle: true,
    valeur: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateStatistic
 */
export type UpdateStatistic = z.infer<typeof updateStatisticSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing statistics with filters
 */
export const listStatisticsSchema = paginationSchema
  .extend({
    type: z.string().trim().optional(),
    cle: z.string().trim().optional(),
    date_debut: z.coerce.date().optional(),
    date_fin: z.coerce.date().optional(),
    sort_by: z.enum(['date_stat', 'type', 'cle', 'created_at']).default('date_stat'),
    sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
  })
  .refine(
    (data) => {
      if (data.date_debut && data.date_fin) {
        const diffTime = Math.abs(data.date_fin.getTime() - data.date_debut.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= MAX_STATISTICS_DATE_RANGE_DAYS;
      }
      return true;
    },
    {
      message: `La plage de dates ne peut pas dépasser ${MAX_STATISTICS_DATE_RANGE_DAYS} jours`,
      path: ['date_fin'],
    }
  );

/**
 * Inferred TypeScript type for ListStatistics query
 */
export type ListStatisticsQuery = z.infer<typeof listStatisticsSchema>;

/**
 * Schema for statistics by type
 */
export const statisticsByTypeSchema = paginationSchema.extend({
  type: z.string().trim(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  sort_by: z.enum(['date_stat', 'cle']).default('date_stat'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for StatisticsByType query
 */
export type StatisticsByTypeQuery = z.infer<typeof statisticsByTypeSchema>;

/**
 * Schema for statistics by date range
 */
export const statisticsByDateRangeSchema = z
  .object({
    date_debut: z.coerce.date(),
    date_fin: z.coerce.date(),
    type: z.string().trim().optional(),
  })
  .refine((data) => data.date_fin >= data.date_debut, {
    message: 'La date de fin doit être supérieure ou égale à la date de début',
    path: ['date_fin'],
  })
  .refine(
    (data) => {
      const diffTime = Math.abs(data.date_fin.getTime() - data.date_debut.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= MAX_STATISTICS_DATE_RANGE_DAYS;
    },
    {
      message: `La plage de dates ne peut pas dépasser ${MAX_STATISTICS_DATE_RANGE_DAYS} jours`,
      path: ['date_fin'],
    }
  );

/**
 * Inferred TypeScript type for StatisticsByDateRange query
 */
export type StatisticsByDateRangeQuery = z.infer<typeof statisticsByDateRangeSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating statistic ID as number
 */
export const statisticIdSchema = idSchema;

/**
 * Schema for validating statistic ID as string (from params)
 */
export const statisticIdStringSchema = idStringSchema;

/**
 * Schema for validating statistic ID in route params
 */
export const statisticIdParamSchema = z.object({
  id: statisticIdStringSchema,
});

/**
 * Inferred TypeScript type for statistic ID param
 */
export type StatisticIdParam = z.infer<typeof statisticIdParamSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schema for bulk creating statistics
 */
export const bulkCreateStatisticsSchema = z.object({
  statistics: z
    .array(createStatisticSchema)
    .min(1, { message: 'Au moins une statistique doit être fournie' })
    .max(100, { message: 'Vous ne pouvez pas créer plus de 100 statistiques à la fois' }),
});

/**
 * Inferred TypeScript type for BulkCreateStatistics
 */
export type BulkCreateStatistics = z.infer<typeof bulkCreateStatisticsSchema>;

/**
 * Schema for bulk deleting statistics
 */
export const bulkDeleteStatisticsSchema = z.object({
  statistic_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins une statistique doit être sélectionnée' })
    .max(100, { message: 'Vous ne pouvez pas supprimer plus de 100 statistiques à la fois' }),
});

/**
 * Inferred TypeScript type for BulkDeleteStatistics
 */
export type BulkDeleteStatistics = z.infer<typeof bulkDeleteStatisticsSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for statistic response (includes all fields)
 */
export const statisticResponseSchema = statisticBaseSchema;

/**
 * Inferred TypeScript type for StatisticResponse
 */
export type StatisticResponse = z.infer<typeof statisticResponseSchema>;

/**
 * Schema for paginated statistics list response
 */
export const statisticsListResponseSchema = z.object({
  data: z.array(statisticResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for StatisticsListResponse
 */
export type StatisticsListResponse = z.infer<typeof statisticsListResponseSchema>;

/**
 * Schema for statistics summary by type
 */
export const statisticsSummarySchema = z.object({
  type: z.string(),
  count: z.number().int().nonnegative(),
  date_debut: z.coerce.date(),
  date_fin: z.coerce.date(),
  statistics: z.array(statisticResponseSchema).optional(),
});

/**
 * Inferred TypeScript type for StatisticsSummary
 */
export type StatisticsSummary = z.infer<typeof statisticsSummarySchema>;

/**
 * Schema for aggregated statistics
 */
export const aggregatedStatisticsSchema = z.object({
  total_records: z.number().int().nonnegative(),
  types: z.record(z.number().int().nonnegative()),
  date_range: z.object({
    earliest: z.coerce.date(),
    latest: z.coerce.date(),
  }),
});

/**
 * Inferred TypeScript type for AggregatedStatistics
 */
export type AggregatedStatistics = z.infer<typeof aggregatedStatisticsSchema>;
