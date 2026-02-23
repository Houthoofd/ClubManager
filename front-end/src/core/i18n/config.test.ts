import { describe, it, expect } from 'vitest';
import { changeLanguage, getCurrentLanguage, isLanguageSupported, getSupportedLanguages } from './config';


describe('changeLanguage', () => {
  it('should be defined', () => {
    expect(changeLanguage).toBeDefined();
    expect(typeof changeLanguage).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => changeLanguage()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = changeLanguage();
    const result2 = changeLanguage();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => changeLanguage(null)).not.toThrow();
    expect(() => changeLanguage(undefined)).not.toThrow();
  });
});


describe('getCurrentLanguage', () => {
  it('should be defined', () => {
    expect(getCurrentLanguage).toBeDefined();
    expect(typeof getCurrentLanguage).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => getCurrentLanguage()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = getCurrentLanguage();
    const result2 = getCurrentLanguage();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => getCurrentLanguage(null)).not.toThrow();
    expect(() => getCurrentLanguage(undefined)).not.toThrow();
  });
});


describe('isLanguageSupported', () => {
  it('should be defined', () => {
    expect(isLanguageSupported).toBeDefined();
    expect(typeof isLanguageSupported).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => isLanguageSupported()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = isLanguageSupported();
    const result2 = isLanguageSupported();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => isLanguageSupported(null)).not.toThrow();
    expect(() => isLanguageSupported(undefined)).not.toThrow();
  });
});


describe('getSupportedLanguages', () => {
  it('should be defined', () => {
    expect(getSupportedLanguages).toBeDefined();
    expect(typeof getSupportedLanguages).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => getSupportedLanguages()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = getSupportedLanguages();
    const result2 = getSupportedLanguages();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => getSupportedLanguages(null)).not.toThrow();
    expect(() => getSupportedLanguages(undefined)).not.toThrow();
  });
});

