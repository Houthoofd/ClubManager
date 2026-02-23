import { describe, it, expect } from 'vitest';
import { Page } from './patternfly-react-core.d';

describe('Page', () => {
  it('should be defined', () => {
    expect(Page).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(Page).toBeTruthy();
  });
});
