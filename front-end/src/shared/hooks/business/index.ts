/**
 * ====================================================================
 * BUSINESS HOOKS - BARREL EXPORT
 * ====================================================================
 *
 * Centralized export point for all business logic hooks.
 * These hooks encapsulate common business operations like
 * pagination, sorting, filtering, and data export.
 *
 * Usage:
 * ```tsx
 * import { usePagination, useTableSort, useExport } from '@/shared/hooks/business';
 * ```
 */

// ============================================================================
// Pagination
// ============================================================================

export {
  usePagination,
  getPaginationRange,
  type UsePaginationOptions,
  type UsePaginationReturn,
} from './usePagination';

// ============================================================================
// Sorting
// ============================================================================

export {
  useTableSort,
  useMultiSort,
  type SortDirection,
  type UseTableSortOptions,
  type UseTableSortReturn,
  type SortConfig,
} from './useTableSort';

// ============================================================================
// Filtering
// ============================================================================

export {
  useTableFilter,
  useQuickFilters,
  useTableControls,
  type FilterOperator,
  type FilterConfig,
  type UseTableFilterOptions,
  type UseTableFilterReturn,
} from './useTableFilter';

// ============================================================================
// Export
// ============================================================================

export {
  useExport,
  formatDateForExport,
  formatCurrencyForExport,
  sanitizeDataForExport,
  type ExportOptions,
  type UseExportReturn,
} from './useExport';

// ============================================================================
// Re-export default
// ============================================================================

export { default as usePaginationDefault } from './usePagination';
export { default as useTableSortDefault } from './useTableSort';
export { default as useTableFilterDefault } from './useTableFilter';
export { default as useExportDefault } from './useExport';
