/**
 * Tests for course-formatters.ts
 *
 * @file course-formatters.ts
 * @type util
 * @updated Fixed with proper parameters and assertions
 * */

import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDate,
  formatTimeRange,
  calculateDuration,
  formatDuration,
  normalizeDay,
  getDayKey,
  getDayOrder,
  sortDays,
  formatInstructorNames,
  createCourseSearchableString,
  normalizeSearchTerm,
  formatCourseType,
  truncateText,
  groupCoursesByDay,
  sortCoursesByTime,
  formatSearchResultsMessage,
} from "../../course-formatters";

describe("formatTime", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatTime).toBeDefined();
      expect(typeof formatTime).toBe("function");
    });

    it("should return time already in HH:MM format", () => {
      const result = formatTime("14:30");
      expect(result).toBe("14:30");
    });

    it("should format HH:MM:SS to HH:MM", () => {
      const result = formatTime("14:30:45");
      expect(result).toBe("14:30");
    });

    it("should format ISO datetime to HH:MM", () => {
      const result = formatTime("2024-01-15T14:30:00");
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid time string", () => {
      const result = formatTime("invalid");
      expect(result).toBe("invalid");
    });

    it("should not throw on empty string", () => {
      expect(() => formatTime("")).not.toThrow();
    });
  });
});

describe("formatDate", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatDate).toBeDefined();
      expect(typeof formatDate).toBe("function");
    });

    it("should format ISO date string", () => {
      const result = formatDate("2024-01-15");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format ISO datetime string", () => {
      const result = formatDate("2024-01-15T10:00:00");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date string", () => {
      const result = formatDate("invalid");
      expect(result).toBe("invalid");
    });

    it("should not throw on empty string", () => {
      expect(() => formatDate("")).not.toThrow();
    });
  });
});

describe("formatTimeRange", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatTimeRange).toBeDefined();
      expect(typeof formatTimeRange).toBe("function");
    });

    it("should format valid time range", () => {
      const result = formatTimeRange("09:00", "10:30");
      expect(result).toBe("09:00 - 10:30");
    });

    it("should handle HH:MM:SS format", () => {
      const result = formatTimeRange("14:00:00", "16:00:00");
      expect(result).toBe("14:00 - 16:00");
    });
  });
});

describe("calculateDuration", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(calculateDuration).toBeDefined();
      expect(typeof calculateDuration).toBe("function");
    });

    it("should calculate 90 minutes duration", () => {
      const result = calculateDuration("14:30", "16:00");
      expect(result).toBe(90);
    });

    it("should calculate 60 minutes duration", () => {
      const result = calculateDuration("09:00", "10:00");
      expect(result).toBe(60);
    });

    it("should calculate 45 minutes duration", () => {
      const result = calculateDuration("10:00", "10:45");
      expect(result).toBe(45);
    });
  });

  describe("Edge Cases", () => {
    it("should return NaN for invalid times", () => {
      const result = calculateDuration("invalid", "10:00");
      expect(result).toBeNaN();
    });
  });
});

describe("formatDuration", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatDuration).toBeDefined();
      expect(typeof formatDuration).toBe("function");
    });

    it("should format minutes less than 60", () => {
      const result = formatDuration(45);
      expect(result).toBe("45min");
    });

    it("should format exactly 1 hour", () => {
      const result = formatDuration(60);
      expect(result).toBe("1h");
    });

    it("should format hours and minutes", () => {
      const result = formatDuration(90);
      expect(result).toBe("1h30");
    });

    it("should format exactly 2 hours", () => {
      const result = formatDuration(120);
      expect(result).toBe("2h");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero minutes", () => {
      const result = formatDuration(0);
      expect(result).toBe("0min");
    });
  });
});

describe("normalizeDay", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(normalizeDay).toBeDefined();
      expect(typeof normalizeDay).toBe("function");
    });

    it("should lowercase capitalized day", () => {
      const result = normalizeDay("Lundi");
      expect(result).toBe("lundi");
    });

    it("should trim whitespace", () => {
      const result = normalizeDay("  Mardi  ");
      expect(result).toBe("mardi");
    });

    it("should handle uppercase", () => {
      const result = normalizeDay("MERCREDI");
      expect(result).toBe("mercredi");
    });
  });
});

describe("getDayKey", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getDayKey).toBeDefined();
      expect(typeof getDayKey).toBe("function");
    });

    it("should convert French Monday to English", () => {
      const result = getDayKey("lundi");
      expect(result).toBe("monday");
    });

    it("should convert French Tuesday to English", () => {
      const result = getDayKey("mardi");
      expect(result).toBe("tuesday");
    });

    it("should keep English Monday", () => {
      const result = getDayKey("monday");
      expect(result).toBe("monday");
    });

    it("should normalize and translate", () => {
      const result = getDayKey("  Mercredi  ");
      expect(result).toBe("wednesday");
    });
  });
});

describe("getDayOrder", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getDayOrder).toBeDefined();
      expect(typeof getDayOrder).toBe("function");
    });

    it("should return 0 for Monday (lundi)", () => {
      const result = getDayOrder("lundi");
      expect(result).toBe(0);
    });

    it("should return 0 for Monday (english)", () => {
      const result = getDayOrder("monday");
      expect(result).toBe(0);
    });

    it("should return 6 for Sunday", () => {
      const result = getDayOrder("dimanche");
      expect(result).toBe(6);
    });

    it("should return 999 for unknown day", () => {
      const result = getDayOrder("unknown");
      expect(result).toBe(999);
    });
  });
});

describe("sortDays", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(sortDays).toBeDefined();
      expect(typeof sortDays).toBe("function");
    });

    it("should sort French days correctly", () => {
      const result = sortDays(["vendredi", "lundi", "mercredi"]);
      expect(result).toEqual(["lundi", "mercredi", "vendredi"]);
    });

    it("should sort English days correctly", () => {
      const result = sortDays(["friday", "monday", "wednesday"]);
      expect(result).toEqual(["monday", "wednesday", "friday"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = sortDays([]);
      expect(result).toEqual([]);
    });
  });
});

describe("formatInstructorNames", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatInstructorNames).toBeDefined();
      expect(typeof formatInstructorNames).toBe("function");
    });

    it("should format single instructor with French fields", () => {
      const result = formatInstructorNames([{ nom: "Dupont", prenom: "Jean" }]);
      expect(result).toBe("Jean Dupont");
    });

    it("should format single instructor with English fields", () => {
      const result = formatInstructorNames([{ first_name: "John", last_name: "Doe" }]);
      expect(result).toBe("John Doe");
    });

    it("should format multiple instructors", () => {
      const result = formatInstructorNames([
        { nom: "Dupont", prenom: "Jean" },
        { nom: "Martin", prenom: "Marie" },
      ]);
      expect(result).toBe("Jean Dupont, Marie Martin");
    });
  });

  describe("Edge Cases", () => {
    it("should return default for empty array", () => {
      const result = formatInstructorNames([]);
      expect(result).toBe("Non assigné");
    });
  });
});

describe("createCourseSearchableString", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(createCourseSearchableString).toBeDefined();
      expect(typeof createCourseSearchableString).toBe("function");
    });

    it("should create searchable string from course", () => {
      const result = createCourseSearchableString({
        type_cours: "Yoga",
        nom: "Débutant",
        jour_semaine: "lundi",
      });
      expect(result).toContain("yoga");
      expect(result).toContain("débutant");
      expect(result).toContain("lundi");
    });

    it("should handle partial course data", () => {
      const result = createCourseSearchableString({ type_cours: "Pilates" });
      expect(result).toContain("pilates");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty course", () => {
      const result = createCourseSearchableString({});
      expect(result).toBe("   ");
    });
  });
});

describe("normalizeSearchTerm", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(normalizeSearchTerm).toBeDefined();
      expect(typeof normalizeSearchTerm).toBe("function");
    });

    it("should lowercase and trim", () => {
      const result = normalizeSearchTerm("  YOGA  ");
      expect(result).toBe("yoga");
    });

    it("should handle accented characters", () => {
      const result = normalizeSearchTerm("Débutant");
      expect(result).toBe("débutant");
    });
  });
});

describe("formatCourseType", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatCourseType).toBeDefined();
      expect(typeof formatCourseType).toBe("function");
    });

    it("should capitalize first letter", () => {
      const result = formatCourseType("yoga");
      expect(result).toBe("Yoga");
    });

    it("should capitalize pilates", () => {
      const result = formatCourseType("pilates");
      expect(result).toBe("Pilates");
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
      const result = truncateText("Short text", 100);
      expect(result).toBe("Short text");
    });

    it("should truncate long text", () => {
      const longText = "A".repeat(150);
      const result = truncateText(longText);
      expect(result).toContain("...");
      expect(result.length).toBeLessThan(longText.length);
    });

    it("should truncate with custom length", () => {
      const result = truncateText("Long text here", 10);
      expect(result).toContain("...");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = truncateText("");
      expect(result).toBe("");
    });
  });
});

describe("groupCoursesByDay", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(groupCoursesByDay).toBeDefined();
      expect(typeof groupCoursesByDay).toBe("function");
    });

    it("should group courses by day", () => {
      const courses = [
        { jour_semaine: "lundi", nom: "Yoga" },
        { jour_semaine: "lundi", nom: "Pilates" },
        { jour_semaine: "mardi", nom: "Zumba" },
      ];
      const result = groupCoursesByDay(courses);
      expect(result.lundi).toHaveLength(2);
      expect(result.mardi).toHaveLength(1);
    });

    it("should handle jour field", () => {
      const courses = [
        { jour: "lundi", nom: "Cours 1" },
        { jour: "lundi", nom: "Cours 2" },
      ];
      const result = groupCoursesByDay(courses);
      expect(result.lundi).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = groupCoursesByDay([]);
      expect(result).toEqual({});
    });
  });
});

describe("sortCoursesByTime", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(sortCoursesByTime).toBeDefined();
      expect(typeof sortCoursesByTime).toBe("function");
    });

    it("should sort courses by time", () => {
      const courses = [
        { heure_debut: "14:00", nom: "Course 1" },
        { heure_debut: "10:00", nom: "Course 2" },
        { heure_debut: "12:00", nom: "Course 3" },
      ];
      const result = sortCoursesByTime(courses);
      expect(result[0].heure_debut).toBe("10:00");
      expect(result[1].heure_debut).toBe("12:00");
      expect(result[2].heure_debut).toBe("14:00");
    });

    it("should not mutate original array", () => {
      const courses = [{ heure_debut: "14:00" }, { heure_debut: "10:00" }];
      const original = [...courses];
      sortCoursesByTime(courses);
      expect(courses).toEqual(original);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = sortCoursesByTime([]);
      expect(result).toEqual([]);
    });

    it("should handle single course", () => {
      const courses = [{ heure_debut: "09:00" }];
      const result = sortCoursesByTime(courses);
      expect(result).toHaveLength(1);
    });
  });
});

describe("formatSearchResultsMessage", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatSearchResultsMessage).toBeDefined();
      expect(typeof formatSearchResultsMessage).toBe("function");
    });

    it("should format singular result", () => {
      const result = formatSearchResultsMessage(1, 10);
      expect(result).toBe("1 cours trouvé sur 10");
    });

    it("should format plural results", () => {
      const result = formatSearchResultsMessage(5, 10);
      expect(result).toBe("5 cours trouvés sur 10");
    });

    it("should format zero results", () => {
      const result = formatSearchResultsMessage(0, 10);
      expect(result).toBe("0 cours trouvé sur 10");
    });
  });
});
