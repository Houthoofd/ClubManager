import { describe, it, expect } from '@jest/globals';
import { userConsentsSchema, userConsentsCreateSchema } from '../gdpr.validators.js';

describe('UserConsents Validators', () => {
  describe('userConsentsSchema', () => {
    it('should validate a valid user_consents', () => {
      const validUserConsents = {
        id: 1,
        user_id: 0,
        consent_type: 'photos',
      };

      const result = userConsentsSchema.safeParse(validUserConsents);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = userConsentsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('userConsentsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        consent_type: 'photos',
      };

      const result = userConsentsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
