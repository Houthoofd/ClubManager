/**
 * ====================================================================
 * usePrevious Hook Tests
 * ====================================================================
 *
 * Tests for all usePrevious hook variants and utilities.
 */

import { renderHook } from "@testing-library/react";
import {
  usePrevious,
  usePreviousWithInitial,
  useCompare,
  useHasChanged,
  usePreviousValues,
  useHistory,
  useDeepCompareChanged,
  usePreviousDistinct,
} from "./usePrevious";

describe("usePrevious", () => {
  describe("Basic functionality", () => {
    it("should return undefined on first render", () => {
      const { result } = renderHook(() => usePrevious(5));
      expect(result.current).toBeUndefined();
    });

    it("should return previous value on re-render", () => {
      const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
        initialProps: { value: 1 },
      });

      expect(result.current).toBeUndefined();

      rerender({ value: 2 });
      expect(result.current).toBe(1);

      rerender({ value: 3 });
      expect(result.current).toBe(2);
    });

    it("should work with strings", () => {
      const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
        initialProps: { value: "hello" },
      });

      expect(result.current).toBeUndefined();

      rerender({ value: "world" });
      expect(result.current).toBe("hello");
    });

    it("should work with objects", () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };

      const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
        initialProps: { value: obj1 },
      });

      expect(result.current).toBeUndefined();

      rerender({ value: obj2 });
      expect(result.current).toBe(obj1);
    });
  });
});

describe("usePreviousWithInitial", () => {
  it("should return initial value on first render", () => {
    const { result } = renderHook(() => usePreviousWithInitial(10, 0));
    expect(result.current).toBe(0);
  });

  it("should return previous value after re-render", () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousWithInitial(value, 0), {
      initialProps: { value: 5 },
    });

    expect(result.current).toBe(0);

    rerender({ value: 10 });
    expect(result.current).toBe(5);

    rerender({ value: 15 });
    expect(result.current).toBe(10);
  });

  it("should work with string initial value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePreviousWithInitial(value, "initial"),
      { initialProps: { value: "first" } },
    );

    expect(result.current).toBe("initial");

    rerender({ value: "second" });
    expect(result.current).toBe("first");
  });
});

describe("useCompare", () => {
  it("should track current and previous values", () => {
    const { result, rerender } = renderHook(({ value }) => useCompare(value), {
      initialProps: { value: 1 },
    });

    expect(result.current.current).toBe(1);
    expect(result.current.previous).toBeUndefined();
    expect(result.current.hasChanged).toBe(true);

    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
    expect(result.current.previous).toBe(1);
    expect(result.current.hasChanged).toBe(true);
  });

  it("should detect when value has not changed", () => {
    const { result, rerender } = renderHook(({ value }) => useCompare(value), {
      initialProps: { value: 5 },
    });

    rerender({ value: 5 });
    rerender({ value: 5 });

    expect(result.current.current).toBe(5);
    expect(result.current.previous).toBe(5);
    expect(result.current.hasChanged).toBe(false);
  });

  it("should use custom compare function", () => {
    const compareFn = (prev: number | undefined, current: number) => {
      if (prev === undefined) return true;
      return Math.abs(prev - current) > 5;
    };

    const { result, rerender } = renderHook(({ value }) => useCompare(value, compareFn), {
      initialProps: { value: 10 },
    });

    expect(result.current.hasChanged).toBe(true);

    rerender({ value: 12 });
    expect(result.current.hasChanged).toBe(false);

    rerender({ value: 20 });
    expect(result.current.hasChanged).toBe(true);
  });
});

describe("useHasChanged", () => {
  it("should return false on first render", () => {
    const { result } = renderHook(() => useHasChanged(1));
    expect(result.current).toBe(false);
  });

  it("should return true when value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useHasChanged(value), {
      initialProps: { value: 1 },
    });

    expect(result.current).toBe(false);

    rerender({ value: 2 });
    expect(result.current).toBe(true);
  });

  it("should return false when value stays the same", () => {
    const { result, rerender } = renderHook(({ value }) => useHasChanged(value), {
      initialProps: { value: "test" },
    });

    rerender({ value: "test" });
    expect(result.current).toBe(false);

    rerender({ value: "changed" });
    expect(result.current).toBe(true);

    rerender({ value: "changed" });
    expect(result.current).toBe(false);
  });
});

describe("usePreviousValues", () => {
  it("should return empty object on first render", () => {
    const { result } = renderHook(() => usePreviousValues({ userId: 1, page: 1 }));
    expect(result.current).toEqual({});
  });

  it("should track multiple values", () => {
    const { result, rerender } = renderHook(({ values }) => usePreviousValues(values), {
      initialProps: { values: { userId: 1, page: 1, filter: "all" } },
    });

    expect(result.current).toEqual({});

    rerender({ values: { userId: 2, page: 1, filter: "active" } });
    expect(result.current).toEqual({ userId: 1, page: 1, filter: "all" });

    rerender({ values: { userId: 2, page: 2, filter: "active" } });
    expect(result.current).toEqual({ userId: 2, page: 1, filter: "active" });
  });
});

describe("useHistory", () => {
  it("should track value history", () => {
    const { result, rerender } = renderHook(({ value }) => useHistory(value, 5), {
      initialProps: { value: 1 },
    });

    expect(result.current).toEqual([]);

    rerender({ value: 2 });
    expect(result.current).toEqual([1]);

    rerender({ value: 3 });
    expect(result.current).toEqual([2, 1]);
  });

  it("should limit history size", () => {
    const { result, rerender } = renderHook(({ value }) => useHistory(value, 3), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    rerender({ value: 3 });
    rerender({ value: 4 });
    rerender({ value: 5 });

    expect(result.current).toEqual([4, 3, 2]);
    expect(result.current.length).toBe(3);
  });

  it("should use default max history of 10", () => {
    const { result, rerender } = renderHook(({ value }) => useHistory(value), {
      initialProps: { value: 1 },
    });

    for (let i = 2; i <= 15; i++) {
      rerender({ value: i });
    }

    expect(result.current.length).toBe(10);
    expect(result.current[0]).toBe(14);
    expect(result.current[9]).toBe(5);
  });
});

describe("useDeepCompareChanged", () => {
  it("should return true on first render", () => {
    const { result } = renderHook(() => useDeepCompareChanged({ id: 1, name: "test" }));
    expect(result.current).toBe(true);
  });

  it("should detect object changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDeepCompareChanged(value), {
      initialProps: { value: { id: 1, name: "John" } },
    });

    expect(result.current).toBe(true);

    rerender({ value: { id: 1, name: "John" } });
    expect(result.current).toBe(false);

    rerender({ value: { id: 1, name: "Jane" } });
    expect(result.current).toBe(true);
  });

  it("should detect array changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDeepCompareChanged(value), {
      initialProps: { value: [1, 2, 3] },
    });

    expect(result.current).toBe(true);

    rerender({ value: [1, 2, 3] });
    expect(result.current).toBe(false);

    rerender({ value: [1, 2, 3, 4] });
    expect(result.current).toBe(true);
  });

  it("should detect nested object changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDeepCompareChanged(value), {
      initialProps: {
        value: { user: { id: 1, profile: { name: "John" } } },
      },
    });

    rerender({ value: { user: { id: 1, profile: { name: "John" } } } });
    expect(result.current).toBe(false);

    rerender({ value: { user: { id: 1, profile: { name: "Jane" } } } });
    expect(result.current).toBe(true);
  });
});

describe("usePreviousDistinct", () => {
  it("should return undefined on first render", () => {
    const { result } = renderHook(() => usePreviousDistinct(5));
    expect(result.current).toBeUndefined();
  });

  it("should update previous value by default", () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousDistinct(value), {
      initialProps: { value: 1 },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it("should only update when shouldUpdate returns true", () => {
    const shouldUpdate = (prev: number | undefined, current: number) => current > 5;

    const { result, rerender } = renderHook(
      ({ value }) => usePreviousDistinct(value, shouldUpdate),
      { initialProps: { value: 3 } },
    );

    expect(result.current).toBeUndefined();

    rerender({ value: 4 });
    expect(result.current).toBeUndefined();

    rerender({ value: 6 });
    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(6);

    rerender({ value: 10 });
    expect(result.current).toBe(6);
  });

  it("should keep previous valid value", () => {
    const shouldUpdate = (prev: string | undefined, current: string) => current.length > 0;

    const { result, rerender } = renderHook(
      ({ value }) => usePreviousDistinct(value, shouldUpdate),
      { initialProps: { value: "hello" } },
    );

    rerender({ value: "world" });
    expect(result.current).toBe("hello");

    rerender({ value: "" });
    expect(result.current).toBe("world");

    rerender({ value: "test" });
    expect(result.current).toBe("world");
  });
});
