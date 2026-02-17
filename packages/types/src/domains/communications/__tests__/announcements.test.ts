import { describe, it, expect } from '@jest/globals';
import { announcementsSchema, announcementsCreateSchema } from '../communications.validators.js';

describe('Announcements Validators', () => {
  describe('announcementsSchema', () => {
    it('should validate a valid announcements', () => {
      const validAnnouncements = {
        id: 1,
        author_id: 0,
        title: 'test title',
        content: 'test content',
      };

      const result = announcementsSchema.safeParse(validAnnouncements);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = announcementsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('announcementsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        author_id: 1,
        title: 'test title',
        content: 'test content',
      };

      const result = announcementsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
