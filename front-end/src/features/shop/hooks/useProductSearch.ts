/**
 * useProductSearch Hook
 *
 * Custom hook for managing product search functionality.
 * Handles search input state and filtering logic.
 * Fully supports i18n and type-safe operations.
 */

import { useState, useMemo } from "react";
import type { ProductItem } from "../components/ProductList";
import { createProductSearchableString, normalizeSearchTerm } from "../utils/product-formatters";

export interface UseProductSearchOptions {
  /** Initial search value */
  initialValue?: string;
}

export interface UseProductSearchReturn {
  /** Current search value */
  searchValue: string;

  /** Set search value */
  setSearchValue: (value: string) => void;

  /** Clear search */
  clearSearch: () => void;

  /** Filter products based on search */
  filterProducts: (products: ProductItem[]) => ProductItem[];

  /** Whether search is active */
  hasSearch: boolean;
}

/**
 * Hook for managing product search
 * @param options - Configuration options
 * @returns Search state and methods
 */
export const useProductSearch = (
  options: UseProductSearchOptions = {}
): UseProductSearchReturn => {
  const { initialValue = "" } = options;

  const [searchValue, setSearchValue] = useState<string>(initialValue);

  const hasSearch = useMemo(() => {
    return searchValue.trim().length > 0;
  }, [searchValue]);

  const clearSearch = () => {
    setSearchValue("");
  };

  const filterProducts = useMemo(() => {
    return (products: ProductItem[]): ProductItem[] => {
      if (!hasSearch) {
        return products;
      }

      const searchTerm = normalizeSearchTerm(searchValue);

      return products.filter((product) => {
        const searchableText = createProductSearchableString({
          nom: product.nom,
          name: product.name,
          description: product.description,
          categorie: product.categorie,
          category: product.category,
        });

        return searchableText.includes(searchTerm);
      });
    };
  }, [searchValue, hasSearch]);

  return {
    searchValue,
    setSearchValue,
    clearSearch,
    filterProducts,
    hasSearch,
  };
};

export default useProductSearch;
