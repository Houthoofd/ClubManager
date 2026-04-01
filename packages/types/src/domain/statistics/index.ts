/**
 * @fileoverview Statistics Domain Types
 * @module @clubmanager/types/domain/statistics
 *
 * Domain types for the Statistics module.
 * Re-exports types inferred from Zod validators for consistency.
 */

// ============================================================================
// STATISTIC TYPES
// ============================================================================

export type {
  Statistic,
  CreateStatistic,
  CreateStatisticWithJson,
  UpdateStatistic,
  StatisticResponse,
  StatisticsListResponse,
  StatisticsSummary,
  AggregatedStatistics,
} from '../../validators/statistics/statistic.validators.js';

// ============================================================================
// INFORMATION TYPES
// ============================================================================

export type {
  Information,
  CreateInformation,
  UpdateInformation,
  InformationResponse,
  InformationsListResponse,
  InformationStats,
  GroupedInformations,
} from '../../validators/statistics/information.validators.js';
