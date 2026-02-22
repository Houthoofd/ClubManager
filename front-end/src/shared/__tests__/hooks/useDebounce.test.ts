/**
 * ====================================================================
 * useDebounce Hook - Unit Tests
 * ====================================================================
 *
 * Tests for the useDebounce hook that delays value updates
 *
 * @see src/shared/hooks/utils/useDebounce.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useDebouncedValue, useDebouncedCallback } from '../../hooks/utils/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ============================================================================
  // Basic Functionality Tests
  // ============================================================================

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not update immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'v1' },
      }
    );

    // Rapid changes
    rerender({ value: 'v2' });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: 'v3' });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: 'v4' });
    act(() => vi.advanceTimersByTime(200));

    // Still showing initial value (no timeout completed)
    expect(result.current).toBe('v1');

    // Complete the timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should show last value
    expect(result.current).toBe('v4');
  });

  it('should use custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    // After 500ms (less than delay)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // After 1000ms (full delay)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 0 },
      }
    );

    rerender({ value: 42 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(42);
  });

  it('should handle boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: false },
      }
    );

    rerender({ value: true });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(true);
  });

  it('should handle object values', () => {
    const initialObj = { name: 'John' };
    const updatedObj = { name: 'Jane' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: initialObj },
      }
    );

    rerender({ value: updatedObj });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toEqual(updatedObj);
  });

  it('should handle array values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: [1, 2, 3] },
      }
    );

    rerender({ value: [4, 5, 6] });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toEqual([4, 5, 6]);
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it('should handle empty string', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: '' });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('');
  });

  it('should handle null values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'initial' as string | null },
      }
    );

    rerender({ value: null });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeNull();
  });

  it('should handle undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'initial' as string | undefined },
      }
    );

    rerender({ value: undefined });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeUndefined();
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

// ============================================================================
// useDebouncedValue Tests (Advanced)
// ============================================================================

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return debounced value and control functions', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500));

    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.cancel).toBe('function');
    expect(typeof result.current.flush).toBe('function');
  });

  it('should set isPending to true during debounce', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    );

    expect(result.current.isPending).toBe(false);

    rerender({ value: 'updated' });

    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should support leading edge update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500, { leading: true }),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    // Should update immediately with leading: true
    expect(result.current.debouncedValue).toBe('updated');
  });

  it('should support flush function', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    // Before flush
    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isPending).toBe(true);

    // Flush immediately
    act(() => {
      result.current.flush();
    });

    expect(result.current.debouncedValue).toBe('updated');
    expect(result.current.isPending).toBe(false);
  });

  it('should support cancel function', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    expect(result.current.isPending).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.debouncedValue).toBe('initial'); // Not updated
  });

  it('should support maxWait option', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500, { maxWait: 1000 }),
      {
        initialProps: { value: 'v1' },
      }
    );

    // Rapid updates
    rerender({ value: 'v2' });
    act(() => vi.advanceTimersByTime(400));

    rerender({ value: 'v3' });
    act(() => vi.advanceTimersByTime(400));

    rerender({ value: 'v4' });
    act(() => vi.advanceTimersByTime(400));

    // After 1200ms total, maxWait should force update
    expect(result.current.debouncedValue).toBe('v4');
  });
});

// ============================================================================
// useDebouncedCallback Tests
// ============================================================================

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    // Call multiple times rapidly
    act(() => {
      result.current('call1');
      result.current('call2');
      result.current('call3');
    });

    // Callback should not be called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should be called only once with last args
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call3');
  });

  it('should handle callback with multiple arguments', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('arg1', 'arg2', 'arg3');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('test');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });

  it('should cancel previous timeout on new call', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Call again before timeout
    act(() => {
      result.current('second');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should only call with latest args
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });
});

// ============================================================================
// Real-World Use Case Tests
// ============================================================================

describe('useDebounce - Real-world scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should work for search input scenario', () => {
    const searchAPI = vi.fn();

    const { result, rerender } = renderHook(
      ({ searchTerm }) => {
        const debouncedSearch = useDebounce(searchTerm, 300);
        return { debouncedSearch };
      },
      {
        initialProps: { searchTerm: '' },
      }
    );

    // User types rapidly
    rerender({ searchTerm: 'r' });
    rerender({ searchTerm: 're' });
    rerender({ searchTerm: 'rea' });
    rerender({ searchTerm: 'reac' });
    rerender({ searchTerm: 'react' });

    // No debounced value yet
    expect(result.current.debouncedSearch).toBe('');

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now we can call API with debounced value
    if (result.current.debouncedSearch) {
      searchAPI(result.current.debouncedSearch);
    }

    expect(searchAPI).toHaveBeenCalledWith('react');
    expect(searchAPI).toHaveBeenCalledTimes(1); // Only called once!
  });

  it('should work for window resize scenario', () => {
    const handleResize = vi.fn();

    const { result } = renderHook(() => {
      return useDebouncedCallback(handleResize, 200);
    });

    // Simulate multiple resize events
    act(() => {
      result.current({ width: 1024, height: 768 });
      result.current({ width: 1025, height: 768 });
      result.current({ width: 1026, height: 768 });
      result.current({ width: 1027, height: 768 });
    });

    // Handler not called yet
    expect(handleResize).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Handler called once with final dimensions
    expect(handleResize).toHaveBeenCalledTimes(1);
    expect(handleResize).toHaveBeenCalledWith({ width: 1027, height: 768 });
  });
});
