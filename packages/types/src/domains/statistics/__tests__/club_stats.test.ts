import { describe, it, expect } from '@jest/globals';
import { clubStatsSchema, clubStatsCreateSchema } from '../statistics.validators.js';

describe('ClubStats Validators', () => {
  describe('clubStatsSchema', () => {
    it('should validate a valid club_stats', () => {
      const validClubStats = {
        id: 1,
        stat_date: '2024-01-01T00:00:00Z',
      };

      const result = clubStatsSchema.safeParse(validClubStats);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = clubStatsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('clubStatsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        stat_date: 'test stat_date',
      };

      const result = clubStatsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
