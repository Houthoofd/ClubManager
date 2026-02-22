/**
 * ====================================================================
 * useProductSearch Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useProductSearch hook that handles product search functionality
 *
 * @see src/features/shop/hooks/useProductSearch.ts
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductSearch } from '../../hooks/useProductSearch';
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
];

describe('useProductSearch', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with empty search value', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    expect(result?.current?.searchValue).toBe('');
    expect(result?.current?.hasSearch).toBe(false);
  });

  it('should initialize with custom initial value', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useProductSearch({ initialValue: 'Kimono' })
    );

    expect(result?.current?.searchValue).toBe('Kimono');
    expect(result?.current?.hasSearch).toBe(true);
  });

  it('should return all products when search is empty', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered).toHaveLength(mockProducts.length);
    expect(filtered).toEqual(mockProducts);
  });

  // ============================================================================
  // Search Functionality Tests
  // ============================================================================

  it('should filter products by name (French)', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].nom).toBe('Kimono Blanc');
    expect(result?.current?.hasSearch).toBe(true);
  });

  it('should filter products by name (English)', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Belt');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Black Belt');
  });

  it('should filter products by description', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('combat');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].description).toContain('combat');
  });

  it('should filter products by category', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Protection');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.categorie === 'Protection')).toBe(true);
  });

  it('should be case-insensitive', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('KIMONO');
    });

    const filteredUpper = result.current.filterProducts(mockProducts);

    act(() => {
      result.current.setSearchValue('kimono');
    });

    const filteredLower = result.current.filterProducts(mockProducts);

    act(() => {
      result.current.setSearchValue('KiMoNo');
    });

    const filteredMixed = result.current.filterProducts(mockProducts);

    expect(filteredUpper).toHaveLength(1);
    expect(filteredLower).toHaveLength(1);
    expect(filteredMixed).toHaveLength(1);
  });

  it('should handle partial matches', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Protè');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.some((p) => p.nom.includes('Protège') || p.name.includes('Protection'))
    ).toBe(true);
  });

  it('should return empty array when no matches found', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('NonExistentProduct');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered).toHaveLength(0);
  });

  // ============================================================================
  // Clear Search Tests
  // ============================================================================

  it('should clear search value', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    expect(result?.current?.searchValue).toBe('Kimono');
    expect(result?.current?.hasSearch).toBe(true);

    act(() => {
      result.current.clearSearch();
    });

    expect(result?.current?.searchValue).toBe('');
    expect(result?.current?.hasSearch).toBe(false);
  });

  it('should return all products after clearing search', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    let filtered = result.current.filterProducts(mockProducts);
    expect(filtered).toHaveLength(1);

    act(() => {
      result.current.clearSearch();
    });

    filtered = result.current.filterProducts(mockProducts);
    expect(filtered).toHaveLength(mockProducts.length);
  });

  // ============================================================================
  // hasSearch Flag Tests
  // ============================================================================

  it('should set hasSearch to true when search has value', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    expect(result?.current?.hasSearch).toBe(false);

    act(() => {
      result.current.setSearchValue('test');
    });

    expect(result?.current?.hasSearch).toBe(true);
  });

  it('should set hasSearch to false for whitespace-only search', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('   ');
    });

    expect(result?.current?.hasSearch).toBe(false);
  });

  it('should handle single character search', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('K');
    });

    expect(result?.current?.hasSearch).toBe(true);
    const filtered = result.current.filterProducts(mockProducts);
    expect(filtered.length).toBeGreaterThan(0);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle empty product array', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    const filtered = result.current.filterProducts([]);

    expect(filtered).toEqual([]);
  });

  it('should handle products with missing fields', () => {
    const incompleteProducts: ProductItem[] = [
      {
        id: 1,
        nom: 'Product 1',
        prix: 10,
        stock: 5,
        is_active: true,
      } as ProductItem,
    ];

    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Product');
    });

    const filtered = result.current.filterProducts(incompleteProducts);

    expect(filtered).toHaveLength(1);
  });

  it('should handle special characters in search', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Protège-tibias');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should handle accented characters', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('ceinture');
    });

    const filtered = result.current.filterProducts(mockProducts);

    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should handle numbers in search', () => {
    const productsWithNumbers: ProductItem[] = [
      {
        id: 1,
        nom: 'Kimono T-1000',
        name: 'Kimono T-1000',
        prix: 99.99,
        price: 99.99,
        stock: 10,
        is_active: true,
      } as ProductItem,
    ];

    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('1000');
    });

    const filtered = result.current.filterProducts(productsWithNumbers);

    expect(filtered).toHaveLength(1);
  });

  // ============================================================================
  // Multiple Rapid Updates Tests
  // ============================================================================

  it('should handle rapid search updates', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('K');
    });
    act(() => {
      result.current.setSearchValue('Ki');
    });
    act(() => {
      result.current.setSearchValue('Kim');
    });
    act(() => {
      result.current.setSearchValue('Kimo');
    });
    act(() => {
      result.current.setSearchValue('Kimono');
    });

    expect(result?.current?.searchValue).toBe('Kimono');
    const filtered = result.current.filterProducts(mockProducts);
    expect(filtered).toHaveLength(1);
  });

  it('should handle search value updates', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    let filtered = result.current.filterProducts(mockProducts);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].nom).toBe('Kimono Blanc');

    act(() => {
      result.current.setSearchValue('Ceinture');
    });

    filtered = result.current.filterProducts(mockProducts);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].nom).toBe('Ceinture Noire');
  });

  // ============================================================================
  // Performance / Memoization Tests
  // ============================================================================

  it('should memoize filter function', () => {
    const { result, rerender } = renderHook(() => useProductSearch());

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    const firstFilter = result.current.filterProducts;

    // Re-render without changing search value
    rerender();

    const secondFilter = result.current.filterProducts;

    // Function reference should be the same (memoized)
    expect(firstFilter).toBe(secondFilter);
  });

  it('should update filter function when search changes', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    const initialFilter = result.current.filterProducts;

    act(() => {
      result.current.setSearchValue('Kimono');
    });

    const updatedFilter = result.current.filterProducts;

    // Function reference should change when search changes
    expect(initialFilter).not.toBe(updatedFilter);
  });

  // ============================================================================
  // Real-World Scenarios Tests
  // ============================================================================

  it('should work with realistic user typing scenario', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    // User types "Prot" letter by letter
    act(() => {
      result.current.setSearchValue('P');
    });
    let filtered = result.current.filterProducts(mockProducts);
    expect(filtered.length).toBeGreaterThan(0);

    act(() => {
      result.current.setSearchValue('Pr');
    });
    filtered = result.current.filterProducts(mockProducts);
    expect(filtered.length).toBeGreaterThan(0);

    act(() => {
      result.current.setSearchValue('Pro');
    });
    filtered = result.current.filterProducts(mockProducts);
    expect(filtered.length).toBeGreaterThan(0);

    act(() => {
      result.current.setSearchValue('Prot');
    });
    filtered = result.current.filterProducts(mockProducts);
    expect(filtered.length).toBe(2); // "Gants de Protection" and "Protège-tibias"
  });

  it('should work with combined filters scenario', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useProductSearch());

    // Search for "Protection" category products
    act(() => {
      result.current.setSearchValue('Protection');
    });

    const filtered = result.current.filterProducts(mockProducts);

    // Should find both protection items
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.categorie === 'Protection')).toBe(true);
  });
});
