import { describe, it, expect } from '@jest/globals';
import { activityStatsSchema, activityStatsCreateSchema } from '../statistics.validators.js';

describe('ActivityStats Validators', () => {
  describe('activityStatsSchema', () => {
    it('should validate a valid activity_stats', () => {
      const validActivityStats = {
        id: 1,
        activity_id: 0,
        period_start: 'test period_start',
        period_end: 'test period_end',
      };

      const result = activityStatsSchema.safeParse(validActivityStats);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = activityStatsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('activityStatsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        activity_id: 1,
        period_start: 'test period_start',
        period_end: 'test period_end',
      };

      const result = activityStatsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
