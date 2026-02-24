/**
 * Inscription Validation Tests
 *
 * Comprehensive test suite for form validation utilities.
 * Tests cover all validation functions with realistic scenarios.
 *
 * @see src/shared/utils/inscriptionValidation.ts
 */

import { describe, it, expect, vi } from "vitest";
import { ValidatedOptions } from "@patternfly/react-core";
import {
  validatePrenom,
  validateNom,
  validateEmail,
  calculatePasswordStrength,
  validatePassword,
  validateConfirmPassword,
  validateDateNaissance,
} from "../inscriptionValidation";

describe("inscriptionValidation", () => {
  // ============================================================================
  // Prénom Validation
  // ============================================================================

  describe("validatePrenom", () => {
    it("should validate correct first name", () => {
      const result = validatePrenom("Jean");
      expect(result.isValid).toBe(true);
      expect(result.validated).toBe(ValidatedOptions.success);
    });

    it("should accept name with accents", () => {
      const result = validatePrenom("François");
      expect(result.isValid).toBe(true);
    });

    it("should accept name with apostrophe", () => {
      const result = validatePrenom("D'Artagnan");
      expect(result.isValid).toBe(true);
    });

    it("should accept name with hyphen", () => {
      const result = validatePrenom("Jean-Paul");
      expect(result.isValid).toBe(true);
    });

    it("should reject empty name", () => {
      const result = validatePrenom("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject name with only spaces", () => {
      const result = validatePrenom("   ");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject too short name", () => {
      const result = validatePrenom("A");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("2 caractères");
    });

    it("should reject too long name", () => {
      const result = validatePrenom("A".repeat(31));
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("30 caractères");
    });

    it("should reject name with numbers", () => {
      const result = validatePrenom("Jean123");
      expect(result.isValid).toBe(false);
    });

    it("should reject name starting with space", () => {
      const result = validatePrenom(" Jean");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("espace");
    });

    it("should reject name ending with space", () => {
      const result = validatePrenom("Jean ");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("espace");
    });

    it("should accept minimum valid length", () => {
      const result = validatePrenom("Jo");
      expect(result.isValid).toBe(true);
    });

    it("should accept maximum valid length", () => {
      const result = validatePrenom("A".repeat(30));
      expect(result.isValid).toBe(true);
    });
  });

  // ============================================================================
  // Nom Validation
  // ============================================================================

  describe("validateNom", () => {
    it("should validate correct last name", () => {
      const result = validateNom("Dupont");
      expect(result.isValid).toBe(true);
      expect(result.validated).toBe(ValidatedOptions.success);
    });

    it("should accept name with accents", () => {
      const result = validateNom("Müller");
      expect(result.isValid).toBe(true);
    });

    it("should accept compound name", () => {
      const result = validateNom("Martin-Dubois");
      expect(result.isValid).toBe(true);
    });

    it("should reject empty name", () => {
      const result = validateNom("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject too short name", () => {
      const result = validateNom("A");
      expect(result.isValid).toBe(false);
    });

    it("should reject too long name", () => {
      const result = validateNom("D".repeat(31));
      expect(result.isValid).toBe(false);
    });

    it("should reject name with special characters", () => {
      const result = validateNom("Dupont@123");
      expect(result.isValid).toBe(false);
    });
  });

  // ============================================================================
  // Email Validation
  // ============================================================================

  describe("validateEmail", () => {
    it("should validate correct email", () => {
      const result = validateEmail("user@example.com");
      expect(result.isValid).toBe(true);
      expect(result.validated).toBe(ValidatedOptions.success);
    });

    it("should accept email with dots", () => {
      const result = validateEmail("user.name@example.com");
      expect(result.isValid).toBe(true);
    });

    it("should accept email with plus", () => {
      const result = validateEmail("user+tag@example.com");
      expect(result.isValid).toBe(true);
    });

    it("should normalize email to lowercase", () => {
      const result = validateEmail("USER@EXAMPLE.COM");
      expect(result.isValid).toBe(true);
    });

    it("should reject empty email", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject email without @", () => {
      const result = validateEmail("userexample.com");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("invalide");
    });

    it("should reject email without domain", () => {
      const result = validateEmail("user@");
      expect(result.isValid).toBe(false);
    });

    it("should reject too long email", () => {
      const result = validateEmail("a".repeat(90) + "@example.com");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("100 caractères");
    });

    it("should handle trimming whitespace", () => {
      const result = validateEmail("  user@example.com  ");
      expect(result.isValid).toBe(true);
    });
  });

  // ============================================================================
  // Password Strength Calculation
  // ============================================================================

  describe("calculatePasswordStrength", () => {
    it("should return low strength for empty password", () => {
      const strength = calculatePasswordStrength("");
      expect(strength).toBeLessThan(3);
    });

    it("should return low strength for weak password", () => {
      const strength = calculatePasswordStrength("abc123");
      expect(strength).toBeLessThan(4);
    });

    it("should return medium strength for decent password", () => {
      const strength = calculatePasswordStrength("Abc123456");
      expect(strength).toBeGreaterThanOrEqual(4);
    });

    it("should return high strength for strong password", () => {
      const strength = calculatePasswordStrength("MyP@ssw0rd123!");
      expect(strength).toBeGreaterThanOrEqual(6);
    });

    it("should reward length >= 8", () => {
      const short = calculatePasswordStrength("Ab1@");
      const long = calculatePasswordStrength("Ab1@5678");
      expect(long).toBeGreaterThan(short);
    });

    it("should reward length >= 12", () => {
      const medium = calculatePasswordStrength("Ab1@5678");
      const longer = calculatePasswordStrength("Ab1@56789012");
      expect(longer).toBeGreaterThan(medium);
    });

    it("should detect lowercase letters", () => {
      const withLower = calculatePasswordStrength("abc12345678");
      const withoutLower = calculatePasswordStrength("ABC12345678");
      expect(withLower).toBeGreaterThanOrEqual(withoutLower);
    });

    it("should detect uppercase letters", () => {
      const withUpper = calculatePasswordStrength("Abc12345678");
      const withoutUpper = calculatePasswordStrength("abc12345678");
      expect(withUpper).toBeGreaterThan(withoutUpper);
    });

    it("should detect digits", () => {
      const withDigits = calculatePasswordStrength("abcdef123");
      const withoutDigits = calculatePasswordStrength("abcdefghi");
      expect(withDigits).toBeGreaterThan(withoutDigits);
    });

    it("should detect special characters", () => {
      const withSpecial = calculatePasswordStrength("abc123@!");
      const withoutSpecial = calculatePasswordStrength("abc12345");
      expect(withSpecial).toBeGreaterThan(withoutSpecial);
    });

    it("should cap strength at 8", () => {
      const strength = calculatePasswordStrength("MyV3ry$tr0ng&C0mpl3xP@ssw0rd!");
      expect(strength).toBeLessThanOrEqual(8);
    });
  });

  // ============================================================================
  // Password Validation
  // ============================================================================

  describe("validatePassword", () => {
    const mockSetStrength = vi.fn();

    it("should validate strong password", () => {
      const result = validatePassword("MyP@ssw0rd123", mockSetStrength);
      expect(result.isValid).toBe(true);
      expect(result.validated).toBe(ValidatedOptions.success);
    });

    it("should call setPasswordStrength callback", () => {
      mockSetStrength.mockClear();
      validatePassword("MyP@ssw0rd123", mockSetStrength);
      expect(mockSetStrength).toHaveBeenCalled();
    });

    it("should reject empty password", () => {
      const result = validatePassword("", mockSetStrength);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject too short password", () => {
      const result = validatePassword("Abc1@", mockSetStrength);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("8 caractères");
    });

    it("should reject too long password", () => {
      const result = validatePassword("A".repeat(129), mockSetStrength);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("128 caractères");
    });

    it("should reject weak password", () => {
      const result = validatePassword("abcdefgh", mockSetStrength);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("faible");
    });

    it("should reject password without uppercase", () => {
      const result = validatePassword("myp@ssw0rd123", mockSetStrength);
      expect(result.isValid).toBe(false);
    });

    it("should reject password without lowercase", () => {
      const result = validatePassword("MYP@SSW0RD123", mockSetStrength);
      expect(result.isValid).toBe(false);
    });

    it("should reject password without digit", () => {
      const result = validatePassword("MyP@ssword", mockSetStrength);
      expect(result.isValid).toBe(false);
    });

    it("should reject password without special char", () => {
      const result = validatePassword("MyPassw0rd123", mockSetStrength);
      expect(result.isValid).toBe(false);
    });

    it("should accept minimum valid password", () => {
      const result = validatePassword("MyP@ss1!", mockSetStrength);
      expect(result.isValid).toBe(true);
    });
  });

  // ============================================================================
  // Confirm Password Validation
  // ============================================================================

  describe("validateConfirmPassword", () => {
    it("should validate matching passwords", () => {
      const result = validateConfirmPassword("MyP@ss123", "MyP@ss123");
      expect(result.isValid).toBe(true);
      expect(result.validated).toBe(ValidatedOptions.success);
    });

    it("should reject empty confirmation", () => {
      const result = validateConfirmPassword("", "MyP@ss123");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject non-matching passwords", () => {
      const result = validateConfirmPassword("MyP@ss123", "Different123");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("correspondent pas");
    });

    it("should be case-sensitive", () => {
      const result = validateConfirmPassword("MyP@ss123", "myp@ss123");
      expect(result.isValid).toBe(false);
    });
  });

  // ============================================================================
  // Date de Naissance Validation
  // ============================================================================

  describe("validateDateNaissance", () => {
    it("should validate correct birth date", () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      const dateStr = twentyYearsAgo.toISOString().split("T")[0];

      const result = validateDateNaissance(dateStr);
      expect(result.isValid).toBe(true);
      expect(result.validated).toBe(ValidatedOptions.success);
    });

    it("should reject empty date", () => {
      const result = validateDateNaissance("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatoire");
    });

    it("should reject invalid date", () => {
      const result = validateDateNaissance("invalid-date");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("invalide");
    });

    it("should reject future date", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const result = validateDateNaissance(dateStr);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("futur");
    });

    it("should reject today's date", () => {
      const today = new Date().toISOString().split("T")[0];
      const result = validateDateNaissance(today);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("aujourd'hui");
    });

    it("should reject age under 5", () => {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const dateStr = threeYearsAgo.toISOString().split("T")[0];

      const result = validateDateNaissance(dateStr);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("insuffisant");
    });

    it("should accept exactly 5 years old", () => {
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      fiveYearsAgo.setDate(fiveYearsAgo.getDate() - 1); // -1 day to be safe
      const dateStr = fiveYearsAgo.toISOString().split("T")[0];

      const result = validateDateNaissance(dateStr);
      expect(result.isValid).toBe(true);
    });

    it("should reject age over 100", () => {
      const result = validateDateNaissance("1920-01-01");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("100 ans");
    });

    it("should reject year before 1900", () => {
      const result = validateDateNaissance("1899-12-31");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("100 ans");
    });

    it("should include age in success message", () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      const dateStr = twentyYearsAgo.toISOString().split("T")[0];

      const result = validateDateNaissance(dateStr);
      expect(result.message).toContain("ans");
    });
  });
});
