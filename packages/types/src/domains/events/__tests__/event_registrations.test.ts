import { describe, it, expect } from '@jest/globals';
import { eventRegistrationsSchema, eventRegistrationsCreateSchema } from '../events.validators.js';

describe('EventRegistrations Validators', () => {
  describe('eventRegistrationsSchema', () => {
    it('should validate a valid event_registrations', () => {
      const validEventRegistrations = {
        id: 1,
        event_id: 0,
        user_id: 0,
      };

      const result = eventRegistrationsSchema.safeParse(validEventRegistrations);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = eventRegistrationsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('eventRegistrationsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        event_id: 1,
        user_id: 1,
      };

      const result = eventRegistrationsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
