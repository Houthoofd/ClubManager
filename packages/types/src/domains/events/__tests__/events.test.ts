import { describe, it, expect } from '@jest/globals';
import { eventsSchema, eventsCreateSchema } from '../events.validators.js';

describe('Events Validators', () => {
  describe('eventsSchema', () => {
    it('should validate a valid events', () => {
      const validEvents = {
        id: 1,
        event_type_id: 0,
        title: 'test title',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-01T00:00:00Z',
        created_by: 0,
      };

      const result = eventsSchema.safeParse(validEvents);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = eventsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('eventsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        event_type_id: 1,
        title: 'test title',
        start_date: 'test start_date',
        end_date: 'test end_date',
        created_by: 1,
      };

      const result = eventsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
