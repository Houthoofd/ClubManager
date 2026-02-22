/**
 * Template for utility/helper/formatter function tests
 */

import { generateMockValue } from "../analyzer.js";

export function generateUtilsTest(analysis, importPath) {
  const { name, exports, functionParams, returnTypes } = analysis;
  const functions = exports.named.length > 0 ? exports.named : [name];

  return `import { describe, it, expect } from 'vitest';
import { ${functions.join(", ")} } from '${importPath}';

/**
 * Tests for utility functions in ${name}
 *
 * Functions tested:
 * ${functions.map((fn) => `- ${fn}${functionParams[fn] ? ` (${functionParams[fn].length} params)` : ""}`).join("\n * ")}
 */

${functions
  .map((fnName) => {
    const params = functionParams[fnName] || [];
    const returnType = returnTypes[fnName] || "unknown";
    const hasParams = params.length > 0;

    // Generate mock input based on first parameter
    const mockInput = hasParams ? generateMockValue(params[0].type) : "/* test value */";

    // Generate valid test inputs based on parameters
    const validInputs = hasParams
      ? params.map((p) => generateMockValue(p.type)).join(", ")
      : mockInput;

    return `describe('${fnName}', () => {
  /**
   * Function: ${fnName}
   * Parameters: ${hasParams ? params.map((p) => `${p.name}: ${p.type}`).join(", ") : "none"}
   * Return type: ${returnType}
   */
  describe('Basic Functionality', () => {
    it('should be defined as a function', () => {
      expect(${fnName}).toBeDefined();
      expect(typeof ${fnName}).toBe('function');
    });

    it('should return expected output for valid input', () => {
      ${
        hasParams
          ? `// Test with valid parameters
      const result = ${fnName}(${validInputs});

      expect(result).toBeDefined();
      // TODO: Add specific assertions based on expected behavior
      // Expected return type: ${returnType}`
          : `// Function has no parameters
      const result = ${fnName}();

      expect(result).toBeDefined();
      // Expected return type: ${returnType}`
      }
    });

    it('should handle different input types', () => {
      ${
        hasParams
          ? `// Test with various valid inputs
      const testInputs = [
        ${params.map((p, i) => `${generateMockValue(p.type)}, // Test case ${i + 1}: ${p.type}`).join("\n        ")}
      ];

      testInputs.forEach(input => {
        const result = ${fnName}(input${
          params.length > 1
            ? ", " +
              params
                .slice(1)
                .map((p) => generateMockValue(p.type))
                .join(", ")
            : ""
        });
        expect(result).toBeDefined();
      });`
          : `// Function has no parameters - test idempotency
      const result1 = ${fnName}();
      const result2 = ${fnName}();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();`
      }
    });

    it('should produce consistent results (idempotency)', () => {
      ${
        hasParams
          ? `// Test that same input produces same output
      const input = ${validInputs};
      const result1 = ${fnName}(input);
      const result2 = ${fnName}(input);

      expect(result1).toEqual(result2);`
          : `// Test that function returns consistent results
      const result1 = ${fnName}();
      const result2 = ${fnName}();

      expect(result1).toEqual(result2);`
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty/null/undefined input', () => {
      ${
        hasParams
          ? `// Test with empty values for first parameter
      const emptyInputs = ${
        params[0].type.toLowerCase().includes("string")
          ? `['', '   ']`
          : params[0].type.toLowerCase().includes("array") ||
              params[0].type.toLowerCase().includes("[]")
            ? `[[], null, undefined]`
            : params[0].type.toLowerCase().includes("object")
              ? `[{}, null, undefined]`
              : `[null, undefined]`
      };

      emptyInputs.forEach(input => {
        // Depending on implementation, this might throw or return a default value
        // TODO: Adjust expectation based on actual behavior
        expect(() => ${fnName}(input${
          params.length > 1
            ? ", " +
              params
                .slice(1)
                .map((p) => generateMockValue(p.type))
                .join(", ")
            : ""
        })).not.toThrow();
      });`
          : `// Function has no parameters
      expect(() => ${fnName}()).not.toThrow();`
      }
    });

    it('should handle invalid input gracefully', () => {
      ${
        hasParams
          ? `// Test with wrong type for first parameter
      const invalidInputs = ${
        params[0].type.toLowerCase().includes("string")
          ? `[123, true, {}, []]`
          : params[0].type.toLowerCase().includes("number")
            ? `['not a number', true, {}, []]`
            : params[0].type.toLowerCase().includes("boolean")
              ? `['true', 1, {}, []]`
              : `[Symbol(), () => {}, new Date()]`
      };

      invalidInputs.forEach(invalidInput => {
        // TODO: Decide if function should throw or handle gracefully
        expect(() => ${fnName}(invalidInput${
          params.length > 1
            ? ", " +
              params
                .slice(1)
                .map((p) => generateMockValue(p.type))
                .join(", ")
            : ""
        })).not.toThrow();
      });`
          : `// Function has no parameters to validate
      expect(true).toBe(true);`
      }
    });

    it('should handle boundary values', () => {
      ${
        hasParams && params.some((p) => p.type.toLowerCase().includes("number"))
          ? `// Test with boundary number values
      const boundaryInputs = [
        0,
        -1,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Infinity,
        -Infinity,
      ];

      boundaryInputs.forEach(input => {
        const result = ${fnName}(input${
          params.length > 1
            ? ", " +
              params
                .slice(1)
                .map((p) => generateMockValue(p.type))
                .join(", ")
            : ""
        });
        expect(result).toBeDefined();
      });`
          : hasParams && params.some((p) => p.type.toLowerCase().includes("string"))
            ? `// Test with boundary string values
      const boundaryInputs = [
        '',
        ' ',
        'a'.repeat(1000), // Very long string
        '\\n\\t\\r', // Special whitespace
      ];

      boundaryInputs.forEach(input => {
        const result = ${fnName}(input${
          params.length > 1
            ? ", " +
              params
                .slice(1)
                .map((p) => generateMockValue(p.type))
                .join(", ")
            : ""
        });
        expect(result).toBeDefined();
      });`
            : `// TODO: Define boundary values based on parameter types
      expect(true).toBe(true);`
      }
    });

    it('should handle special characters and unicode', () => {
      ${
        hasParams && params.some((p) => p.type.toLowerCase().includes("string"))
          ? `// Test with special characters (relevant for string parameters)
      const specialInputs = [
        'test@#$%^&*()',
        '你好世界',
        '🎉🚀✨',
        'test\\nnewline\\ttab',
        '<script>alert("xss")</script>',
      ];

      specialInputs.forEach(input => {
        expect(() => ${fnName}(input${
          params.length > 1
            ? ", " +
              params
                .slice(1)
                .map((p) => generateMockValue(p.type))
                .join(", ")
            : ""
        })).not.toThrow();
      });`
          : `// Special characters not applicable for this function
      expect(true).toBe(true);`
      }
    });
  });

  describe('Type Safety', () => {
    it('should return correct type', () => {
      ${hasParams ? `const result = ${fnName}(${validInputs});` : `const result = ${fnName}();`}

      // Verify return type matches expected type: ${returnType}
      ${
        returnType.toLowerCase().includes("string")
          ? `expect(typeof result).toBe('string');`
          : returnType.toLowerCase().includes("number")
            ? `expect(typeof result).toBe('number');`
            : returnType.toLowerCase().includes("boolean")
              ? `expect(typeof result).toBe('boolean');`
              : returnType.toLowerCase().includes("void")
                ? `expect(result).toBeUndefined();`
                : `expect(result).toBeDefined();
      // TODO: Add specific type checks for ${returnType}`
      }
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
      ${
        hasParams
          ? `// Generate large input based on parameter type
      const largeInput = ${
        params[0].type.toLowerCase().includes("array") ||
        params[0].type.toLowerCase().includes("[]")
          ? `Array.from({ length: 10000 }, (_, i) => i)`
          : params[0].type.toLowerCase().includes("string")
            ? `'x'.repeat(100000)`
            : params[0].type.toLowerCase().includes("object")
              ? `Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [i, i]))`
              : `10000`
      };

      const startTime = performance.now();
      const result = ${fnName}(largeInput${
        params.length > 1
          ? ", " +
            params
              .slice(1)
              .map((p) => generateMockValue(p.type))
              .join(", ")
          : ""
      });
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1s`
          : `// Performance test not applicable for parameterless function
      expect(true).toBe(true);`
      }
    });

    it('should not mutate input (pure function)', () => {
      ${
        hasParams &&
        (params[0].type.toLowerCase().includes("object") ||
          params[0].type.toLowerCase().includes("array"))
          ? `// Verify function doesn't mutate object/array inputs
      const input = ${
        params[0].type.toLowerCase().includes("array") ||
        params[0].type.toLowerCase().includes("[]")
          ? `[1, 2, 3, 4, 5]`
          : `{ key: 'value', nested: { prop: 'test' } }`
      };
      const inputCopy = JSON.parse(JSON.stringify(input));

      ${fnName}(input${
        params.length > 1
          ? ", " +
            params
              .slice(1)
              .map((p) => generateMockValue(p.type))
              .join(", ")
          : ""
      });

      expect(input).toEqual(inputCopy);`
          : `// Function doesn't take object/array parameters
      expect(true).toBe(true);`
      }
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical use case', () => {
      ${
        hasParams
          ? `// Test with realistic example data
      const realInput = ${validInputs};
      const result = ${fnName}(realInput);

      expect(result).toBeDefined();
      // TODO: Add assertions based on expected real-world behavior`
          : `// Test realistic usage
      const result = ${fnName}();

      expect(result).toBeDefined();
      // TODO: Verify realistic behavior`
      }
    });

    it('should integrate with other functions', () => {
      // TODO: Test composition with other utilities if applicable
    });
  });
});

`;
  })
  .join("\n")}
`;
}

export default generateUtilsTest;
