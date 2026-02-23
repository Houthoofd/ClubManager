import { describe, it, expect } from 'vitest';
import { SentryErrorBoundary } from './SentryErrorBoundary';

describe('SentryErrorBoundary', () => {
  it('should be defined', () => {
    expect(SentryErrorBoundary).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(SentryErrorBoundary).toBeTruthy();
  });
});
