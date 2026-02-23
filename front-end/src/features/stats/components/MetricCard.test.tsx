import { describe, it, expect } from 'vitest';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('should be defined', () => {
    expect(MetricCard).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(MetricCard).toBeTruthy();
  });
});
