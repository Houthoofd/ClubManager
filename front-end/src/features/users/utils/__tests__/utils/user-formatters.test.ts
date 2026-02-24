/**
 * Tests for user-formatters.ts
 *
 * @file user-formatters.ts
 * @type util
 * @updated Fixed with proper parameters and assertions
 * */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatUserFullName,
  formatUserInitials,
  formatUserDisplayName,
  getUserRoleLabel,
  getUserRoleColor,
  getUserStatusLabel,
  getUserStatusColor,
  formatUserEmail,
  formatUserPhone,
  formatUserJoinDate,
  formatUserLastLogin,
  calculateUserAge,
  formatUserAge,
  isUserActive,
  canEditUser,
  canDeleteUser,
  sortUsersByName,
  sortUsersByJoinDate,
  filterUsersByRole,
  filterUsersByStatus,
  getUserAvatarOrInitials,
  isValidUserEmail,
  sanitizeUserInput,
} from "../../user-formatters";

describe("formatUserFullName", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserFullName).toBeDefined();
      expect(typeof formatUserFullName).toBe("function");
    });

    it("should format full name correctly", () => {
      const result = formatUserFullName("John", "Doe");
      expect(result).toBe("John Doe");
    });

    it("should handle single name", () => {
      const result = formatUserFullName("John", "");
      expect(result).toBe("John");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty names", () => {
      const result = formatUserFullName("", "");
      expect(result).toBe("N/A");
    });

    it("should trim whitespace", () => {
      const result = formatUserFullName("  John  ", "  Doe  ");
      expect(result).toBe("John Doe");
    });
  });
});

describe("formatUserInitials", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserInitials).toBeDefined();
      expect(typeof formatUserInitials).toBe("function");
    });

    it("should format initials correctly", () => {
      const result = formatUserInitials("John", "Doe");
      expect(result).toBe("JD");
    });

    it("should uppercase initials", () => {
      const result = formatUserInitials("john", "doe");
      expect(result).toBe("JD");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty names", () => {
      const result = formatUserInitials("", "");
      expect(result).toBe("?");
    });

    it("should handle single name", () => {
      const result = formatUserInitials("John", "");
      expect(result).toBe("J");
    });
  });
});

describe("formatUserDisplayName", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserDisplayName).toBeDefined();
      expect(typeof formatUserDisplayName).toBe("function");
    });

    it("should use preferred name if provided", () => {
      const result = formatUserDisplayName("John", "Doe", "Johnny");
      expect(result).toBe("Johnny");
    });

    it("should fallback to full name", () => {
      const result = formatUserDisplayName("John", "Doe");
      expect(result).toBe("John Doe");
    });
  });
});

describe("getUserRoleLabel", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getUserRoleLabel).toBeDefined();
      expect(typeof getUserRoleLabel).toBe("function");
    });

    it("should return label for admin", () => {
      const result = getUserRoleLabel("admin");
      expect(result).toBe("auth.roles.admin");
    });

    it("should return label for teacher", () => {
      const result = getUserRoleLabel("teacher");
      expect(result).toBe("auth.roles.teacher");
    });

    it("should return label for student", () => {
      const result = getUserRoleLabel("student");
      expect(result).toBe("auth.roles.student");
    });
  });
});

describe("getUserRoleColor", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getUserRoleColor).toBeDefined();
      expect(typeof getUserRoleColor).toBe("function");
    });

    it("should return purple for admin", () => {
      const result = getUserRoleColor("admin");
      expect(result).toBe("purple");
    });

    it("should return blue for teacher", () => {
      const result = getUserRoleColor("teacher");
      expect(result).toBe("blue");
    });

    it("should return green for student", () => {
      const result = getUserRoleColor("student");
      expect(result).toBe("green");
    });
  });
});

describe("getUserStatusLabel", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getUserStatusLabel).toBeDefined();
      expect(typeof getUserStatusLabel).toBe("function");
    });

    it("should return label for active", () => {
      const result = getUserStatusLabel("active");
      expect(result).toBe("common.status.active");
    });

    it("should return label for inactive", () => {
      const result = getUserStatusLabel("inactive");
      expect(result).toBe("common.status.inactive");
    });

    it("should return label for pending", () => {
      const result = getUserStatusLabel("pending");
      expect(result).toBe("common.status.pending");
    });
  });
});

describe("getUserStatusColor", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getUserStatusColor).toBeDefined();
      expect(typeof getUserStatusColor).toBe("function");
    });

    it("should return success for active", () => {
      const result = getUserStatusColor("active");
      expect(result).toBe("success");
    });

    it("should return info for pending", () => {
      const result = getUserStatusColor("pending");
      expect(result).toBe("info");
    });

    it("should return danger for banned", () => {
      const result = getUserStatusColor("banned");
      expect(result).toBe("danger");
    });
  });
});

describe("formatUserEmail", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserEmail).toBeDefined();
      expect(typeof formatUserEmail).toBe("function");
    });

    it("should return email without masking", () => {
      const result = formatUserEmail("john.doe@example.com", false);
      expect(result).toBe("john.doe@example.com");
    });

    it("should mask email when requested", () => {
      const result = formatUserEmail("john.doe@example.com", true);
      expect(result).toContain("@example.com");
      expect(result).toContain("***");
    });

    it("should default to unmasked", () => {
      const result = formatUserEmail("test@example.com");
      expect(result).toBe("test@example.com");
    });
  });
});

describe("formatUserPhone", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserPhone).toBeDefined();
      expect(typeof formatUserPhone).toBe("function");
    });

    it("should format international phone", () => {
      const result = formatUserPhone("32123456789", "international");
      expect(result).toContain("+32");
    });

    it("should format local phone", () => {
      const result = formatUserPhone("0123456789", "local");
      expect(result).toMatch(/\d{4}\s\d{2}\s\d{2}\s\d{2}/);
    });

    it("should handle N/A for empty phone", () => {
      const result = formatUserPhone("", "international");
      expect(result).toBe("N/A");
    });
  });
});

describe("formatUserJoinDate", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserJoinDate).toBeDefined();
      expect(typeof formatUserJoinDate).toBe("function");
    });

    it("should format ISO date string", () => {
      const result = formatUserJoinDate("2024-01-15");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format Date object", () => {
      const result = formatUserJoinDate(new Date("2024-01-15"));
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date", () => {
      const result = formatUserJoinDate("invalid");
      expect(result).toBe("N/A");
    });
  });
});

describe("formatUserLastLogin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserLastLogin).toBeDefined();
      expect(typeof formatUserLastLogin).toBe("function");
    });

    it("should format recent login", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatUserLastLogin("2024-01-15T14:29:30");
      expect(result).toBe("À l'instant");
    });

    it("should format login in minutes", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatUserLastLogin("2024-01-15T14:15:00");
      expect(result).toContain("min");
    });

    it("should format login in hours", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatUserLastLogin("2024-01-15T12:30:00");
      expect(result).toContain("h");
    });

    it("should format login in days", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatUserLastLogin("2024-01-13T14:30:00");
      expect(result).toContain("j");
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date", () => {
      const result = formatUserLastLogin("invalid");
      expect(result).toBe("Jamais");
    });
  });
});

describe("calculateUserAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(calculateUserAge).toBeDefined();
      expect(typeof calculateUserAge).toBe("function");
    });

    it("should calculate age correctly", () => {
      vi.setSystemTime(new Date("2024-01-15"));
      const result = calculateUserAge("1999-01-15");
      expect(result).toBe(25);
    });

    it("should handle Date object", () => {
      vi.setSystemTime(new Date("2024-01-15"));
      const result = calculateUserAge(new Date("2000-01-15"));
      expect(result).toBe(24);
    });
  });

  describe("Edge Cases", () => {
    it("should return 0 for invalid date", () => {
      const result = calculateUserAge("invalid");
      expect(result).toBe(0);
    });
  });
});

describe("formatUserAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUserAge).toBeDefined();
      expect(typeof formatUserAge).toBe("function");
    });

    it("should format age with years", () => {
      vi.setSystemTime(new Date("2024-01-15"));
      const result = formatUserAge("1999-01-15");
      expect(result).toBe("25 ans");
    });

    it("should format single year", () => {
      vi.setSystemTime(new Date("2024-01-15"));
      const result = formatUserAge("2023-01-15");
      expect(result).toBe("1 an");
    });
  });

  describe("Edge Cases", () => {
    it("should return N/A for invalid age", () => {
      const result = formatUserAge("invalid");
      expect(result).toBe("N/A");
    });
  });
});

describe("isUserActive", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(isUserActive).toBeDefined();
      expect(typeof isUserActive).toBe("function");
    });

    it("should return true for active status", () => {
      const result = isUserActive("active");
      expect(result).toBe(true);
    });

    it("should return false for inactive status", () => {
      const result = isUserActive("inactive");
      expect(result).toBe(false);
    });

    it("should return false for pending status", () => {
      const result = isUserActive("pending");
      expect(result).toBe(false);
    });
  });
});

describe("canEditUser", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(canEditUser).toBeDefined();
      expect(typeof canEditUser).toBe("function");
    });

    it("should return true for active users", () => {
      const result = canEditUser("active");
      expect(result).toBe(true);
    });

    it("should return false for banned users", () => {
      const result = canEditUser("banned");
      expect(result).toBe(false);
    });

    it("should return true for suspended users", () => {
      const result = canEditUser("suspended");
      expect(result).toBe(true);
    });
  });
});

describe("canDeleteUser", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(canDeleteUser).toBeDefined();
      expect(typeof canDeleteUser).toBe("function");
    });

    it("should return false for admin", () => {
      const result = canDeleteUser("admin");
      expect(result).toBe(false);
    });

    it("should return true for teacher", () => {
      const result = canDeleteUser("teacher");
      expect(result).toBe(true);
    });

    it("should return true for student", () => {
      const result = canDeleteUser("student");
      expect(result).toBe(true);
    });
  });
});

describe("sortUsersByName", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(sortUsersByName).toBeDefined();
      expect(typeof sortUsersByName).toBe("function");
    });

    it("should sort users alphabetically", () => {
      const users = [
        { firstName: "John", lastName: "Doe" },
        { firstName: "Alice", lastName: "Smith" },
        { firstName: "Bob", lastName: "Johnson" },
      ];
      const result = sortUsersByName(users);
      expect(result[0].firstName).toBe("Alice");
      expect(result[1].firstName).toBe("Bob");
      expect(result[2].firstName).toBe("John");
    });

    it("should not mutate original array", () => {
      const users = [
        { firstName: "John", lastName: "Doe" },
        { firstName: "Alice", lastName: "Smith" },
      ];
      const original = [...users];
      sortUsersByName(users);
      expect(users).toEqual(original);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = sortUsersByName([]);
      expect(result).toEqual([]);
    });
  });
});

describe("sortUsersByJoinDate", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(sortUsersByJoinDate).toBeDefined();
      expect(typeof sortUsersByJoinDate).toBe("function");
    });

    it("should sort users newest first", () => {
      const users = [
        { createdAt: "2024-01-10", id: 1 },
        { createdAt: "2024-01-15", id: 2 },
        { createdAt: "2024-01-12", id: 3 },
      ];
      const result = sortUsersByJoinDate(users);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(1);
    });

    it("should handle Date objects", () => {
      const users = [
        { createdAt: new Date("2024-01-10"), id: 1 },
        { createdAt: new Date("2024-01-15"), id: 2 },
      ];
      const result = sortUsersByJoinDate(users);
      expect(result[0].id).toBe(2);
    });
  });
});

describe("filterUsersByRole", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(filterUsersByRole).toBeDefined();
      expect(typeof filterUsersByRole).toBe("function");
    });

    it("should filter users by role", () => {
      const users = [
        { role: "admin" as const, id: 1 },
        { role: "teacher" as const, id: 2 },
        { role: "student" as const, id: 3 },
      ];
      const result = filterUsersByRole(users, "teacher");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it("should return all users when role is 'all'", () => {
      const users = [
        { role: "admin" as const, id: 1 },
        { role: "teacher" as const, id: 2 },
      ];
      const result = filterUsersByRole(users, "all");
      expect(result).toHaveLength(2);
    });
  });
});

describe("filterUsersByStatus", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(filterUsersByStatus).toBeDefined();
      expect(typeof filterUsersByStatus).toBe("function");
    });

    it("should filter users by status", () => {
      const users = [
        { status: "active" as const, id: 1 },
        { status: "inactive" as const, id: 2 },
        { status: "active" as const, id: 3 },
      ];
      const result = filterUsersByStatus(users, "active");
      expect(result).toHaveLength(2);
    });

    it("should return all users when status is 'all'", () => {
      const users = [
        { status: "active" as const, id: 1 },
        { status: "inactive" as const, id: 2 },
      ];
      const result = filterUsersByStatus(users, "all");
      expect(result).toHaveLength(2);
    });
  });
});

describe("getUserAvatarOrInitials", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(getUserAvatarOrInitials).toBeDefined();
      expect(typeof getUserAvatarOrInitials).toBe("function");
    });

    it("should return avatar URL if provided", () => {
      const result = getUserAvatarOrInitials("https://example.com/avatar.jpg", "John", "Doe");
      expect(result).toBe("https://example.com/avatar.jpg");
    });

    it("should generate initials URL if no avatar", () => {
      const result = getUserAvatarOrInitials(undefined, "John", "Doe");
      expect(result).toContain("ui-avatars.com");
      expect(result).toContain("JD");
    });
  });
});

describe("isValidUserEmail", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(isValidUserEmail).toBeDefined();
      expect(typeof isValidUserEmail).toBe("function");
    });

    it("should validate correct email", () => {
      const result = isValidUserEmail("test@example.com");
      expect(result).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = isValidUserEmail("invalid-email");
      expect(result).toBe(false);
    });

    it("should reject email without @", () => {
      const result = isValidUserEmail("testexample.com");
      expect(result).toBe(false);
    });
  });
});

describe("sanitizeUserInput", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(sanitizeUserInput).toBeDefined();
      expect(typeof sanitizeUserInput).toBe("function");
    });

    it("should remove < and >", () => {
      const result = sanitizeUserInput("<script>alert('xss')</script>");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should remove javascript: protocol", () => {
      const result = sanitizeUserInput("javascript:alert('xss')");
      expect(result).not.toContain("javascript:");
    });

    it("should trim whitespace", () => {
      const result = sanitizeUserInput("  test  ");
      expect(result).toBe("test");
    });

    it("should handle clean input", () => {
      const result = sanitizeUserInput("Clean text");
      expect(result).toBe("Clean text");
    });
  });
});
