import { describe, it, expect } from 'vitest';
import { useQuery } from '@apollo/client';

describe('Test Apollo import', () => {
  it('should import useQuery', () => {
    expect(useQuery).toBeDefined();
    expect(typeof useQuery).toBe('function');
  });
});
