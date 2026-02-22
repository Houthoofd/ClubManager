/**
 * Template for React Context Provider tests
 */

import { generateMockValue } from "../analyzer.js";

export function generateContextTest(analysis, importPath) {
  const { name, exports, functionParams, reactHooks } = analysis;
  const contextName = exports.default || exports.named[0] || name;

  // Detect provider and hook names
  const providerName = exports.named.find(n => n.includes('Provider')) || `${contextName}Provider`;
  const hookName = exports.named.find(n => n.startsWith('use')) || `use${contextName.replace('Context', '')}`;

  const usesReducer = reactHooks.includes('useReducer');
  const usesState = reactHooks.includes('useState');

  return `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import { ${[...new Set([contextName, providerName, hookName].filter(Boolean))].join(', ')} } from '${importPath}';

/**
 * Tests for ${contextName}
 *
 * Components:
 * - Provider: ${providerName}
 * - Hook: ${hookName}
 *
 * State Management:
 * ${usesReducer ? '- Uses useReducer for complex state' : ''}
 * ${usesState ? '- Uses useState for simple state' : ''}
 */
describe('${contextName}', () => {
  describe('Context Definition', () => {
    it('should be defined and exported', () => {
      expect(${contextName}).toBeDefined();
    });

    it('should export provider component', () => {
      expect(${providerName}).toBeDefined();
      expect(typeof ${providerName}).toBe('function');
    });

    it('should export consumer hook', () => {
      expect(${hookName}).toBeDefined();
      expect(typeof ${hookName}).toBe('function');
    });
  });

  describe('${providerName}', () => {
    it('should render children without crashing', () => {
      const { container } = render(
        <${providerName}>
          <div>Test Child</div>
        </${providerName}>
      );

      expect(container.textContent).toContain('Test Child');
    });

    it('should render multiple children', () => {
      const { container } = render(
        <${providerName}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </${providerName}>
      );

      expect(container.textContent).toContain('Child 1');
      expect(container.textContent).toContain('Child 2');
      expect(container.textContent).toContain('Child 3');
    });

    it('should accept initial values via props', () => {
      const initialValue = {
        // TODO: Define initial context value
      };

      expect(() => {
        render(
          <${providerName} value={initialValue}>
            <div>Child</div>
          </${providerName}>
        );
      }).not.toThrow();
    });

    it('should handle nested providers', () => {
      const { container } = render(
        <${providerName}>
          <${providerName}>
            <div>Nested Child</div>
          </${providerName}>
        </${providerName}>
      );

      expect(container.textContent).toContain('Nested Child');
    });
  });

  describe('${hookName}', () => {
    const wrapper = ({ children }) => (
      <${providerName}>{children}</${providerName}>
    );

    it('should return context value when used within provider', () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => ${hookName}());
      }).toThrow();

      consoleSpy.mockRestore();
    });

    it('should provide default context values', () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Verify default values
      expect(result.current).toBeDefined();
      // expect(result.current.state).toBeDefined();
      // expect(result.current.actions).toBeDefined();
    });

    it('should expose all expected properties', () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Verify context API surface
      // expect(result.current).toHaveProperty('loading');
      // expect(result.current).toHaveProperty('error');
      // expect(result.current).toHaveProperty('data');
      // expect(result.current).toHaveProperty('actions');
    });
  });

  describe('State Management', () => {
    const wrapper = ({ children }) => (
      <${providerName}>{children}</${providerName}>
    );

    it('should initialize with default state', () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Verify initial state
      expect(result.current).toBeDefined();
      ${usesReducer ? `
      // Context uses reducer - verify initial reducer state
      // expect(result.current.state).toMatchObject({
      //   loading: false,
      //   error: null,
      //   data: null,
      // });` : ''}
      ${usesState ? `
      // Context uses useState - verify initial state values
      // expect(result.current.someState).toBe(initialValue);` : ''}
    });

    it('should update state via actions', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Call action to update state
        // result.current.actions.updateState(newValue);
        // or result.current.dispatch({ type: 'UPDATE', payload: newValue });
      });

      await waitFor(() => {
        // TODO: Verify state was updated
        // expect(result.current.state.value).toBe(newValue);
      });
    });

    it('should handle multiple state updates', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Perform multiple updates
        // result.current.actions.update1(value1);
        // result.current.actions.update2(value2);
        // result.current.actions.update3(value3);
      });

      await waitFor(() => {
        // TODO: Verify all updates were applied
      });
    });

    it('should propagate state to all consumers', () => {
      let consumer1Value;
      let consumer2Value;

      const Consumer1 = () => {
        consumer1Value = ${hookName}();
        return null;
      };

      const Consumer2 = () => {
        consumer2Value = ${hookName}();
        return null;
      };

      render(
        <${providerName}>
          <Consumer1 />
          <Consumer2 />
        </${providerName}>
      );

      // Both consumers should receive the same context value
      expect(consumer1Value).toBeDefined();
      expect(consumer2Value).toBeDefined();
      // expect(consumer1Value).toBe(consumer2Value); // Same reference
    });

    it('should trigger re-render in consumers on state change', async () => {
      let renderCount = 0;

      const Consumer = () => {
        renderCount++;
        const context = ${hookName}();
        return <div>{JSON.stringify(context)}</div>;
      };

      const { container } = render(
        <${providerName}>
          <Consumer />
        </${providerName}>
      );

      const initialRenderCount = renderCount;

      // TODO: Trigger state update
      // const button = container.querySelector('button');
      // await userEvent.click(button);

      // Should trigger re-render in consumer
      // expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe('${usesReducer ? "Reducer Actions" : "Actions"}', () => {
    const wrapper = ({ children }) => (
      <${providerName}>{children}</${providerName}>
    );

    ${usesReducer ? `
    it('should handle action types correctly', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Test each action type
      const actionTypes = [
        // 'SET_LOADING',
        // 'SET_ERROR',
        // 'SET_DATA',
        // 'RESET',
      ];

      for (const type of actionTypes) {
        await act(async () => {
          // result.current.dispatch({ type, payload: testPayload });
        });

        // Verify state after action
      }
    });

    it('should handle unknown action types gracefully', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // result.current.dispatch({ type: 'UNKNOWN_ACTION', payload: {} });
      });

      // State should remain unchanged or handle gracefully
      expect(result.current).toBeDefined();
    });

    it('should handle actions with payload', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });
      const testPayload = { id: 1, name: 'test' };

      await act(async () => {
        // result.current.dispatch({ type: 'SET_DATA', payload: testPayload });
      });

      // Verify payload was processed correctly
      // expect(result.current.state.data).toEqual(testPayload);
    });

    it('should handle actions without payload', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // result.current.dispatch({ type: 'RESET' });
      });

      // Verify action was handled
      expect(result.current).toBeDefined();
    });` : `
    it('should provide action methods', () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Verify action methods exist
      // expect(typeof result.current.actions.someAction).toBe('function');
    });

    it('should execute actions correctly', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Call action
        // result.current.actions.someAction(params);
      });

      // TODO: Verify action effect
      // expect(result.current.state).toMatchObject(expectedState);
    });`}

    it('should handle async actions', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Trigger async action
        // await result.current.actions.fetchData();
      });

      await waitFor(() => {
        // TODO: Verify async action completed
        // expect(result.current.loading).toBe(false);
        // expect(result.current.data).toBeDefined();
      });
    });

    it('should handle action errors', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Trigger action that fails
        // await result.current.actions.actionThatFails();
      });

      await waitFor(() => {
        // TODO: Verify error handling
        // expect(result.current.error).toBeDefined();
        // expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    const wrapper = ({ children }) => (
      <${providerName}>{children}</${providerName}>
    );

    it('should handle rapid consecutive updates', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Trigger multiple rapid updates
        for (let i = 0; i < 10; i++) {
          // result.current.actions.update(i);
        }
      });

      // State should be consistent
      expect(result.current).toBeDefined();
    });

    it('should handle concurrent async operations', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Trigger multiple async operations
        await Promise.all([
          // result.current.actions.asyncOp1(),
          // result.current.actions.asyncOp2(),
          // result.current.actions.asyncOp3(),
        ]);
      });

      // All operations should complete successfully
      expect(result.current).toBeDefined();
    });

    it('should handle null/undefined values', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Try to set null/undefined values
        // result.current.actions.setValue(null);
        // result.current.actions.setValue(undefined);
      });

      // Should handle gracefully
      expect(result.current).toBeDefined();
    });

    it('should handle very large state objects', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });
      const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i }));

      await act(async () => {
        // TODO: Set large data
        // result.current.actions.setData(largeData);
      });

      // Should handle efficiently
      expect(result.current).toBeDefined();
    });
  });

  describe('Performance', () => {
    const wrapper = ({ children }) => (
      <${providerName}>{children}</${providerName}>
    );

    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;

      const Consumer = () => {
        renderCount++;
        const context = ${hookName}();
        return <div>{JSON.stringify(context)}</div>;
      };

      const { rerender } = render(
        <${providerName}>
          <Consumer />
        </${providerName}>
      );

      const initialCount = renderCount;

      // Rerender provider without state change
      rerender(
        <${providerName}>
          <Consumer />
        </${providerName}>
      );

      // Should not cause consumer re-render if state unchanged
      // expect(renderCount).toBe(initialCount);
    });

    it('should memoize action functions', () => {
      const { result, rerender } = renderHook(() => ${hookName}(), { wrapper });
      const firstActions = result.current.actions || result.current;

      rerender();

      const secondActions = result.current.actions || result.current;

      // Action references should be stable
      // TODO: Verify stable references for action functions
      expect(firstActions).toBeDefined();
      expect(secondActions).toBeDefined();
    });

    it('should handle frequent state updates efficiently', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          // TODO: Rapid updates
          // result.current.actions.update(i);
        }
      });

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Cleanup and Lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <${providerName}>
          <div>Child</div>
        </${providerName}>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should cleanup subscriptions on unmount', () => {
      const wrapper = ({ children }) => (
        <${providerName}>{children}</${providerName}>
      );

      const { unmount } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Setup spies for cleanup
      unmount();

      // TODO: Verify cleanup occurred
    });

    it('should not update state after unmount', async () => {
      const wrapper = ({ children }) => (
        <${providerName}>{children}</${providerName}>
      );

      const { result, unmount } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Start async operation
      // const promise = result.current.actions.asyncAction();

      unmount();

      // TODO: Wait for operation
      // await promise;

      // Should not cause warnings about state updates after unmount
    });
  });

  describe('Integration', () => {
    it('should work with nested consumers', () => {
      const NestedConsumer = () => {
        const context = ${hookName}();
        return (
          <div>
            <div>Level 1: {JSON.stringify(context)}</div>
            <DeepConsumer />
          </div>
        );
      };

      const DeepConsumer = () => {
        const context = ${hookName}();
        return <div>Level 2: {JSON.stringify(context)}</div>;
      };

      const { container } = render(
        <${providerName}>
          <NestedConsumer />
        </${providerName}>
      );

      expect(container.textContent).toContain('Level 1');
      expect(container.textContent).toContain('Level 2');
    });

    it('should work with conditional rendering', () => {
      const ConditionalConsumer = ({ show }) => {
        const context = ${hookName}();
        return show ? <div>{JSON.stringify(context)}</div> : null;
      };

      const { rerender, container } = render(
        <${providerName}>
          <ConditionalConsumer show={false} />
        </${providerName}>
      );

      expect(container.textContent).toBe('');

      rerender(
        <${providerName}>
          <ConditionalConsumer show={true} />
        </${providerName}>
      );

      expect(container.textContent).not.toBe('');
    });

    it('should persist state across consumer mount/unmount', async () => {
      const wrapper = ({ children }) => (
        <${providerName}>{children}</${providerName}>
      );

      const { result, unmount } = renderHook(() => ${hookName}(), { wrapper });

      // TODO: Set some state
      await act(async () => {
        // result.current.actions.setValue('test');
      });

      const stateBeforeUnmount = result.current;
      unmount();

      // Mount new consumer
      const { result: newResult } = renderHook(() => ${hookName}(), { wrapper });

      // State should persist in provider
      // expect(newResult.current.state).toEqual(stateBeforeUnmount.state);
    });
  });

  describe('Error Handling', () => {
    const wrapper = ({ children }) => (
      <${providerName}>{children}</${providerName}>
    );

    it('should handle errors in action execution', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Trigger action that might throw
        try {
          // await result.current.actions.dangerousAction();
        } catch (error) {
          // Error should be caught
        }
      });

      // Context should remain stable
      expect(result.current).toBeDefined();
    });

    it('should provide error state', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      await act(async () => {
        // TODO: Trigger error condition
        // await result.current.actions.actionThatFails();
      });

      // TODO: Verify error is exposed
      // expect(result.current.error).toBeDefined();
    });

    it('should recover from error state', async () => {
      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // Set error state
      await act(async () => {
        // TODO: Trigger error
        // await result.current.actions.actionThatFails();
      });

      // Clear error
      await act(async () => {
        // TODO: Clear or retry
        // result.current.actions.clearError();
      });

      // TODO: Verify error was cleared
      // expect(result.current.error).toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should have proper TypeScript types', () => {
      const wrapper = ({ children }) => (
        <${providerName}>{children}</${providerName}>
      );

      const { result } = renderHook(() => ${hookName}(), { wrapper });

      // Types should be inferred correctly
      expect(result.current).toBeDefined();
    });
  });
});
`;
}

export default generateContextTest;
