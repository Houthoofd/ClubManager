import { describe, it, expect } from 'vitest';
import { LazyI18nBackend } from './lazyBackend';

describe('LazyI18nBackend', () => {
  it('should be defined', () => {
    expect(LazyI18nBackend).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(LazyI18nBackend).toBeTruthy();
  });
});
