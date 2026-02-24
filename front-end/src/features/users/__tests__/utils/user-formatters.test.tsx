/**
 * ====================================================================
 * user-formatters - Unit Tests
 * ====================================================================
 *
 * Tests for pure utility functions that format user data
 *
 * @see src/features/users/utils/user-formatters.ts
 */

import { describe, it, expect } from "vitest";
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
} from "../../utils/user-formatters";

describe("user-formatters", () => {
  // ============================================================================
  // Name Formatting Tests
  // ============================================================================

  describe("formatUserFullName", () => {
    it("should format full name correctly", () => {
      expect(formatUserFullName("Jean", "Dupont")).toBe("Jean Dupont");
    });

    it("should handle first name only", () => {
      expect(formatUserFullName("Jean", "")).toBe("Jean");
    });

    it("should handle last name only", () => {
      expect(formatUserFullName("", "Dupont")).toBe("Dupont");
    });

    it("should return N/A for empty names", () => {
      expect(formatUserFullName("", "")).toBe("N/A");
    });

    it("should trim extra whitespace", () => {
      expect(formatUserFullName("  Jean  ", "  Dupont  ")).toBe("Jean Dupont");
    });
  });

  describe("formatUserInitials", () => {
    it("should format initials correctly", () => {
      expect(formatUserInitials("Jean", "Dupont")).toBe("JD");
    });

    it("should uppercase initials", () => {
      expect(formatUserInitials("jean", "dupont")).toBe("JD");
    });

    it("should handle first name only", () => {
      expect(formatUserInitials("Jean", "")).toBe("J");
    });

    it("should handle last name only", () => {
      expect(formatUserInitials("", "Dupont")).toBe("D");
    });

    it("should return ? for empty names", () => {
      expect(formatUserInitials("", "")).toBe("?");
    });
  });

  describe("formatUserDisplayName", () => {
    it("should use preferred name when provided", () => {
      expect(formatUserDisplayName("Jean", "Dupont", "JD")).toBe("JD");
    });

    it("should fall back to full name when no preferred name", () => {
      expect(formatUserDisplayName("Jean", "Dupont")).toBe("Jean Dupont");
    });

    it("should handle empty preferred name", () => {
      expect(formatUserDisplayName("Jean", "Dupont", "")).toBe("Jean Dupont");
    });
  });

  // ============================================================================
  // Role Tests
  // ============================================================================

  describe("getUserRoleLabel", () => {
    it("should return correct i18n key for admin", () => {
      expect(getUserRoleLabel("admin")).toBe("auth.roles.admin");
    });

    it("should return correct i18n key for teacher", () => {
      expect(getUserRoleLabel("teacher")).toBe("auth.roles.teacher");
    });

    it("should return correct i18n key for student", () => {
      expect(getUserRoleLabel("student")).toBe("auth.roles.student");
    });

    it("should return correct i18n key for member", () => {
      expect(getUserRoleLabel("member")).toBe("auth.roles.member");
    });

    it("should return correct i18n key for guest", () => {
      expect(getUserRoleLabel("guest")).toBe("auth.roles.guest");
    });
  });

  describe("getUserRoleColor", () => {
    it("should return purple for admin", () => {
      expect(getUserRoleColor("admin")).toBe("purple");
    });

    it("should return blue for teacher", () => {
      expect(getUserRoleColor("teacher")).toBe("blue");
    });

    it("should return green for student", () => {
      expect(getUserRoleColor("student")).toBe("green");
    });

    it("should return orange for member", () => {
      expect(getUserRoleColor("member")).toBe("orange");
    });

    it("should return default for guest", () => {
      expect(getUserRoleColor("guest")).toBe("default");
    });
  });

  // ============================================================================
  // Status Tests
  // ============================================================================

  describe("getUserStatusLabel", () => {
    it("should return correct i18n key for active", () => {
      expect(getUserStatusLabel("active")).toBe("common.status.active");
    });

    it("should return correct i18n key for inactive", () => {
      expect(getUserStatusLabel("inactive")).toBe("common.status.inactive");
    });

    it("should return correct i18n key for pending", () => {
      expect(getUserStatusLabel("pending")).toBe("common.status.pending");
    });

    it("should return correct i18n key for suspended", () => {
      expect(getUserStatusLabel("suspended")).toBe("users.status.suspended");
    });

    it("should return correct i18n key for banned", () => {
      expect(getUserStatusLabel("banned")).toBe("users.status.banned");
    });
  });

  describe("getUserStatusColor", () => {
    it("should return success for active", () => {
      expect(getUserStatusColor("active")).toBe("success");
    });

    it("should return default for inactive", () => {
      expect(getUserStatusColor("inactive")).toBe("default");
    });

    it("should return info for pending", () => {
      expect(getUserStatusColor("pending")).toBe("info");
    });

    it("should return warning for suspended", () => {
      expect(getUserStatusColor("suspended")).toBe("warning");
    });

    it("should return danger for banned", () => {
      expect(getUserStatusColor("banned")).toBe("danger");
    });
  });

  // ============================================================================
  // Email Formatting Tests
  // ============================================================================

  describe("formatUserEmail", () => {
    it("should return email as-is when not masked", () => {
      expect(formatUserEmail("jean.dupont@example.com")).toBe("jean.dupont@example.com");
    });

    it("should mask email when requested", () => {
      const masked = formatUserEmail("jean.dupont@example.com", true);
      expect(masked).toContain("***");
      expect(masked).toContain("@example.com");
    });

    it("should preserve domain when masking", () => {
      const masked = formatUserEmail("user@test.com", true);
      expect(masked).toContain("@test.com");
    });

    it("should handle short usernames", () => {
      const masked = formatUserEmail("ab@test.com", true);
      expect(masked).toBe("a***@test.com");
    });
  });

  // ============================================================================
  // Phone Formatting Tests
  // ============================================================================

  describe("formatUserPhone", () => {
    it("should format international phone number", () => {
      const formatted = formatUserPhone("32123456789", "international");
      expect(formatted).toContain("+32");
      expect(formatted).toContain("123");
    });

    it("should format local phone number", () => {
      const formatted = formatUserPhone("0123456789", "local");
      expect(formatted).toContain("0123");
    });

    it("should return N/A for empty phone", () => {
      expect(formatUserPhone("")).toBe("N/A");
    });

    it("should handle phone with spaces and dashes", () => {
      const formatted = formatUserPhone("+32 123-45-67-89", "international");
      expect(formatted).toContain("+32");
    });
  });

  // ============================================================================
  // Date Formatting Tests
  // ============================================================================

  describe("formatUserJoinDate", () => {
    it("should format date with default format", () => {
      const formatted = formatUserJoinDate("2023-01-15");
      expect(formatted).toBe("15/01/2023");
    });

    it("should format date with custom format", () => {
      const formatted = formatUserJoinDate("2023-01-15", "yyyy-MM-dd");
      expect(formatted).toBe("2023-01-15");
    });

    it("should handle Date objects", () => {
      const date = new Date("2023-01-15");
      const formatted = formatUserJoinDate(date);
      expect(formatted).toBe("15/01/2023");
    });

    it("should return N/A for invalid date", () => {
      const formatted = formatUserJoinDate("invalid-date");
      expect(formatted).toBe("N/A");
    });
  });

  describe("formatUserLastLogin", () => {
    it('should return "À l\'instant" for very recent login', () => {
      const now = new Date();
      const formatted = formatUserLastLogin(now);
      expect(formatted).toBe("À l'instant");
    });

    it("should format minutes ago", () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 30);
      const formatted = formatUserLastLogin(date);
      expect(formatted).toContain("min");
    });

    it("should format hours ago", () => {
      const date = new Date();
      date.setHours(date.getHours() - 5);
      const formatted = formatUserLastLogin(date);
      expect(formatted).toContain("h");
    });

    it("should format days ago", () => {
      const date = new Date();
      date.setDate(date.getDate() - 3);
      const formatted = formatUserLastLogin(date);
      expect(formatted).toContain("j");
    });

    it('should return "Jamais" for invalid date', () => {
      const formatted = formatUserLastLogin("invalid-date");
      expect(formatted).toBe("Jamais");
    });
  });

  // ============================================================================
  // Age Calculation Tests
  // ============================================================================

  describe("calculateUserAge", () => {
    it("should calculate age correctly", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const age = calculateUserAge(birthDate);
      expect(age).toBe(25);
    });

    it("should handle ISO date strings", () => {
      const birthDate = "1998-05-15";
      const age = calculateUserAge(birthDate);
      expect(age).toBeGreaterThan(20);
    });

    it("should return 0 for invalid date", () => {
      const age = calculateUserAge("invalid-date");
      expect(age).toBe(0);
    });
  });

  describe("formatUserAge", () => {
    it('should format age with "ans" for multiple years', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const formatted = formatUserAge(birthDate);
      expect(formatted).toBe("25 ans");
    });

    it('should format age with "an" for single year', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 1);
      const formatted = formatUserAge(birthDate);
      expect(formatted).toBe("1 an");
    });

    it("should return N/A for invalid date", () => {
      const formatted = formatUserAge("invalid-date");
      expect(formatted).toBe("N/A");
    });
  });

  // ============================================================================
  // Permission Tests
  // ============================================================================

  describe("isUserActive", () => {
    it("should return true for active status", () => {
      expect(isUserActive("active")).toBe(true);
    });

    it("should return false for inactive status", () => {
      expect(isUserActive("inactive")).toBe(false);
    });

    it("should return false for other statuses", () => {
      expect(isUserActive("pending")).toBe(false);
      expect(isUserActive("suspended")).toBe(false);
      expect(isUserActive("banned")).toBe(false);
    });
  });

  describe("canEditUser", () => {
    it("should return true for active users", () => {
      expect(canEditUser("active")).toBe(true);
    });

    it("should return true for inactive users", () => {
      expect(canEditUser("inactive")).toBe(true);
    });

    it("should return false for banned users", () => {
      expect(canEditUser("banned")).toBe(false);
    });
  });

  describe("canDeleteUser", () => {
    it("should return false for admin role", () => {
      expect(canDeleteUser("admin")).toBe(false);
    });

    it("should return true for other roles", () => {
      expect(canDeleteUser("teacher")).toBe(true);
      expect(canDeleteUser("student")).toBe(true);
      expect(canDeleteUser("member")).toBe(true);
      expect(canDeleteUser("guest")).toBe(true);
    });
  });

  // ============================================================================
  // Sorting Tests
  // ============================================================================

  describe("sortUsersByName", () => {
    const users = [
      { firstName: "Zoe", lastName: "Adams" },
      { firstName: "Alice", lastName: "Brown" },
      { firstName: "Bob", lastName: "Smith" },
    ];

    it("should sort users alphabetically by full name", () => {
      const sorted = sortUsersByName(users);
      expect(sorted[0].firstName).toBe("Alice");
      expect(sorted[1].firstName).toBe("Bob");
      expect(sorted[2].firstName).toBe("Zoe");
    });

    it("should not mutate original array", () => {
      const original = [...users];
      sortUsersByName(users);
      expect(users).toEqual(original);
    });
  });

  describe("sortUsersByJoinDate", () => {
    const users = [
      { createdAt: "2023-01-15" },
      { createdAt: "2023-03-20" },
      { createdAt: "2023-02-10" },
    ];

    it("should sort users by join date (newest first)", () => {
      const sorted = sortUsersByJoinDate(users);
      expect(sorted[0].createdAt).toBe("2023-03-20");
      expect(sorted[1].createdAt).toBe("2023-02-10");
      expect(sorted[2].createdAt).toBe("2023-01-15");
    });

    it("should handle Date objects", () => {
      const usersWithDates = [
        { createdAt: new Date("2023-01-15") },
        { createdAt: new Date("2023-03-20") },
      ];
      const sorted = sortUsersByJoinDate(usersWithDates);
      expect(sorted[0].createdAt.getMonth()).toBe(2); // March (0-indexed)
    });
  });

  // ============================================================================
  // Filtering Tests
  // ============================================================================

  describe("filterUsersByRole", () => {
    const users = [
      { role: "admin" as const },
      { role: "teacher" as const },
      { role: "student" as const },
      { role: "student" as const },
    ];

    it("should filter users by specific role", () => {
      const filtered = filterUsersByRole(users, "student");
      expect(filtered).toHaveLength(2);
      expect(filtered.every((u) => u.role === "student")).toBe(true);
    });

    it('should return all users when role is "all"', () => {
      const filtered = filterUsersByRole(users, "all");
      expect(filtered).toHaveLength(4);
    });

    it("should return empty array when no matches", () => {
      const filtered = filterUsersByRole(users, "guest");
      expect(filtered).toHaveLength(0);
    });
  });

  describe("filterUsersByStatus", () => {
    const users = [
      { status: "active" as const },
      { status: "inactive" as const },
      { status: "active" as const },
      { status: "banned" as const },
    ];

    it("should filter users by specific status", () => {
      const filtered = filterUsersByStatus(users, "active");
      expect(filtered).toHaveLength(2);
      expect(filtered.every((u) => u.status === "active")).toBe(true);
    });

    it('should return all users when status is "all"', () => {
      const filtered = filterUsersByStatus(users, "all");
      expect(filtered).toHaveLength(4);
    });
  });

  // ============================================================================
  // Avatar Tests
  // ============================================================================

  describe("getUserAvatarOrInitials", () => {
    it("should return avatar URL when provided", () => {
      const url = "https://example.com/avatar.jpg";
      expect(getUserAvatarOrInitials(url, "Jean", "Dupont")).toBe(url);
    });

    it("should generate initials URL when no avatar", () => {
      const result = getUserAvatarOrInitials(undefined, "Jean", "Dupont");
      expect(result).toContain("ui-avatars.com");
      expect(result).toContain("JD");
    });

    it("should handle special characters in names", () => {
      const result = getUserAvatarOrInitials(undefined, "Jean-Paul", "D'Arcy");
      expect(result).toContain("ui-avatars.com");
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe("isValidUserEmail", () => {
    it("should validate correct email", () => {
      expect(isValidUserEmail("jean.dupont@example.com")).toBe(true);
    });

    it("should validate email with numbers", () => {
      expect(isValidUserEmail("user123@test.com")).toBe(true);
    });

    it("should reject email without @", () => {
      expect(isValidUserEmail("userexample.com")).toBe(false);
    });

    it("should reject email without domain", () => {
      expect(isValidUserEmail("user@")).toBe(false);
    });

    it("should reject email with spaces", () => {
      expect(isValidUserEmail("user @example.com")).toBe(false);
    });

    it("should reject empty email", () => {
      expect(isValidUserEmail("")).toBe(false);
    });
  });

  // ============================================================================
  // Sanitization Tests
  // ============================================================================

  describe("sanitizeUserInput", () => {
    it("should remove < and > characters", () => {
      expect(sanitizeUserInput('Hello <script>alert("XSS")</script>')).toBe(
        'Hello scriptalert("XSS")/script',
      );
    });

    it("should remove javascript: protocol", () => {
      expect(sanitizeUserInput('javascript:alert("XSS")')).toBe('alert("XSS")');
    });

    it("should trim whitespace", () => {
      expect(sanitizeUserInput("  Hello World  ")).toBe("Hello World");
    });

    it("should handle empty string", () => {
      expect(sanitizeUserInput("")).toBe("");
    });

    it("should preserve safe characters", () => {
      const safe = "Jean-Paul D'Arcy (Admin)";
      expect(sanitizeUserInput(safe)).toBe(safe);
    });
  });
});
