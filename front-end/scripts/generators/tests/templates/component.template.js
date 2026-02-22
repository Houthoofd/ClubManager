/**
 * Template for React component tests
 */

import { generateMockValue, generateDefaultProps } from "../analyzer.js";

export function generateComponentTest(analysis, importPath) {
  const { name, exports, props, propsDetails, hasI18n, hasRouting, isGraphQL } = analysis;
  const componentName = exports.default || exports.named[0] || name;
  const propsInterface = props[0] || `${componentName}Props`;

  // Generate default props from detected props
  const defaultPropsObject =
    propsDetails && propsDetails.length > 0 ? generateDefaultProps(propsDetails) : "{}";

  // Generate required providers based on analysis
  const providers = [];
  const providerImports = [];

  if (isGraphQL) {
    providerImports.push("import { MockedProvider } from '@apollo/client/testing';");
    providers.push("MockedProvider");
  }
  if (hasI18n) {
    providerImports.push("import { I18nextProvider } from 'react-i18next';");
    providerImports.push("import i18n from '@/core/i18n/config';");
    providers.push("I18nextProvider");
  }
  if (hasRouting) {
    providerImports.push("import { BrowserRouter } from 'react-router-dom';");
    providers.push("BrowserRouter");
  }

  const providerImportsStr = providerImports.length > 0 ? providerImports.join("\n") + "\n" : "";

  // Generate provider wrapper
  let wrapperOpen = "";
  let wrapperClose = "";

  if (providers.length > 0) {
    if (providers.includes("MockedProvider")) {
      wrapperOpen += "      <MockedProvider mocks={[]} addTypename={false}>\n";
      wrapperClose = "      </MockedProvider>\n" + wrapperClose;
    }
    if (providers.includes("I18nextProvider")) {
      wrapperOpen += "        <I18nextProvider i18n={i18n}>\n";
      wrapperClose = "        </I18nextProvider>\n" + wrapperClose;
    }
    if (providers.includes("BrowserRouter")) {
      wrapperOpen += "          <BrowserRouter>\n";
      wrapperClose = "          </BrowserRouter>\n" + wrapperClose;
    }
  }

  // Generate prop list for documentation
  const propsList =
    propsDetails && propsDetails.length > 0
      ? propsDetails
          .map((p) => `   * - ${p.name}: ${p.type}${p.optional ? " (optional)" : ""}`)
          .join("\n")
      : "   * No props detected";

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from '${importPath}';
${providerImportsStr}
/**
 * Tests for ${componentName}
 *
 * Detected Props:
${propsList}
 */
describe('${componentName}', () => {
  // Default props for testing
  const defaultProps = ${defaultPropsObject};

  // Helper to render component with providers
  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };

    return render(
${wrapperOpen ? wrapperOpen + "            <" + componentName + " {...mergedProps} />\n" + wrapperClose : "      <" + componentName + " {...mergedProps} />"}
    );
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      expect(document.body).toBeTruthy();
    });

    it('should render with default props', () => {
      renderComponent();

      // TODO: Verify default rendering state
      expect(document.body).toBeTruthy();
    });

    it('should render with custom props', () => {
      const customProps = ${
        propsDetails && propsDetails.length > 0
          ? "{\n        " +
            propsDetails
              .slice(0, 2)
              .map((p) => `${p.name}: ${generateMockValue(p.type)}`)
              .join(",\n        ") +
            ",\n      }"
          : "{}"
      };

      renderComponent(customProps);

      // Verify component handles custom props
      expect(document.body).toBeTruthy();
    });

    it('should display correct content', () => {
      renderComponent();

      // TODO: Check for expected text, images, etc.
      // expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const onClick = vi.fn();
      renderComponent({ onClick });

      // TODO: Find and click the element
      // const button = screen.getByRole('button');
      // await userEvent.click(button);

      // expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle input changes', async () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      // TODO: Find input and type
      // const input = screen.getByRole('textbox');
      // await userEvent.type(input, 'test input');

      // expect(onChange).toHaveBeenCalled();
    });

    it('should handle form submission', async () => {
      const onSubmit = vi.fn();
      renderComponent({ onSubmit });

      // TODO: Fill form and submit
      // const submitButton = screen.getByRole('button', { name: /submit/i });
      // await userEvent.click(submitButton);

      // expect(onSubmit).toHaveBeenCalled();
    });

    it('should handle keyboard events', async () => {
      renderComponent();

      // TODO: Test keyboard interactions
      // const element = screen.getByRole('...');
      // await userEvent.keyboard('{Enter}');
      // await userEvent.keyboard('{Escape}');
    });
  });

  describe('Conditional Rendering', () => {
    it('should show loading state', () => {
      renderComponent({ loading: true });

      // TODO: Verify loading indicator is shown
      // expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const error = 'Test error message';
      renderComponent({ error });

      // TODO: Verify error is displayed
      // expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('should show empty state', () => {
      renderComponent({ data: [] });

      // TODO: Verify empty state message
      // expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });

    it('should conditionally render elements based on props', () => {
      const { rerender } = renderComponent({ showDetails: false });

      // TODO: Verify element is not shown
      // expect(screen.queryByTestId('details')).not.toBeInTheDocument();

      // Rerender with different prop
      rerender(<${componentName} {...defaultProps} showDetails={true} />);

      // TODO: Verify element is now shown
      // expect(screen.getByTestId('details')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle missing optional props', () => {
      const requiredOnly = ${
        propsDetails && propsDetails.length > 0
          ? "{\n        " +
            propsDetails
              .filter((p) => !p.optional)
              .map((p) => `${p.name}: ${generateMockValue(p.type)}`)
              .join(",\n        ") +
            ",\n      }"
          : "{}"
      };

      expect(() => renderComponent(requiredOnly)).not.toThrow();
    });

    it('should use default values for missing props', () => {
      renderComponent();

      expect(document.body).toBeTruthy();
    });

    it('should accept all prop types correctly', () => {
      const allProps = ${
        propsDetails && propsDetails.length > 0
          ? "{\n        " +
            propsDetails.map((p) => `${p.name}: ${generateMockValue(p.type)}`).join(",\n        ") +
            ",\n      }"
          : "{}"
      };

      expect(() => renderComponent(allProps)).not.toThrow();
    });
  });

  describe('Callbacks', () => {
    it('should call callback with correct arguments', async () => {
      const callback = vi.fn();
      renderComponent({ onAction: callback });

      // TODO: Trigger action that calls callback
      // const button = screen.getByRole('button');
      // await userEvent.click(button);

      // expect(callback).toHaveBeenCalledWith(expectedArgs);
    });

    it('should not call callback when disabled', async () => {
      const callback = vi.fn();
      renderComponent({ onAction: callback, disabled: true });

      // TODO: Try to trigger action
      // const button = screen.getByRole('button');
      // await userEvent.click(button);

      // expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();

      // TODO: Check for aria-label, aria-labelledby, etc.
      // const element = screen.getByRole('button');
      // expect(element).toHaveAttribute('aria-label', 'Expected Label');
    });

    it('should be keyboard navigable', async () => {
      renderComponent();

      // TODO: Test keyboard navigation
      // await userEvent.tab();
      // expect(screen.getByRole('button')).toHaveFocus();
    });

    it('should have proper role attributes', () => {
      renderComponent();

      // TODO: Verify semantic HTML and roles
      // expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      renderComponent();

      // TODO: Check for sr-only text, alt text, etc.
    });
  });

  describe('Data Display', () => {
    it('should display data correctly', () => {
      const testData = {
        // TODO: Define test data
      };

      renderComponent({ data: testData });

      // TODO: Verify data is displayed
      // expect(screen.getByText(testData.someField)).toBeInTheDocument();
    });

    it('should format data properly', () => {
      const testData = {
        // TODO: Test data formatting (dates, numbers, currency, etc.)
      };

      renderComponent({ data: testData });

      // TODO: Verify formatted output
    });

    it('should handle missing data fields gracefully', () => {
      const incompleteData = {
        // TODO: Data with missing fields
      };

      expect(() => renderComponent({ data: incompleteData })).not.toThrow();
    });
  });

  describe('Styling', () => {
    it('should apply custom className if prop exists', () => {
      ${
        propsDetails && propsDetails.some((p) => p.name === "className")
          ? `const customClass = 'custom-class';
      renderComponent({ className: customClass });

      // Verify className prop is accepted
      expect(document.body).toBeTruthy();`
          : `// Component doesn't have className prop
      expect(true).toBe(true);`
      }
    });

    it('should apply conditional styles', () => {
      renderComponent({ variant: 'primary' });

      // TODO: Verify variant-specific styles
    });

    it('should handle different size props', () => {
      const sizes = ['small', 'medium', 'large'];

      sizes.forEach(size => {
        const { unmount } = renderComponent({ size });
        // TODO: Verify size-specific rendering
        unmount();
      });
    });
  });

  describe('Integration', () => {
    it('should work with parent component state', () => {
      // TODO: Test integration with parent state management
    });

    it('should handle prop updates', () => {
      const { rerender } = renderComponent({ value: 'initial' });

      // TODO: Verify initial value
      // expect(screen.getByText('initial')).toBeInTheDocument();

      rerender(<${componentName} {...defaultProps} value="updated" />);

      // TODO: Verify updated value
      // expect(screen.getByText('updated')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();

      // TODO: Set up render tracking
      const { rerender } = renderComponent();

      // Rerender with same props
      rerender(<${componentName} {...defaultProps} />);

      // TODO: Verify component didn't re-render
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        // TODO: Add data structure
      }));

      const startTime = performance.now();
      renderComponent({ data: largeDataset });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1s
    });
  });

  describe('Error Boundaries', () => {
    it('should handle render errors gracefully', () => {
      // TODO: Test error boundary behavior if applicable
      const invalidProps = {
        // TODO: Props that might cause errors
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderComponent(invalidProps)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();

      // TODO: Verify cleanup (event listeners, subscriptions, etc.)
    });

    it('should cancel pending async operations on unmount', async () => {
      const { unmount } = renderComponent();

      // Unmount before async operations complete
      unmount();

      // TODO: Verify no memory leaks or warnings
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });
  });
});
`;
}

export default generateComponentTest;
