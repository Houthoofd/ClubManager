import { describe, it, expect } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('should be defined', () => {
    expect(PageHeader).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(PageHeader).toBeTruthy();
  });
});
