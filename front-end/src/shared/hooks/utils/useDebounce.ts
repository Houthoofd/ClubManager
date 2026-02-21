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

import { useState, useEffect } from 'react';

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
  }
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const {
      maxWait,
      leading = false,
      trailing = true,
    } = options || {};

    let timeoutId: NodeJS.Timeout | null = null;
    let maxWaitTimeoutId: NodeJS.Timeout | null = null;

    // Leading edge: update immediately
    if (leading && !isPending) {
      setDebouncedValue(value);
    }

    setIsPending(true);

    // Normal debounce timeout
    if (trailing) {
      timeoutId = setTimeout(() => {
        setDebouncedValue(value);
        setIsPending(false);
        if (maxWaitTimeoutId) {
          clearTimeout(maxWaitTimeoutId);
        }
      }, delay);
    }

    // Max wait timeout: force update after maxWait
    if (maxWait) {
      maxWaitTimeoutId = setTimeout(() => {
        setDebouncedValue(value);
        setIsPending(false);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }, maxWait);
    }

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId);
      setIsPending(false);
    };
  }, [value, delay, options, isPending]);

  // Cancel pending debounce
  const cancel = () => {
    setIsPending(false);
  };

  // Flush: immediately update to current value
  const flush = () => {
    setDebouncedValue(value);
    setIsPending(false);
  };

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
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

// Export default
export default useDebounce;
