/**
 * Template for Zustand store tests
 */

export function generateStoreTest(analysis, importPath) {
  const { name, exports } = analysis;
  const storeName = exports.default || exports.named[0] || name;
  const hookName = storeName.startsWith('use') ? storeName : `use${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`;

  return `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ${storeName} } from '${importPath}';

describe('${storeName}', () => {
  // Reset store before each test
  beforeEach(() => {
    // TODO: Reset store state to initial values
    // ${storeName}.getState().reset?.();
  });

  afterEach(() => {
    // Clean up any side effects
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => ${storeName}());

      expect(result.current).toBeDefined();
      // TODO: Add assertions for initial state
      // expect(result.current.someState).toBe(initialValue);
    });

    it('should have all expected properties', () => {
      const { result } = renderHook(() => ${storeName}());

      // TODO: Verify all state properties exist
      // expect(result.current).toHaveProperty('someState');
      // expect(result.current).toHaveProperty('someAction');
    });

    it('should have all expected actions', () => {
      const { result } = renderHook(() => ${storeName}());

      // TODO: Verify all actions are functions
      // expect(typeof result.current.someAction).toBe('function');
    });
  });

  describe('State Updates', () => {
    it('should update state correctly', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Call action to update state
        // result.current.setSomeState(newValue);
      });

      // TODO: Verify state was updated
      // expect(result.current.someState).toBe(newValue);
    });

    it('should handle multiple state updates', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Perform multiple updates
        // result.current.setSomeState(value1);
        // result.current.setAnotherState(value2);
      });

      // TODO: Verify all states were updated
      // expect(result.current.someState).toBe(value1);
      // expect(result.current.anotherState).toBe(value2);
    });

    it('should batch updates efficiently', () => {
      const { result } = renderHook(() => ${storeName}());
      let renderCount = 0;

      const { rerender } = renderHook(() => {
        renderCount++;
        return ${storeName}();
      });

      const initialCount = renderCount;

      act(() => {
        // TODO: Perform multiple updates in same action
        // result.current.batchUpdate({ state1: value1, state2: value2 });
      });

      // Should only trigger one re-render for batched updates
      // expect(renderCount).toBe(initialCount + 1);
    });
  });

  describe('Selectors', () => {
    it('should select specific state slice', () => {
      const { result } = renderHook(() => ${storeName}((state) => state.someProperty));

      expect(result.current).toBeDefined();
      // TODO: Verify selector returns correct value
    });

    it('should only re-render when selected state changes', () => {
      let renderCount = 0;

      const { result, rerender } = renderHook(() => {
        renderCount++;
        return ${storeName}((state) => state.selectedProperty);
      });

      const initialCount = renderCount;

      act(() => {
        // Update different property (should not trigger re-render)
        // ${storeName}.getState().setOtherProperty(newValue);
      });

      // expect(renderCount).toBe(initialCount);

      act(() => {
        // Update selected property (should trigger re-render)
        // ${storeName}.getState().setSelectedProperty(newValue);
      });

      // expect(renderCount).toBe(initialCount + 1);
    });

    it('should handle computed/derived state', () => {
      const { result } = renderHook(() =>
        ${storeName}((state) => ({
          // TODO: Compute derived state
          // computed: state.value1 + state.value2
        }))
      );

      // TODO: Verify computed value
      // expect(result.current.computed).toBe(expectedValue);
    });
  });

  describe('Actions', () => {
    it('should execute action correctly', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Execute action
        // result.current.someAction(params);
      });

      // TODO: Verify action effects
      // expect(result.current.someState).toBe(expectedValue);
    });

    it('should handle async actions', async () => {
      const { result } = renderHook(() => ${storeName}());

      await act(async () => {
        // TODO: Execute async action
        // await result.current.fetchData();
      });

      // TODO: Verify async action results
      // expect(result.current.data).toBeDefined();
    });

    it('should handle action errors gracefully', async () => {
      const { result } = renderHook(() => ${storeName}());

      await act(async () => {
        // TODO: Execute action that might fail
        // await result.current.actionThatFails();
      });

      // TODO: Verify error handling
      // expect(result.current.error).toBeDefined();
    });

    it('should support action chaining', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Chain multiple actions
        // result.current.action1().action2().action3();
      });

      // TODO: Verify final state
    });
  });

  describe('Persistence', () => {
    it('should persist state to storage', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Update state that should be persisted
        // result.current.setSomeState(newValue);
      });

      // TODO: Verify state was saved to localStorage/sessionStorage
      // const stored = localStorage.getItem('store-key');
      // expect(stored).toBeDefined();
      // expect(JSON.parse(stored).someState).toBe(newValue);
    });

    it('should hydrate state from storage on init', () => {
      // TODO: Set up persisted state in storage
      // localStorage.setItem('store-key', JSON.stringify({ someState: persistedValue }));

      const { result } = renderHook(() => ${storeName}());

      // TODO: Verify state was hydrated
      // expect(result.current.someState).toBe(persistedValue);
    });

    it('should handle storage errors gracefully', () => {
      // Mock storage error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => ${storeName}());

      expect(() => {
        act(() => {
          // TODO: Trigger state update that tries to persist
          // result.current.setSomeState(newValue);
        });
      }).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should clear persisted state', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Clear/reset store
        // result.current.reset();
      });

      // TODO: Verify storage was cleared
      // expect(localStorage.getItem('store-key')).toBeNull();
    });
  });

  describe('Middleware', () => {
    it('should apply middleware correctly', () => {
      // TODO: Test middleware behavior (e.g., devtools, persist, immer)
      const { result } = renderHook(() => ${storeName}());

      expect(result.current).toBeDefined();
    });

    it('should work with immer middleware if used', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Test immer-style mutations
        // result.current.updateNested((draft) => {
        //   draft.nested.value = newValue;
        // });
      });

      // TODO: Verify nested update
      // expect(result.current.nested.value).toBe(newValue);
    });
  });

  describe('Reset/Clear', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => ${storeName}());

      // Modify state
      act(() => {
        // TODO: Change state
        // result.current.setSomeState(modifiedValue);
      });

      // Reset
      act(() => {
        // TODO: Reset store
        // result.current.reset();
      });

      // TODO: Verify state is back to initial
      // expect(result.current.someState).toBe(initialValue);
    });

    it('should clear specific state slice', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Clear specific state
        // result.current.clearSpecificState();
      });

      // TODO: Verify only specific state was cleared
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on state change', () => {
      const subscriber = vi.fn();

      // TODO: Subscribe to store changes
      // const unsubscribe = ${storeName}.subscribe(subscriber);

      act(() => {
        // TODO: Change state
        // ${storeName}.getState().setSomeState(newValue);
      });

      // expect(subscriber).toHaveBeenCalled();
      // unsubscribe();
    });

    it('should allow unsubscribe', () => {
      const subscriber = vi.fn();

      // TODO: Subscribe and unsubscribe
      // const unsubscribe = ${storeName}.subscribe(subscriber);
      // unsubscribe();

      act(() => {
        // TODO: Change state
        // ${storeName}.getState().setSomeState(newValue);
      });

      // Should not be called after unsubscribe
      // expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Store Instances', () => {
    it('should maintain separate state across components', () => {
      const { result: result1 } = renderHook(() => ${storeName}());
      const { result: result2 } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Modify state in first instance
        // result1.current.setSomeState(value1);
      });

      // Both should reflect same global state (Zustand is global by default)
      // expect(result1.current.someState).toBe(result2.current.someState);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent updates', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Trigger multiple concurrent updates
        // Promise.all([
        //   result.current.asyncAction1(),
        //   result.current.asyncAction2(),
        // ]);
      });

      // TODO: Verify state consistency
    });

    it('should handle invalid state values', () => {
      const { result } = renderHook(() => ${storeName}());

      expect(() => {
        act(() => {
          // TODO: Try to set invalid state
          // result.current.setSomeState(invalidValue);
        });
      }).not.toThrow();
    });

    it('should handle deeply nested state updates', () => {
      const { result } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Update deeply nested property
        // result.current.updateDeepNested(path, value);
      });

      // TODO: Verify nested update worked
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;

      const { rerender } = renderHook(() => {
        renderCount++;
        return ${storeName}();
      });

      const initialCount = renderCount;

      // Rerender without state change
      rerender();

      // Should not cause re-render
      // expect(renderCount).toBe(initialCount);
    });

    it('should handle large state efficiently', () => {
      const largeState = {
        // TODO: Create large state object
        items: Array.from({ length: 10000 }, (_, i) => ({ id: i }))
      };

      const { result } = renderHook(() => ${storeName}());

      const startTime = performance.now();
      act(() => {
        // TODO: Update with large state
        // result.current.setLargeState(largeState);
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types', () => {
      const { result } = renderHook(() => ${storeName}());

      // TODO: Verify types are inferred correctly
      expect(result.current).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should work with other stores', () => {
      // TODO: Test interaction with other Zustand stores if applicable
      const { result } = renderHook(() => ${storeName}());

      expect(result.current).toBeDefined();
    });

    it('should integrate with React lifecycle', () => {
      const { result, unmount } = renderHook(() => ${storeName}());

      act(() => {
        // TODO: Perform actions
        // result.current.someAction();
      });

      unmount();

      // Store should persist after unmount (global state)
      // const state = ${storeName}.getState();
      // expect(state.someState).toBeDefined();
    });
  });
});
`;
}

export default generateStoreTest;
