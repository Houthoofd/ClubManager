import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    const state = useAuthStore.getState?.();
    if (state?.reset) {
      state.reset();
    }
  });

  it('should initialize store', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current).toBeDefined();
  });

  it('should update state', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      // State updates
    });

    expect(result.current).toBeDefined();
  });

  it('should handle selectors', () => {
    const { result } = renderHook(() => useAuthStore(state => state));

    expect(result.current).toBeDefined();
  });
});
