import { describe, it, expect } from "vitest";
import { safeSubstring } from "../safeSubstring";

describe("safeSubstring", () => {
  describe("Normal Usage", () => {
    it("should extract substring with start and end", () => {
      const result = safeSubstring("Hello World", 0, 5);
      expect(result).toBe("Hello");
    });

    it("should extract substring with only start index", () => {
      const result = safeSubstring("Hello World", 6);
      expect(result).toBe("World");
    });

    it("should extract substring from middle", () => {
      const result = safeSubstring("Hello World", 3, 8);
      expect(result).toBe("lo Wo");
    });

    it("should handle start index of 0", () => {
      const result = safeSubstring("Test", 0);
      expect(result).toBe("Test");
    });

    it("should handle end index equal to string length", () => {
      const result = safeSubstring("Test", 0, 4);
      expect(result).toBe("Test");
    });
  });

  describe("Null and Undefined Handling", () => {
    it("should return empty string for null value", () => {
      const result = safeSubstring(null, 0, 5);
      expect(result).toBe("");
    });

    it("should return empty string for undefined value", () => {
      const result = safeSubstring(undefined, 0, 5);
      expect(result).toBe("");
    });

    it("should return empty string for null with only start index", () => {
      const result = safeSubstring(null, 5);
      expect(result).toBe("");
    });

    it("should return empty string for undefined with only start index", () => {
      const result = safeSubstring(undefined, 5);
      expect(result).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = safeSubstring("", 0, 5);
      expect(result).toBe("");
    });

    it("should handle start index greater than string length", () => {
      const result = safeSubstring("Hello", 10);
      expect(result).toBe("");
    });

    it("should handle end index greater than string length", () => {
      const result = safeSubstring("Hello", 0, 100);
      expect(result).toBe("Hello");
    });

    it("should handle negative start index", () => {
      const result = safeSubstring("Hello", -2);
      expect(result).toBe("Hello");
    });

    it("should handle negative end index", () => {
      const result = safeSubstring("Hello World", 0, -5);
      expect(result).toBe("");
    });

    it("should handle start greater than end", () => {
      const result = safeSubstring("Hello", 5, 2);
      expect(result).toBe("llo"); // substring swaps the values
    });

    it("should handle single character string", () => {
      const result = safeSubstring("A", 0, 1);
      expect(result).toBe("A");
    });

    it("should handle very long strings", () => {
      const longString = "A".repeat(10000);
      const result = safeSubstring(longString, 0, 100);
      expect(result).toBe("A".repeat(100));
    });
  });

  describe("Special Characters", () => {
    it("should handle strings with unicode characters", () => {
      const result = safeSubstring("Hello 🌍 World", 0, 8);
      expect(result).toBe("Hello 🌍");
    });

    it("should handle strings with accents", () => {
      const result = safeSubstring("Café Münchën", 0, 4);
      expect(result).toBe("Café");
    });

    it("should handle strings with special symbols", () => {
      const result = safeSubstring("Test@#$%^&*()", 4, 12);
      expect(result).toBe("@#$%^&*(");
    });

    it("should handle strings with newlines", () => {
      const result = safeSubstring("Line1\nLine2", 0, 5);
      expect(result).toBe("Line1");
    });

    it("should handle strings with tabs", () => {
      const result = safeSubstring("Col1\tCol2", 0, 4);
      expect(result).toBe("Col1");
    });
  });

  describe("Return Type", () => {
    it("should always return a string", () => {
      expect(typeof safeSubstring("test", 0, 2)).toBe("string");
      expect(typeof safeSubstring(null, 0, 2)).toBe("string");
      expect(typeof safeSubstring(undefined, 0, 2)).toBe("string");
    });

    it("should never return null", () => {
      expect(safeSubstring(null, 0, 5)).not.toBeNull();
    });

    it("should never return undefined", () => {
      expect(safeSubstring(undefined, 0, 5)).not.toBeUndefined();
    });
  });

  describe("Real-World Use Cases", () => {
    it("should truncate long user names", () => {
      const longName = "Christopher Alexander Johnson";
      const result = safeSubstring(longName, 0, 10);
      expect(result).toBe("Christophe");
    });

    it("should extract file extension", () => {
      const filename = "document.pdf";
      const result = safeSubstring(filename, 9);
      expect(result).toBe("pdf");
    });

    it("should handle null user input gracefully", () => {
      const userInput = null;
      const result = safeSubstring(userInput, 0, 100);
      expect(result).toBe("");
    });

    it("should extract domain from email", () => {
      const email = "user@example.com";
      const result = safeSubstring(email, 5);
      expect(result).toBe("example.com");
    });
  });
});
