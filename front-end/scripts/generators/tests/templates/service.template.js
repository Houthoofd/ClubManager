/**
 * Template for service tests (API services, auth services, etc.)
 */

import { generateMockValue } from "../analyzer.js";

export function generateServiceTest(analysis, importPath) {
  const { name, exports, functionParams, returnTypes, isGraphQL } = analysis;
  const serviceName = exports.default || exports.named[0] || name;

  // Filter out types/interfaces - only keep functions
  const allExports = exports.named.length > 0 ? exports.named : [];
  const methods = allExports.filter((exportName) => {
    // Check if it's a function (has params or is in functions list)
    return analysis.functions.includes(exportName) || functionParams[exportName];
  });

  // Detect if service uses Apollo Client
  const usesApollo = isGraphQL || analysis.imports.apollo;

  const hasDefaultExport = exports.default !== null && exports.default !== undefined;
  const importStatement = hasDefaultExport
    ? `import ${serviceName}${methods.length > 0 ? `, { ${methods.join(", ")} }` : ""} from '${importPath}';`
    : `import { ${serviceName}${methods.length > 0 ? `, ${methods.join(", ")}` : ""} } from '${importPath}';`;

  return `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
${usesApollo ? `import { ApolloClient, InMemoryCache } from '@apollo/client';` : ""}
${importStatement}

/**
 * Tests for ${serviceName}
 *
 * Service Type: ${usesApollo ? "GraphQL Service (Apollo Client)" : "API Service"}
 * Exported Methods: ${methods.length > 0 ? methods.join(", ") : "Default export only"}
 */
describe('${serviceName}', () => {
  ${
    usesApollo
      ? `
  let mockApolloClient: ApolloClient<any>;

  beforeEach(() => {
    // Create a mock Apollo Client
    mockApolloClient = new ApolloClient({
      cache: new InMemoryCache(),
      uri: 'http://localhost:4000/graphql',
    });

    // Mock Apollo Client methods
    vi.spyOn(mockApolloClient, 'query').mockResolvedValue({
      data: {},
      loading: false,
      networkStatus: 7,
    });

    vi.spyOn(mockApolloClient, 'mutate').mockResolvedValue({
      data: {},
    });
  });
  `
      : `
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
  `
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined and exported', () => {
      expect(${serviceName}).toBeDefined();
    });

    ${methods
      .map(
        (method) => `
    it('should export ${method} method', () => {
      expect(${method}).toBeDefined();
      expect(typeof ${method}).toBe('function');
    });
    `,
      )
      .join("\n")}
  });

${methods
  .map((method) => {
    const params = functionParams[method] || [];
    const returnType = returnTypes[method] || "unknown";
    const hasParams = params.length > 0;
    const isAsync = returnType.includes("Promise") || returnType.includes("async");

    const mockParams = hasParams ? params.map((p) => generateMockValue(p.type)).join(", ") : "";

    return `
  describe('${method}', () => {
    /**
     * Method: ${method}
     * Parameters: ${hasParams ? params.map((p) => `${p.name}: ${p.type}`).join(", ") : "none"}
     * Return type: ${returnType}
     * Async: ${isAsync ? "Yes" : "No"}
     */

    describe('Basic Functionality', () => {
      it('should be defined as a function', () => {
        expect(${method}).toBeDefined();
        expect(typeof ${method}).toBe('function');
      });

      it('should call with correct parameters', ${isAsync ? "async " : ""}() => {
        ${
          hasParams
            ? `// Test with valid parameters
        const params = [${mockParams}];
        ${isAsync ? "await " : ""}${method}(...params);

        // TODO: Add assertions for method call
        expect(true).toBe(true);`
            : `// Method has no parameters
        ${isAsync ? "await " : ""}${method}();

        expect(true).toBe(true);`
        }
      });

      ${
        isAsync
          ? `
      it('should return a Promise', () => {
        const result = ${method}(${mockParams});

        expect(result).toBeInstanceOf(Promise);
      });

      it('should resolve with expected data structure', async () => {
        const result = await ${method}(${mockParams});

        expect(result).toBeDefined();
        // TODO: Add specific assertions for return value structure
        // Example: expect(result).toHaveProperty('data');
      });
      `
          : `
      it('should return expected value', () => {
        const result = ${method}(${mockParams});

        expect(result).toBeDefined();
        // TODO: Add specific assertions based on ${returnType}
      });
      `
      }
    });

    describe('Success Cases', () => {
      ${
        isAsync
          ? `
      it('should handle successful API call', async () => {
        ${
          usesApollo
            ? `// Mock successful GraphQL response
        const mockData = {
          // TODO: Define mock GraphQL response
        };

        mockApolloClient.query.mockResolvedValueOnce({
          data: mockData,
          loading: false,
          networkStatus: 7,
        });

        const result = await ${method}(${mockParams});

        expect(result).toBeDefined();
        // TODO: Verify result matches expected structure`
            : `// Mock successful HTTP response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        });

        const result = await ${method}(${mockParams});

        expect(result).toBeDefined();
        // TODO: Verify API was called correctly
        // expect(fetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);`
        }
      });

      it('should handle successful response with real data', async () => {
        const mockData = {
          // TODO: Define realistic mock data
        };

        ${
          usesApollo
            ? `mockApolloClient.query.mockResolvedValueOnce({
          data: mockData,
          loading: false,
          networkStatus: 7,
        });`
            : `global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });`
        }

        const result = await ${method}(${mockParams});

        expect(result).toBeDefined();
        // TODO: Verify data transformation/processing
      });
      `
          : `
      it('should return valid data', () => {
        const result = ${method}(${mockParams});

        expect(result).toBeDefined();
        // TODO: Verify returned data structure
      });
      `
      }
    });

    describe('Error Handling', () => {
      ${
        isAsync
          ? `
      it('should handle network errors', async () => {
        ${
          usesApollo
            ? `mockApolloClient.query.mockRejectedValueOnce(new Error('Network error'));`
            : `global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));`
        }

        await expect(${method}(${mockParams})).rejects.toThrow();
        // OR if service catches errors:
        // const result = await ${method}(${mockParams});
        // expect(result.error).toBeDefined();
      });

      it('should handle API error responses', async () => {
        ${
          usesApollo
            ? `mockApolloClient.query.mockResolvedValueOnce({
          errors: [{ message: 'GraphQL Error' }],
          data: null,
        });`
            : `global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Bad Request' }),
        });`
        }

        // TODO: Verify error handling behavior
        await expect(${method}(${mockParams})).rejects.toThrow();
        // OR verify error is returned gracefully
      });

      it('should handle timeout errors', async () => {
        ${
          usesApollo
            ? `mockApolloClient.query.mockRejectedValueOnce(new Error('Request timeout'));`
            : `global.fetch = vi.fn().mockRejectedValueOnce(new Error('Request timeout'));`
        }

        await expect(${method}(${mockParams})).rejects.toThrow();
      });

      it('should handle unauthorized errors (401)', async () => {
        ${
          usesApollo
            ? `mockApolloClient.query.mockResolvedValueOnce({
          errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }],
        });`
            : `global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });`
        }

        // TODO: Verify unauthorized handling (redirect to login, etc.)
        await expect(${method}(${mockParams})).rejects.toThrow();
      });

      it('should handle server errors (500)', async () => {
        ${
          usesApollo
            ? `mockApolloClient.query.mockRejectedValueOnce(new Error('Internal server error'));`
            : `global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' }),
        });`
        }

        await expect(${method}(${mockParams})).rejects.toThrow();
      });
      `
          : `
      it('should handle invalid input', () => {
        ${
          hasParams
            ? `const invalidInput = null;
        expect(() => ${method}(invalidInput)).not.toThrow();
        // OR expect it to throw/return error`
            : `expect(() => ${method}()).not.toThrow();`
        }
      });
      `
      }
    });

    ${
      hasParams
        ? `
    describe('Input Validation', () => {
      it('should validate required parameters', ${isAsync ? "async " : ""}() => {
        ${params
          .map(
            (p, i) => `
        // Test missing ${p.name}
        const params${i} = [${params.map((pp, ii) => (ii === i ? "undefined" : generateMockValue(pp.type))).join(", ")}];

        // TODO: Verify validation behavior
        // await expect(${method}(...params${i})).rejects.toThrow();
        `,
          )
          .join("\n")}
      });

      it('should validate parameter types', ${isAsync ? "async " : ""}() => {
        ${params
          .filter((p) => p.type.toLowerCase().includes("string"))
          .map(
            (p) => `
        // Test invalid type for ${p.name}
        const invalidParams = [${params.map((pp) => (pp.name === p.name ? "123" : generateMockValue(pp.type))).join(", ")}];

        // TODO: Verify type validation
        `,
          )
          .join("\n")}
      });

      it('should handle edge case values', ${isAsync ? "async " : ""}() => {
        ${params
          .map((p) => {
            if (p.type.toLowerCase().includes("string")) {
              return `// Empty string for ${p.name}
        const edgeParams = [${params.map((pp) => (pp.name === p.name ? "''" : generateMockValue(pp.type))).join(", ")}];`;
            } else if (p.type.toLowerCase().includes("number")) {
              return `// Zero/negative for ${p.name}
        const edgeParams = [${params.map((pp) => (pp.name === p.name ? "0" : generateMockValue(pp.type))).join(", ")}];`;
            } else if (p.type.toLowerCase().includes("array")) {
              return `// Empty array for ${p.name}
        const edgeParams = [${params.map((pp) => (pp.name === p.name ? "[]" : generateMockValue(pp.type))).join(", ")}];`;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n        ")}

        // TODO: Verify edge case handling
      });
    });
    `
        : ""
    }

    ${
      isAsync && usesApollo
        ? `
    describe('GraphQL Integration', () => {
      it('should send correct GraphQL query/mutation', async () => {
        await ${method}(${mockParams});

        // TODO: Verify GraphQL operation was called with correct variables
        // expect(mockApolloClient.query).toHaveBeenCalledWith({
        //   query: EXPECTED_QUERY,
        //   variables: expectedVariables,
        // });
      });

      it('should handle GraphQL caching', async () => {
        // First call
        await ${method}(${mockParams});

        // Second call with same params (should use cache)
        await ${method}(${mockParams});

        // TODO: Verify caching behavior
      });

      it('should refetch when needed', async () => {
        const firstResult = await ${method}(${mockParams});
        const secondResult = await ${method}(${mockParams});

        // TODO: Verify refetch behavior or cache usage
      });
    });
    `
        : ""
    }

    ${
      isAsync && !usesApollo
        ? `
    describe('HTTP Integration', () => {
      it('should make HTTP request with correct method', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await ${method}(${mockParams});

        // TODO: Verify HTTP method (GET, POST, PUT, DELETE, etc.)
        // expect(fetch).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({ method: 'GET' })
        // );
      });

      it('should send correct headers', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await ${method}(${mockParams});

        // TODO: Verify headers (auth token, content-type, etc.)
        // expect(fetch).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     headers: expect.objectContaining({
        //       'Content-Type': 'application/json',
        //     }),
        //   })
        // );
      });

      it('should send correct request body', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await ${method}(${mockParams});

        // TODO: Verify request body
        // expect(fetch).toHaveBeenCalledWith(
        //   expect.any(String),
        //   expect.objectContaining({
        //     body: JSON.stringify(expectedBody),
        //   })
        // );
      });
    });
    `
        : ""
    }

    describe('Performance', () => {
      ${
        isAsync
          ? `
      it('should complete within reasonable time', async () => {
        const startTime = performance.now();
        await ${method}(${mockParams});
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      });

      it('should handle concurrent calls', async () => {
        const promises = Array.from({ length: 5 }, () => ${method}(${mockParams}));

        const results = await Promise.all(promises);

        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result).toBeDefined();
        });
      });
      `
          : `
      it('should execute quickly', () => {
        const startTime = performance.now();
        ${method}(${mockParams});
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100); // 100ms max for sync operations
      });
      `
      }
    });

    describe('Side Effects', () => {
      it('should not mutate input parameters', ${isAsync ? "async " : ""}() => {
        ${
          hasParams &&
          params.some(
            (p) =>
              p.type.toLowerCase().includes("object") || p.type.toLowerCase().includes("array"),
          )
            ? `const input = ${
                params.find(
                  (p) =>
                    p.type.toLowerCase().includes("object") ||
                    p.type.toLowerCase().includes("array"),
                )
                  ? generateMockValue(
                      params.find(
                        (p) =>
                          p.type.toLowerCase().includes("object") ||
                          p.type.toLowerCase().includes("array"),
                      ).type,
                    )
                  : "{}"
              };
        const inputCopy = JSON.parse(JSON.stringify(input));

        ${isAsync ? "await " : ""}${method}(${params
          .map((p) =>
            p.type.toLowerCase().includes("object") || p.type.toLowerCase().includes("array")
              ? "input"
              : generateMockValue(p.type),
          )
          .join(", ")});

        expect(input).toEqual(inputCopy);`
            : `// No object/array parameters to mutate
        expect(true).toBe(true);`
        }
      });

      ${
        isAsync
          ? `
      it('should cleanup resources on error', async () => {
        ${
          usesApollo
            ? `mockApolloClient.query.mockRejectedValueOnce(new Error('Test error'));`
            : `global.fetch = vi.fn().mockRejectedValueOnce(new Error('Test error'));`
        }

        try {
          await ${method}(${mockParams});
        } catch (error) {
          // TODO: Verify cleanup (timers, listeners, etc.)
          expect(error).toBeDefined();
        }
      });
      `
          : ""
      }
    });
  });
  `;
  })
  .join("\n")}

  describe('Integration Tests', () => {
    it('should work with other service methods', ${methods.some((m) => (returnTypes[m] || "").includes("Promise")) ? "async " : ""}() => {
      // TODO: Test method composition and integration
      ${
        methods.length > 1
          ? `// Example: Chain multiple methods
      // const result1 = await ${methods[0]}(${functionParams[methods[0]] ? functionParams[methods[0]].map((p) => generateMockValue(p.type)).join(", ") : ""});
      // const result2 = await ${methods[1]}(result1);`
          : `// Single method - test with external dependencies`
      }

      expect(true).toBe(true);
    });

    it('should maintain state consistency across calls', ${methods.some((m) => (returnTypes[m] || "").includes("Promise")) ? "async " : ""}() => {
      // TODO: Test state management if service is stateful
      expect(true).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient errors', async () => {
      // TODO: Test retry logic if implemented
      expect(true).toBe(true);
    });

    it('should fallback gracefully on persistent errors', async () => {
      // TODO: Test fallback mechanisms
      expect(true).toBe(true);
    });
  });
});
`;
}

export default generateServiceTest;
