import { describe, it, expect } from '@jest/globals';
import { passwordResetTokensSchema, passwordResetTokensCreateSchema } from '../users.validators.js';

describe('PasswordResetTokens Validators', () => {
  describe('passwordResetTokensSchema', () => {
    it('should validate a valid password_reset_tokens', () => {
      const validPasswordResetTokens = {
        id: 1,
        user_id: 0,
        token: 'test token',
        expires_at: '2024-01-01T00:00:00Z',
      };

      const result = passwordResetTokensSchema.safeParse(validPasswordResetTokens);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = passwordResetTokensSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetTokensCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        token: 'test token',
        expires_at: 'test expires_at',
      };

      const result = passwordResetTokensCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
