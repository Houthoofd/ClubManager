/**
 * ====================================================================
 * useDebounce Hook Tests
 * ====================================================================
 *
 * Tests for useDebounce, useDebouncedValue, and useDebouncedCallback.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useDebounce, useDebouncedValue, useDebouncedCallback } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Basic functionality", () => {
    it("should return initial value immediately", () => {
      const { result } = renderHook(() => useDebounce("test", 500));
      expect(result.current).toBe("test");
    });

    it("should debounce value changes", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "initial" },
      });

      expect(result.current).toBe("initial");

      rerender({ value: "changed" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("changed");
    });

    it("should cancel previous timeout on rapid changes", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "a" },
      });

      rerender({ value: "b" });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: "c" });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: "d" });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should still be initial value
      expect(result.current).toBe("a");

      // After full delay from last change
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe("d");
    });

    it("should work with different delays", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 1000), {
        initialProps: { value: "test" },
      });

      rerender({ value: "updated" });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("test");

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("updated");
    });

    it("should work with numbers", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 0 },
      });

      rerender({ value: 5 });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe(5);
    });

    it("should work with objects", () => {
      const obj1 = { id: 1, name: "test" };
      const obj2 = { id: 2, name: "updated" };

      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: obj1 },
      });

      expect(result.current).toBe(obj1);

      rerender({ value: obj2 });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe(obj2);
    });

    it("should use default delay of 500ms", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
        initialProps: { value: "initial" },
      });

      rerender({ value: "changed" });
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe("changed");
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined values", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: undefined as string | undefined },
      });

      expect(result.current).toBeUndefined();

      rerender({ value: "defined" });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("defined");
    });

    it("should handle null values", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: null as string | null },
      });

      expect(result.current).toBeNull();

      rerender({ value: "value" });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("value");
    });

    it("should cleanup timeout on unmount", () => {
      const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "test" },
      });

      rerender({ value: "updated" });
      unmount();

      // Should not throw or cause issues
      act(() => {
        vi.advanceTimersByTime(500);
      });
    });
  });
});

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Basic functionality", () => {
    it("should return debounced value and isPending state", () => {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
        initialProps: { value: "test" },
      });

      expect(result.current.debouncedValue).toBe("test");
      expect(result.current.isPending).toBe(false);

      rerender({ value: "changed" });
      expect(result.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.debouncedValue).toBe("changed");
      expect(result.current.isPending).toBe(false);
    });

    it("should provide cancel function", () => {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
        initialProps: { value: "initial" },
      });

      rerender({ value: "changed" });
      expect(result.current.isPending).toBe(true);

      act(() => {
        result.current.cancel();
      });
      expect(result.current.isPending).toBe(false);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      // Should not have updated since we cancelled
      expect(result.current.debouncedValue).toBe("initial");
    });

    it("should provide flush function", () => {
      const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
        initialProps: { value: "initial" },
      });

      rerender({ value: "changed" });
      expect(result.current.debouncedValue).toBe("initial");
      expect(result.current.isPending).toBe(true);

      act(() => {
        result.current.flush();
      });
      expect(result.current.debouncedValue).toBe("changed");
      expect(result.current.isPending).toBe(false);
    });
  });

  describe("Options", () => {
    it("should support leading edge updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 500, { leading: true }),
        { initialProps: { value: "initial" } },
      );

      expect(result.current.debouncedValue).toBe("initial");

      rerender({ value: "changed" });
      // Should update immediately with leading: true
      expect(result.current.debouncedValue).toBe("changed");
    });

    it("should support maxWait option", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 1000, { maxWait: 500 }),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "changed" });
      expect(result.current.debouncedValue).toBe("initial");

      // Should update after maxWait, not delay
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.debouncedValue).toBe("changed");
    });

    it("should support trailing: false option", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 500, { trailing: false }),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "changed" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // With trailing: false, should not update after delay
      expect(result.current.debouncedValue).toBe("initial");
    });
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should debounce callback execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current("arg1");
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledWith("arg1");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous callback on rapid calls", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current("first");
    act(() => {
      vi.advanceTimersByTime(200);
    });

    result.current("second");
    act(() => {
      vi.advanceTimersByTime(200);
    });

    result.current("third");
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should only call with the last argument
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("third");
  });

  it("should handle multiple arguments", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current("arg1", 123, { test: true });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith("arg1", 123, { test: true });
  });

  it("should use default delay of 500ms", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback));

    result.current("test");
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledWith("test");
  });

  it("should cleanup timeout on unmount", () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current("test");
    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    // Should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });

  it("should work with different callback types", () => {
    const callback = vi.fn((x: number, y: number) => x + y);
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current(5, 10);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith(5, 10);
  });
});
