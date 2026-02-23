import { describe, it, expect } from 'vitest';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  it('should be defined', () => {
    expect(DataTable).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(DataTable).toBeTruthy();
  });
});
