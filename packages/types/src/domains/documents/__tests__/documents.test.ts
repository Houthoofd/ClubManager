import { describe, it, expect } from '@jest/globals';
import { documentsSchema, documentsCreateSchema } from '../documents.validators.js';

describe('Documents Validators', () => {
  describe('documentsSchema', () => {
    it('should validate a valid documents', () => {
      const validDocuments = {
        id: 1,
        title: 'test title',
        file_url: 'https://example.com',
        file_name: 'test file_name',
        uploaded_by: 0,
      };

      const result = documentsSchema.safeParse(validDocuments);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = documentsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('documentsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        title: 'test title',
        file_url: 'test file_url',
        file_name: 'test file_name',
        uploaded_by: 1,
      };

      const result = documentsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
