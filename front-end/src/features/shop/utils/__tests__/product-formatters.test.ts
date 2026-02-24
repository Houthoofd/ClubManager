/**
 * Product Formatters Tests
 *
 * Comprehensive test suite for product formatting utilities.
 * Tests cover all functions with realistic inputs and specific assertions.
 *
 * @see src/features/shop/utils/product-formatters.ts
 */

import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatStock,
  getStockStatus,
  getStockColor,
  formatCategory,
  normalizeSearchTerm,
  createProductSearchableString,
  truncateText,
  truncateDescription,
  formatProductName,
  isValidPrice,
  isValidStock,
  formatImageUrl,
  calculateDiscountPercentage,
  formatDiscount,
  sortProductsByPrice,
  sortProductsByName,
  filterProductsByCategory,
  filterProductsByStock,
  getUniqueCategories,
  formatSearchResultsMessage,
  calculateTotalStock,
  formatSizeOptions,
} from "../product-formatters";

describe("product-formatters", () => {
  // ============================================================================
  // Price Formatting
  // ============================================================================

  describe("formatPrice", () => {
    it("should format number price correctly", () => {
      expect(formatPrice(25.99)).toBe("25,99\u00a0€");
    });

    it("should format string price correctly", () => {
      expect(formatPrice("42.50")).toBe("42,50\u00a0€");
    });

    it("should format zero price", () => {
      expect(formatPrice(0)).toBe("0,00\u00a0€");
    });

    it("should handle large prices", () => {
      expect(formatPrice(1234567.89)).toBe("1\u202f234\u202f567,89\u00a0€");
    });

    it("should handle invalid string", () => {
      expect(formatPrice("invalid")).toBe("0,00 €");
    });

    it("should format prices with many decimals", () => {
      const result = formatPrice(19.999);
      expect(result).toContain("€");
    });
  });

  // ============================================================================
  // Stock Formatting
  // ============================================================================

  describe("formatStock", () => {
    it("should show out of stock for zero", () => {
      expect(formatStock(0)).toBe("Rupture de stock");
    });

    it("should show low stock warning", () => {
      expect(formatStock(3)).toBe("Stock faible (3)");
    });

    it("should show available stock", () => {
      expect(formatStock(10)).toBe("10 en stock");
    });

    it("should show stock for exactly 5 items", () => {
      expect(formatStock(5)).toBe("5 en stock");
    });

    it("should handle large quantities", () => {
      expect(formatStock(1000)).toBe("1000 en stock");
    });
  });

  describe("getStockStatus", () => {
    it("should return out for zero stock", () => {
      expect(getStockStatus(0)).toBe("out");
    });

    it("should return low for low stock", () => {
      expect(getStockStatus(3)).toBe("low");
    });

    it("should return available for good stock", () => {
      expect(getStockStatus(10)).toBe("available");
    });

    it("should return available for exactly 5 items", () => {
      expect(getStockStatus(5)).toBe("available");
    });
  });

  describe("getStockColor", () => {
    it("should return red for zero stock", () => {
      expect(getStockColor(0)).toBe("red");
    });

    it("should return orange for low stock", () => {
      expect(getStockColor(3)).toBe("orange");
    });

    it("should return green for good stock", () => {
      expect(getStockColor(10)).toBe("green");
    });
  });

  // ============================================================================
  // Category Formatting
  // ============================================================================

  describe("formatCategory", () => {
    it("should capitalize category", () => {
      expect(formatCategory("vêtements")).toBe("Vêtements");
    });

    it("should handle uppercase input", () => {
      expect(formatCategory("CHAUSSURES")).toBe("Chaussures");
    });

    it("should handle empty string", () => {
      expect(formatCategory("")).toBe("Non catégorisé");
    });

    it("should handle mixed case", () => {
      expect(formatCategory("AcCeSsOiReS")).toBe("Accessoires");
    });
  });

  // ============================================================================
  // Search Functions
  // ============================================================================

  describe("normalizeSearchTerm", () => {
    it("should lowercase and trim", () => {
      expect(normalizeSearchTerm("  HELLO World  ")).toBe("hello world");
    });

    it("should handle empty string", () => {
      expect(normalizeSearchTerm("")).toBe("");
    });

    it("should handle already normalized", () => {
      expect(normalizeSearchTerm("search")).toBe("search");
    });
  });

  describe("createProductSearchableString", () => {
    it("should combine product fields", () => {
      const product = {
        nom: "T-Shirt",
        description: "Cotton shirt",
        categorie: "Vêtements",
      };
      const result = createProductSearchableString(product);
      expect(result).toBe("t-shirt cotton shirt vêtements");
    });

    it("should handle name instead of nom", () => {
      const product = {
        name: "Shoes",
        description: "Running shoes",
        category: "Sports",
      };
      const result = createProductSearchableString(product);
      expect(result).toBe("shoes running shoes sports");
    });

    it("should handle missing fields", () => {
      const product = { nom: "Test" };
      const result = createProductSearchableString(product);
      expect(result).toContain("test");
    });

    it("should handle empty product", () => {
      const result = createProductSearchableString({});
      expect(result).toBe("  ");
    });
  });

  // ============================================================================
  // Text Truncation
  // ============================================================================

  describe("truncateText", () => {
    it("should not truncate short text", () => {
      expect(truncateText("Short text", 100)).toBe("Short text");
    });

    it("should truncate long text", () => {
      const longText = "a".repeat(150);
      const result = truncateText(longText, 100);
      expect(result).toHaveLength(103); // 100 + "..."
      expect(result.endsWith("...")).toBe(true);
    });

    it("should handle empty text", () => {
      expect(truncateText("", 100)).toBe("");
    });

    it("should use default length", () => {
      const longText = "a".repeat(150);
      const result = truncateText(longText);
      expect(result).toHaveLength(103);
    });
  });

  describe("truncateDescription", () => {
    it("should truncate with default 150 chars", () => {
      const longDesc = "a".repeat(200);
      const result = truncateDescription(longDesc);
      expect(result).toHaveLength(153);
    });

    it("should allow custom length", () => {
      const longDesc = "a".repeat(200);
      const result = truncateDescription(longDesc, 50);
      expect(result).toHaveLength(53);
    });
  });

  describe("formatProductName", () => {
    it("should return name as-is", () => {
      expect(formatProductName("Product Name")).toBe("Product Name");
    });

    it("should handle empty name", () => {
      expect(formatProductName("")).toBe("Sans nom");
    });
  });

  // ============================================================================
  // Validation
  // ============================================================================

  describe("isValidPrice", () => {
    it("should validate positive number", () => {
      expect(isValidPrice(25.99)).toBe(true);
    });

    it("should validate zero", () => {
      expect(isValidPrice(0)).toBe(true);
    });

    it("should validate string number", () => {
      expect(isValidPrice("42.50")).toBe(true);
    });

    it("should reject negative", () => {
      expect(isValidPrice(-10)).toBe(false);
    });

    it("should reject invalid string", () => {
      expect(isValidPrice("invalid")).toBe(false);
    });
  });

  describe("isValidStock", () => {
    it("should validate positive integer", () => {
      expect(isValidStock(10)).toBe(true);
    });

    it("should validate zero", () => {
      expect(isValidStock(0)).toBe(true);
    });

    it("should reject negative", () => {
      expect(isValidStock(-5)).toBe(false);
    });

    it("should reject decimal", () => {
      expect(isValidStock(5.5)).toBe(false);
    });
  });

  // ============================================================================
  // Image URL Formatting
  // ============================================================================

  describe("formatImageUrl", () => {
    it("should return empty for empty input", () => {
      expect(formatImageUrl("")).toBe("");
    });

    it("should preserve absolute HTTP URL", () => {
      expect(formatImageUrl("http://example.com/image.jpg")).toBe("http://example.com/image.jpg");
    });

    it("should preserve absolute HTTPS URL", () => {
      expect(formatImageUrl("https://example.com/image.jpg")).toBe("https://example.com/image.jpg");
    });

    it("should add leading slash to relative path", () => {
      expect(formatImageUrl("images/product.jpg")).toBe("/images/product.jpg");
    });

    it("should preserve existing leading slash", () => {
      expect(formatImageUrl("/images/product.jpg")).toBe("/images/product.jpg");
    });
  });

  // ============================================================================
  // Discount Calculations
  // ============================================================================

  describe("calculateDiscountPercentage", () => {
    it("should calculate correct percentage", () => {
      expect(calculateDiscountPercentage(100, 80)).toBe(20);
    });

    it("should round to nearest integer", () => {
      expect(calculateDiscountPercentage(100, 66.6)).toBe(33);
    });

    it("should return 0 for no discount", () => {
      expect(calculateDiscountPercentage(100, 100)).toBe(0);
    });

    it("should return 0 for zero original price", () => {
      expect(calculateDiscountPercentage(0, 50)).toBe(0);
    });

    it("should handle large discounts", () => {
      expect(calculateDiscountPercentage(200, 50)).toBe(75);
    });
  });

  describe("formatDiscount", () => {
    it("should format positive discount", () => {
      expect(formatDiscount(25)).toBe("-25%");
    });

    it("should return empty for zero", () => {
      expect(formatDiscount(0)).toBe("");
    });

    it("should return empty for negative", () => {
      expect(formatDiscount(-10)).toBe("");
    });
  });

  // ============================================================================
  // Sorting
  // ============================================================================

  describe("sortProductsByPrice", () => {
    const products = [
      { prix: 50, name: "A" },
      { prix: 20, name: "B" },
      { prix: 100, name: "C" },
    ];

    it("should sort ascending by default", () => {
      const sorted = sortProductsByPrice(products);
      expect(sorted[0].prix).toBe(20);
      expect(sorted[1].prix).toBe(50);
      expect(sorted[2].prix).toBe(100);
    });

    it("should sort descending", () => {
      const sorted = sortProductsByPrice(products, "desc");
      expect(sorted[0].prix).toBe(100);
      expect(sorted[1].prix).toBe(50);
      expect(sorted[2].prix).toBe(20);
    });

    it("should not mutate original array", () => {
      const original = [...products];
      sortProductsByPrice(products);
      expect(products).toEqual(original);
    });

    it("should handle price field instead of prix", () => {
      const prods = [{ price: 50 }, { price: 20 }];
      const sorted = sortProductsByPrice(prods);
      expect(sorted[0].price).toBe(20);
    });
  });

  describe("sortProductsByName", () => {
    const products = [{ nom: "Zebra" }, { nom: "Apple" }, { nom: "Banana" }];

    it("should sort alphabetically ascending", () => {
      const sorted = sortProductsByName(products);
      expect(sorted[0].nom).toBe("Apple");
      expect(sorted[1].nom).toBe("Banana");
      expect(sorted[2].nom).toBe("Zebra");
    });

    it("should sort descending", () => {
      const sorted = sortProductsByName(products, "desc");
      expect(sorted[0].nom).toBe("Zebra");
      expect(sorted[2].nom).toBe("Apple");
    });

    it("should handle name field instead of nom", () => {
      const prods = [{ name: "Zebra" }, { name: "Apple" }];
      const sorted = sortProductsByName(prods);
      expect(sorted[0].name).toBe("Apple");
    });
  });

  // ============================================================================
  // Filtering
  // ============================================================================

  describe("filterProductsByCategory", () => {
    const products = [
      { categorie: "Vêtements" },
      { categorie: "Chaussures" },
      { categorie: "Vêtements" },
    ];

    it("should filter by category", () => {
      const filtered = filterProductsByCategory(products, "Vêtements");
      expect(filtered).toHaveLength(2);
    });

    it("should return all for 'all'", () => {
      const filtered = filterProductsByCategory(products, "all");
      expect(filtered).toHaveLength(3);
    });

    it("should return all for empty string", () => {
      const filtered = filterProductsByCategory(products, "");
      expect(filtered).toHaveLength(3);
    });

    it("should be case insensitive", () => {
      const filtered = filterProductsByCategory(products, "VÊTEMENTS");
      expect(filtered).toHaveLength(2);
    });

    it("should handle category field instead of categorie", () => {
      const prods = [{ category: "Sports" }, { category: "Games" }];
      const filtered = filterProductsByCategory(prods, "Sports");
      expect(filtered).toHaveLength(1);
    });
  });

  describe("filterProductsByStock", () => {
    const products = [{ stock_total: 10 }, { stock_total: 0 }, { stock_total: 5 }];

    it("should return all when not filtering", () => {
      const filtered = filterProductsByStock(products, false);
      expect(filtered).toHaveLength(3);
    });

    it("should filter out zero stock", () => {
      const filtered = filterProductsByStock(products, true);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => (p.stock_total ?? 0) > 0)).toBe(true);
    });

    it("should handle stock field instead of stock_total", () => {
      const prods = [{ stock: 10 }, { stock: 0 }];
      const filtered = filterProductsByStock(prods, true);
      expect(filtered).toHaveLength(1);
    });
  });

  describe("getUniqueCategories", () => {
    it("should return unique sorted categories", () => {
      const products = [
        { categorie: "B" },
        { categorie: "A" },
        { categorie: "B" },
        { categorie: "C" },
      ];
      const result = getUniqueCategories(products);
      expect(result).toEqual(["A", "B", "C"]);
    });

    it("should handle category field", () => {
      const products = [{ category: "X" }, { category: "Y" }];
      const result = getUniqueCategories(products);
      expect(result).toEqual(["X", "Y"]);
    });

    it("should filter out empty categories", () => {
      const products = [{ categorie: "A" }, { categorie: "" }, { categorie: "B" }];
      const result = getUniqueCategories(products);
      expect(result).toEqual(["A", "B"]);
    });

    it("should handle empty array", () => {
      const result = getUniqueCategories([]);
      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // Search Results
  // ============================================================================

  describe("formatSearchResultsMessage", () => {
    it("should format singular result", () => {
      expect(formatSearchResultsMessage(1, 100)).toBe("1 produit trouvé sur 100");
    });

    it("should format plural results", () => {
      expect(formatSearchResultsMessage(5, 100)).toBe("5 produits trouvés sur 100");
    });

    it("should handle zero results", () => {
      expect(formatSearchResultsMessage(0, 100)).toBe("0 produit trouvé sur 100");
    });

    it("should handle all results", () => {
      expect(formatSearchResultsMessage(50, 50)).toBe("50 produits trouvés sur 50");
    });
  });

  // ============================================================================
  // Stock Calculations
  // ============================================================================

  describe("calculateTotalStock", () => {
    it("should sum all sizes", () => {
      const stock = { S: 5, M: 10, L: 3 };
      expect(calculateTotalStock(stock)).toBe(18);
    });

    it("should handle single size", () => {
      const stock = { M: 10 };
      expect(calculateTotalStock(stock)).toBe(10);
    });

    it("should handle empty object", () => {
      expect(calculateTotalStock({})).toBe(0);
    });

    it("should handle null input", () => {
      expect(calculateTotalStock(null as any)).toBe(0);
    });

    it("should handle zero quantities", () => {
      const stock = { S: 0, M: 0, L: 0 };
      expect(calculateTotalStock(stock)).toBe(0);
    });
  });

  // ============================================================================
  // Size Formatting
  // ============================================================================

  describe("formatSizeOptions", () => {
    it("should sort sizes in standard order", () => {
      const sizes = ["L", "S", "XL", "M"];
      const result = formatSizeOptions(sizes);
      expect(result).toEqual(["S", "M", "L", "XL"]);
    });

    it("should handle all standard sizes", () => {
      const sizes = ["XXL", "XS", "L", "M", "S", "XL"];
      const result = formatSizeOptions(sizes);
      expect(result).toEqual(["XS", "S", "M", "L", "XL", "XXL"]);
    });

    it("should handle lowercase", () => {
      const sizes = ["l", "s", "m"];
      const result = formatSizeOptions(sizes);
      expect(result[0].toUpperCase()).toBe("S");
    });

    it("should handle empty array", () => {
      expect(formatSizeOptions([])).toEqual([]);
    });

    it("should handle null input", () => {
      expect(formatSizeOptions(null as any)).toEqual([]);
    });

    it("should handle non-standard sizes alphabetically", () => {
      const sizes = ["36", "38", "40", "42"];
      const result = formatSizeOptions(sizes);
      expect(result).toEqual(["36", "38", "40", "42"]);
    });
  });
});
