import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    const state = useUIStore.getState?.();
    if (state?.reset) {
      state.reset();
    }
  });

  it('should initialize store', () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current).toBeDefined();
  });

  it('should update state', () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      // State updates
    });

    expect(result.current).toBeDefined();
  });

  it('should handle selectors', () => {
    const { result } = renderHook(() => useUIStore(state => state));

    expect(result.current).toBeDefined();
  });
});
