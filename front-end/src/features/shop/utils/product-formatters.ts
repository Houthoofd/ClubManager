/**
 * Product Formatters
 *
 * Utility functions for formatting product-related data.
 * Pure functions with single responsibility.
 * Supports i18n for price formatting and localized strings.
 */

/**
 * Formats price for display in EUR
 * @param price - Price amount
 * @returns Formatted price string (e.g., "25,99 €")
 */
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(numPrice);
};

/**
 * Formats stock quantity for display
 * @param quantity - Stock quantity
 * @returns Formatted stock string
 */
export const formatStock = (quantity: number): string => {
  if (quantity === 0) {
    return "Rupture de stock";
  }
  if (quantity < 5) {
    return `Stock faible (${quantity})`;
  }
  return `${quantity} en stock`;
};

/**
 * Gets stock status
 * @param quantity - Stock quantity
 * @returns Stock status code
 */
export const getStockStatus = (quantity: number): "out" | "low" | "available" => {
  if (quantity === 0) return "out";
  if (quantity < 5) return "low";
  return "available";
};

/**
 * Gets stock color for badges
 * @param quantity - Stock quantity
 * @returns PatternFly color name
 */
export const getStockColor = (
  quantity: number
): "red" | "orange" | "green" => {
  if (quantity === 0) return "red";
  if (quantity < 5) return "orange";
  return "green";
};

/**
 * Formats category name for display
 * @param category - Category code or name
 * @returns Formatted category name
 */
export const formatCategory = (category: string): string => {
  if (!category) return "Non catégorisé";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

/**
 * Normalizes search term for matching
 * @param searchValue - Raw search input
 * @returns Normalized lowercase trimmed search term
 */
export const normalizeSearchTerm = (searchValue: string): string => {
  return searchValue.toLowerCase().trim();
};

/**
 * Creates a searchable string from product data
 * @param product - Product object with searchable fields
 * @returns Concatenated searchable string
 */
export const createProductSearchableString = (product: {
  nom?: string;
  name?: string;
  description?: string;
  categorie?: string;
  category?: string;
}): string => {
  const parts = [
    product.nom || product.name || "",
    product.description || "",
    product.categorie || product.category || "",
  ];
  return parts.join(" ").toLowerCase();
};

/**
 * Truncates text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return "";
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Truncates product description
 * @param description - Product description
 * @param maxLength - Maximum length
 * @returns Truncated description
 */
export const truncateDescription = (
  description: string,
  maxLength: number = 150
): string => {
  return truncateText(description, maxLength);
};

/**
 * Formats product name
 * @param name - Product name
 * @returns Formatted product name
 */
export const formatProductName = (name: string): string => {
  if (!name) return "Sans nom";
  return name;
};

/**
 * Validates price format
 * @param price - Price string or number
 * @returns True if valid price
 */
export const isValidPrice = (price: string | number): boolean => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Validates stock quantity
 * @param quantity - Stock quantity
 * @returns True if valid quantity
 */
export const isValidStock = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity >= 0;
};

/**
 * Formats image URL
 * @param url - Image URL or path
 * @returns Formatted URL
 */
export const formatImageUrl = (url: string): string => {
  if (!url) return "";

  // If already absolute URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If relative path, prepend base URL
  return url.startsWith("/") ? url : `/${url}`;
};

/**
 * Calculates discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountedPrice: number
): number => {
  if (originalPrice <= 0) return 0;
  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Formats discount for display
 * @param percentage - Discount percentage
 * @returns Formatted discount string
 */
export const formatDiscount = (percentage: number): string => {
  if (percentage <= 0) return "";
  return `-${percentage}%`;
};

/**
 * Sorts products by price
 * @param products - Array of products
 * @param order - Sort order ('asc' | 'desc')
 * @returns Sorted products
 */
export const sortProductsByPrice = <T extends { prix?: number; price?: number }>(
  products: T[],
  order: "asc" | "desc" = "asc"
): T[] => {
  return [...products].sort((a, b) => {
    const priceA = a.prix ?? a.price ?? 0;
    const priceB = b.prix ?? b.price ?? 0;
    return order === "asc" ? priceA - priceB : priceB - priceA;
  });
};

/**
 * Sorts products by name
 * @param products - Array of products
 * @param order - Sort order ('asc' | 'desc')
 * @returns Sorted products
 */
export const sortProductsByName = <T extends { nom?: string; name?: string }>(
  products: T[],
  order: "asc" | "desc" = "asc"
): T[] => {
  return [...products].sort((a, b) => {
    const nameA = (a.nom || a.name || "").toLowerCase();
    const nameB = (b.nom || b.name || "").toLowerCase();
    return order === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });
};

/**
 * Filters products by category
 * @param products - Array of products
 * @param category - Category to filter by
 * @returns Filtered products
 */
export const filterProductsByCategory = <
  T extends { categorie?: string; category?: string }
>(
  products: T[],
  category: string
): T[] => {
  if (!category || category === "all") {
    return products;
  }

  return products.filter(
    (p) =>
      (p.categorie || p.category || "").toLowerCase() ===
      category.toLowerCase()
  );
};

/**
 * Filters products by stock availability
 * @param products - Array of products
 * @param inStockOnly - Whether to show only in-stock products
 * @returns Filtered products
 */
export const filterProductsByStock = <
  T extends { stock_total?: number; stock?: number }
>(
  products: T[],
  inStockOnly: boolean = false
): T[] => {
  if (!inStockOnly) {
    return products;
  }

  return products.filter((p) => {
    const stock = p.stock_total ?? p.stock ?? 0;
    return stock > 0;
  });
};

/**
 * Gets unique categories from products
 * @param products - Array of products
 * @returns Array of unique category names
 */
export const getUniqueCategories = <
  T extends { categorie?: string; category?: string }
>(
  products: T[]
): string[] => {
  const categories = products
    .map((p) => p.categorie || p.category || "")
    .filter(Boolean);

  return Array.from(new Set(categories)).sort();
};

/**
 * Formats search results message
 * @param count - Number of items found
 * @param total - Total number of items
 * @returns Formatted message string
 */
export const formatSearchResultsMessage = (
  count: number,
  total: number
): string => {
  const plural = count > 1 ? "s" : "";
  const foundPlural = count > 1 ? "s" : "";
  return `${count} produit${plural} trouvé${foundPlural} sur ${total}`;
};

/**
 * Calculates total stock across all sizes
 * @param stockBySizes - Object with size -> quantity mapping
 * @returns Total stock quantity
 */
export const calculateTotalStock = (
  stockBySizes: Record<string, number>
): number => {
  if (!stockBySizes) return 0;
  return Object.values(stockBySizes).reduce((sum, qty) => sum + qty, 0);
};

/**
 * Formats size options for display
 * @param sizes - Array of size codes
 * @returns Formatted size options
 */
export const formatSizeOptions = (sizes: string[]): string[] => {
  if (!sizes || sizes.length === 0) return [];

  // Common size ordering
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];

  return sizes.sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.toUpperCase());
    const indexB = sizeOrder.indexOf(b.toUpperCase());

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    return a.localeCompare(b);
  });
};
