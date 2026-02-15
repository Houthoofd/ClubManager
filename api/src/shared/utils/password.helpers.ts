/**
 * Password Helpers
 *
 * Utilities for password hashing, validation, and strength checking.
 */

import * as bcrypt from "bcryptjs";
import { appConfig } from "../config/app.config.js";

export interface PasswordStrengthResult {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isStrong: boolean;
  crackTimeSeconds: number;
  crackTimeDisplay: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = appConfig.security.bcryptRounds || 12;
  return bcrypt.hash(password, rounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if password needs rehashing (e.g., when bcrypt rounds increase)
 */
export function needsRehash(hash: string): boolean {
  const rounds = appConfig.security.bcryptRounds || 12;
  const currentRounds = bcrypt.getRounds(hash);
  return currentRounds < rounds;
}

/**
 * Validate password against security policy
 */
export function validatePasswordPolicy(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = appConfig.security;

  if (password.length < config.passwordMinLength) {
    errors.push(
      `Password must be at least ${config.passwordMinLength} characters`,
    );
  }

  if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (config.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (config.passwordRequireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (config.passwordRequireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength (0-4)
 * Based on zxcvbn-inspired algorithm
 */
export function calculatePasswordStrength(
  password: string,
): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const varietyScore = [hasLower, hasUpper, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;

  if (varietyScore >= 3) score++;
  if (varietyScore === 4) score++;

  // Common patterns (reduce score)
  const commonPatterns = [
    /^123/,
    /password/i,
    /qwerty/i,
    /abc/i,
    /111/,
    /000/,
    /admin/i,
  ];

  const hasCommonPattern = commonPatterns.some((pattern) =>
    pattern.test(password),
  );
  if (hasCommonPattern) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common patterns and words");
  }

  // Repeating characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Avoid repeating characters");
  }

  // Sequential characters
  const sequential =
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
  if (sequential.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Avoid sequential characters");
  }

  // Ensure score is between 0 and 4
  score = Math.max(0, Math.min(4, score));

  // Generate feedback based on score
  if (score === 0) {
    feedback.unshift("Very weak password");
  } else if (score === 1) {
    feedback.unshift("Weak password");
  } else if (score === 2) {
    feedback.unshift("Fair password");
  } else if (score === 3) {
    feedback.unshift("Strong password");
  } else {
    feedback.unshift("Very strong password");
  }

  // Add positive feedback
  if (password.length >= 16) {
    feedback.push("Good length!");
  }
  if (varietyScore === 4) {
    feedback.push("Great character variety!");
  }

  // Estimate crack time
  const crackTimeSeconds = estimateCrackTime(password, score);
  const crackTimeDisplay = formatCrackTime(crackTimeSeconds);

  return {
    score,
    feedback,
    isStrong: score >= 3,
    crackTimeSeconds,
    crackTimeDisplay,
  };
}

/**
 * Estimate time to crack password (simplified)
 */
function estimateCrackTime(password: string, score: number): number {
  let entropy = 0;

  // Calculate character space
  let charSpace = 0;
  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSpace += 33;

  // Calculate entropy bits
  entropy = password.length * Math.log2(charSpace);

  // Assume 1 billion guesses per second
  const guessesPerSecond = 1_000_000_000;
  const possibleCombinations = Math.pow(2, entropy);
  const seconds = possibleCombinations / (2 * guessesPerSecond); // Divide by 2 for average

  // Adjust based on score (account for common patterns)
  const adjustmentFactor = [0.01, 0.1, 0.5, 1, 2][score];
  return seconds * adjustmentFactor;
}

/**
 * Format crack time in human-readable format
 */
function formatCrackTime(seconds: number): string {
  if (seconds < 1) return "Instant";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;

  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1000000) return `${Math.round(years / 1000)} thousand years`;
  if (years < 1000000000) return `${Math.round(years / 1000000)} million years`;

  return "Centuries";
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + special;

  let password = "";

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Check if password has been compromised (simplified version)
 * In production, integrate with HaveIBeenPwned API
 */
export function checkCommonPasswords(password: string): boolean {
  const commonPasswords = [
    "password",
    "Password",
    "password123",
    "Password123",
    "123456",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty",
    "abc123",
    "password1",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "1234",
    "dragon",
    "master",
    "sunshine",
    "princess",
    "football",
    "baseball",
    "superman",
    "batman",
    "trustno1",
    "iloveyou",
    "hello",
    "welcome1",
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some((common) =>
    lowerPassword.includes(common.toLowerCase()),
  );
}

/**
 * Validate password strength meets minimum requirements
 */
export function meetsMinimumStrength(
  password: string,
  minScore: number = 3,
): boolean {
  const strength = calculatePasswordStrength(password);
  return strength.score >= minScore;
}

/**
 * Get password requirements as text
 */
export function getPasswordRequirements(): string[] {
  const config = appConfig.security;
  const requirements: string[] = [];

  requirements.push(`At least ${config.passwordMinLength} characters`);

  if (config.passwordRequireUppercase) {
    requirements.push("At least one uppercase letter");
  }

  if (config.passwordRequireLowercase) {
    requirements.push("At least one lowercase letter");
  }

  if (config.passwordRequireNumbers) {
    requirements.push("At least one number");
  }

  if (config.passwordRequireSpecialChars) {
    requirements.push("At least one special character");
  }

  return requirements;
}

/**
 * Sanitize password for logging (never log actual passwords!)
 */
export function sanitizePasswordForLog(password: string): string {
  return `[${password.length} chars]`;
}

/**
 * Check password age (if last changed date is provided)
 */
export function isPasswordExpired(
  lastChangedDate: Date,
  maxAgeDays: number = 90,
): boolean {
  const ageInDays =
    (Date.now() - lastChangedDate.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > maxAgeDays;
}

/**
 * Generate a temporary password reset token
 */
export function generateResetToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password reset token for storage
 */
export async function hashResetToken(token: string): Promise<string> {
  return hashPassword(token);
}
