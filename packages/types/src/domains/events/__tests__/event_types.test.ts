import { describe, it, expect } from '@jest/globals';
import { eventTypesSchema, eventTypesCreateSchema } from '../events.validators.js';

describe('EventTypes Validators', () => {
  describe('eventTypesSchema', () => {
    it('should validate a valid event_types', () => {
      const validEventTypes = {
        id: 1,
        name: 'test name',
      };

      const result = eventTypesSchema.safeParse(validEventTypes);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = eventTypesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('eventTypesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
      };

      const result = eventTypesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
