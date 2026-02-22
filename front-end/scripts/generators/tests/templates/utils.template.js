/**
 * Template for utility/helper/formatter function tests
 */

export function generateUtilsTest(analysis, importPath) {
  const { name, exports } = analysis;
  const functions = exports.named.length > 0 ? exports.named : [name];

  return `import { describe, it, expect } from 'vitest';
import { ${functions.join(', ')} } from '${importPath}';

${functions.map(fnName => `describe('${fnName}', () => {
  describe('Basic Functionality', () => {
    it('should return expected output for valid input', () => {
      // TODO: Test with valid input
      const input = /* valid input */;
      const result = ${fnName}(input);

      expect(result).toBeDefined();
      // TODO: Add specific assertions
    });

    it('should handle different input types', () => {
      // TODO: Test with various input types
      const inputs = [
        /* test case 1 */,
        /* test case 2 */,
        /* test case 3 */,
      ];

      inputs.forEach(input => {
        const result = ${fnName}(input);
        expect(result).toBeDefined();
      });
    });

    it('should produce consistent results', () => {
      // TODO: Test idempotency
      const input = /* test input */;
      const result1 = ${fnName}(input);
      const result2 = ${fnName}(input);

      expect(result1).toEqual(result2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      // TODO: Test with empty values
      const emptyInputs = [null, undefined, '', [], {}];

      emptyInputs.forEach(input => {
        expect(() => ${fnName}(input)).not.toThrow();
        // OR expect a specific error/default value
      });
    });

    it('should handle invalid input gracefully', () => {
      // TODO: Test with invalid input
      const invalidInput = /* invalid value */;

      expect(() => ${fnName}(invalidInput)).not.toThrow();
      // TODO: Verify error handling or default return value
    });

    it('should handle boundary values', () => {
      // TODO: Test min/max values, special characters, etc.
      const boundaryInputs = [
        0,
        -1,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
      ];

      boundaryInputs.forEach(input => {
        const result = ${fnName}(input);
        expect(result).toBeDefined();
      });
    });

    it('should handle special characters and unicode', () => {
      // TODO: Test with special characters if applicable
      const specialInputs = [
        'test@#$%',
        '你好',
        '🎉',
        'test\\nnewline',
      ];

      specialInputs.forEach(input => {
        expect(() => ${fnName}(input)).not.toThrow();
      });
    });
  });

  describe('Type Safety', () => {
    it('should return correct type', () => {
      const input = /* valid input */;
      const result = ${fnName}(input);

      // TODO: Check return type
      expect(typeof result).toBe(/* expected type */);
    });

    it('should handle type coercion correctly', () => {
      // TODO: Test how function handles type coercion
      const mixedInputs = [
        '123',    // string number
        123,      // number
        true,     // boolean
        false,    // boolean
      ];

      mixedInputs.forEach(input => {
        const result = ${fnName}(input);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      // TODO: Test with large datasets if applicable
      const largeInput = /* generate large input */;

      const startTime = performance.now();
      const result = ${fnName}(largeInput);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1s
    });

    it('should not mutate input', () => {
      // TODO: Verify function is pure (doesn't mutate input)
      const input = /* object or array */;
      const inputCopy = JSON.parse(JSON.stringify(input));

      ${fnName}(input);

      expect(input).toEqual(inputCopy);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical use case', () => {
      // TODO: Test realistic scenario
      const realInput = /* realistic example */;
      const result = ${fnName}(realInput);

      expect(result).toBeDefined();
      // TODO: Add assertions based on expected behavior
    });

    it('should integrate with other functions', () => {
      // TODO: Test composition with other utilities if applicable
    });
  });
});

`).join('\n')}
});
`;
}

export default generateUtilsTest;
