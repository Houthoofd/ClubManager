import { describe, it, expect } from 'vitest';
import { InscriptionFormFields } from './InscriptionFormFields';

describe('InscriptionFormFields', () => {
  it('should be defined', () => {
    expect(InscriptionFormFields).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(InscriptionFormFields).toBeTruthy();
  });
});
