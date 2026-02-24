# Apollo Mock Testing Guide

Complete guide for testing GraphQL hooks and components with Apollo Client mocks.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Usage](#basic-usage)
3. [Advanced Patterns](#advanced-patterns)
4. [Common Mocks](#common-mocks)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Installation

Apollo Client testing utilities are already installed:

```bash
npm install @apollo/client
```

### Import

```typescript
import { createApolloWrapper, mockGrades } from '@/__test-utils__/apollo-mock';
import { renderHook, waitFor } from '@testing-library/react';
```

---

## 📖 Basic Usage

### Testing a Simple Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { createApolloWrapper, mockGrades } from '@/__test-utils__/apollo-mock';
import { useGrades } from './useInformations';

describe('useGrades', () => {
  it('should return grades data', async () => {
    const { result } = renderHook(() => useGrades(), {
      wrapper: createApolloWrapper([mockGrades.success])
    });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check data
    expect(result.current.data?.grades).toHaveLength(3);
    expect(result.current.error).toBeUndefined();
  });
});
```

### Testing Error States

```typescript
it('should handle errors', async () => {
  const { result } = renderHook(() => useGrades(), {
    wrapper: createApolloWrapper([mockGrades.error])
  });

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.error).toBeDefined();
  expect(result.current.data).toBeUndefined();
});
```

### Testing Empty Data

```typescript
it('should handle empty data', async () => {
  const { result } = renderHook(() => useGrades(), {
    wrapper: createApolloWrapper([mockGrades.empty])
  });

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data?.grades).toEqual([]);
});
```

---

## 🔧 Advanced Patterns

### Testing Components with Multiple Queries

```typescript
import { createApolloWrapper, mockGrades, mockStatuses } from '@/__test-utils__/apollo-mock';

it('should load multiple queries', async () => {
  const wrapper = createApolloWrapper([
    mockGrades.success,
    mockStatuses.success,
  ]);

  const { getByText } = render(<MyComponent />, { wrapper });

  await waitFor(() => {
    expect(getByText('1ère année')).toBeInTheDocument();
    expect(getByText('Actif')).toBeInTheDocument();
  });
});
```

### Custom Mock Responses

```typescript
import { createMockResponse } from '@/__test-utils__/apollo-mock';
import { GetUserDocument } from '@/core/api/apollo/generated/graphql';

const customUserMock = createMockResponse(
  GetUserDocument,
  {
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      __typename: 'User'
    }
  },
  { id: '1' } // variables
);

const wrapper = createApolloWrapper([customUserMock]);
```

### Mock Mutations

```typescript
import { createMockResponse } from '@/__test-utils__/apollo-mock';
import { CreateUserDocument } from '@/core/api/apollo/generated/graphql';

const createUserMock = createMockResponse(
  CreateUserDocument,
  {
    createUser: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      success: true,
      __typename: 'CreateUserResponse'
    }
  },
  {
    input: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  }
);

it('should create user', async () => {
  const wrapper = createApolloWrapper([createUserMock]);
  const { result } = renderHook(() => useCreateUser(), { wrapper });

  await act(async () => {
    await result.current.createUser({
      variables: {
        input: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      }
    });
  });

  expect(result.current.data?.createUser.success).toBe(true);
});
```

### Testing with Variables

```typescript
import { createMockResponse } from '@/__test-utils__/apollo-mock';

const mockWithVariables = createMockResponse(
  GetUserByIdDocument,
  { user: { id: '123', name: 'John' } },
  { id: '123' } // These variables must match
);

// This will match
useQuery(GetUserByIdDocument, { variables: { id: '123' } });

// This will NOT match
useQuery(GetUserByIdDocument, { variables: { id: '456' } });
```

### Sequential Requests

```typescript
const firstRequest = createMockResponse(
  GetUsersDocument,
  { users: [{ id: '1', name: 'John' }] }
);

const secondRequest = createMockResponse(
  GetUsersDocument,
  { users: [{ id: '1', name: 'John' }, { id: '2', name: 'Jane' }] }
);

const wrapper = createApolloWrapper([firstRequest, secondRequest]);

// First query returns first mock
// refetch() returns second mock
```

---

## 📦 Common Mocks

### Reference Data Mocks

```typescript
import {
  mockGrades,
  mockStatuses,
  mockGenders,
  mockSubscriptions
} from '@/__test-utils__/apollo-mock';

// Success state
mockGrades.success
mockStatuses.success
mockGenders.success
mockSubscriptions.success

// Empty state
mockGrades.empty
mockStatuses.empty
mockGenders.empty
mockSubscriptions.empty

// Error state
mockGrades.error
mockStatuses.error
mockGenders.error
mockSubscriptions.error
```

### Default Wrapper (All Reference Data)

```typescript
import { createDefaultApolloWrapper } from '@/__test-utils__/apollo-mock';

// Includes all reference data mocks
const wrapper = createDefaultApolloWrapper();

const { result } = renderHook(() => useGrades(), { wrapper });
```

### Raw Mock Data

```typescript
import {
  mockGradesData,
  mockStatusesData,
  mockGendersData,
  mockSubscriptionsData
} from '@/__test-utils__/apollo-mock';

// Use for custom assertions or test data
expect(result.current.data?.grades).toEqual(mockGradesData);
```

---

## ✅ Best Practices

### 1. Always Wait for Loading to Complete

```typescript
// ❌ BAD - May fail due to timing
expect(result.current.data).toBeDefined();

// ✅ GOOD - Wait for loading
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
expect(result.current.data).toBeDefined();
```

### 2. Test Loading States

```typescript
it('should show loading state', () => {
  const { result } = renderHook(() => useGrades(), {
    wrapper: createApolloWrapper([mockGrades.success])
  });

  // Check initial loading state
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBeUndefined();
});
```

### 3. Test Error States

```typescript
it('should handle errors gracefully', async () => {
  const { result } = renderHook(() => useGrades(), {
    wrapper: createApolloWrapper([mockGrades.error])
  });

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.error).toBeDefined();
  expect(result.current.error?.message).toContain('Failed to fetch');
});
```

### 4. Use Specific Mocks

```typescript
// ❌ BAD - Generic mock
const mock = { request: { query: GetGradesDocument }, result: { data: {} } };

// ✅ GOOD - Use predefined specific mocks
import { mockGrades } from '@/__test-utils__/apollo-mock';
const wrapper = createApolloWrapper([mockGrades.success]);
```

### 5. Match Variables Exactly

```typescript
// ❌ BAD - Variables don't match
const mock = createMockResponse(
  GetUserDocument,
  { user: { id: '1' } },
  { userId: '1' } // Wrong variable name
);

// ✅ GOOD - Variables match query
const mock = createMockResponse(
  GetUserDocument,
  { user: { id: '1' } },
  { id: '1' } // Correct variable name
);
```

### 6. Include __typename

```typescript
// ❌ BAD - Missing __typename
const data = {
  user: { id: '1', name: 'John' }
};

// ✅ GOOD - Include __typename for Apollo cache
const data = {
  user: { id: '1', name: 'John', __typename: 'User' }
};
```

---

## 🐛 Troubleshooting

### Issue: "No more mocked responses"

**Cause**: Query was called more times than mocks provided.

**Solution**: Provide enough mocks for all queries.

```typescript
// If refetch is called, provide multiple mocks
const wrapper = createApolloWrapper([
  mockGrades.success, // Initial query
  mockGrades.success, // Refetch
]);
```

### Issue: "Mock not matched"

**Cause**: Query variables don't match mock variables.

**Solution**: Ensure variables match exactly.

```typescript
// Query
useQuery(GetUserDocument, { variables: { id: '1' } });

// Mock MUST have same variables
createMockResponse(GetUserDocument, data, { id: '1' });
```

### Issue: "Cannot read property of undefined"

**Cause**: Accessing data before loading completes.

**Solution**: Always wait for loading.

```typescript
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});

// Now safe to access data
expect(result.current.data.grades).toBeDefined();
```

### Issue: "useQuery is not a function"

**Cause**: Hook not wrapped in Apollo provider.

**Solution**: Use createApolloWrapper.

```typescript
const { result } = renderHook(() => useGrades(), {
  wrapper: createApolloWrapper([mockGrades.success])
});
```

### Issue: Component errors with "Element type is invalid"

**Cause**: Missing MockedProvider or wrong import.

**Solution**: Verify imports and wrapper usage.

```typescript
import { createApolloWrapper } from '@/__test-utils__/apollo-mock';

render(<Component />, {
  wrapper: createApolloWrapper([/* mocks */])
});
```

---

## 📚 Examples

### Complete Hook Test

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { createApolloWrapper, mockGrades } from '@/__test-utils__/apollo-mock';
import { useGrades } from './useInformations';

describe('useGrades', () => {
  it('should fetch and return grades', async () => {
    const { result } = renderHook(() => useGrades(), {
      wrapper: createApolloWrapper([mockGrades.success])
    });

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Final state
    expect(result.current.data?.grades).toHaveLength(3);
    expect(result.current.data?.grades[0].grade_name).toBe('1ère année');
    expect(result.current.error).toBeUndefined();
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useGrades(), {
      wrapper: createApolloWrapper([mockGrades.error])
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Failed to fetch grades');
  });

  it('should handle empty results', async () => {
    const { result } = renderHook(() => useGrades(), {
      wrapper: createApolloWrapper([mockGrades.empty])
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.grades).toEqual([]);
  });
});
```

### Complete Component Test

```typescript
import { render, waitFor } from '@testing-library/react';
import { createApolloWrapper, mockGrades } from '@/__test-utils__/apollo-mock';
import { GradesList } from './GradesList';

describe('GradesList', () => {
  it('should render grades', async () => {
    const { getByText, queryByText } = render(<GradesList />, {
      wrapper: createApolloWrapper([mockGrades.success])
    });

    // Loading state
    expect(getByText('Loading...')).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check rendered data
    expect(getByText('1ère année')).toBeInTheDocument();
    expect(getByText('2ème année')).toBeInTheDocument();
    expect(getByText('3ème année')).toBeInTheDocument();
  });
});
```

---

## 🎯 Summary

**Key Points:**

1. ✅ Use `createApolloWrapper()` for all GraphQL tests
2. ✅ Always `await waitFor()` for loading to complete
3. ✅ Test loading, success, error, and empty states
4. ✅ Use predefined mocks from `apollo-mock.tsx`
5. ✅ Match variables exactly in custom mocks
6. ✅ Include `__typename` in all mock data

**Quick Reference:**

```typescript
// Import
import { createApolloWrapper, mockGrades } from '@/__test-utils__/apollo-mock';

// Hook test
const { result } = renderHook(() => useGrades(), {
  wrapper: createApolloWrapper([mockGrades.success])
});

// Component test
render(<Component />, {
  wrapper: createApolloWrapper([mockGrades.success])
});

// Wait for data
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

---

**Happy Testing! 🎉**