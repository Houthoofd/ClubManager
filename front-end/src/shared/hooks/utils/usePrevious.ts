/**
 * ====================================================================
 * usePrevious Hook
 * ====================================================================
 *
 * Returns the previous value of a state or prop.
 * Useful for comparing current and previous values, animations, etc.
 *
 * Usage:
 * ```tsx
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 *
 * // previousCount will be the value from the last render
 * console.log(`Current: ${count}, Previous: ${previousCount}`);
 * ```
 */

import { useRef, useEffect } from "react";

/**
 * Hook to get the previous value of a variable
 *
 * @param value - Current value to track
 * @returns Previous value (undefined on first render)
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook to get the previous value with an initial value
 *
 * @param value - Current value to track
 * @param initialValue - Value to return on first render
 * @returns Previous value (or initialValue on first render)
 *
 * @example
 * ```tsx
 * const prevCount = usePreviousWithInitial(count, 0);
 * ```
 */
export function usePreviousWithInitial<T>(value: T, initialValue: T): T {
  const ref = useRef<T>(initialValue);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook to compare current and previous values
 *
 * @param value - Current value
 * @param compareFn - Optional custom compare function
 * @returns Object with current, previous, and hasChanged
 *
 * @example
 * ```tsx
 * const { current, previous, hasChanged } = useCompare(userId);
 *
 * useEffect(() => {
 *   if (hasChanged) {
 *     console.log(`User ID changed from ${previous} to ${current}`);
 *   }
 * }, [hasChanged]);
 * ```
 */
export function useCompare<T>(
  value: T,
  compareFn?: (prev: T | undefined, current: T) => boolean,
): {
  current: T;
  previous: T | undefined;
  hasChanged: boolean;
} {
  const previousValue = usePrevious(value);

  const hasChanged = compareFn ? compareFn(previousValue, value) : previousValue !== value;

  return {
    current: value,
    previous: previousValue,
    hasChanged,
  };
}

/**
 * Hook to detect if a value has changed
 *
 * @param value - Value to track
 * @returns Boolean indicating if value changed since last render
 *
 * @example
 * ```tsx
 * const hasUserIdChanged = useHasChanged(userId);
 *
 * if (hasUserIdChanged) {
 *   fetchUserData(userId);
 * }
 * ```
 */
export function useHasChanged<T>(value: T): boolean {
  const previousValue = usePrevious(value);
  return previousValue !== undefined && previousValue !== value;
}

/**
 * Hook to track previous props/state for multiple values
 *
 * @param values - Object with values to track
 * @returns Object with previous values
 *
 * @example
 * ```tsx
 * const previous = usePreviousValues({
 *   userId,
 *   page,
 *   filter,
 * });
 *
 * // previous.userId, previous.page, previous.filter
 * ```
 */
export function usePreviousValues<T extends Record<string, any>>(values: T): Partial<T> {
  const ref = useRef<Partial<T>>({});

  useEffect(() => {
    ref.current = { ...values };
  }, [values]);

  return ref.current;
}

/**
 * Hook to track value changes with history
 *
 * @param value - Value to track
 * @param maxHistory - Maximum history size (default: 10)
 * @returns Array of previous values
 *
 * @example
 * ```tsx
 * const history = useHistory(searchTerm, 5);
 * // history = ['term1', 'term2', 'term3', 'term4', 'term5']
 * ```
 */
export function useHistory<T>(value: T, maxHistory: number = 10): T[] {
  const historyRef = useRef<T[]>([]);

  useEffect(() => {
    historyRef.current = [value, ...historyRef.current].slice(0, maxHistory);
  }, [value, maxHistory]);

  return historyRef.current;
}

/**
 * Hook to detect deep equality changes (useful for objects/arrays)
 *
 * @param value - Value to track (object or array)
 * @returns Boolean indicating if value changed (deep comparison)
 *
 * @example
 * ```tsx
 * const filters = { category: 'books', minPrice: 10 };
 * const hasFiltersChanged = useDeepCompareChanged(filters);
 * ```
 */
export function useDeepCompareChanged<T>(value: T): boolean {
  const previousValue = usePrevious(value);

  if (previousValue === undefined) {
    return true;
  }

  return JSON.stringify(previousValue) !== JSON.stringify(value);
}

/**
 * Hook to get previous value only when it changes
 *
 * @param value - Current value
 * @param shouldUpdate - Function to determine if previous should update
 * @returns Previous value (updates only when shouldUpdate returns true)
 *
 * @example
 * ```tsx
 * // Only update previous when value is truthy
 * const previousValidValue = usePreviousDistinct(
 *   value,
 *   (prev, curr) => !!curr
 * );
 * ```
 */
export function usePreviousDistinct<T>(
  value: T,
  shouldUpdate?: (prev: T | undefined, current: T) => boolean,
): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (shouldUpdate === undefined || shouldUpdate(ref.current, value)) {
      ref.current = value;
    }
  }, [value, shouldUpdate]);

  return ref.current;
}

// Export default
export default usePrevious;
