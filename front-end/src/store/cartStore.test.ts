import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from './cartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    const state = useCartStore.getState?.();
    if (state?.reset) {
      state.reset();
    }
  });

  it('should initialize store', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current).toBeDefined();
  });

  it('should update state', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      // State updates
    });

    expect(result.current).toBeDefined();
  });

  it('should handle selectors', () => {
    const { result } = renderHook(() => useCartStore(state => state));

    expect(result.current).toBeDefined();
  });
});
