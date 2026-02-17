import { describe, it, expect } from '@jest/globals';
import { notificationsSchema, notificationsCreateSchema } from '../communications.validators.js';

describe('Notifications Validators', () => {
  describe('notificationsSchema', () => {
    it('should validate a valid notifications', () => {
      const validNotifications = {
        id: 1,
        user_id: 0,
        type: 'test type',
        title: 'test title',
        content: 'test content',
      };

      const result = notificationsSchema.safeParse(validNotifications);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = notificationsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('notificationsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        type: 'test type',
        title: 'test title',
        content: 'test content',
      };

      const result = notificationsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
