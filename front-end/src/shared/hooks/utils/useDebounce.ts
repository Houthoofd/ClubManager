/**
 * ====================================================================
 * useDebounce Hook
 * ====================================================================
 *
 * Debounces a value, delaying updates until after a specified delay
 * has passed without the value changing. Perfect for search inputs,
 * API calls, and expensive operations.
 *
 * Usage:
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // API call only happens after user stops typing for 500ms
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * // Search input with debounce
 * function SearchComponent() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearch) {
 *       fetchResults(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 *   return (
 *     <input
 *       value={search}
 *       onChange={(e) => setSearch(e.target.value)}
 *       placeholder="Search..."
 *     />
 *   );
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel the timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Advanced debounce hook with additional options and control
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @param options - Additional options
 * @returns Object with debounced value and control functions
 *
 * @example
 * ```tsx
 * const { debouncedValue, isPending, cancel, flush } = useDebouncedValue(
 *   searchTerm,
 *   500,
 *   { maxWait: 2000 }
 * );
 * ```
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number = 500,
  options?: {
    maxWait?: number; // Maximum time to wait before forcing update
    leading?: boolean; // Update immediately on first change
    trailing?: boolean; // Update after delay (default: true)
  },
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  // Use refs to store timeout IDs to avoid stale closures
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if this is the first mount (skip debounce on initial render)
  const isFirstMount = useRef(true);

  // Store current value for flush
  const currentValueRef = useRef<T>(value);

  // Destructure options to avoid reference changes causing re-renders
  const maxWait = options?.maxWait;
  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;

  useEffect(() => {
    currentValueRef.current = value;

    // Skip effect on first mount - initial value is already set
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }

    // Leading edge: update immediately
    if (leading) {
      setDebouncedValue(value);
      if (!trailing && !maxWait) {
        // If only leading, no debounce needed
        return;
      }
    }

    // Set pending state
    setIsPending(true);

    // Normal debounce timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        setIsPending(false);
        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current);
          maxWaitTimeoutRef.current = null;
        }
      }, delay);
    }

    // Max wait timeout: force update after maxWait
    if (maxWait) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        setIsPending(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }, maxWait);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = null;
      }
    };
  }, [value, delay, maxWait, leading, trailing]);

  // Cancel pending debounce - use useCallback to maintain stable reference
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    setIsPending(false);
  }, []);

  // Flush: immediately update to current value - use useCallback
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    setDebouncedValue(currentValueRef.current);
    setIsPending(false);
  }, []);

  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
  };
}

/**
 * Debounce a callback function
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced callback function
 *
 * @example
 * ```tsx
 * function Component() {
 *   const handleSearch = useDebouncedCallback((query: string) => {
 *     fetchResults(query);
 *   }, 500);
 *
 *   return (
 *     <input onChange={(e) => handleSearch(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
): (...args: Parameters<T>) => void {
  // Use ref instead of state to persist timeout ID across renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
    }, delay);
  };
}

// Export default
export default useDebounce;
