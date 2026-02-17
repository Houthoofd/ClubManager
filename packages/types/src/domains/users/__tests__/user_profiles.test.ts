import { describe, it, expect } from '@jest/globals';
import { userProfilesSchema, userProfilesCreateSchema } from '../users.validators.js';

describe('UserProfiles Validators', () => {
  describe('userProfilesSchema', () => {
    it('should validate a valid user_profiles', () => {
      const validUserProfiles = {
        id: 1,
        user_id: 0,
      };

      const result = userProfilesSchema.safeParse(validUserProfiles);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = userProfilesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('userProfilesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
      };

      const result = userProfilesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
