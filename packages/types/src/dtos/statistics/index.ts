/**
 * @fileoverview Statistics DTOs
 * @module @clubmanager/types/dtos/statistics
 *
 * Data Transfer Objects for the Statistics module.
 * Re-exports types from validators for API request/response structures.
 */

// ============================================================================
// STATISTIC DTOs
// ============================================================================

export type {
  CreateStatistic,
  CreateStatisticWithJson,
  UpdateStatistic,
  StatisticResponse,
  StatisticsListResponse,
  StatisticsSummary,
  AggregatedStatistics,
  ListStatisticsQuery,
  StatisticsByTypeQuery,
  StatisticsByDateRangeQuery,
  BulkCreateStatistics,
  BulkDeleteStatistics,
} from '../../validators/statistics/statistic.validators.js';

// ============================================================================
// INFORMATION DTOs
// ============================================================================

export type {
  CreateInformation,
  UpdateInformation,
  InformationResponse,
  InformationsListResponse,
  InformationStats,
  GroupedInformations,
  ListInformationsQuery,
  GetInformationByKey,
  BulkUpsertInformations,
  BulkDeleteInformations,
} from '../../validators/statistics/information.validators.js';
