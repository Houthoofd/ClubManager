/**
 * ====================================================================
 * useTableFilter Hook
 * ====================================================================
 *
 * Hook for handling advanced table filtering logic.
 * Provides multi-field filtering with various operators.
 *
 * Usage:
 * ```tsx
 * const { filteredData, filters, setFilter, clearFilters } =
 *   useTableFilter(users);
 * ```
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'notIn';

export interface FilterConfig<T> {
  field: keyof T;
  operator: FilterOperator;
  value: any;
  caseSensitive?: boolean;
}

export interface UseTableFilterOptions<T> {
  /** Initial filters */
  initialFilters?: FilterConfig<T>[];
  /** Custom filter function */
  customFilter?: (item: T, filters: FilterConfig<T>[]) => boolean;
}

export interface UseTableFilterReturn<T> {
  /** Filtered data array */
  filteredData: T[];
  /** Active filters */
  filters: FilterConfig<T>[];
  /** Set a filter */
  setFilter: (filter: FilterConfig<T>) => void;
  /** Remove a filter by field */
  removeFilter: (field: keyof T) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Check if field has filter */
  hasFilter: (field: keyof T) => boolean;
  /** Get filter for field */
  getFilter: (field: keyof T) => FilterConfig<T> | undefined;
  /** Number of active filters */
  activeFilterCount: number;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for table filtering
 *
 * @param data - Array of items to filter
 * @param options - Filter options
 * @returns Filter state and controls
 *
 * @example
 * ```tsx
 * function UsersTable() {
 *   const [users, setUsers] = useState<User[]>([]);
 *
 *   const { filteredData, setFilter, clearFilters, activeFilterCount } =
 *     useTableFilter(users);
 *
 *   const handleSearchName = (value: string) => {
 *     setFilter({
 *       field: 'name',
 *       operator: 'contains',
 *       value,
 *       caseSensitive: false,
 *     });
 *   };
 *
 *   const handleFilterRole = (role: string) => {
 *     setFilter({
 *       field: 'role',
 *       operator: 'equals',
 *       value: role,
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <SearchInput onChange={handleSearchName} />
 *       <RoleFilter onChange={handleFilterRole} />
 *       {activeFilterCount > 0 && (
 *         <Button onClick={clearFilters}>Clear Filters ({activeFilterCount})</Button>
 *       )}
 *       <DataTable data={filteredData} />
 *     </>
 *   );
 * }
 * ```
 */
export function useTableFilter<T extends Record<string, any>>(
  data: T[],
  options: UseTableFilterOptions<T> = {}
): UseTableFilterReturn<T> {
  const { initialFilters = [], customFilter } = options;

  // State
  const [filters, setFilters] = useState<FilterConfig<T>[]>(initialFilters);

  // Apply filters
  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;

    // Use custom filter if provided
    if (customFilter) {
      return data.filter((item) => customFilter(item, filters));
    }

    // Default filter logic
    return data.filter((item) => {
      return filters.every((filter) => {
        const value = item[filter.field];
        return matchesFilter(value, filter);
      });
    });
  }, [data, filters, customFilter]);

  // Set or update filter
  const setFilter = useCallback((filter: FilterConfig<T>) => {
    setFilters((prev) => {
      const existingIndex = prev.findIndex((f) => f.field === filter.field);
      if (existingIndex >= 0) {
        // Update existing filter
        const newFilters = [...prev];
        newFilters[existingIndex] = filter;
        return newFilters;
      }
      // Add new filter
      return [...prev, filter];
    });
  }, []);

  // Remove filter
  const removeFilter = useCallback((field: keyof T) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // Check if field has filter
  const hasFilter = useCallback(
    (field: keyof T): boolean => {
      return filters.some((f) => f.field === field);
    },
    [filters]
  );

  // Get filter for field
  const getFilter = useCallback(
    (field: keyof T): FilterConfig<T> | undefined => {
      return filters.find((f) => f.field === field);
    },
    [filters]
  );

  return {
    filteredData,
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    hasFilter,
    getFilter,
    activeFilterCount: filters.length,
  };
}

// ============================================================================
// Filter Matching Logic
// ============================================================================

/**
 * Check if value matches filter criteria
 */
function matchesFilter<T>(value: any, filter: FilterConfig<T>): boolean {
  const { operator, value: filterValue, caseSensitive = false } = filter;

  // Handle null/undefined
  if (value == null) {
    return filterValue == null;
  }

  // Convert to string for text operations
  const valueStr = caseSensitive ? String(value) : String(value).toLowerCase();
  const filterStr = caseSensitive
    ? String(filterValue)
    : String(filterValue).toLowerCase();

  switch (operator) {
    case 'equals':
      return value === filterValue;

    case 'contains':
      return valueStr.includes(filterStr);

    case 'startsWith':
      return valueStr.startsWith(filterStr);

    case 'endsWith':
      return valueStr.endsWith(filterStr);

    case 'gt':
      return Number(value) > Number(filterValue);

    case 'gte':
      return Number(value) >= Number(filterValue);

    case 'lt':
      return Number(value) < Number(filterValue);

    case 'lte':
      return Number(value) <= Number(filterValue);

    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const numValue = Number(value);
        return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
      }
      return false;

    case 'in':
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value);
      }
      return false;

    case 'notIn':
      if (Array.isArray(filterValue)) {
        return !filterValue.includes(value);
      }
      return true;

    default:
      return true;
  }
}

// ============================================================================
// Utility: Quick Filters
// ============================================================================

/**
 * Hook for quick preset filters
 *
 * @param data - Array of items to filter
 * @param presets - Preset filter configurations
 * @returns Quick filter controls
 *
 * @example
 * ```tsx
 * const { filteredData, activePreset, applyPreset, clearPreset } = useQuickFilters(
 *   users,
 *   {
 *     active: [{ field: 'status', operator: 'equals', value: 'active' }],
 *     inactive: [{ field: 'status', operator: 'equals', value: 'inactive' }],
 *     admins: [{ field: 'role', operator: 'equals', value: 'admin' }],
 *   }
 * );
 * ```
 */
export function useQuickFilters<T extends Record<string, any>>(
  data: T[],
  presets: Record<string, FilterConfig<T>[]>
) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterConfig<T>[]>([]);

  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;

    return data.filter((item) => {
      return filters.every((filter) => {
        const value = item[filter.field];
        return matchesFilter(value, filter);
      });
    });
  }, [data, filters]);

  const applyPreset = useCallback(
    (presetName: string) => {
      const presetFilters = presets[presetName];
      if (presetFilters) {
        setFilters(presetFilters);
        setActivePreset(presetName);
      }
    },
    [presets]
  );

  const clearPreset = useCallback(() => {
    setFilters([]);
    setActivePreset(null);
  }, []);

  return {
    filteredData,
    activePreset,
    applyPreset,
    clearPreset,
    presetNames: Object.keys(presets),
  };
}

// ============================================================================
// Utility: Combined Sort + Filter + Pagination
// ============================================================================

/**
 * Combined hook for sorting, filtering, and pagination
 *
 * @param data - Array of items
 * @returns Combined controls
 *
 * @example
 * ```tsx
 * const {
 *   displayData,
 *   sortKey,
 *   handleSort,
 *   setFilter,
 *   clearFilters,
 *   currentPage,
 *   totalPages,
 *   nextPage,
 *   prevPage,
 * } = useTableControls(users, { itemsPerPage: 20 });
 * ```
 */
export function useTableControls<T extends Record<string, any>>(
  data: T[],
  options: {
    itemsPerPage?: number;
    defaultSortKey?: keyof T;
    initialFilters?: FilterConfig<T>[];
  } = {}
) {
  const { itemsPerPage = 10, defaultSortKey, initialFilters = [] } = options;

  // Filtering
  const [filters, setFilters] = useState<FilterConfig<T>[]>(initialFilters);
  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;
    return data.filter((item) =>
      filters.every((filter) => matchesFilter(item[filter.field], filter))
    );
  }, [data, filters]);

  // Sorting
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const displayData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = useCallback(
    (key: keyof T) => {
      if (sortKey === key) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
      setCurrentPage(1); // Reset to first page when sorting
    },
    [sortKey]
  );

  const setFilter = useCallback((filter: FilterConfig<T>) => {
    setFilters((prev) => {
      const idx = prev.findIndex((f) => f.field === filter.field);
      if (idx >= 0) {
        const newFilters = [...prev];
        newFilters[idx] = filter;
        return newFilters;
      }
      return [...prev, filter];
    });
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setCurrentPage(1);
  }, []);

  return {
    displayData,
    sortKey,
    sortDirection,
    handleSort,
    filters,
    setFilter,
    removeFilter: (field: keyof T) =>
      setFilters((prev) => prev.filter((f) => f.field !== field)),
    clearFilters,
    currentPage,
    totalPages,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    goToPage: (page: number) =>
      setCurrentPage(Math.max(1, Math.min(page, totalPages))),
  };
}

// Export default
export default useTableFilter;
