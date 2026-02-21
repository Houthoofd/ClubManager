/**
 * ====================================================================
 * STATS SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés aux statistiques.
 *
 * Usage:
 * ```tsx
 * import { StatsService } from '@/features/stats/services';
 *
 * // Utiliser les fonctions du service
 * const kpi = StatsService.calculateKPI('Revenue', 10000, 8000, '€');
 * const trend = StatsService.detectTrend(data);
 * const distribution = StatsService.calculateDistribution(categories);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { calculateKPI, formatKPIChange, comparePeriods } from '@/features/stats/services';
 * ```
 */

// ============================================================================
// Export everything from stats.service.ts
// ============================================================================

export * from "./stats.service";
export { default as StatsService } from "./stats.service";

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  KPI,
  TrendDirection,
  TimeSeriesData,
  PeriodComparison,
  CategoryDistribution,
  DashboardStats,
  PerformanceMetrics,
} from "./stats.service";
