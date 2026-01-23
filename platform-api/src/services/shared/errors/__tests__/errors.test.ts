/**
 * Unit tests for shared error classes
 * Tests ValidationError, NotFoundError, and AuthenticationError
 */

import { describe, it, expect } from '@jest/globals';
import { ValidationError, NotFoundError, AuthenticationError } from '../index.js';

describe('Shared Error Classes', () => {
  describe('ValidationError', () => {
    it('should create a ValidationError with correct message', () => {
      const message = 'Invalid input data';
      const error = new ValidationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('ValidationError');
    });

    it('should have a stack trace', () => {
      const error = new ValidationError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be catchable as Error', () => {
      try {
        throw new ValidationError('Test validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should handle empty message', () => {
      const error = new ValidationError('');
      expect(error.message).toBe('');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle special characters in message', () => {
      const message = 'Error: Field "email" is invalid! @#$%';
      const error = new ValidationError(message);
      expect(error.message).toBe(message);
    });

    it('should be distinguishable from other error types', () => {
      const validationError = new ValidationError('Validation failed');
      const notFoundError = new NotFoundError('Not found');

      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError).not.toBeInstanceOf(NotFoundError);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with correct message', () => {
      const message = 'Resource not found';
      const error = new NotFoundError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('NotFoundError');
    });

    it('should have a stack trace', () => {
      const error = new NotFoundError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be catchable as Error', () => {
      try {
        throw new NotFoundError('User not found');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should handle entity-specific messages', () => {
      const userId = '12345';
      const error = new NotFoundError(`User with ID ${userId} not found`);
      expect(error.message).toContain(userId);
    });

    it('should be distinguishable from other error types', () => {
      const notFoundError = new NotFoundError('Not found');
      const authError = new AuthenticationError('Unauthorized');

      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(notFoundError).not.toBeInstanceOf(AuthenticationError);
    });

    it('should handle multiple resources in message', () => {
      const message = 'User or Product not found in tenant';
      const error = new NotFoundError(message);
      expect(error.message).toBe(message);
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with correct message', () => {
      const message = 'Invalid credentials';
      const error = new AuthenticationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should have a stack trace', () => {
      const error = new AuthenticationError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be catchable as Error', () => {
      try {
        throw new AuthenticationError('Unauthorized access');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AuthenticationError);
      }
    });

    it('should handle common auth failure messages', () => {
      const messages = [
        'Invalid username or password',
        'Token expired',
        'Session timeout',
        'Unauthorized access',
      ];

      messages.forEach((message) => {
        const error = new AuthenticationError(message);
        expect(error.message).toBe(message);
        expect(error.name).toBe('AuthenticationError');
      });
    });

    it('should be distinguishable from other error types', () => {
      const authError = new AuthenticationError('Unauthorized');
      const validationError = new ValidationError('Invalid');

      expect(authError).toBeInstanceOf(AuthenticationError);
      expect(authError).not.toBeInstanceOf(ValidationError);
    });

    it('should handle security-related messages', () => {
      const error = new AuthenticationError(
        'Access denied: insufficient permissions',
      );
      expect(error.message).toContain('Access denied');
    });
  });

  describe('Error Type Checking', () => {
    it('should allow type checking with instanceof', () => {
      const errors = [
        new ValidationError('validation'),
        new NotFoundError('not found'),
        new AuthenticationError('auth'),
      ];

      expect(errors[0]).toBeInstanceOf(ValidationError);
      expect(errors[1]).toBeInstanceOf(NotFoundError);
      expect(errors[2]).toBeInstanceOf(AuthenticationError);
    });

    it('should allow type checking by name property', () => {
      const errors = [
        new ValidationError('test'),
        new NotFoundError('test'),
        new AuthenticationError('test'),
      ];

      expect(errors[0].name).toBe('ValidationError');
      expect(errors[1].name).toBe('NotFoundError');
      expect(errors[2].name).toBe('AuthenticationError');
    });

    it('should all be instances of Error base class', () => {
      const errors = [
        new ValidationError('test'),
        new NotFoundError('test'),
        new AuthenticationError('test'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('should be serializable to JSON', () => {
      const error = new ValidationError('Test error');
      const json = JSON.stringify({
        name: error.name,
        message: error.message,
      });

      expect(json).toContain('ValidationError');
      expect(json).toContain('Test error');
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain prototype chain', () => {
      const error = new ValidationError('test');
      expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
      expect(Object.getPrototypeOf(ValidationError.prototype)).toBe(Error.prototype);
    });

    it('should work with try-catch blocks', () => {
      const testFunction = (errorType: 'validation' | 'notFound' | 'auth') => {
        if (errorType === 'validation') {
          throw new ValidationError('Validation failed');
        } else if (errorType === 'notFound') {
          throw new NotFoundError('Not found');
        } else {
          throw new AuthenticationError('Unauthorized');
        }
      };

      expect(() => testFunction('validation')).toThrow(ValidationError);
      expect(() => testFunction('notFound')).toThrow(NotFoundError);
      expect(() => testFunction('auth')).toThrow(AuthenticationError);
    });

    it('should preserve error message in catch blocks', () => {
      const message = 'Custom error message';

      try {
        throw new ValidationError(message);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.message).toBe(message);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new ValidationError(longMessage);
      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
    });

    it('should handle unicode characters', () => {
      const message = 'Error: 用户未找到 🚫';
      const error = new NotFoundError(message);
      expect(error.message).toBe(message);
    });

    it('should handle multiline messages', () => {
      const message = 'Error on line 1\nError on line 2\nError on line 3';
      const error = new ValidationError(message);
      expect(error.message).toBe(message);
      expect(error.message.split('\n')).toHaveLength(3);
    });

    it('should handle null-like strings', () => {
      const messages = ['null', 'undefined', 'NaN'];
      messages.forEach((msg) => {
        const error = new ValidationError(msg);
        expect(error.message).toBe(msg);
      });
    });
  });
});
