/**
 * ====================================================================
 * useTableSort Hook
 * ====================================================================
 *
 * Hook for handling table sorting logic.
 * Provides column-based sorting with direction toggle.
 *
 * Usage:
 * ```tsx
 * const { sortedData, sortKey, sortDirection, handleSort } =
 *   useTableSort(users, 'name');
 * ```
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface UseTableSortOptions<T> {
  /** Default sort key */
  defaultKey?: keyof T | null;
  /** Default sort direction */
  defaultDirection?: SortDirection;
  /** Custom compare function */
  compareFn?: (a: T, b: T, key: keyof T, direction: SortDirection) => number;
}

export interface UseTableSortReturn<T> {
  /** Sorted data array */
  sortedData: T[];
  /** Current sort key */
  sortKey: keyof T | null;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Handle column sort click */
  handleSort: (key: keyof T) => void;
  /** Reset sorting to default */
  resetSort: () => void;
  /** Check if column is sorted */
  isSorted: (key: keyof T) => boolean;
  /** Get sort indicator for column */
  getSortIndicator: (key: keyof T) => '↑' | '↓' | '';
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for table sorting
 *
 * @param data - Array of items to sort
 * @param options - Sort options
 * @returns Sort state and controls
 *
 * @example
 * ```tsx
 * function UsersTable() {
 *   const [users, setUsers] = useState<User[]>([]);
 *
 *   const { sortedData, sortKey, sortDirection, handleSort } =
 *     useTableSort(users, { defaultKey: 'name', defaultDirection: 'asc' });
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th onClick={() => handleSort('name')}>
 *             Name {sortKey === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
 *           </th>
 *           <th onClick={() => handleSort('email')}>Email</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {sortedData.map(user => (
 *           <tr key={user.id}>
 *             <td>{user.name}</td>
 *             <td>{user.email}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 */
export function useTableSort<T>(
  data: T[],
  options: UseTableSortOptions<T> = {}
): UseTableSortReturn<T> {
  const {
    defaultKey = null,
    defaultDirection = 'asc',
    compareFn,
  } = options;

  // State
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  // Default compare function
  const defaultCompareFn = useCallback(
    (a: T, b: T, key: keyof T, direction: SortDirection): number => {
      if (!key || !direction) return 0;

      const aVal = a[key];
      const bVal = b[key];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle strings (case-insensitive)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        return direction === 'asc' ? comparison : -comparison;
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle booleans
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
        return direction === 'asc' ? comparison : -comparison;
      }

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        const comparison = aVal.getTime() - bVal.getTime();
        return direction === 'asc' ? comparison : -comparison;
      }

      // Fallback: convert to string and compare
      const aStr = String(aVal);
      const bStr = String(bVal);
      const comparison = aStr.localeCompare(bStr);
      return direction === 'asc' ? comparison : -comparison;
    },
    []
  );

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return data;
    }

    const compare = compareFn || defaultCompareFn;

    return [...data].sort((a, b) => compare(a, b, sortKey, sortDirection));
  }, [data, sortKey, sortDirection, compareFn, defaultCompareFn]);

  // Handle sort
  const handleSort = useCallback(
    (key: keyof T) => {
      if (sortKey === key) {
        // Toggle direction or clear sort
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else if (sortDirection === 'desc') {
          setSortKey(null);
          setSortDirection(null);
        } else {
          setSortDirection('asc');
        }
      } else {
        // New column: sort ascending
        setSortKey(key);
        setSortDirection('asc');
      }
    },
    [sortKey, sortDirection]
  );

  // Reset sort
  const resetSort = useCallback(() => {
    setSortKey(defaultKey);
    setSortDirection(defaultDirection);
  }, [defaultKey, defaultDirection]);

  // Check if column is sorted
  const isSorted = useCallback(
    (key: keyof T): boolean => {
      return sortKey === key;
    },
    [sortKey]
  );

  // Get sort indicator
  const getSortIndicator = useCallback(
    (key: keyof T): '↑' | '↓' | '' => {
      if (sortKey !== key) return '';
      if (sortDirection === 'asc') return '↑';
      if (sortDirection === 'desc') return '↓';
      return '';
    },
    [sortKey, sortDirection]
  );

  return {
    sortedData,
    sortKey,
    sortDirection,
    handleSort,
    resetSort,
    isSorted,
    getSortIndicator,
  };
}

// ============================================================================
// Utility: Multi-column sorting
// ============================================================================

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

/**
 * Hook for multi-column sorting
 *
 * @param data - Array of items to sort
 * @param defaultSorts - Default sort configurations
 * @returns Multi-sort state and controls
 *
 * @example
 * ```tsx
 * const { sortedData, sortConfigs, addSort, removeSort } =
 *   useMultiSort(users, [
 *     { key: 'department', direction: 'asc' },
 *     { key: 'name', direction: 'asc' },
 *   ]);
 * ```
 */
export function useMultiSort<T>(
  data: T[],
  defaultSorts: SortConfig<T>[] = []
) {
  const [sortConfigs, setSortConfigs] = useState<SortConfig<T>[]>(defaultSorts);

  const sortedData = useMemo(() => {
    if (sortConfigs.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const config of sortConfigs) {
        const { key, direction } = config;
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === bVal) continue;

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison = 0;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison;
        }
      }

      return 0;
    });
  }, [data, sortConfigs]);

  const addSort = useCallback((config: SortConfig<T>) => {
    setSortConfigs((prev) => {
      const existing = prev.findIndex((c) => c.key === config.key);
      if (existing >= 0) {
        const newConfigs = [...prev];
        newConfigs[existing] = config;
        return newConfigs;
      }
      return [...prev, config];
    });
  }, []);

  const removeSort = useCallback((key: keyof T) => {
    setSortConfigs((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const toggleSort = useCallback((key: keyof T) => {
    setSortConfigs((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (!existing) {
        return [...prev, { key, direction: 'asc' }];
      }
      if (existing.direction === 'asc') {
        return prev.map((c) =>
          c.key === key ? { ...c, direction: 'desc' as const } : c
        );
      }
      return prev.filter((c) => c.key !== key);
    });
  }, []);

  const clearSorts = useCallback(() => {
    setSortConfigs([]);
  }, []);

  return {
    sortedData,
    sortConfigs,
    addSort,
    removeSort,
    toggleSort,
    clearSorts,
  };
}

// Export default
export default useTableSort;
