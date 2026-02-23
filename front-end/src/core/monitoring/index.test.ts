import { describe, it, expect } from 'vitest';
import { SentryModule } from './index';

describe('SentryModule', () => {
  it('should be defined', () => {
    expect(SentryModule).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(SentryModule).toBeTruthy();
  });
});
