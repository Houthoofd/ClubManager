/**
 * ====================================================================
 * useLocalStorage Hook
 * ====================================================================
 *
 * Syncs state with localStorage for persistence across sessions.
 * Automatically serializes/deserializes JSON and handles errors gracefully.
 *
 * Usage:
 * ```tsx
 * const [user, setUser] = useLocalStorage('user', null);
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * ```
 */

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Error thrown when localStorage operations fail
 */
export class LocalStorageError extends Error {
  constructor(message: string, public readonly key: string) {
    super(message);
    this.name = 'LocalStorageError';
  }
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sync state with localStorage
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [storedValue, setValue, removeValue]
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const [user, setUser, removeUser] = useLocalStorage('user', null);
 *
 *   const login = (userData) => {
 *     setUser(userData);
 *   };
 *
 *   const logout = () => {
 *     removeUser();
 *   };
 *
 *   return (
 *     <div>
 *       {user ? (
 *         <p>Welcome, {user.name}!</p>
 *       ) : (
 *         <button onClick={() => login({ name: 'John' })}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  // Check if localStorage is available
  const isAvailable = isLocalStorageAvailable();

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isAvailable) {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (isAvailable) {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, isAvailable]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (isAvailable) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, isAvailable]);

  return [storedValue, setValue, removeValue];
}

/**
 * Advanced localStorage hook with sync across tabs
 *
 * @param key - localStorage key
 * @param initialValue - Initial value
 * @param options - Configuration options
 * @returns [value, setValue, removeValue]
 *
 * @example
 * ```tsx
 * const [count, setCount] = useLocalStorageSync('count', 0, {
 *   syncAcrossTabs: true,
 *   serializer: JSON.stringify,
 *   deserializer: JSON.parse,
 * });
 * ```
 */
export function useLocalStorageSync<T>(
  key: string,
  initialValue: T,
  options?: {
    syncAcrossTabs?: boolean;
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
  }
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const {
    syncAcrossTabs = true,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options || {};

  const isAvailable = isLocalStorageAvailable();

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isAvailable) {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (isAvailable) {
          localStorage.setItem(key, serializer(valueToStore));
        }

        // Dispatch custom event for cross-tab sync
        if (syncAcrossTabs && isAvailable) {
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, value: valueToStore },
            })
          );
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, isAvailable, syncAcrossTabs, serializer]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (isAvailable) {
        localStorage.removeItem(key);
      }

      if (syncAcrossTabs && isAvailable) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, value: null },
          })
        );
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, isAvailable, syncAcrossTabs]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!syncAcrossTabs || !isAvailable) {
      return;
    }

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent) {
        // Native storage event (from other tabs)
        if (e.key === key && e.newValue !== null) {
          try {
            setStoredValue(deserializer(e.newValue));
          } catch (error) {
            console.warn(`Error parsing localStorage value for key "${key}":`, error);
          }
        } else if (e.key === key && e.newValue === null) {
          setStoredValue(initialValue);
        }
      } else if (e instanceof CustomEvent) {
        // Custom event (from same tab)
        const { key: eventKey, value } = e.detail;
        if (eventKey === key) {
          setStoredValue(value !== null ? value : initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('local-storage-change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('local-storage-change', handleStorageChange as EventListener);
    };
  }, [key, initialValue, syncAcrossTabs, isAvailable, deserializer]);

  return [storedValue, setValue, removeValue];
}

/**
 * Read-only hook to get a value from localStorage
 *
 * @param key - localStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value
 *
 * @example
 * ```tsx
 * const theme = useLocalStorageValue('theme', 'light');
 * ```
 */
export function useLocalStorageValue<T>(key: string, defaultValue: T): T {
  const [value] = useLocalStorage(key, defaultValue);
  return value;
}

/**
 * Hook to manage multiple localStorage keys as a single object
 *
 * @param keys - Object with localStorage keys and initial values
 * @returns Object with values and setters
 *
 * @example
 * ```tsx
 * const storage = useLocalStorageObject({
 *   user: null,
 *   theme: 'light',
 *   settings: {},
 * });
 *
 * // Usage
 * storage.user.value // current user
 * storage.user.set({ name: 'John' }) // update user
 * storage.user.remove() // remove user
 * ```
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  keys: T
): {
  [K in keyof T]: {
    value: T[K];
    set: Dispatch<SetStateAction<T[K]>>;
    remove: () => void;
  };
} {
  const result = {} as any;

  for (const key in keys) {
    const [value, setValue, removeValue] = useLocalStorage(key, keys[key]);
    result[key] = {
      value,
      set: setValue,
      remove: removeValue,
    };
  }

  return result;
}

// Export default
export default useLocalStorage;
