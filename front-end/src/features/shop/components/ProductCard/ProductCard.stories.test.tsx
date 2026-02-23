import { describe, it, expect } from 'vitest';
import { meta } from './ProductCard.stories';

describe('meta', () => {
  it('should be defined', () => {
    expect(meta).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(meta).toBeTruthy();
  });
});
