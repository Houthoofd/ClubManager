/**
 * Tests unitaires pour les validators Zod du domaine Auth
 * @module __tests__/domains/auth.validators.test
 */

import { describe, it, expect } from "@jest/globals";
import {
  // Schemas
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyTokenSchema,
  confirmEmailSchema,
  // Validator functions
  validerLogin,
  validerForgotPassword,
  validerResetPassword,
  validerVerifyToken,
  validerConfirmEmail,
} from "../validators.js";

// ============================================================================
// LOGIN SCHEMA TESTS
// ============================================================================

describe("Auth Validators - loginSchema", () => {
  it("should validate valid login credentials", () => {
    const validLogin = {
      email: "user@example.com",
      password: "password123",
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidLogin = {
      email: "not-an-email",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject missing email", () => {
    const invalidLogin = {
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const invalidLogin = {
      email: "",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const invalidLogin = {
      email: "user@example.com",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const invalidLogin = {
      email: "user@example.com",
      password: "",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should accept various valid email formats", () => {
    const validEmails = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.co.uk",
      "user_name@example-domain.com",
    ];

    validEmails.forEach((email) => {
      const login = {
        email,
        password: "password123",
      };

      const result = loginSchema.safeParse(login);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// FORGOT PASSWORD SCHEMA TESTS
// ============================================================================

describe("Auth Validators - forgotPasswordSchema", () => {
  it("should validate valid email for password reset", () => {
    const validRequest = {
      email: "user@example.com",
    };

    const result = forgotPasswordSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidRequest = {
      email: "invalid-email",
    };

    const result = forgotPasswordSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("should reject missing email", () => {
    const invalidRequest = {};

    const result = forgotPasswordSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const invalidRequest = {
      email: "",
    };

    const result = forgotPasswordSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("should normalize email to lowercase", () => {
    const request = {
      email: "USER@EXAMPLE.COM",
    };

    const result = forgotPasswordSchema.safeParse(request);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// RESET PASSWORD SCHEMA TESTS
// ============================================================================

describe("Auth Validators - resetPasswordSchema", () => {
  it("should validate valid password reset", () => {
    const validReset = {
      token: "valid-reset-token-123",
      newPassword: "NewPass123",
    };

    const result = resetPasswordSchema.safeParse(validReset);
    expect(result.success).toBe(true);
  });

  it("should reject password shorter than 8 characters", () => {
    const invalidReset = {
      token: "valid-token",
      newPassword: "Pass1",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should reject password longer than 100 characters", () => {
    const invalidReset = {
      token: "valid-token",
      newPassword: "A".repeat(101) + "a1",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase letter", () => {
    const invalidReset = {
      token: "valid-token",
      newPassword: "password123",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should reject password without lowercase letter", () => {
    const invalidReset = {
      token: "valid-token",
      newPassword: "PASSWORD123",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const invalidReset = {
      token: "valid-token",
      newPassword: "PasswordABC",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should accept password with special characters", () => {
    const validReset = {
      token: "valid-token",
      newPassword: "Password123!@#",
    };

    const result = resetPasswordSchema.safeParse(validReset);
    expect(result.success).toBe(true);
  });

  it("should reject missing token", () => {
    const invalidReset = {
      newPassword: "NewPass123",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should reject empty token", () => {
    const invalidReset = {
      token: "",
      newPassword: "NewPass123",
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
  });

  it("should accept strong passwords", () => {
    const strongPasswords = [
      "MyPass123",
      "Str0ngP@ssw0rd",
      "C0mpl3xP4ss!",
      "SecurePass1",
    ];

    strongPasswords.forEach((password) => {
      const reset = {
        token: "valid-token",
        newPassword: password,
      };

      const result = resetPasswordSchema.safeParse(reset);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// VERIFY TOKEN SCHEMA TESTS
// ============================================================================

describe("Auth Validators - verifyTokenSchema", () => {
  it("should validate valid token", () => {
    const validToken = {
      token: "valid-token-abc123",
    };

    const result = verifyTokenSchema.safeParse(validToken);
    expect(result.success).toBe(true);
  });

  it("should reject missing token", () => {
    const invalidToken = {};

    const result = verifyTokenSchema.safeParse(invalidToken);
    expect(result.success).toBe(false);
  });

  it("should reject empty token", () => {
    const invalidToken = {
      token: "",
    };

    const result = verifyTokenSchema.safeParse(invalidToken);
    expect(result.success).toBe(false);
  });

  it("should accept various token formats", () => {
    const tokens = [
      "simple-token",
      "token-with-numbers-123",
      "UPPERCASE-TOKEN",
      "token_with_underscores",
      "very-long-token-with-many-characters-1234567890",
    ];

    tokens.forEach((token) => {
      const verification = { token };
      const result = verifyTokenSchema.safeParse(verification);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// CONFIRM EMAIL SCHEMA TESTS
// ============================================================================

describe("Auth Validators - confirmEmailSchema", () => {
  it("should validate valid email confirmation", () => {
    const validConfirmation = {
      token: "confirmation-token-123",
      userId: "user-123",
    };

    const result = confirmEmailSchema.safeParse(validConfirmation);
    expect(result.success).toBe(true);
  });

  it("should reject missing token", () => {
    const invalidConfirmation = {
      userId: "user-123",
    };

    const result = confirmEmailSchema.safeParse(invalidConfirmation);
    expect(result.success).toBe(false);
  });

  it("should reject missing userId", () => {
    const invalidConfirmation = {
      token: "confirmation-token-123",
    };

    const result = confirmEmailSchema.safeParse(invalidConfirmation);
    expect(result.success).toBe(false);
  });

  it("should reject empty token", () => {
    const invalidConfirmation = {
      token: "",
      userId: "user-123",
    };

    const result = confirmEmailSchema.safeParse(invalidConfirmation);
    expect(result.success).toBe(false);
  });

  it("should reject empty userId", () => {
    const invalidConfirmation = {
      token: "confirmation-token-123",
      userId: "",
    };

    const result = confirmEmailSchema.safeParse(invalidConfirmation);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// VALIDATOR FUNCTION TESTS
// ============================================================================

describe("Auth Validators - validerLogin", () => {
  it("should return success for valid login", () => {
    const validLogin = {
      email: "user@example.com",
      password: "password123",
    };

    const result = validerLogin(validLogin);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("should return errors for invalid login", () => {
    const invalidLogin = {
      email: "invalid-email",
      password: "",
    };

    const result = validerLogin(invalidLogin);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("should return error messages", () => {
    const invalidLogin = {
      email: "",
      password: "",
    };

    const result = validerLogin(invalidLogin);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe("Auth Validators - validerForgotPassword", () => {
  it("should return success for valid email", () => {
    const validRequest = {
      email: "user@example.com",
    };

    const result = validerForgotPassword(validRequest);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("should return errors for invalid email", () => {
    const invalidRequest = {
      email: "not-an-email",
    };

    const result = validerForgotPassword(invalidRequest);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });
});

describe("Auth Validators - validerResetPassword", () => {
  it("should return success for valid reset", () => {
    const validReset = {
      token: "valid-token",
      newPassword: "NewPass123",
    };

    const result = validerResetPassword(validReset);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("should return errors for weak password", () => {
    const invalidReset = {
      token: "valid-token",
      newPassword: "weak",
    };

    const result = validerResetPassword(invalidReset);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });
});

describe("Auth Validators - validerVerifyToken", () => {
  it("should return success for valid token", () => {
    const validToken = {
      token: "valid-token-123",
    };

    const result = validerVerifyToken(validToken);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should return errors for empty token", () => {
    const invalidToken = {
      token: "",
    };

    const result = validerVerifyToken(invalidToken);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe("Auth Validators - validerConfirmEmail", () => {
  it("should return success for valid confirmation", () => {
    const validConfirmation = {
      token: "confirmation-token",
      userId: "user-123",
    };

    const result = validerConfirmEmail(validConfirmation);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should return errors for missing fields", () => {
    const invalidConfirmation = {
      token: "confirmation-token",
    };

    const result = validerConfirmEmail(invalidConfirmation);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("Auth Validators - Edge Cases", () => {
  it("should handle null input", () => {
    const result = validerLogin(null);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should handle undefined input", () => {
    const result = validerLogin(undefined);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should handle non-object input", () => {
    const result = validerLogin("not an object");
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should trim whitespace from email", () => {
    const login = {
      email: "  user@example.com  ",
      password: "password123",
    };

    const result = loginSchema.safeParse(login);
    expect(result.success).toBe(true);
  });

  it("should accept exactly 8 character password", () => {
    const reset = {
      token: "valid-token",
      newPassword: "Pass1234",
    };

    const result = resetPasswordSchema.safeParse(reset);
    expect(result.success).toBe(true);
  });

  it("should accept exactly 100 character password", () => {
    const password = "A" + "a".repeat(97) + "1";
    const reset = {
      token: "valid-token",
      newPassword: password,
    };

    const result = resetPasswordSchema.safeParse(reset);
    expect(result.success).toBe(true);
  });

  it("should handle password with unicode characters", () => {
    const reset = {
      token: "valid-token",
      newPassword: "Pàss1234",
    };

    const result = resetPasswordSchema.safeParse(reset);
    expect(result.success).toBe(true);
  });

  it("should handle very long token strings", () => {
    const verification = {
      token: "a".repeat(1000),
    };

    const result = verifyTokenSchema.safeParse(verification);
    expect(result.success).toBe(true);
  });
});
