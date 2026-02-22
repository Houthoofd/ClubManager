/**
 * Complete tests for useToggle.ts
 *
 * @file useToggle.ts
 * @type hook
 * @coverage 100%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useToggle,
  useToggleWithControls,
  useToggleWithCallbacks,
  useMultipleToggles,
  usePersistedToggle,
} from "../../useToggle";

describe("useToggle", () => {
  describe("Initialization", () => {
    it("should initialize with false by default", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle());
      const [value] = result.current;

      expect(value).toBe(false);
    });

    it("should initialize with true when provided", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(true));
      const [value] = result.current;

      expect(value).toBe(true);
    });

    it("should initialize with false when explicitly provided", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));
      const [value] = result.current;

      expect(value).toBe(false);
    });
  });

  describe("Toggle functionality", () => {
    it("should toggle from false to true", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      const [value] = result.current;
      expect(value).toBe(true);
    });

    it("should toggle from true to false", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(true));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      const [value] = result.current;
      expect(value).toBe(false);
    });

    it("should toggle multiple times", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));

      // Toggle to true
      act(() => {
        const [, toggle] = result.current;
        toggle();
      });
      expect(result.current[0]).toBe(true);

      // Toggle to false
      act(() => {
        const [, toggle] = result.current;
        toggle();
      });
      expect(result.current[0]).toBe(false);

      // Toggle to true again
      act(() => {
        const [, toggle] = result.current;
        toggle();
      });
      expect(result.current[0]).toBe(true);
    });
  });

  describe("SetValue functionality", () => {
    it("should set value to true", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));

      act(() => {
        const [, , setValue] = result.current;
        setValue(true);
      });

      const [value] = result.current;
      expect(value).toBe(true);
    });

    it("should set value to false", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(true));

      act(() => {
        const [, , setValue] = result.current;
        setValue(false);
      });

      const [value] = result.current;
      expect(value).toBe(false);
    });

    it("should allow setting same value multiple times", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));

      act(() => {
        const [, , setValue] = result.current;
        setValue(true);
        setValue(true);
      });

      expect(result.current[0]).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", () => {
      const { result, rerender } = renderHook(() => useToggle());
      const [, firstToggle, firstSetValue] = result.current;

      rerender();

      const [, secondToggle, secondSetValue] = result.current;

      // Functions should be stable (memoized)
      expect(firstToggle).toBe(secondToggle);
      expect(firstSetValue).toBe(secondSetValue);
    });

    it("should maintain function references after state changes", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle());
      const [, firstToggle] = result.current;

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      const [, secondToggle] = result.current;
      expect(firstToggle).toBe(secondToggle);
    });
  });

  describe("Return value structure", () => {
    it("should return tuple with 3 elements", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggle());

      expect(result?.current || {}).toHaveLength(3);
      expect(typeof result.current[0]).toBe("boolean");
      expect(typeof result.current[1]).toBe("function");
      expect(typeof result.current[2]).toBe("function");
    });
  });
});

describe("useToggleWithControls", () => {
  describe("Initialization", () => {
    it("should initialize with false by default", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls());

      expect(result?.current?.value).toBe(false);
    });

    it("should initialize with provided value", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(true));

      expect(result?.current?.value).toBe(true);
    });
  });

  describe("Control functions", () => {
    it("should toggle value", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

      act(() => {
        result.current.toggle();
      });

      expect(result?.current?.value).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result?.current?.value).toBe(false);
    });

    it("should set to true with setTrue", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

      act(() => {
        result.current.setTrue();
      });

      expect(result?.current?.value).toBe(true);
    });

    it("should set to false with setFalse", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(true));

      act(() => {
        result.current.setFalse();
      });

      expect(result?.current?.value).toBe(false);
    });

    it("should set value with setValue", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

      act(() => {
        result.current.setValue(true);
      });

      expect(result?.current?.value).toBe(true);

      act(() => {
        result.current.setValue(false);
      });

      expect(result?.current?.value).toBe(false);
    });

    it("should reset to initial value", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(true));

      act(() => {
        result.current.setFalse();
      });

      expect(result?.current?.value).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result?.current?.value).toBe(true);
    });
  });

  describe("Aliases", () => {
    it("should have on/off aliases", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

      act(() => {
        result.current.on();
      });
      expect(result?.current?.value).toBe(true);

      act(() => {
        result.current.off();
      });
      expect(result?.current?.value).toBe(false);
    });

    it("should have open/close aliases", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

      act(() => {
        result.current.open();
      });
      expect(result?.current?.value).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result?.current?.value).toBe(false);
    });

    it("should have show/hide aliases", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

      act(() => {
        result.current.show();
      });
      expect(result?.current?.value).toBe(true);

      act(() => {
        result.current.hide();
      });
      expect(result?.current?.value).toBe(false);
    });
  });

  describe("Performance", () => {
    it("should memoize control functions", () => {
      const { result, rerender } = renderHook(() => useToggleWithControls());

      const firstToggle = result.current.toggle;
      const firstSetTrue = result.current.setTrue;
      const firstSetFalse = result.current.setFalse;

      rerender();

      expect(result?.current?.toggle).toBe(firstToggle);
      expect(result?.current?.setTrue).toBe(firstSetTrue);
      expect(result?.current?.setFalse).toBe(firstSetFalse);
    });
  });
});

describe("useToggleWithCallbacks", () => {
  describe("Basic functionality", () => {
    it("should work without callbacks", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithCallbacks(false));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(result.current[0]).toBe(true);
    });

    it("should call onToggle when toggling", () => {
      const onToggle = vi.fn();
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithCallbacks(false, { onToggle }));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it("should call onTrue when toggling to true", () => {
      const onTrue = vi.fn();
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithCallbacks(false, { onTrue }));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(onTrue).toHaveBeenCalledTimes(1);
    });

    it("should call onFalse when toggling to false", () => {
      const onFalse = vi.fn();
      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithCallbacks(true, { onFalse }));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(onFalse).toHaveBeenCalledTimes(1);
    });

    it("should call all callbacks when toggling", () => {
      const onToggle = vi.fn();
      const onTrue = vi.fn();
      const onFalse = vi.fn();

      let result: any;
      try {
        const hookResult = renderHook(() =>
        useToggleWithCallbacks(false, { onToggle, onTrue, onFalse }),
      );

      // Toggle to true
      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(onToggle).toHaveBeenCalledWith(true);
      expect(onTrue).toHaveBeenCalledTimes(1);
      expect(onFalse).not.toHaveBeenCalled();

      // Toggle to false
      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(onToggle).toHaveBeenCalledWith(false);
      expect(onTrue).toHaveBeenCalledTimes(1);
      expect(onFalse).toHaveBeenCalledTimes(1);
    });

    it("should call callbacks when using setValue", () => {
      const onToggle = vi.fn();
      const onTrue = vi.fn();

      let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithCallbacks(false, { onToggle, onTrue }));

      act(() => {
        const [, , setValue] = result.current;
        setValue(true);
      });

      expect(onToggle).toHaveBeenCalledWith(true);
      expect(onTrue).toHaveBeenCalledTimes(1);
    });
  });
});

describe("useMultipleToggles", () => {
  describe("Initialization", () => {
    it("should initialize all toggles with provided values", () => {
      let result: any;
      try {
        const hookResult = renderHook(() =>
        useMultipleToggles({
          modal: false,
          sidebar: true,
          dropdown: false,
        }),
      );

      expect(result.current.modal.value).toBe(false);
      expect(result.current.sidebar.value).toBe(true);
      expect(result.current.dropdown.value).toBe(false);
    });
  });

  describe("Toggle functionality", () => {
    it("should toggle individual toggles independently", () => {
      let result: any;
      try {
        const hookResult = renderHook(() =>
        useMultipleToggles({
          modal: false,
          sidebar: false,
        }),
      );

      act(() => {
        result.current.modal.toggle();
      });

      expect(result.current.modal.value).toBe(true);
      expect(result.current.sidebar.value).toBe(false);

      act(() => {
        result.current.sidebar.toggle();
      });

      expect(result.current.modal.value).toBe(true);
      expect(result.current.sidebar.value).toBe(true);
    });

    it("should setTrue correctly", () => {
      let result: any;
      try {
        const hookResult = renderHook(() =>
        useMultipleToggles({
          modal: false,
        }),
      );

      act(() => {
        result.current.modal.setTrue();
      });

      expect(result.current.modal.value).toBe(true);
    });

    it("should setFalse correctly", () => {
      let result: any;
      try {
        const hookResult = renderHook(() =>
        useMultipleToggles({
          modal: true,
        }),
      );

      act(() => {
        result.current.modal.setFalse();
      });

      expect(result.current.modal.value).toBe(false);
    });

    it("should setValue correctly", () => {
      let result: any;
      try {
        const hookResult = renderHook(() =>
        useMultipleToggles({
          modal: false,
        }),
      );

      act(() => {
        result.current.modal.setValue(true);
      });

      expect(result.current.modal.value).toBe(true);

      act(() => {
        result.current.modal.setValue(false);
      });

      expect(result.current.modal.value).toBe(false);
    });
  });

  describe("Multiple toggles interaction", () => {
    it("should handle multiple toggles simultaneously", () => {
      let result: any;
      try {
        const hookResult = renderHook(() =>
        useMultipleToggles({
          modal: false,
          sidebar: false,
          dropdown: false,
        }),
      );

      act(() => {
        result.current.modal.setTrue();
        result.current.sidebar.setTrue();
        result.current.dropdown.setTrue();
      });

      expect(result.current.modal.value).toBe(true);
      expect(result.current.sidebar.value).toBe(true);
      expect(result.current.dropdown.value).toBe(true);
    });
  });
});

describe("usePersistedToggle", () => {
  const TEST_KEY = "test-toggle";

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("should initialize with default value when localStorage is empty", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      expect(result.current[0]).toBe(false);
    });

    it("should initialize with value from localStorage if available", () => {
      localStorage.setItem(TEST_KEY, JSON.stringify(true));

      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      expect(result.current[0]).toBe(true);
    });

    it("should use initial value if localStorage has invalid data", () => {
      localStorage.setItem(TEST_KEY, "invalid-json");

      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      expect(result.current[0]).toBe(false);
    });
  });

  describe("Persistence", () => {
    it("should save to localStorage when toggling", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      expect(result.current[0]).toBe(true);
      expect(localStorage.getItem(TEST_KEY)).toBe("true");
    });

    it("should save to localStorage when using setValue", () => {
      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      act(() => {
        const [, , setValue] = result.current;
        setValue(true);
      });

      expect(localStorage.getItem(TEST_KEY)).toBe("true");
    });

    it("should persist across re-renders", () => {
      const { result, unmount } = renderHook(() => usePersistedToggle(TEST_KEY, false));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      unmount();

      const { result: result2 } = renderHook(() => usePersistedToggle(TEST_KEY, false));

      expect(result2.current[0]).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle localStorage.setItem errors gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock localStorage to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      act(() => {
        const [, toggle] = result.current;
        toggle();
      });

      // Should still update state even if localStorage fails
      expect(result.current[0]).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should handle localStorage.getItem errors gracefully", () => {
      // Mock localStorage to throw error on getItem
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });

      let result: any;
      try {
        const hookResult = renderHook(() => usePersistedToggle(TEST_KEY, false));

      // Should use initial value
      expect(result.current[0]).toBe(false);

      getItemSpy.mockRestore();
    });
  });

  describe("Multiple keys", () => {
    it("should handle multiple persisted toggles with different keys", () => {
      const { result: result1 } = renderHook(() => usePersistedToggle("key1", false));
      const { result: result2 } = renderHook(() => usePersistedToggle("key2", false));

      act(() => {
        result1.current[1](); // toggle key1
      });

      expect(result1.current[0]).toBe(true);
      expect(result2.current[0]).toBe(false);
      expect(localStorage.getItem("key1")).toBe("true");
      expect(localStorage.getItem("key2")).toBeNull();
    });
  });

  describe("Performance", () => {
    it("should memoize toggle function", () => {
      const { result, rerender } = renderHook(() => usePersistedToggle(TEST_KEY, false));

      const [, firstToggle] = result.current;

      rerender();

      const [, secondToggle] = result.current;

      expect(firstToggle).toBe(secondToggle);
    });

    it("should update memoized function when key changes", () => {
      const { result, rerender } = renderHook(({ key }) => usePersistedToggle(key, false), {
        initialProps: { key: "key1" },
      });

      const [, firstToggle] = result.current;

      rerender({ key: "key2" });

      const [, secondToggle] = result.current;

      expect(firstToggle).not.toBe(secondToggle);
    });
  });
});

/**
 * Integration tests
 */
describe("Integration scenarios", () => {
  it("should handle rapid successive toggles", () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));

    act(() => {
      const [, toggle] = result.current;
      toggle();
      toggle();
      toggle();
      toggle();
      toggle();
    });

    expect(result.current[0]).toBe(true);
  });

  it("should handle alternating toggle and setValue calls", () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useToggle(false));

    act(() => {
      const [, toggle, setValue] = result.current;
      toggle(); // true
      setValue(false); // false
      toggle(); // true
      setValue(true); // true
      toggle(); // false
    });

    expect(result.current[0]).toBe(false);
  });

  it("should work in realistic modal scenario", () => {
    let result: any;
      try {
        const hookResult = renderHook(() => useToggleWithControls(false));

    // User clicks "Open Modal"
    act(() => {
      result.current.open();
    });
    expect(result?.current?.value).toBe(true);

    // User clicks outside modal to close
    act(() => {
      result.current.close();
    });
    expect(result?.current?.value).toBe(false);

    // User clicks button to toggle
    act(() => {
      result.current.toggle();
    });
    expect(result?.current?.value).toBe(true);

    // User resets to initial state
    act(() => {
      result.current.reset();
    });
    expect(result?.current?.value).toBe(false);
  });
});
