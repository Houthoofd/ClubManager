/**
 * Template generator - Applies the appropriate template based on file analysis
 */

import { getImportPath } from "./utils.js";
import { generateHookTest } from "./templates/hook.template.js";
import { generateGraphQLHookTest } from "./templates/hook-graphql.template.js";
import { generateUtilsTest } from "./templates/utils.template.js";
import { generateComponentTest } from "./templates/component.template.js";
import { generateStoreTest } from "./templates/store.template.js";
import { generateServiceTest } from "./templates/service.template.js";

/**
 * Generate test content based on file analysis
 */
export function generateTest(analysis, testFilePath) {
  const importPath = getImportPath(testFilePath, analysis.filePath);

  let testContent = "";

  // Detect if file is a service (*.service.ts)
  const isService = /\.service\.(ts|tsx)$/.test(analysis.fileName);

  if (isService) {
    testContent = generateServiceTest(analysis, importPath);
  } else {
    switch (analysis.type) {
      case "hook":
        testContent = generateHookTest(analysis, importPath);
        break;

      case "hookGraphQL":
        testContent = generateGraphQLHookTest(analysis, importPath);
        break;

      case "util":
        testContent = generateUtilsTest(analysis, importPath);
        break;

      case "component":
        testContent = generateComponentTest(analysis, importPath);
        break;

      case "store":
        testContent = generateStoreTest(analysis, importPath);
        break;

      case "page":
        // Pages are similar to components but might have routing
        testContent = generatePageTest(analysis, importPath);
        break;

      default:
        testContent = generateGenericTest(analysis, importPath);
    }
  }

  return testContent;
}

/**
 * Generate test for page components
 */
function generatePageTest(analysis, importPath) {
  const { name, exports } = analysis;
  const pageName = exports.default || exports.named[0] || name;

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import { ${pageName} } from '${importPath}';

describe('${pageName}', () => {
  const renderPage = (props = {}) => {
    return render(
      <BrowserRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <${pageName} {...props} />
        </MockedProvider>
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the page without crashing', () => {
      renderPage();

      // TODO: Add assertion to verify page rendered
      expect(document.body).toBeTruthy();
    });

    it('should render page header/title', () => {
      renderPage();

      // TODO: Verify page title or main heading
      // expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render main content sections', () => {
      renderPage();

      // TODO: Verify main sections are rendered
    });
  });

  describe('Data Loading', () => {
    it('should show loading state initially', () => {
      renderPage();

      // TODO: Verify loading indicator
      // expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should load and display data', async () => {
      const mockData = {
        // TODO: Define mock data
      };

      const mocks = [
        {
          request: {
            query: /* YOUR_QUERY */,
            variables: {},
          },
          result: { data: mockData },
        },
      ];

      const { container } = render(
        <BrowserRouter>
          <MockedProvider mocks={mocks} addTypename={false}>
            <${pageName} />
          </MockedProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        // TODO: Verify data is displayed
      });
    });

    it('should handle loading errors', async () => {
      const mocks = [
        {
          request: {
            query: /* YOUR_QUERY */,
            variables: {},
          },
          error: new Error('Failed to fetch'),
        },
      ];

      const { container } = render(
        <BrowserRouter>
          <MockedProvider mocks={mocks} addTypename={false}>
            <${pageName} />
          </MockedProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        // TODO: Verify error message is shown
        // expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should handle route parameters', () => {
      // TODO: Test with route params (e.g., /users/:id)
    });

    it('should navigate to other pages', async () => {
      renderPage();

      // TODO: Click link/button that navigates
      // const link = screen.getByRole('link', { name: /go to/i });
      // await userEvent.click(link);
      // expect(window.location.pathname).toBe('/expected-path');
    });

    it('should update URL on state changes', () => {
      // TODO: Test query params or hash changes
    });
  });

  describe('User Interactions', () => {
    it('should handle user actions', async () => {
      renderPage();

      // TODO: Test page-specific interactions
      // const button = screen.getByRole('button', { name: /action/i });
      // await userEvent.click(button);
    });

    it('should update page state on interaction', async () => {
      renderPage();

      // TODO: Test state updates from user actions
    });
  });

  describe('Permissions & Auth', () => {
    it('should redirect unauthorized users', () => {
      // TODO: Test unauthorized access
    });

    it('should show appropriate content for user role', () => {
      // TODO: Test role-based rendering
    });
  });

  describe('Accessibility', () => {
    it('should have proper page structure', () => {
      renderPage();

      // TODO: Verify semantic HTML
      // expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      renderPage();

      // TODO: Test keyboard navigation
      // await userEvent.tab();
    });

    it('should have proper focus management', () => {
      renderPage();

      // TODO: Test focus is set correctly on page load
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderPage();

      expect(() => unmount()).not.toThrow();
    });
  });
});
`;
}

/**
 * Generate generic test for unknown file types
 */
function generateGenericTest(analysis, importPath) {
  const { name, exports } = analysis;
  const exportName = exports.default || exports.named[0] || name;

  return `import { describe, it, expect } from 'vitest';
import { ${exportName} } from '${importPath}';

describe('${exportName}', () => {
  it('should be defined', () => {
    expect(${exportName}).toBeDefined();
  });

  // TODO: Add specific tests based on the functionality
  it('should work correctly', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });
});
`;
}

/**
 * Generate test file header comment
 */
export function generateTestHeader(analysis) {
  const date = new Date().toISOString().split("T")[0];

  return `/**
 * Tests for ${analysis.fileName}
 *
 * @file ${analysis.fileName}
 * @type ${analysis.type}
 * @generated ${date}
 *
 * TODO: Review and complete the test cases below
 * TODO: Remove this header once tests are finalized
 */

`;
}

/**
 * Generate test file footer comment
 */
export function generateTestFooter(analysis) {
  const tips = getTipsForFileType(analysis.type);

  return `
/**
 * Testing Tips for ${analysis.type}:
 * ${tips.map((tip) => `\n * - ${tip}`).join("")}
 */
`;
}

/**
 * Get testing tips based on file type
 */
function getTipsForFileType(type) {
  const tips = {
    hook: [
      "Test initialization with different parameters",
      "Test state updates and side effects",
      "Test cleanup on unmount",
      "Verify memoization and performance",
    ],
    hookGraphQL: [
      "Use MockedProvider for GraphQL mocking",
      "Test loading, error, and success states",
      "Test refetch and polling behavior",
      "Test cache interactions",
    ],
    util: [
      "Test with valid and invalid inputs",
      "Test edge cases and boundary values",
      "Verify function purity (no mutations)",
      "Test performance with large datasets",
    ],
    component: [
      "Test rendering with different props",
      "Test user interactions (click, type, etc.)",
      "Test accessibility (ARIA, keyboard nav)",
      "Test conditional rendering",
    ],
    store: [
      "Test state initialization and updates",
      "Test selectors and computed values",
      "Test persistence if applicable",
      "Test subscriptions and cleanup",
    ],
    page: [
      "Test with routing context",
      "Test data loading states",
      "Test navigation and route params",
      "Test permissions and auth",
    ],
    service: [
      "Test all service methods",
      "Mock API calls (GraphQL or REST)",
      "Test error handling and recovery",
      "Verify request/response transformations",
      "Test authentication and authorization",
    ],
  };

  return (
    tips[type] || [
      "Write clear and descriptive test names",
      "Test both happy path and error cases",
      "Keep tests isolated and independent",
      "Mock external dependencies",
    ]
  );
}

/**
 * Generate complete test file
 */
export function generateCompleteTest(analysis, testFilePath) {
  const header = generateTestHeader(analysis);
  const body = generateTest(analysis, testFilePath);
  const footer = generateTestFooter(analysis);

  return header + body + footer;
}

export default {
  generateTest,
  generateTestHeader,
  generateTestFooter,
  generateCompleteTest,
};
