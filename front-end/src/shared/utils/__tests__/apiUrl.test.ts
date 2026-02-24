import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { apiUrl } from "../apiUrl";

describe("apiUrl", () => {
  const originalEnv = import.meta.env.MODE;

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Development Mode", () => {
    beforeEach(() => {
      vi.stubEnv("MODE", "development");
    });

    it("should construct URL with base URL in development", () => {
      const result = apiUrl("users");
      expect(result).toContain("users");
    });

    it("should handle path with leading slash", () => {
      const result = apiUrl("/users");
      // Should not have double slashes except in http://
      expect(result.replace(/https?:\/\//, "")).not.toMatch(/\/\//);
      expect(result).toContain("users");
    });

    it("should handle path with multiple leading slashes", () => {
      const result = apiUrl("///users");
      // Should not have triple slashes
      expect(result.replace(/https?:\/\//, "")).not.toMatch(/\/\/\//);
      expect(result).toContain("users");
    });

    it("should handle empty path", () => {
      const result = apiUrl("");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should handle nested paths", () => {
      const result = apiUrl("users/123/profile");
      expect(result).toContain("users/123/profile");
    });
  });

  describe("URL Construction", () => {
    it("should construct valid URL", () => {
      const result = apiUrl("users");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result).toContain("users");
    });

    it("should handle path with leading slash", () => {
      const result = apiUrl("/users");
      expect(result).toContain("users");
      // Check no double slash in path part (excluding http://)
      const pathPart = result.replace(/https?:\/\/[^/]+/, "");
      expect(pathPart).not.toMatch(/\/\/users/);
    });

    it("should produce valid URL format", () => {
      const result = apiUrl("users");
      expect(result).toMatch(/^https?:\/\/.+/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle query parameters", () => {
      const result = apiUrl("users?page=1&limit=10");
      expect(result).toContain("users?page=1&limit=10");
    });

    it("should handle hash fragments", () => {
      const result = apiUrl("users#section");
      expect(result).toContain("users#section");
    });

    it("should handle complex URLs", () => {
      const result = apiUrl("users/123/orders?status=pending&sort=date#top");
      expect(result).toContain("users/123/orders?status=pending&sort=date#top");
    });

    it("should handle special characters in path", () => {
      const result = apiUrl("search?q=hello%20world");
      expect(result).toContain("search?q=hello%20world");
    });
  });

  describe("Return Type", () => {
    it("should always return a string", () => {
      expect(typeof apiUrl("test")).toBe("string");
    });

    it("should return non-empty string for valid paths", () => {
      const result = apiUrl("users");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Path Sanitization", () => {
    it("should remove leading slashes from path", () => {
      const result1 = apiUrl("/users");
      const result2 = apiUrl("users");
      // Both should produce similar results (without comparing base URL)
      expect(result1.endsWith("users")).toBe(true);
      expect(result2.endsWith("users")).toBe(true);
    });

    it("should handle whitespace in paths", () => {
      const result = apiUrl("  users  ");
      expect(result).toContain("users");
    });
  });
});
