/**
 * ProductSearch Component
 *
 * Search bar and filters for product catalog.
 * Atomic component with single responsibility: search & filter UI.
 * Fully internationalized with i18n support.
 */

import React from "react";
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

export interface ProductSearchProps {
  /** Current search value */
  value: string;

  /** Handler for search value changes */
  onChange: (value: string) => void;

  /** Handler for clearing search */
  onClear: () => void;

  /** Placeholder text for search input (overrides i18n default) */
  placeholder?: string;

  /** Number of filtered results */
  resultsCount?: number;

  /** Total number of items */
  totalCount?: number;

  /** Whether to show results info */
  showResultsInfo?: boolean;

  /** Category filter value */
  categoryFilter?: string;

  /** Handler for category filter changes */
  onCategoryChange?: (category: string) => void;

  /** Available categories */
  categories?: string[];

  /** Show in-stock only filter */
  showStockFilter?: boolean;

  /** In-stock only filter value */
  inStockOnly?: boolean;

  /** Handler for stock filter changes */
  onStockFilterChange?: (inStockOnly: boolean) => void;

  /** Additional CSS classes */
  className?: string;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  value,
  onChange,
  onClear,
  placeholder,
  resultsCount,
  totalCount,
  showResultsInfo = true,
  categoryFilter,
  onCategoryChange,
  categories = [],
  showStockFilter = false,
  inStockOnly = false,
  onStockFilterChange,
  className = "",
}) => {
  const { t } = useTranslation();
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);

  const handleChange = (_event: React.FormEvent<HTMLInputElement>, newValue: string) => {
    onChange(newValue);
  };

  const showInfo =
    showResultsInfo && value && resultsCount !== undefined && totalCount !== undefined;

  const defaultPlaceholder = t("shop.products.search") || "Rechercher un produit...";

  const handleCategorySelect = (
    _event: React.MouseEvent | React.ChangeEvent,
    selection: string
  ) => {
    if (onCategoryChange) {
      onCategoryChange(selection === "all" ? "" : selection);
    }
    setIsCategoryOpen(false);
  };

  return (
    <div className={className}>
      {/* Search Toolbar */}
      <Toolbar style={{ marginBottom: showInfo ? "0.5rem" : "1rem" }}>
        <ToolbarContent>
          {/* Search Input */}
          <ToolbarItem style={{ flexGrow: 1, minWidth: "300px" }}>
            <SearchInput
              placeholder={placeholder || defaultPlaceholder}
              value={value}
              onChange={handleChange}
              onClear={onClear}
              style={{ width: "100%" }}
              aria-label={t("common.actions.search")}
            />
          </ToolbarItem>

          {/* Category Filter */}
          {categories.length > 0 && onCategoryChange && (
            <ToolbarItem>
              <Select
                variant={SelectVariant.single}
                onToggle={() => setIsCategoryOpen(!isCategoryOpen)}
                onSelect={handleCategorySelect}
                selections={categoryFilter || "all"}
                isOpen={isCategoryOpen}
                placeholderText={t("shop.categories.all") || "Toutes catégories"}
              >
                <SelectOption key="all" value="all">
                  {t("shop.categories.all") || "Toutes catégories"}
                </SelectOption>
                {categories.map((category) => (
                  <SelectOption key={category} value={category}>
                    {category}
                  </SelectOption>
                ))}
              </Select>
            </ToolbarItem>
          )}

          {/* Stock Filter */}
          {showStockFilter && onStockFilterChange && (
            <ToolbarItem>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => onStockFilterChange(e.target.checked)}
                />
                <span>{t("shop.products.inStock") || "En stock uniquement"}</span>
              </label>
            </ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>

      {/* Results Info */}
      {showInfo && (
        <div style={{ marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
            {resultsCount} produit{resultsCount !== 1 ? "s" : ""} trouvé
            {resultsCount !== 1 ? "s" : ""} sur {totalCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
