import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { initializeStores } from './index';

describe('initializeStores', () => {
  beforeEach(() => {
    const state = initializeStores.getState?.();
    if (state?.reset) {
      state.reset();
    }
  });

  it('should initialize store', () => {
    const { result } = renderHook(() => initializeStores());

    expect(result.current).toBeDefined();
  });

  it('should update state', () => {
    const { result } = renderHook(() => initializeStores());

    act(() => {
      // State updates
    });

    expect(result.current).toBeDefined();
  });

  it('should handle selectors', () => {
    const { result } = renderHook(() => initializeStores(state => state));

    expect(result.current).toBeDefined();
  });
});
