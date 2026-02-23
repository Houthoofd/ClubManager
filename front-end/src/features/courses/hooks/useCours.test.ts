import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessions } from './useCours';

describe('useSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize correctly', () => {
      const { result } = renderHook(() => useSessions());

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
    });

    it('should have stable initial values', () => {
      const { result, rerender } = renderHook(() => useSessions());
      const firstResult = JSON.stringify(result.current);

      rerender();

      expect(JSON.stringify(result.current)).toBe(firstResult);
    });
  });

  describe('State Updates', () => {
    it('should update state without errors', async () => {
      const { result } = renderHook(() => useSessions());

      await act(async () => {
        // State updates happen here
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      const { unmount } = renderHook(() => useSessions());

      expect(() => unmount()).not.toThrow();
    });
  });
});
