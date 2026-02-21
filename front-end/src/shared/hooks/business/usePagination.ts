/**
 * ====================================================================
 * usePagination Hook
 * ====================================================================
 *
 * Hook for handling pagination logic in lists and tables.
 * Provides page navigation, page size control, and current page data.
 *
 * Usage:
 * ```tsx
 * const { currentData, currentPage, totalPages, nextPage, prevPage } =
 *   usePagination(users, { itemsPerPage: 20 });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UsePaginationOptions {
  /** Number of items per page (default: 10) */
  itemsPerPage?: number;
  /** Initial page number (1-based, default: 1) */
  initialPage?: number;
}

export interface UsePaginationReturn<T> {
  /** Current page data slice */
  currentData: T[];
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  itemsPerPage: number;
  /** Start index of current page (0-based) */
  startIndex: number;
  /** End index of current page (0-based, exclusive) */
  endIndex: number;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to specific page (1-based) */
  goToPage: (page: number) => void;
  /** Go to first page */
  goToFirstPage: () => void;
  /** Go to last page */
  goToLastPage: () => void;
  /** Set items per page (resets to page 1) */
  setItemsPerPage: (count: number) => void;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
  /** Whether current page is first page */
  isFirstPage: boolean;
  /** Whether current page is last page */
  isLastPage: boolean;
  /** Page numbers array for pagination UI */
  pageNumbers: number[];
  /** Reset pagination to initial state */
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for pagination logic
 *
 * @param data - Array of items to paginate
 * @param options - Pagination options
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * function UsersList() {
 *   const [users, setUsers] = useState<User[]>([]);
 *
 *   const {
 *     currentData,
 *     currentPage,
 *     totalPages,
 *     nextPage,
 *     prevPage,
 *     goToPage,
 *     hasNextPage,
 *     hasPrevPage,
 *   } = usePagination(users, { itemsPerPage: 20 });
 *
 *   return (
 *     <>
 *       <UserTable users={currentData} />
 *       <Pagination
 *         page={currentPage}
 *         total={totalPages}
 *         onNext={nextPage}
 *         onPrev={prevPage}
 *         onPageClick={goToPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    itemsPerPage: initialItemsPerPage = 10,
    initialPage = 1,
  } = options;

  // State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  // Computed values
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Ensure current page is within bounds
  const validCurrentPage = useMemo(() => {
    return Math.max(1, Math.min(currentPage, totalPages));
  }, [currentPage, totalPages]);

  // Calculate indices
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Current page data
  const currentData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Page navigation
  const goToPage = useCallback(
    (page: number) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNumber);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(validCurrentPage + 1);
  }, [validCurrentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(validCurrentPage - 1);
  }, [validCurrentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  const setItemsPerPage = useCallback((count: number) => {
    setItemsPerPageState(count);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setItemsPerPageState(initialItemsPerPage);
  }, [initialPage, initialItemsPerPage]);

  // Page status
  const hasNextPage = validCurrentPage < totalPages;
  const hasPrevPage = validCurrentPage > 1;
  const isFirstPage = validCurrentPage === 1;
  const isLastPage = validCurrentPage === totalPages;

  // Generate page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return {
    currentData,
    currentPage: validCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    nextPage,
    prevPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    pageNumbers,
    reset,
  };
}

// ============================================================================
// Utility: Generate page range for pagination UI
// ============================================================================

/**
 * Generate page numbers with ellipsis for large page counts
 *
 * @param currentPage - Current active page
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show
 * @returns Array of page numbers or 'ellipsis' markers
 *
 * @example
 * ```tsx
 * const pages = getPaginationRange(5, 20, 7);
 * // Returns: [1, '...', 4, 5, 6, '...', 20]
 * ```
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor((maxVisible - 2) / 2);

  // Always show first page
  pages.push(1);

  if (currentPage <= halfVisible + 2) {
    // Near start
    for (let i = 2; i <= maxVisible - 2; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - halfVisible - 1) {
    // Near end
    pages.push('ellipsis');
    for (let i = totalPages - maxVisible + 3; i < totalPages; i++) {
      pages.push(i);
    }
    pages.push(totalPages);
  } else {
    // Middle
    pages.push('ellipsis');
    for (let i = currentPage - halfVisible; i <= currentPage + halfVisible; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
    pages.push(totalPages);
  }

  return pages;
}

// Export default
export default usePagination;
