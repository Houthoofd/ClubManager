/**
 * ====================================================================
 * useProductFilter Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useProductFilter hook that handles product filtering
 *
 * @see src/features/shop/hooks/useProductFilter.ts
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductFilter } from '../../hooks/useProductFilter';
import type { ProductItem } from '../../components/ProductList';

/**
 * Mock product data for testing
 */
const mockProducts: ProductItem[] = [
  {
    id: 1,
    nom: 'Kimono Blanc',
    name: 'White Kimono',
    description: 'Kimono traditionnel en coton',
    prix: 89.99,
    price: 89.99,
    stock: 15,
    categorie: 'Vêtements',
    category: 'Clothing',
    image_url: 'https://example.com/kimono.jpg',
    is_active: true,
  },
  {
    id: 2,
    nom: 'Ceinture Noire',
    name: 'Black Belt',
    description: 'Ceinture noire pour expert',
    prix: 25.50,
    price: 25.50,
    stock: 30,
    categorie: 'Accessoires',
    category: 'Accessories',
    image_url: 'https://example.com/belt.jpg',
    is_active: true,
  },
  {
    id: 3,
    nom: 'Gants de Protection',
    name: 'Protection Gloves',
    description: 'Gants renforcés pour combat',
    prix: 45.00,
    price: 45.00,
    stock: 8,
    categorie: 'Protection',
    category: 'Protection',
    image_url: 'https://example.com/gloves.jpg',
    is_active: true,
  },
  {
    id: 4,
    nom: 'Protège-tibias',
    name: 'Shin Guards',
    description: 'Protection pour les tibias',
    prix: 35.99,
    price: 35.99,
    stock: 0,
    categorie: 'Protection',
    category: 'Protection',
    image_url: 'https://example.com/shinguards.jpg',
    is_active: false,
  },
  {
    id: 5,
    nom: 'Kimono Bleu',
    name: 'Blue Kimono',
    description: 'Kimono pour débutant',
    prix: 65.00,
    price: 65.00,
    stock: 20,
    categorie: 'Vêtements',
    category: 'Clothing',
    image_url: 'https://example.com/kimono-blue.jpg',
    is_active: true,
  },
  {
    id: 6,
    nom: 'Sac de Sport',
    name: 'Sports Bag',
    description: 'Grand sac pour équipement',
    prix: 55.00,
    price: 55.00,
    stock: 0,
    categorie: 'Accessoires',
    category: 'Accessories',
    image_url: 'https://example.com/bag.jpg',
    is_active: true,
  },
];

describe('useProductFilter', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with default filters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    expect(result?.current?.filters).toEqual({
      category: '',
      minPrice: undefined,
      maxPrice: undefined,
      inStockOnly: false,
      sortBy: 'none',
    });
    expect(result?.current?.hasActiveFilters).toBe(false);
    expect(result?.current?.activeFilterCount).toBe(0);
  });

  it('should initialize with custom initial filters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useProductFilter({
        initialFilters: {
          category: 'Vêtements',
          inStockOnly: true,
          sortBy: 'price-asc',
        },
      })
    );

    expect(result.current.filters.category).toBe('Vêtements');
    expect(result.current.filters.inStockOnly).toBe(true);
    expect(result.current.filters.sortBy).toBe('price-asc');
    expect(result?.current?.hasActiveFilters).toBe(true);
  });

  it('should return all products when no filters active', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered).toHaveLength(mockProducts.length);
  });

  // ============================================================================
  // Category Filter Tests
  // ============================================================================

  it('should filter products by category', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Vêtements');
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.categorie === 'Vêtements')).toBe(true);
    expect(result?.current?.hasActiveFilters).toBe(true);
    expect(result?.current?.activeFilterCount).toBe(1);
  });

  it('should return all products when category is empty string', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Vêtements');
    });

    let filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(2);

    act(() => {
      result.current.setCategory('');
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(mockProducts.length);
  });

  it('should filter Protection category', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Protection');
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.categorie === 'Protection')).toBe(true);
  });

  it('should filter Accessoires category', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Accessoires');
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.categorie === 'Accessoires')).toBe(true);
  });

  // ============================================================================
  // Price Range Filter Tests
  // ============================================================================

  it('should filter products by minimum price', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(50, undefined);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.every((p) => (p.prix ?? p.price ?? 0) >= 50)).toBe(true);
    expect(result?.current?.hasActiveFilters).toBe(true);
    expect(result?.current?.activeFilterCount).toBe(1);
  });

  it('should filter products by maximum price', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(undefined, 40);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.every((p) => (p.prix ?? p.price ?? 0) <= 40)).toBe(true);
  });

  it('should filter products by price range (min and max)', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(30, 70);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(
      filtered.every((p) => {
        const price = p.prix ?? p.price ?? 0;
        return price >= 30 && price <= 70;
      })
    ).toBe(true);
    expect(filtered).toHaveLength(4); // Ceinture(25.50), Gants(45), Protège(35.99), Kimono Bleu(65), Sac(55)
  });

  it('should clear price range when both undefined', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(30, 70);
    });

    let filtered = result.current.applyFilters(mockProducts);
    expect(filtered.length).toBeLessThan(mockProducts.length);

    act(() => {
      result.current.setPriceRange(undefined, undefined);
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(mockProducts.length);
  });

  it('should handle edge case: min price equals product price', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(45.00, undefined);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.some((p) => p.prix === 45.00)).toBe(true);
  });

  it('should handle edge case: max price equals product price', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(undefined, 45.00);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.some((p) => p.prix === 45.00)).toBe(true);
  });

  // ============================================================================
  // Stock Filter Tests
  // ============================================================================

  it('should filter only in-stock products', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setInStockOnly(true);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.every((p) => p.stock > 0)).toBe(true);
    expect(result?.current?.hasActiveFilters).toBe(true);
    expect(result?.current?.activeFilterCount).toBe(1);
  });

  it('should include out-of-stock when inStockOnly is false', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setInStockOnly(false);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.some((p) => p.stock === 0)).toBe(true);
  });

  it('should toggle inStockOnly filter', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setInStockOnly(true);
    });

    let filtered = result.current.applyFilters(mockProducts);
    expect(filtered.every((p) => p.stock > 0)).toBe(true);

    act(() => {
      result.current.setInStockOnly(false);
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered.some((p) => p.stock === 0)).toBe(true);
  });

  // ============================================================================
  // Sort By Tests
  // ============================================================================

  it('should set sort by price ascending', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setSortBy('price-asc');
    });

    expect(result.current.filters.sortBy).toBe('price-asc');
    expect(result?.current?.hasActiveFilters).toBe(true);
    expect(result?.current?.activeFilterCount).toBe(1);
  });

  it('should set sort by price descending', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setSortBy('price-desc');
    });

    expect(result.current.filters.sortBy).toBe('price-desc');
  });

  it('should set sort by name ascending', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setSortBy('name-asc');
    });

    expect(result.current.filters.sortBy).toBe('name-asc');
  });

  it('should set sort by name descending', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setSortBy('name-desc');
    });

    expect(result.current.filters.sortBy).toBe('name-desc');
  });

  it('should set sort to none', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setSortBy('price-asc');
    });

    expect(result?.current?.hasActiveFilters).toBe(true);

    act(() => {
      result.current.setSortBy('none');
    });

    expect(result.current.filters.sortBy).toBe('none');
    expect(result?.current?.hasActiveFilters).toBe(false);
  });

  // ============================================================================
  // Combined Filters Tests
  // ============================================================================

  it('should apply multiple filters together', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Vêtements');
      result.current.setPriceRange(60, 100);
      result.current.setInStockOnly(true);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.every((p) => p.categorie === 'Vêtements')).toBe(true);
    expect(filtered.every((p) => (p.prix ?? 0) >= 60 && (p.prix ?? 0) <= 100)).toBe(true);
    expect(filtered.every((p) => p.stock > 0)).toBe(true);
    expect(result?.current?.activeFilterCount).toBe(3);
  });

  it('should apply category and stock filters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Protection');
      result.current.setInStockOnly(true);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered).toHaveLength(1); // Only "Gants de Protection" (in stock)
    expect(filtered[0].nom).toBe('Gants de Protection');
    expect(result?.current?.activeFilterCount).toBe(2);
  });

  it('should apply price range and stock filters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(40, 90);
      result.current.setInStockOnly(true);
    });

    const filtered = result.current.applyFilters(mockProducts);

    expect(filtered.every((p) => p.stock > 0)).toBe(true);
    expect(
      filtered.every((p) => {
        const price = p.prix ?? p.price ?? 0;
        return price >= 40 && price <= 90;
      })
    ).toBe(true);
  });

  // ============================================================================
  // Clear Filters Tests
  // ============================================================================

  it('should clear all filters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Vêtements');
      result.current.setPriceRange(30, 70);
      result.current.setInStockOnly(true);
      result.current.setSortBy('price-asc');
    });

    expect(result?.current?.hasActiveFilters).toBe(true);
    expect(result?.current?.activeFilterCount).toBe(4);

    act(() => {
      result.current.clearFilters();
    });

    expect(result?.current?.filters).toEqual({
      category: '',
      minPrice: undefined,
      maxPrice: undefined,
      inStockOnly: false,
      sortBy: 'none',
    });
    expect(result?.current?.hasActiveFilters).toBe(false);
    expect(result?.current?.activeFilterCount).toBe(0);
  });

  it('should return all products after clearing filters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Vêtements');
      result.current.setInStockOnly(true);
    });

    let filtered = result.current.applyFilters(mockProducts);
    expect(filtered.length).toBeLessThan(mockProducts.length);

    act(() => {
      result.current.clearFilters();
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(mockProducts.length);
  });

  // ============================================================================
  // Get Categories Tests
  // ============================================================================

  it('should extract unique categories from products', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    const categories = result.current.getCategories(mockProducts);

    expect(categories).toContain('Vêtements');
    expect(categories).toContain('Accessoires');
    expect(categories).toContain('Protection');
    expect(categories.length).toBe(3);
  });

  it('should return empty array for empty products', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    const categories = result.current.getCategories([]);

    expect(categories).toEqual([]);
  });

  // ============================================================================
  // Active Filters Count Tests
  // ============================================================================

  it('should count active filters correctly', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    expect(result?.current?.activeFilterCount).toBe(0);

    act(() => {
      result.current.setCategory('Vêtements');
    });
    expect(result?.current?.activeFilterCount).toBe(1);

    act(() => {
      result.current.setPriceRange(30, 70);
    });
    expect(result?.current?.activeFilterCount).toBe(2);

    act(() => {
      result.current.setInStockOnly(true);
    });
    expect(result?.current?.activeFilterCount).toBe(3);

    act(() => {
      result.current.setSortBy('price-asc');
    });
    expect(result?.current?.activeFilterCount).toBe(4);
  });

  it('should count price range as one filter', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(30, 70);
    });

    expect(result?.current?.activeFilterCount).toBe(1);
  });

  it('should not count minPrice alone if both undefined', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(undefined, undefined);
    });

    expect(result?.current?.activeFilterCount).toBe(0);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle empty product array', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setCategory('Vêtements');
    });

    const filtered = result.current.applyFilters([]);

    expect(filtered).toEqual([]);
  });

  it('should handle products with missing price fields', () => {
    const productsNoPrix: ProductItem[] = [
      {
        id: 1,
        nom: 'Product',
        stock: 10,
        is_active: true,
      } as ProductItem,
    ];

    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    act(() => {
      result.current.setPriceRange(10, 50);
    });

    const filtered = result.current.applyFilters(productsNoPrix);

    expect(filtered).toHaveLength(1); // Price defaults to 0, which is < 10
  });

  it('should not mutate original products array', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());
    const originalLength = mockProducts.length;

    act(() => {
      result.current.setCategory('Vêtements');
    });

    result.current.applyFilters(mockProducts);

    expect(mockProducts).toHaveLength(originalLength);
  });

  // ============================================================================
  // Real-World Scenarios Tests
  // ============================================================================

  it('should handle realistic e-commerce filtering scenario', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    // Step 1: User selects category
    act(() => {
      result.current.setCategory('Vêtements');
    });

    let filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(2);

    // Step 2: User sets price range
    act(() => {
      result.current.setPriceRange(60, 100);
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(2); // Kimono Blanc (89.99), Kimono Bleu (65)

    // Step 3: User enables in-stock only
    act(() => {
      result.current.setInStockOnly(true);
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(2);

    // Step 4: User clears all
    act(() => {
      result.current.clearFilters();
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(mockProducts.length);
  });

  it('should handle progressive price narrowing', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductFilter());

    // Start with wide range
    act(() => {
      result.current.setPriceRange(0, 100);
    });

    let filtered = result.current.applyFilters(mockProducts);
    const initialCount = filtered.length;

    // Narrow down
    act(() => {
      result.current.setPriceRange(30, 60);
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered.length).toBeLessThan(initialCount);

    // Further narrow
    act(() => {
      result.current.setPriceRange(40, 50);
    });

    filtered = result.current.applyFilters(mockProducts);
    expect(filtered).toHaveLength(1); // Only Gants (45)
  });
});
