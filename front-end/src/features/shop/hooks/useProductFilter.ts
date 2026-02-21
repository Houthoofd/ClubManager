/**
 * useProductFilter Hook
 *
 * Custom hook for managing advanced product filtering.
 * Handles category, price range, stock, and other filters.
 * Fully supports i18n and type-safe operations.
 */

import { useState, useMemo, useCallback } from "react";
import type { ProductItem } from "../components/ProductList";
import {
  filterProductsByCategory,
  filterProductsByStock,
  getUniqueCategories,
} from "../utils/product-formatters";

export interface ProductFilterState {
  /** Selected category (empty string = all) */
  category: string;

  /** Minimum price filter */
  minPrice?: number;

  /** Maximum price filter */
  maxPrice?: number;

  /** Show only in-stock products */
  inStockOnly: boolean;

  /** Sort order */
  sortBy: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "none";
}

export interface UseProductFilterOptions {
  /** Initial filter state */
  initialFilters?: Partial<ProductFilterState>;
}

export interface UseProductFilterReturn {
  /** Current filter state */
  filters: ProductFilterState;

  /** Set category filter */
  setCategory: (category: string) => void;

  /** Set price range filter */
  setPriceRange: (min?: number, max?: number) => void;

  /** Set in-stock only filter */
  setInStockOnly: (inStockOnly: boolean) => void;

  /** Set sort order */
  setSortBy: (sortBy: ProductFilterState["sortBy"]) => void;

  /** Clear all filters */
  clearFilters: () => void;

  /** Apply filters to product list */
  applyFilters: (products: ProductItem[]) => ProductItem[];

  /** Get available categories from products */
  getCategories: (products: ProductItem[]) => string[];

  /** Whether any filter is active */
  hasActiveFilters: boolean;

  /** Count of active filters */
  activeFilterCount: number;
}

const DEFAULT_FILTERS: ProductFilterState = {
  category: "",
  minPrice: undefined,
  maxPrice: undefined,
  inStockOnly: false,
  sortBy: "none",
};

/**
 * Hook for managing advanced product filtering
 * @param options - Configuration options
 * @returns Filter state and methods
 */
export const useProductFilter = (
  options: UseProductFilterOptions = {}
): UseProductFilterReturn => {
  const { initialFilters = {} } = options;

  const [filters, setFilters] = useState<ProductFilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const setCategory = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const setPriceRange = useCallback((min?: number, max?: number) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  }, []);

  const setInStockOnly = useCallback((inStockOnly: boolean) => {
    setFilters((prev) => ({ ...prev, inStockOnly }));
  }, []);

  const setSortBy = useCallback((sortBy: ProductFilterState["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const getCategories = useCallback((products: ProductItem[]): string[] => {
    return getUniqueCategories(products);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== "" ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.inStockOnly ||
      filters.sortBy !== "none"
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.inStockOnly) count++;
    if (filters.sortBy !== "none") count++;
    return count;
  }, [filters]);

  const applyFilters = useMemo(() => {
    return (products: ProductItem[]): ProductItem[] => {
      let filtered = [...products];

      // Filter by category
      if (filters.category) {
        filtered = filterProductsByCategory(filtered, filters.category);
      }

      // Filter by stock
      if (filters.inStockOnly) {
        filtered = filterProductsByStock(filtered, true);
      }

      // Filter by price range
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        filtered = filtered.filter((product) => {
          const price = product.prix ?? product.price ?? 0;
          const min = filters.minPrice ?? 0;
          const max = filters.maxPrice ?? Infinity;
          return price >= min && price <= max;
        });
      }

      // Apply sorting (handled by ProductList component)
      // We just return the filtered list here

      return filtered;
    };
  }, [filters]);

  return {
    filters,
    setCategory,
    setPriceRange,
    setInStockOnly,
    setSortBy,
    clearFilters,
    applyFilters,
    getCategories,
    hasActiveFilters,
    activeFilterCount,
  };
};

export default useProductFilter;
