import { describe, it, expect } from 'vitest';
import { router } from './index';

describe('router', () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(router).toBeTruthy();
  });
});
