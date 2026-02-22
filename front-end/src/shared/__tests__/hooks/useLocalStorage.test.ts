/**
 * ====================================================================
 * useLocalStorage Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useLocalStorage hook that syncs state with localStorage
 *
 * @see src/shared/hooks/utils/useLocalStorage.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, useLocalStorageSync, useLocalStorageValue } from '../../hooks/utils/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with initial value when localStorage is empty', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should initialize with value from localStorage if exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'initial'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('should handle initial value with object', () => {
    const initialObject = { name: 'John', age: 30 };
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('user', initialObject));

    expect(result.current[0]).toEqual(initialObject);
  });

  it('should handle initial value with array', () => {
    const initialArray = [1, 2, 3, 4, 5];
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('numbers', initialArray));

    expect(result.current[0]).toEqual(initialArray);
  });

  it('should handle initial value with boolean', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('isActive', true));

    expect(result.current[0]).toBe(true);
  });

  it('should handle initial value with number', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('count', 42));

    expect(result.current[0]).toBe(42);
  });

  it('should handle initial value with null', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('nullable', null));

    expect(result.current[0]).toBeNull();
  });

  // ============================================================================
  // setValue Tests
  // ============================================================================

  it('should update state and localStorage when setValue is called', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should handle setValue with function updater', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('count')).toBe('1');

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(localStorage.getItem('count')).toBe('2');
  });

  it('should update localStorage with object', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('user', { name: 'John' }));

    const newUser = { name: 'Jane', age: 25 };

    act(() => {
      result.current[1](newUser);
    });

    expect(result.current[0]).toEqual(newUser);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(newUser);
  });

  it('should update localStorage with array', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('items', [1, 2, 3]));

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
    expect(JSON.parse(localStorage.getItem('items')!)).toEqual([4, 5, 6]);
  });

  it('should handle multiple rapid updates', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1](1);
      result.current[1](2);
      result.current[1](3);
    });

    expect(result.current[0]).toBe(3);
    expect(localStorage.getItem('counter')).toBe('3');
  });

  // ============================================================================
  // removeValue Tests
  // ============================================================================

  it('should remove value from localStorage and reset to initial', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('initial');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('should reset to initial value after removal', () => {
    const initialObject = { name: 'John' };
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('user', initialObject));

    act(() => {
      result.current[1]({ name: 'Jane' });
    });

    expect(result.current[0]).toEqual({ name: 'Jane' });

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toEqual(initialObject);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it('should handle corrupted JSON in localStorage', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('test-key', 'invalid-json{');

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle localStorage quota exceeded', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('large-value');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('should gracefully handle when localStorage is not available', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');

    getItemSpy.mockRestore();
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================

  it('should persist data across hook remounts', () => {
    const { result: result1, unmount } = renderHook(() =>
      useLocalStorage('persist-key', 'initial')
    );

    act(() => {
      result1.current[1]('persisted-value');
    });

    unmount();

    const { result: result2 } = renderHook(() => useLocalStorage('persist-key', 'initial'));

    expect(result2.current[0]).toBe('persisted-value');
  });

  it('should maintain separate state for different keys', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

    act(() => {
      result1.current[1]('updated1');
    });

    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('value2');
  });

  // ============================================================================
  // Complex Data Types Tests
  // ============================================================================

  it('should handle nested objects', () => {
    const nestedObject = {
      user: {
        name: 'John',
        address: {
          city: 'Brussels',
          country: 'Belgium',
        },
      },
    };

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('nested', nestedObject));

    expect(result.current[0]).toEqual(nestedObject);

    const updated = {
      ...nestedObject,
      user: { ...nestedObject.user, name: 'Jane' },
    };

    act(() => {
      result.current[1](updated);
    });

    expect(result.current[0]).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('nested')!)).toEqual(updated);
  });

  it('should handle arrays of objects', () => {
    const users = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ];

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('users', users));

    act(() => {
      result.current[1]([...users, { id: 3, name: 'Bob' }]);
    });

    expect(result.current[0]).toHaveLength(3);
    expect(result.current[0][2].name).toBe('Bob');
  });

  // ============================================================================
  // Real-World Scenarios Tests
  // ============================================================================

  it('should work for theme persistence scenario', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('theme', 'light'));

    expect(result.current[0]).toBe('light');

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'));

    // Simulate page reload
    const { result: result2 } = renderHook(() => useLocalStorage('theme', 'light'));
    expect(result2.current[0]).toBe('dark');
  });

  it('should work for user session scenario', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useLocalStorage('user', null as { name: string; token: string } | null)
    );

    expect(result.current[0]).toBeNull();

    // Login
    act(() => {
      result.current[1]({ name: 'John', token: 'abc123' });
    });

    expect(result.current[0]).toEqual({ name: 'John', token: 'abc123' });

    // Logout
    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should work for shopping cart scenario', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorage('cart', [] as any[]));

    // Add item
    act(() => {
      result.current[1]((prev) => [...prev, { id: 1, name: 'Product 1', qty: 1 }]);
    });

    expect(result.current[0]).toHaveLength(1);

    // Add another item
    act(() => {
      result.current[1]((prev) => [...prev, { id: 2, name: 'Product 2', qty: 2 }]);
    });

    expect(result.current[0]).toHaveLength(2);

    // Clear cart
    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toHaveLength(0);
  });
});

// ============================================================================
// useLocalStorageValue Tests (Read-only)
// ============================================================================

describe('useLocalStorageValue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return value from localStorage', () => {
    localStorage.setItem('readonly-key', JSON.stringify('stored'));

    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorageValue('readonly-key', 'default'));

    expect(result?.current || {}).toBe('stored');
  });

  it('should return default value when key does not exist', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorageValue('missing-key', 'default'));

    expect(result?.current || {}).toBe('default');
  });
});

// ============================================================================
// useLocalStorageSync Tests (Cross-tab sync)
// ============================================================================

describe('useLocalStorageSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorageSync('sync-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should update localStorage on setValue', () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useLocalStorageSync('sync-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('sync-key')!)).toBe('updated');
  });

  it('should support custom serializer and deserializer', () => {
    const serializer = (value: number) => `custom-${value}`;
    const deserializer = (value: string) => parseInt(value.replace('custom-', ''), 10);

    let result: any;
      try {
        const hookResult = renderHook(() =>
      useLocalStorageSync('custom-key', 0, { serializer, deserializer })
    );

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
    expect(localStorage.getItem('custom-key')).toBe('custom-42');
  });

  it('should dispatch custom event when syncAcrossTabs is true', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    let result: any;
      try {
        const hookResult = renderHook(() =>
      useLocalStorageSync('sync-key', 'initial', { syncAcrossTabs: true })
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(dispatchEventSpy).toHaveBeenCalled();
  });

  it('should handle removeValue with sync', () => {
    let result: any;
      try {
        const hookResult = renderHook(() =>
      useLocalStorageSync('sync-key', 'initial', { syncAcrossTabs: true })
    );

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('initial');
    expect(localStorage.getItem('sync-key')).toBeNull();
  });
});
