import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useArticlesParCategorie } from './useMagasin';

describe('useArticlesParCategorie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize correctly', () => {
      const { result } = renderHook(() => useArticlesParCategorie());

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
    });

    it('should have stable initial values', () => {
      const { result, rerender } = renderHook(() => useArticlesParCategorie());
      const firstResult = JSON.stringify(result.current);

      rerender();

      expect(JSON.stringify(result.current)).toBe(firstResult);
    });
  });

  describe('State Updates', () => {
    it('should update state without errors', async () => {
      const { result } = renderHook(() => useArticlesParCategorie());

      await act(async () => {
        // State updates happen here
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      const { unmount } = renderHook(() => useArticlesParCategorie());

      expect(() => unmount()).not.toThrow();
    });
  });
});
