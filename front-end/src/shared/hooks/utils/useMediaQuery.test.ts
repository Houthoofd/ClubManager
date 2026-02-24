/**
 * ====================================================================
 * useMediaQuery Hook Tests
 * ====================================================================
 *
 * Tests for useMediaQuery hook with proper window.matchMedia mocking.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    listeners = [];

    // Mock window.matchMedia
    matchMediaMock = vi.fn((query: string) => {
      const mediaQuery = {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === "change") {
            listeners.push(listener);
          }
        }),
        removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === "change") {
            const index = listeners.indexOf(listener);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        }),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;

      return mediaQuery;
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    listeners = [];
  });

  describe("Basic functionality", () => {
    it("should return false for non-matching media query", () => {
      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
      expect(result.current).toBe(false);
    });

    it("should call window.matchMedia with correct query", () => {
      renderHook(() => useMediaQuery("(min-width: 1024px)"));
      expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 1024px)");
    });

    it("should return true when media query matches", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
      expect(result.current).toBe(true);
    });
  });

  describe("Responsive breakpoints", () => {
    it("should detect mobile viewport", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
      expect(result.current).toBe(true);
    });

    it("should detect tablet viewport", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(min-width: 768px) and (max-width: 1023px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 768px) and (max-width: 1023px)"),
      );
      expect(result.current).toBe(true);
    });

    it("should detect desktop viewport", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(min-width: 1024px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
      expect(result.current).toBe(true);
    });
  });

  describe("Media features", () => {
    it("should detect dark mode preference", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(prefers-color-scheme: dark)"));
      expect(result.current).toBe(true);
    });

    it("should detect reduced motion preference", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)"));
      expect(result.current).toBe(true);
    });

    it("should detect orientation", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(orientation: portrait)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(orientation: portrait)"));
      expect(result.current).toBe(true);
    });
  });

  describe("Dynamic updates", () => {
    it("should update when media query changes", async () => {
      let currentMatches = false;
      const addEventListenerMock = vi.fn(
        (event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === "change") {
            listeners.push(listener);
          }
        },
      );

      matchMediaMock.mockImplementation((query: string) => ({
        get matches() {
          return currentMatches;
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
      expect(result.current).toBe(false);

      // Simulate media query change
      currentMatches = true;
      listeners.forEach((listener) =>
        listener({
          matches: true,
          media: "(min-width: 768px)",
        } as MediaQueryListEvent),
      );

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should register event listener", () => {
      const addEventListenerMock = vi.fn();

      matchMediaMock.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderHook(() => useMediaQuery("(min-width: 768px)"));
      expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });

  describe("Cleanup", () => {
    it("should remove event listener on unmount", () => {
      const removeEventListenerMock = vi.fn();

      matchMediaMock.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      }));

      const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should not throw on unmount", () => {
      const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty query string", () => {
      const { result } = renderHook(() => useMediaQuery(""));
      expect(result.current).toBe(false);
    });

    it("should handle complex media queries", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches:
          query === "(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)"),
      );
      expect(result.current).toBe(true);
    });

    it("should handle query changes", () => {
      const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
        initialProps: { query: "(min-width: 768px)" },
      });

      expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 768px)");

      rerender({ query: "(min-width: 1024px)" });
      expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 1024px)");
    });

    it("should work with print media", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "print",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("print"));
      expect(result.current).toBe(true);
    });
  });

  describe("Common use cases", () => {
    it("should detect mobile devices", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(max-width: 640px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
      expect(result.current).toBe(true);
    });

    it("should detect retina displays", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() =>
        useMediaQuery("(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)"),
      );
      expect(result.current).toBe(true);
    });

    it("should detect hover capability", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(hover: hover)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(hover: hover)"));
      expect(result.current).toBe(true);
    });
  });
});
