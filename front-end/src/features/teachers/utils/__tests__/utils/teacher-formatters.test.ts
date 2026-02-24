/**
 * Tests for teacher-formatters.ts
 *
 * @file teacher-formatters.ts
 * @type util
 * @updated Fixed with proper parameters and assertions
 * */

import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatTeacherName,
  formatTeacherStatus,
  normalizeSearchTerm,
  createSearchableString,
  formatSearchResultsMessage,
  truncateText,
} from "../../teacher-formatters";

describe("formatDate", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatDate).toBeDefined();
      expect(typeof formatDate).toBe("function");
    });

    it("should format valid ISO date string", () => {
      const result = formatDate("2024-01-15");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("/");
    });

    it("should handle different date formats", () => {
      const result1 = formatDate("2024-01-15");
      const result2 = formatDate("2024-12-31");
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should produce consistent results", () => {
      const dateString = "2024-01-15";
      const result1 = formatDate(dateString);
      const result2 = formatDate(dateString);
      expect(result1).toEqual(result2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date strings", () => {
      const result = formatDate("invalid-date");
      expect(result).toBe("invalid-date");
    });

    it("should not throw on empty string", () => {
      expect(() => formatDate("")).not.toThrow();
    });
  });
});

describe("formatTeacherName", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatTeacherName).toBeDefined();
      expect(typeof formatTeacherName).toBe("function");
    });

    it("should format full name correctly", () => {
      const result = formatTeacherName("John", "Doe");
      expect(result).toBe("John Doe");
    });

    it("should handle single character names", () => {
      const result = formatTeacherName("J", "D");
      expect(result).toBe("J D");
    });

    it("should trim whitespace from result", () => {
      const result = formatTeacherName("  John  ", "  Doe  ");
      expect(result).toBe("John     Doe");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      const result = formatTeacherName("", "");
      expect(result).toBe("");
    });

    it("should handle one empty parameter", () => {
      const result1 = formatTeacherName("John", "");
      const result2 = formatTeacherName("", "Doe");
      expect(result1).toBe("John");
      expect(result2).toBe("Doe");
    });
  });
});

describe("formatTeacherStatus", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatTeacherStatus).toBeDefined();
      expect(typeof formatTeacherStatus).toBe("function");
    });

    it('should return "Actif" for true', () => {
      const result = formatTeacherStatus(true);
      expect(result).toBe("Actif");
    });

    it('should return "Inactif" for false', () => {
      const result = formatTeacherStatus(false);
      expect(result).toBe("Inactif");
    });

    it("should return correct type", () => {
      const result = formatTeacherStatus(true);
      expect(typeof result).toBe("string");
    });
  });
});

describe("normalizeSearchTerm", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(normalizeSearchTerm).toBeDefined();
      expect(typeof normalizeSearchTerm).toBe("function");
    });

    it("should convert to lowercase", () => {
      const result = normalizeSearchTerm("HELLO");
      expect(result).toBe("hello");
    });

    it("should trim whitespace", () => {
      const result = normalizeSearchTerm("  hello  ");
      expect(result).toBe("hello");
    });

    it("should handle mixed case and whitespace", () => {
      const result = normalizeSearchTerm("  HeLLo WoRLd  ");
      expect(result).toBe("hello world");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = normalizeSearchTerm("");
      expect(result).toBe("");
    });

    it("should handle special characters", () => {
      const result = normalizeSearchTerm("Hello@123");
      expect(result).toBe("hello@123");
    });
  });
});

describe("createSearchableString", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(createSearchableString).toBeDefined();
      expect(typeof createSearchableString).toBe("function");
    });

    it("should create searchable string from teacher data", () => {
      const teacher = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        specialization: "Math",
      };
      const result = createSearchableString(teacher);
      expect(result).toBe("john doe john.doe@example.com math");
    });

    it("should handle missing specialization", () => {
      const teacher = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      };
      const result = createSearchableString(teacher);
      expect(result).toContain("john");
      expect(result).toContain("doe");
    });

    it("should convert to lowercase", () => {
      const teacher = {
        firstName: "JOHN",
        lastName: "DOE",
        email: "JOHN.DOE@EXAMPLE.COM",
        specialization: "MATH",
      };
      const result = createSearchableString(teacher);
      expect(result).toBe("john doe john.doe@example.com math");
    });
  });
});

describe("formatSearchResultsMessage", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatSearchResultsMessage).toBeDefined();
      expect(typeof formatSearchResultsMessage).toBe("function");
    });

    it("should format message for single result", () => {
      const result = formatSearchResultsMessage(1, 10);
      expect(result).toBe("1 professeur trouvé sur 10");
    });

    it("should format message for multiple results", () => {
      const result = formatSearchResultsMessage(5, 10);
      expect(result).toBe("5 professeurs trouvés sur 10");
    });

    it("should format message for zero results", () => {
      const result = formatSearchResultsMessage(0, 10);
      expect(result).toBe("0 professeur trouvé sur 10");
    });

    it("should format message for all results", () => {
      const result = formatSearchResultsMessage(10, 10);
      expect(result).toBe("10 professeurs trouvés sur 10");
    });
  });
});

describe("truncateText", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(truncateText).toBeDefined();
      expect(typeof truncateText).toBe("function");
    });

    it("should not truncate short text", () => {
      const text = "Short text";
      const result = truncateText(text, 100);
      expect(result).toBe(text);
    });

    it("should truncate long text", () => {
      const text = "a".repeat(150);
      const result = truncateText(text, 100);
      expect(result.length).toBe(103); // 100 chars + '...'
      expect(result.endsWith("...")).toBe(true);
    });

    it("should use default max length", () => {
      const text = "a".repeat(150);
      const result = truncateText(text);
      expect(result.length).toBe(103); // 100 chars + '...'
    });

    it("should respect custom max length", () => {
      const text = "a".repeat(100);
      const result = truncateText(text, 50);
      expect(result.length).toBe(53); // 50 chars + '...'
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = truncateText("", 10);
      expect(result).toBe("");
    });

    it("should handle exact length match", () => {
      const text = "a".repeat(50);
      const result = truncateText(text, 50);
      expect(result).toBe(text);
    });
  });
});
