/**
 * ProductList Component
 *
 * Renders a list of product cards in grid or list layout.
 * Atomic component with single responsibility: display product list.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Gallery, Title, Divider } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { ProductCard } from "../ProductCard";
import { EmptyProductState } from "../EmptyProductState";
import {
  sortProductsByPrice,
  sortProductsByName,
  filterProductsByCategory,
  filterProductsByStock,
} from "../../utils/product-formatters";

export interface ProductItem {
  id: string | number;
  nom?: string;
  name?: string;
  description?: string;
  prix?: number;
  price?: number;
  categorie?: string;
  category?: string;
  images?: string[];
  stock_total?: number;
  stock?: number;
  tailles?: string[];
  sizes?: string[];
}

export interface ProductListProps {
  /** Array of products to display */
  products: ProductItem[];

  /** Layout mode: grid or list */
  layout?: "grid" | "list";

  /** Whether this is a filtered/searched list */
  isFiltered?: boolean;

  /** Click handler for product cards */
  onProductClick?: (productId: string | number) => void;

  /** Add to cart handler */
  onAddToCart?: (productId: string | number) => void;

  /** Custom actions for each product card */
  renderActions?: (product: ProductItem) => React.ReactNode;

  /** Custom empty state component */
  emptyState?: React.ReactNode;

  /** Loading state */
  isLoading?: boolean;

  /** Sort order */
  sortBy?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "none";

  /** Filter by category */
  categoryFilter?: string;

  /** Show only in-stock products */
  inStockOnly?: boolean;

  /** Whether to show add to cart buttons */
  showAddToCart?: boolean;

  /** Compact card mode */
  compactCards?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  layout = "grid",
  isFiltered = false,
  onProductClick,
  onAddToCart,
  renderActions,
  emptyState,
  isLoading = false,
  sortBy = "none",
  categoryFilter,
  inStockOnly = false,
  showAddToCart = true,
  compactCards = false,
  className = "",
}) => {
  const { t } = useTranslation();

  // Show loading state
  if (isLoading) {
    return null; // Parent should handle loading spinner
  }

  // Apply filters
  let filteredProducts = [...products];

  // Filter by category
  if (categoryFilter) {
    filteredProducts = filterProductsByCategory(filteredProducts, categoryFilter);
  }

  // Filter by stock
  if (inStockOnly) {
    filteredProducts = filterProductsByStock(filteredProducts, true);
  }

  // Apply sorting
  if (sortBy === "price-asc") {
    filteredProducts = sortProductsByPrice(filteredProducts, "asc");
  } else if (sortBy === "price-desc") {
    filteredProducts = sortProductsByPrice(filteredProducts, "desc");
  } else if (sortBy === "name-asc") {
    filteredProducts = sortProductsByName(filteredProducts, "asc");
  } else if (sortBy === "name-desc") {
    filteredProducts = sortProductsByName(filteredProducts, "desc");
  }

  // Show empty state if no products
  if (filteredProducts.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return <EmptyProductState isSearchResult={isFiltered} />;
  }

  // Render grid layout
  if (layout === "grid") {
    return (
      <div className={`product-list product-list--grid ${className}`}>
        <Gallery
          hasGutter
          minWidths={{
            default: "100%",
            sm: "300px",
            md: "300px",
            lg: "300px",
            xl: "300px",
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.nom || product.name || ""}
              description={product.description}
              price={product.prix || product.price || 0}
              category={product.categorie || product.category}
              images={product.images}
              stock={product.stock_total || product.stock || 0}
              sizes={product.tailles || product.sizes || []}
              onClick={onProductClick}
              onAddToCart={onAddToCart}
              actions={renderActions ? renderActions(product) : undefined}
              showAddToCart={showAddToCart}
              compact={compactCards}
            />
          ))}
        </Gallery>
      </div>
    );
  }

  // Render list layout
  return (
    <div className={`product-list product-list--list ${className}`}>
      {filteredProducts.map((product, index) => (
        <div key={product.id}>
          {index > 0 && <Divider style={{ marginTop: "1rem", marginBottom: "1rem" }} />}
          <ProductCard
            id={product.id}
            name={product.nom || product.name || ""}
            description={product.description}
            price={product.prix || product.price || 0}
            category={product.categorie || product.category}
            images={product.images}
            stock={product.stock_total || product.stock || 0}
            sizes={product.tailles || product.sizes || []}
            onClick={onProductClick}
            onAddToCart={onAddToCart}
            actions={renderActions ? renderActions(product) : undefined}
            showAddToCart={showAddToCart}
            compact={compactCards}
          />
        </div>
      ))}
    </div>
  );
};

export default ProductList;
