/**
 * Tests for template-generator.js
 *
 * Comprehensive test suite for the template generation logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateTest,
  generateTestHeader,
  generateTestFooter,
  generateCompleteTest,
} from '../template-generator.js';

describe('template-generator', () => {
  describe('generateTestHeader', () => {
    it('should generate a header with file information', () => {
      const analysis = {
        fileName: 'useExample.ts',
        type: 'hook',
      };

      const header = generateTestHeader(analysis);

      expect(header).toContain('Tests for useExample.ts');
      expect(header).toContain('@file useExample.ts');
      expect(header).toContain('@type hook');
      expect(header).toContain('@generated');
      expect(header).toContain('TODO: Review and complete');
    });

    it('should include current date in ISO format', () => {
      const analysis = {
        fileName: 'test.ts',
        type: 'util',
      };

      const header = generateTestHeader(analysis);
      const dateRegex = /\d{4}-\d{2}-\d{2}/;

      expect(header).toMatch(dateRegex);
    });

    it('should include TODO comments', () => {
      const analysis = {
        fileName: 'Component.tsx',
        type: 'component',
      };

      const header = generateTestHeader(analysis);

      expect(header).toContain('TODO:');
      expect(header).toContain('Review and complete');
      expect(header).toContain('Remove this header');
    });
  });

  describe('generateTestFooter', () => {
    it('should generate tips for hook type', () => {
      const analysis = { type: 'hook' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for hook');
      expect(footer).toContain('Test initialization');
      expect(footer).toContain('Test state updates');
      expect(footer).toContain('Test cleanup on unmount');
    });

    it('should generate tips for hookGraphQL type', () => {
      const analysis = { type: 'hookGraphQL' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for hookGraphQL');
      expect(footer).toContain('MockedProvider');
      expect(footer).toContain('loading, error, and success states');
      expect(footer).toContain('cache interactions');
    });

    it('should generate tips for util type', () => {
      const analysis = { type: 'util' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for util');
      expect(footer).toContain('valid and invalid inputs');
      expect(footer).toContain('edge cases');
      expect(footer).toContain('function purity');
    });

    it('should generate tips for component type', () => {
      const analysis = { type: 'component' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for component');
      expect(footer).toContain('different props');
      expect(footer).toContain('user interactions');
      expect(footer).toContain('accessibility');
    });

    it('should generate tips for store type', () => {
      const analysis = { type: 'store' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for store');
      expect(footer).toContain('state initialization');
      expect(footer).toContain('selectors');
      expect(footer).toContain('subscriptions');
    });

    it('should generate tips for page type', () => {
      const analysis = { type: 'page' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for page');
      expect(footer).toContain('routing context');
      expect(footer).toContain('data loading states');
      expect(footer).toContain('permissions and auth');
    });

    it('should generate default tips for unknown type', () => {
      const analysis = { type: 'unknown' };
      const footer = generateTestFooter(analysis);

      expect(footer).toContain('Testing Tips for unknown');
      expect(footer).toContain('clear and descriptive');
      expect(footer).toContain('happy path and error cases');
      expect(footer).toContain('isolated and independent');
    });
  });

  describe('generateTest - hook type', () => {
    it('should generate test for basic hook', () => {
      const analysis = {
        type: 'hook',
        name: 'useCounter',
        fileName: 'useCounter.ts',
        exports: { default: 'useCounter', named: [] },
        features: {
          hasState: true,
          hasEffects: false,
          hasGraphQL: false,
        },
      };

      const content = generateTest(analysis, '/path/to/__tests__/useCounter.test.ts');

      expect(content).toContain("import { describe, it, expect");
      expect(content).toContain("import { renderHook");
      expect(content).toContain("import { useCounter }");
      expect(content).toContain("describe('useCounter'");
      expect(content).toContain('Initialization');
      expect(content).toContain('TODO:');
    });

    it('should include correct import path', () => {
      const analysis = {
        type: 'hook',
        name: 'useExample',
        exports: { default: 'useExample', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain("from '../useExample'");
    });
  });

  describe('generateTest - hookGraphQL type', () => {
    it('should generate test for GraphQL hook', () => {
      const analysis = {
        type: 'hookGraphQL',
        name: 'useUsers',
        fileName: 'useUsers.ts',
        exports: { default: 'useUsers', named: [] },
        features: {
          hasGraphQL: true,
          hasQuery: true,
        },
      };

      const content = generateTest(analysis, '/path/to/__tests__/useUsers.test.ts');

      expect(content).toContain("import { MockedProvider }");
      expect(content).toContain("describe('useUsers'");
      expect(content).toContain('Loading State');
      expect(content).toContain('Success State');
      expect(content).toContain('Error State');
      expect(content).toContain('Refetch');
      expect(content).toContain('TODO:');
    });

    it('should include Apollo Client testing utilities', () => {
      const analysis = {
        type: 'hookGraphQL',
        name: 'useQuery',
        exports: { default: 'useQuery', named: [] },
        features: { hasGraphQL: true },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('@apollo/client/testing');
      expect(content).toContain('MockedProvider');
    });
  });

  describe('generateTest - util type', () => {
    it('should generate test for utility function', () => {
      const analysis = {
        type: 'util',
        name: 'formatters',
        fileName: 'formatters.ts',
        exports: {
          default: null,
          named: ['formatDate', 'formatCurrency', 'formatPhone']
        },
        functions: ['formatDate', 'formatCurrency', 'formatPhone'],
      };

      const content = generateTest(analysis, '/path/to/__tests__/formatters.test.ts');

      expect(content).toContain("describe('formatters'");
      expect(content).toContain('formatDate');
      expect(content).toContain('formatCurrency');
      expect(content).toContain('formatPhone');
      expect(content).toContain('valid input');
      expect(content).toContain('invalid input');
      expect(content).toContain('edge cases');
    });

    it('should handle single function export', () => {
      const analysis = {
        type: 'util',
        name: 'validate',
        exports: { default: 'validate', named: [] },
        functions: ['validate'],
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain("import { validate }");
      expect(content).toContain("describe('validate'");
    });

    it('should handle multiple named exports', () => {
      const analysis = {
        type: 'util',
        name: 'helpers',
        exports: { default: null, named: ['helper1', 'helper2', 'helper3'] },
        functions: ['helper1', 'helper2', 'helper3'],
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('helper1');
      expect(content).toContain('helper2');
      expect(content).toContain('helper3');
    });
  });

  describe('generateTest - component type', () => {
    it('should generate test for React component', () => {
      const analysis = {
        type: 'component',
        name: 'Button',
        fileName: 'Button.tsx',
        exports: { default: 'Button', named: [] },
        features: {
          hasJSX: true,
          hasProps: true,
        },
        props: ['onClick', 'disabled', 'children'],
      };

      const content = generateTest(analysis, '/path/to/__tests__/Button.test.tsx');

      expect(content).toContain("import { render, screen }");
      expect(content).toContain("describe('Button'");
      expect(content).toContain('Rendering');
      expect(content).toContain('Props');
      expect(content).toContain('User Interactions');
      expect(content).toContain('Accessibility');
    });

    it('should include user-event for interactions', () => {
      const analysis = {
        type: 'component',
        name: 'Form',
        exports: { default: 'Form', named: [] },
        features: { hasJSX: true },
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toContain("userEvent from '@testing-library/user-event'");
    });

    it('should test component props', () => {
      const analysis = {
        type: 'component',
        name: 'Card',
        exports: { default: 'Card', named: [] },
        props: ['title', 'description', 'onClick'],
        features: {},
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toContain('Props');
      expect(content).toContain('TODO:');
    });
  });

  describe('generateTest - store type', () => {
    it('should generate test for Zustand store', () => {
      const analysis = {
        type: 'store',
        name: 'user-store',
        fileName: 'user-store.ts',
        exports: { default: 'useUserStore', named: [] },
        features: {
          hasZustand: true,
          hasState: true,
        },
      };

      const content = generateTest(analysis, '/path/to/__tests__/user-store.test.ts');

      expect(content).toContain("describe('useUserStore'");
      expect(content).toContain('Initialization');
      expect(content).toContain('State Updates');
      expect(content).toContain('Selectors');
      expect(content).toContain('Persistence');
    });

    it('should include Zustand testing setup', () => {
      const analysis = {
        type: 'store',
        name: 'app-store',
        exports: { default: 'useAppStore', named: [] },
        features: { hasZustand: true },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('renderHook');
      expect(content).toContain('act');
    });
  });

  describe('generateTest - page type', () => {
    it('should generate test for page component', () => {
      const analysis = {
        type: 'page',
        name: 'UsersPage',
        fileName: 'UsersPage.tsx',
        exports: { default: 'UsersPage', named: [] },
        features: {
          hasJSX: true,
          hasGraphQL: true,
        },
      };

      const content = generateTest(analysis, '/path/to/__tests__/UsersPage.test.tsx');

      expect(content).toContain("describe('UsersPage'");
      expect(content).toContain('Rendering');
      expect(content).toContain('Data Loading');
      expect(content).toContain('Navigation');
      expect(content).toContain('User Interactions');
      expect(content).toContain('Permissions & Auth');
      expect(content).toContain('Accessibility');
    });

    it('should include routing context', () => {
      const analysis = {
        type: 'page',
        name: 'HomePage',
        exports: { default: 'HomePage', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toContain('BrowserRouter');
      expect(content).toContain('react-router-dom');
    });

    it('should include GraphQL mocking for pages', () => {
      const analysis = {
        type: 'page',
        name: 'DashboardPage',
        exports: { default: 'DashboardPage', named: [] },
        features: { hasGraphQL: true },
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toContain('MockedProvider');
      expect(content).toContain('@apollo/client/testing');
    });

    it('should test route parameters', () => {
      const analysis = {
        type: 'page',
        name: 'UserDetailPage',
        exports: { default: 'UserDetailPage', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toContain('route parameters');
    });
  });

  describe('generateTest - unknown type', () => {
    it('should generate generic test for unknown type', () => {
      const analysis = {
        type: 'unknown',
        name: 'Mystery',
        fileName: 'mystery.ts',
        exports: { default: 'Mystery', named: [] },
      };

      const content = generateTest(analysis, '/path/to/__tests__/mystery.test.ts');

      expect(content).toContain("describe('Mystery'");
      expect(content).toContain('should be defined');
      expect(content).toContain('TODO: Add specific tests');
    });

    it('should use default export name', () => {
      const analysis = {
        type: 'unknown',
        name: 'Something',
        exports: { default: 'Something', named: [] },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain("import { Something }");
      expect(content).toContain("describe('Something'");
    });

    it('should use first named export if no default', () => {
      const analysis = {
        type: 'unknown',
        name: 'utils',
        exports: { default: null, named: ['firstExport', 'secondExport'] },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('firstExport');
    });

    it('should use name as fallback', () => {
      const analysis = {
        type: 'unknown',
        name: 'fallback',
        exports: { default: null, named: [] },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('fallback');
    });
  });

  describe('generateCompleteTest', () => {
    it('should combine header, body, and footer', () => {
      const analysis = {
        type: 'hook',
        name: 'useExample',
        fileName: 'useExample.ts',
        exports: { default: 'useExample', named: [] },
        features: {},
      };

      const testFilePath = '/path/to/__tests__/useExample.test.ts';
      const completeTest = generateCompleteTest(analysis, testFilePath);

      // Should contain header
      expect(completeTest).toContain('Tests for useExample.ts');
      expect(completeTest).toContain('@generated');

      // Should contain body
      expect(completeTest).toContain("describe('useExample'");
      expect(completeTest).toContain('import');

      // Should contain footer
      expect(completeTest).toContain('Testing Tips');
    });

    it('should be valid JavaScript/TypeScript', () => {
      const analysis = {
        type: 'util',
        name: 'formatDate',
        fileName: 'formatDate.ts',
        exports: { default: 'formatDate', named: [] },
        functions: ['formatDate'],
      };

      const completeTest = generateCompleteTest(analysis, '/test.ts');

      // Check for basic syntax validity
      expect(completeTest).toContain('import');
      expect(completeTest).toContain('describe');
      expect(completeTest).toContain('it(');
      expect(completeTest).toContain('expect');
      expect(completeTest).not.toContain('undefined');
      expect(completeTest).not.toContain('[object Object]');
    });

    it('should include all sections in correct order', () => {
      const analysis = {
        type: 'component',
        name: 'Card',
        fileName: 'Card.tsx',
        exports: { default: 'Card', named: [] },
        features: {},
      };

      const completeTest = generateCompleteTest(analysis, '/test.tsx');

      const headerIndex = completeTest.indexOf('/**');
      const importIndex = completeTest.indexOf('import');
      const describeIndex = completeTest.indexOf('describe');
      const tipsIndex = completeTest.indexOf('Testing Tips');

      expect(headerIndex).toBeLessThan(importIndex);
      expect(importIndex).toBeLessThan(describeIndex);
      expect(describeIndex).toBeLessThan(tipsIndex);
    });

    it('should handle complex analysis with multiple features', () => {
      const analysis = {
        type: 'hookGraphQL',
        name: 'useUserData',
        fileName: 'useUserData.ts',
        exports: { default: 'useUserData', named: ['refetchUser'] },
        features: {
          hasGraphQL: true,
          hasQuery: true,
          hasMutation: true,
          hasState: true,
          hasEffects: true,
        },
        functions: ['useUserData', 'refetchUser'],
      };

      const completeTest = generateCompleteTest(analysis, '/test.ts');

      expect(completeTest).toContain('useUserData');
      expect(completeTest).toContain('MockedProvider');
      expect(completeTest).toBeTruthy();
      expect(completeTest.length).toBeGreaterThan(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle analysis with no exports', () => {
      const analysis = {
        type: 'util',
        name: 'empty',
        fileName: 'empty.ts',
        exports: { default: null, named: [] },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('empty');
      expect(content).toContain('describe');
    });

    it('should handle very long file names', () => {
      const analysis = {
        type: 'hook',
        name: 'useVeryLongNameThatShouldStillWorkCorrectly',
        fileName: 'useVeryLongNameThatShouldStillWorkCorrectly.ts',
        exports: { default: 'useVeryLongNameThatShouldStillWorkCorrectly', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('useVeryLongNameThatShouldStillWorkCorrectly');
    });

    it('should handle special characters in names', () => {
      const analysis = {
        type: 'util',
        name: 'utils-helpers',
        fileName: 'utils-helpers.ts',
        exports: { default: null, named: ['helper1'] },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toBeTruthy();
      expect(content).toContain('describe');
    });

    it('should handle analysis with many functions', () => {
      const analysis = {
        type: 'util',
        name: 'helpers',
        fileName: 'helpers.ts',
        exports: {
          default: null,
          named: Array.from({ length: 20 }, (_, i) => `helper${i}`)
        },
        functions: Array.from({ length: 20 }, (_, i) => `helper${i}`),
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('helper0');
      expect(content).toContain('helper19');
    });

    it('should handle empty features object', () => {
      const analysis = {
        type: 'hook',
        name: 'useSimple',
        exports: { default: 'useSimple', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toBeTruthy();
      expect(content).toContain('useSimple');
    });

    it('should handle missing features property', () => {
      const analysis = {
        type: 'component',
        name: 'Simple',
        exports: { default: 'Simple', named: [] },
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toBeTruthy();
      expect(content).toContain('Simple');
    });
  });

  describe('Import Paths', () => {
    it('should generate correct relative import path', () => {
      const analysis = {
        type: 'hook',
        name: 'useTest',
        exports: { default: 'useTest', named: [] },
        features: {},
        filePath: '/src/hooks/useTest.ts',
      };

      const content = generateTest(analysis, '/src/hooks/__tests__/useTest.test.ts');

      expect(content).toContain("from '../useTest'");
    });

    it('should handle nested directory structures', () => {
      const analysis = {
        type: 'util',
        name: 'helper',
        exports: { default: 'helper', named: [] },
        filePath: '/src/features/users/utils/helper.ts',
      };

      const content = generateTest(
        analysis,
        '/src/features/users/utils/__tests__/helper.test.ts'
      );

      expect(content).toContain("from '../helper'");
    });
  });

  describe('TODO Comments', () => {
    it('should include TODO comments for guidance', () => {
      const analysis = {
        type: 'hook',
        name: 'useExample',
        exports: { default: 'useExample', named: [] },
        features: {},
      };

      const content = generateCompleteTest(analysis, '/test.ts');

      const todoCount = (content.match(/TODO:/g) || []).length;
      expect(todoCount).toBeGreaterThan(0);
    });

    it('should include specific TODOs for GraphQL hooks', () => {
      const analysis = {
        type: 'hookGraphQL',
        name: 'useData',
        exports: { default: 'useData', named: [] },
        features: { hasGraphQL: true },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain('TODO:');
      expect(content).toContain('mock');
    });

    it('should include specific TODOs for components', () => {
      const analysis = {
        type: 'component',
        name: 'Button',
        exports: { default: 'Button', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.tsx');

      expect(content).toContain('TODO:');
    });
  });

  describe('Test Structure', () => {
    it('should create nested describe blocks', () => {
      const analysis = {
        type: 'component',
        name: 'Card',
        exports: { default: 'Card', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.tsx');

      const describeCount = (content.match(/describe\(/g) || []).length;
      expect(describeCount).toBeGreaterThan(1);
    });

    it('should include multiple test cases', () => {
      const analysis = {
        type: 'hook',
        name: 'useCounter',
        exports: { default: 'useCounter', named: [] },
        features: {},
      };

      const content = generateTest(analysis, '/test.ts');

      const itCount = (content.match(/it\(/g) || []).length;
      expect(itCount).toBeGreaterThan(1);
    });

    it('should use proper Vitest imports', () => {
      const analysis = {
        type: 'util',
        name: 'format',
        exports: { default: 'format', named: [] },
      };

      const content = generateTest(analysis, '/test.ts');

      expect(content).toContain("from 'vitest'");
      expect(content).toContain('describe');
      expect(content).toContain('it');
      expect(content).toContain('expect');
    });
  });
});
