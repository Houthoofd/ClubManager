import { describe, it, expect } from '@jest/globals';
import { sessionsSchema, sessionsCreateSchema } from '../sessions.validators.js';

describe('Sessions Validators', () => {
  describe('sessionsSchema', () => {
    it('should validate a valid sessions', () => {
      const validSessions = {
        id: 1,
        session_type_id: 0,
        instructor_id: 0,
        date: '2024-01-01T00:00:00Z',
        start_time: '12:00:00',
        end_time: '12:00:00',
      };

      const result = sessionsSchema.safeParse(validSessions);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = sessionsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('sessionsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        session_type_id: 1,
        instructor_id: 1,
        date: 'test date',
        start_time: 'test start_time',
        end_time: 'test end_time',
      };

      const result = sessionsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
