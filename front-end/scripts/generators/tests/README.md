# Test Generation & Automation Tools

This directory contains automated tools for generating and maintaining comprehensive test suites for the ClubManager frontend application.

## 📁 Directory Structure

```
tests/
├── README.md                    # This file
├── index.js                     # Main test generator orchestrator
├── analyzer.js                  # Code analysis and AST parsing
├── config.js                    # Configuration and patterns
├── file-writer.js              # File I/O operations
├── template-generator.js       # Template selection logic
├── utils.js                    # Shared utilities
├── fill-todos.js               # Automatic TODO completion script
└── templates/                  # Test templates
    ├── component.template.js   # React component tests
    ├── hook.template.js        # React hooks tests
    ├── service.template.js     # Service/API tests
    ├── utils.template.js       # Utility function tests
    └── formatter.template.js   # Data formatter tests
```

## 🚀 Quick Start

### Generate Tests for All Files

```bash
# Interactive mode (prompts for confirmation)
node scripts/generators/tests/index.js --all

# Non-interactive mode (auto-generate all)
node scripts/generators/tests/index.js --all --no-interactive

# Generate tests for specific type only
node scripts/generators/tests/index.js --type component
node scripts/generators/tests/index.js --type service
node scripts/generators/tests/index.js --type utils
```

### Generate Test for Specific File

```bash
node scripts/generators/tests/index.js --file src/components/MyComponent.tsx
```

### Fill Existing TODOs Automatically

```bash
# Dry run (preview changes)
node scripts/generators/tests/fill-todos.js --dry-run

# Apply changes
node scripts/generators/tests/fill-todos.js

# Verbose output
node scripts/generators/tests/fill-todos.js --verbose

# Process specific file
node scripts/generators/tests/fill-todos.js --file=src/components/MyComponent.test.tsx
```

## 🎯 Features

### Intelligent Code Analysis

The analyzer (`analyzer.js`) performs deep static analysis:

- **TypeScript AST parsing** - Extracts props, types, interfaces
- **Function signature detection** - Parameters, return types, defaults
- **Dependency detection** - Apollo Client, i18n, React Router
- **Pattern recognition** - Forms, authentication, GraphQL operations

### Context-Aware Test Generation

Templates automatically adapt to code context:

- **Smart provider wrapping** - Auto-includes necessary providers (Apollo, i18n, Router)
- **Prop-based test cases** - Generates tests for all detected props
- **Type-safe mocks** - Creates mocks matching TypeScript types
- **Edge case coverage** - Null/undefined, boundaries, errors

### Automatic TODO Filling

The `fill-todos.js` script intelligently completes repetitive TODO comments:

- **Pattern matching** - 25+ common TODO patterns recognized
- **Context validation** - Only fills TODOs where context matches
- **Business logic preservation** - Skips domain-specific TODOs
- **88%+ fill rate** - Dramatically reduces manual work

## 📊 Test Coverage Goals

| Category | Target Coverage | Current Status |
|----------|----------------|----------------|
| Components | 80%+ | ✅ Generated |
| Hooks | 80%+ | ✅ Generated |
| Services | 85%+ | ✅ Generated |
| Utils/Formatters | 90%+ | ✅ Generated |
| Overall | 80%+ | 🔄 In Progress |

## 🛠️ Configuration

### `config.js` - Patterns & Rules

```javascript
// Add new file patterns
patterns: {
  component: ['**/*.tsx', '!**/*.test.tsx'],
  service: ['**/services/**/*.ts'],
  // ...
}

// Add ignore patterns
ignorePatterns: [
  'node_modules',
  'dist',
  '__tests__',
  // ...
]
```

### Template Customization

Each template in `templates/` can be customized:

1. **Component Template** - React component test structure
2. **Service Template** - API/GraphQL service tests
3. **Utils Template** - Pure function tests
4. **Hook Template** - React hook tests

## 📝 Generated Test Structure

### Component Tests

```typescript
describe('MyComponent', () => {
  // Setup & helpers
  const defaultProps = { ... };
  const renderComponent = (props) => { ... };

  // Test categories
  describe('Rendering', () => { ... });
  describe('User Interactions', () => { ... });
  describe('Conditional Rendering', () => { ... });
  describe('Props Validation', () => { ... });
  describe('Accessibility', () => { ... });
  describe('Performance', () => { ... });
  describe('Cleanup', () => { ... });
});
```

### Service Tests

```typescript
describe('MyService', () => {
  // Mock setup
  beforeEach(() => { ... });

  // Method tests
  describe('myMethod', () => {
    describe('Basic Functionality', () => { ... });
    describe('Success Cases', () => { ... });
    describe('Error Handling', () => { ... });
    describe('Edge Cases', () => { ... });
  });
});
```

## 🧪 Test Utilities

### Available Test Helpers

Located in `src/__test-utils__/`:

```typescript
// Render helpers
import { renderWithProviders } from '@/__test-utils__';

renderWithProviders(<MyComponent />, {
  apolloMocks: [...],
  initialRoute: '/dashboard',
});

// Factories
import { UserFactory, ProductFactory, CourseFactory } from '@/__test-utils__';

const user = UserFactory.create({ role: 'ADMIN' });
const products = ProductFactory.createMany(10);
const course = CourseFactory.createBeginner();

// Common utilities
import { 
  createMockFile,
  createGraphQLError,
  waitFor,
  flushPromises 
} from '@/__test-utils__';
```

## 📈 Fill-TODOs Statistics

Last run results:

- **Files processed:** 151
- **TODOs found:** 2,241
- **TODOs filled:** 1,989 ✅
- **Fill rate:** 88.8%
- **Remaining:** 252 (business-logic specific)

### Patterns Automatically Filled

1. ✅ Default rendering verification
2. ✅ Click handlers
3. ✅ Form interactions
4. ✅ Loading/error/empty states
5. ✅ ARIA labels & accessibility
6. ✅ Keyboard navigation
7. ✅ Data display
8. ✅ Type safety checks
9. ✅ Performance tests
10. ✅ Cleanup verification
11. ... and 15+ more patterns

## 🔍 Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests for Specific File

```bash
npm test -- src/components/MyComponent.test.tsx
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

## 📋 Workflow: Reaching 80% Coverage

### Phase 1: Generate Tests (✅ Complete)

```bash
# Generate all tests
node scripts/generators/tests/index.js --all --no-interactive

# Generated: 239 test files
# Lines of test code: ~35,000+
```

### Phase 2: Fill TODOs (✅ Complete)

```bash
# Automatically fill repetitive TODOs
node scripts/generators/tests/fill-todos.js

# Filled: 1,989 TODOs
# Remaining: 252 business-specific TODOs
```

### Phase 3: Manual Completion (🔄 In Progress)

1. Review remaining TODOs (252)
2. Add business-logic specific tests
3. Add integration tests
4. Verify critical paths

### Phase 4: Coverage Verification

```bash
# Run coverage analysis
npm run test:coverage

# Check coverage report
open coverage/index.html
```

## 🎓 Best Practices

### When Adding New Code

1. **Run generator for new files:**
   ```bash
   node scripts/generators/tests/index.js --file src/path/to/NewFile.tsx
   ```

2. **Fill TODOs automatically:**
   ```bash
   node scripts/generators/tests/fill-todos.js --file=src/path/to/NewFile.test.tsx
   ```

3. **Complete business-logic TODOs manually**

4. **Run tests to verify:**
   ```bash
   npm test -- NewFile.test.tsx
   ```

### Test Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: Match component/function names
- Test cases: Start with "should"
- Test IDs: Use `data-testid` attributes

### Mock Data Best Practices

```typescript
// ✅ Good: Use factories
const user = UserFactory.create({ role: 'ADMIN' });

// ❌ Bad: Inline mock objects
const user = { id: 1, name: 'Test', ... };

// ✅ Good: Reusable fixtures
import { mockGraphQLResponse } from '@/__test-utils__/fixtures';

// ❌ Bad: Repeated mock data in every test
```

## 🐛 Troubleshooting

### Common Issues

**Issue: "Cannot find module '@/__test-utils__'"**

```bash
# Solution: Verify tsconfig.json paths are configured
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Issue: "Provider not found in test"**

```bash
# Solution: Use renderWithProviders instead of render
import { renderWithProviders } from '@/__test-utils__';
```

**Issue: "Generated test has compilation errors"**

```bash
# Solution: Check imports and regenerate
node scripts/generators/tests/index.js --file path/to/file.tsx
```

**Issue: "TODOs not being filled"**

```bash
# Solution: Run with verbose flag to see why
node scripts/generators/tests/fill-todos.js --dry-run --verbose
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event API](https://testing-library.com/docs/user-event/intro)

## 🤝 Contributing

### Adding New TODO Patterns

Edit `fill-todos.js` and add to `TODO_PATTERNS`:

```javascript
{
  name: "my-pattern",
  regex: /\/\/ TODO: My pattern.*/g,
  replacement: (match, context) => {
    return `// My replacement code`;
  },
  context: ["requiredContext"],
}
```

### Adding New Templates

1. Create template in `templates/my-template.template.js`
2. Add pattern detection in `config.js`
3. Update `template-generator.js` to use new template
4. Test with sample file

## 📞 Support

For issues or questions:

1. Check existing test files for examples
2. Review TODO completion guide: `docs/TODO_COMPLETION_GUIDE.md`
3. Check generator configuration: `scripts/generators/tests/config.js`

---

**Last Updated:** 2024-01
**Maintained By:** ClubManager Development Team
**Status:** ✅ Active Development