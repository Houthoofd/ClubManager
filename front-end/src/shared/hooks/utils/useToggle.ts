/**
 * ====================================================================
 * useToggle Hook
 * ====================================================================
 *
 * Simple hook for managing boolean state with toggle functionality.
 * Perfect for modals, dropdowns, accordions, and any on/off state.
 *
 * Usage:
 * ```tsx
 * const [isOpen, toggle, setIsOpen] = useToggle(false);
 *
 * return (
 *   <div>
 *     <button onClick={toggle}>Toggle</button>
 *     <button onClick={() => setIsOpen(true)}>Open</button>
 *     <button onClick={() => setIsOpen(false)}>Close</button>
 *   </div>
 * );
 * ```
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing boolean toggle state
 *
 * @param initialValue - Initial boolean value (default: false)
 * @returns [value, toggle, setValue]
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const [isOpen, toggleModal, setIsOpen] = useToggle(false);
 *
 *   return (
 *     <>
 *       <button onClick={toggleModal}>Toggle Modal</button>
 *       <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *       <button onClick={() => setIsOpen(false)}>Close Modal</button>
 *
 *       {isOpen && (
 *         <div className="modal">
 *           <p>Modal Content</p>
 *           <button onClick={toggleModal}>Close</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}

/**
 * Advanced toggle hook with additional utilities
 *
 * @param initialValue - Initial boolean value
 * @returns Object with value and control functions
 *
 * @example
 * ```tsx
 * const modal = useToggleWithControls(false);
 *
 * return (
 *   <div>
 *     <button onClick={modal.toggle}>Toggle</button>
 *     <button onClick={modal.setTrue}>Open</button>
 *     <button onClick={modal.setFalse}>Close</button>
 *     {modal.value && <Modal />}
 *   </div>
 * );
 * ```
 */
export function useToggleWithControls(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
    reset,
    // Aliases for common use cases
    on: setTrue,
    off: setFalse,
    open: setTrue,
    close: setFalse,
    show: setTrue,
    hide: setFalse,
  };
}

/**
 * Toggle hook with callback support
 *
 * @param initialValue - Initial boolean value
 * @param callbacks - Optional callbacks for state changes
 * @returns [value, toggle, setValue]
 *
 * @example
 * ```tsx
 * const [isVisible, toggle] = useToggleWithCallbacks(false, {
 *   onToggle: (newValue) => console.log('Toggled to:', newValue),
 *   onTrue: () => console.log('Set to true'),
 *   onFalse: () => console.log('Set to false'),
 * });
 * ```
 */
export function useToggleWithCallbacks(
  initialValue: boolean = false,
  callbacks?: {
    onToggle?: (newValue: boolean) => void;
    onTrue?: () => void;
    onFalse?: () => void;
  }
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => {
      const newValue = !prev;
      callbacks?.onToggle?.(newValue);
      if (newValue) {
        callbacks?.onTrue?.();
      } else {
        callbacks?.onFalse?.();
      }
      return newValue;
    });
  }, [callbacks]);

  const setValueWithCallback = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
      callbacks?.onToggle?.(newValue);
      if (newValue) {
        callbacks?.onTrue?.();
      } else {
        callbacks?.onFalse?.();
      }
    },
    [callbacks]
  );

  return [value, toggle, setValueWithCallback];
}

/**
 * Hook for managing multiple boolean toggles
 *
 * @param keys - Object with boolean keys and initial values
 * @returns Object with toggle functions for each key
 *
 * @example
 * ```tsx
 * const toggles = useMultipleToggles({
 *   modal: false,
 *   sidebar: true,
 *   dropdown: false,
 * });
 *
 * // Usage
 * toggles.modal.value // false
 * toggles.modal.toggle() // toggle modal
 * toggles.modal.setTrue() // open modal
 * ```
 */
export function useMultipleToggles<T extends Record<string, boolean>>(
  initialValues: T
): {
  [K in keyof T]: {
    value: boolean;
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
    setValue: (value: boolean) => void;
  };
} {
  const [values, setValues] = useState(initialValues);

  const result = {} as any;

  for (const key in initialValues) {
    result[key] = {
      value: values[key],
      toggle: () =>
        setValues((prev) => ({
          ...prev,
          [key]: !prev[key],
        })),
      setTrue: () =>
        setValues((prev) => ({
          ...prev,
          [key]: true,
        })),
      setFalse: () =>
        setValues((prev) => ({
          ...prev,
          [key]: false,
        })),
      setValue: (value: boolean) =>
        setValues((prev) => ({
          ...prev,
          [key]: value,
        })),
    };
  }

  return result;
}

/**
 * Toggle hook with localStorage persistence
 *
 * @param key - localStorage key
 * @param initialValue - Initial value
 * @returns [value, toggle, setValue]
 *
 * @example
 * ```tsx
 * const [isDarkMode, toggleDarkMode] = usePersistedToggle('darkMode', false);
 * ```
 */
export function usePersistedToggle(
  key: string,
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const toggle = useCallback(() => {
    setValue((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
      return newValue;
    });
  }, [key]);

  const setValuePersisted = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    [key]
  );

  return [value, toggle, setValuePersisted];
}

// Export default
export default useToggle;
