# 🚀 GraphQL Migration Guide - ClubManager Frontend

> **Migration from REST + React Query to GraphQL + Apollo Client**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Setup Completed](#setup-completed)
4. [Migration Strategy](#migration-strategy)
5. [Code Examples](#code-examples)
6. [Hook Patterns](#hook-patterns)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Why GraphQL?

✅ **Type-safe by design** - Auto-generated TypeScript types from schema  
✅ **Single endpoint** - No more managing multiple REST endpoints  
✅ **Precise data fetching** - Request only what you need  
✅ **Real-time subscriptions** - Built-in support for live updates  
✅ **Automatic caching** - Apollo Client handles caching intelligently  
✅ **Better DevTools** - Apollo DevTools for debugging  

### Current State

- ✅ Backend: GraphQL server with Apollo Server + graphql-yoga
- ✅ Frontend: Apollo Client installed and configured
- ✅ GraphQL Code Generator configured
- ✅ TypeDefs available in `@clubmanager/types` package
- 🔄 Hooks: Currently using REST with `fetch()` + React Query

---

## Architecture Changes

### Before (REST + React Query)

```typescript
// useAuth.ts - REST approach
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch(apiUrl('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Login failed');
      return response.json();
    },
  });
};
```

### After (GraphQL + Apollo Client)

```typescript
// useAuth.ts - GraphQL approach
import { useLoginMutation } from '@/lib/apollo/generated/graphql';

export const useLogin = () => {
  const [loginMutation, { data, loading, error }] = useLoginMutation({
    onCompleted: (data) => {
      if (data.login.token) {
        localStorage.setItem('authToken', data.login.token);
      }
    },
  });

  return {
    login: loginMutation,
    data: data?.login,
    isLoading: loading,
    error,
  };
};
```

**Benefits:**
- ✅ Auto-generated types
- ✅ Less boilerplate
- ✅ Automatic error handling
- ✅ Built-in cache management

---

## Setup Completed

### ✅ Installed Packages

```json
{
  "dependencies": {
    "@apollo/client": "^4.1.4",
    "graphql": "^16.12.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^6.1.1",
    "@graphql-codegen/typescript": "^5.0.8",
    "@graphql-codegen/typescript-operations": "^5.0.8",
    "@graphql-codegen/typescript-react-apollo": "^4.4.0",
    "@graphql-codegen/introspection": "^5.0.0",
    "change-case-all": "^2.1.0"
  }
}
```

### ✅ Configuration Files

1. **Apollo Client**: `src/lib/apollo/apollo-client.ts`
2. **Code Generator**: `codegen.ts`
3. **GraphQL Operations**: `src/graphql/operations/`

### ✅ Available Scripts

```bash
# Generate TypeScript types from GraphQL schema
npm run codegen

# Watch mode - auto-generate on schema changes
npm run codegen:watch
```

---

## Migration Strategy

### Phase 1: Setup Apollo Provider (Current)

Wrap your app with `ApolloProvider`:

```typescript
// src/main.tsx
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo/apollo-client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
```

### Phase 2: Generate Types

1. **Start GraphQL server**: `cd ../api && npm run dev`
2. **Generate types**: `npm run codegen`
3. **Check generated files**: `src/lib/apollo/generated/graphql.ts`

### Phase 3: Create GraphQL Operations

Create `.graphql.ts` files with your queries/mutations:

```typescript
// src/graphql/operations/users.graphql.ts
import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers($take: Int, $skip: Int) {
    users(take: $take, skip: $skip) {
      id
      first_name
      last_name
      email
      status
    }
  }
`;
```

### Phase 4: Migrate Hooks Incrementally

Priority order:
1. **Auth hooks** (critical path)
2. **User management** (frequently used)
3. **Courses/Sessions** (core business logic)
4. **Shop/Payments** (complex but isolated)
5. **Utils** (less critical)

---

## Code Examples

### Example 1: Simple Query

**Before (REST):**

```typescript
// hooks/admin/useUtilisateurs.ts
export const useUtilisateurs = () => {
  return useQuery({
    queryKey: ['utilisateurs'],
    queryFn: async () => {
      const response = await fetch(apiUrl('utilisateurs'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
};
```

**After (GraphQL):**

```typescript
// hooks/admin/useUtilisateurs.ts
import { useGetUsersQuery } from '@/lib/apollo/generated/graphql';

export const useUtilisateurs = (take?: number, skip?: number) => {
  const { data, loading, error, refetch } = useGetUsersQuery({
    variables: { take, skip },
  });

  return {
    users: data?.users ?? [],
    isLoading: loading,
    error,
    refetch,
  };
};
```

### Example 2: Mutation with Optimistic Updates

**Before (REST):**

```typescript
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: UpdateUserInput) => {
      const response = await fetch(apiUrl('users/update'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

**After (GraphQL):**

```typescript
import { useUpdateUserMutation, GetUsersDocument } from '@/lib/apollo/generated/graphql';

export const useUpdateUser = () => {
  const [updateUser, { loading, error }] = useUpdateUserMutation({
    // Optimistic update
    optimisticResponse: (vars) => ({
      __typename: 'Mutation',
      updateUser: {
        __typename: 'User',
        id: vars.id,
        ...vars.input,
      },
    }),
    // Update cache after mutation
    update: (cache, { data }) => {
      if (!data?.updateUser) return;
      
      cache.modify({
        fields: {
          users(existingUsers = []) {
            return existingUsers.map((user: any) =>
              user.id === data.updateUser.id ? data.updateUser : user
            );
          },
        },
      });
    },
    // Refetch queries
    refetchQueries: [{ query: GetUsersDocument }],
  });

  return {
    updateUser,
    isLoading: loading,
    error,
  };
};
```

### Example 3: Pagination

**GraphQL Operation:**

```typescript
export const GET_USERS_PAGINATED = gql`
  query GetUsersPaginated($take: Int!, $skip: Int!) {
    users(take: $take, skip: $skip) {
      id
      first_name
      last_name
      email
    }
    usersCount
  }
`;
```

**Hook:**

```typescript
import { useGetUsersPaginatedQuery } from '@/lib/apollo/generated/graphql';

export const useUsersPaginated = (page: number, pageSize: number) => {
  const { data, loading, fetchMore } = useGetUsersPaginatedQuery({
    variables: {
      take: pageSize,
      skip: page * pageSize,
    },
  });

  const loadMore = () => {
    return fetchMore({
      variables: {
        skip: data?.users.length ?? 0,
      },
    });
  };

  return {
    users: data?.users ?? [],
    totalCount: data?.usersCount ?? 0,
    isLoading: loading,
    loadMore,
  };
};
```

---

## Hook Patterns

### Pattern 1: Simple Query Hook

```typescript
import { useQuery } from '@apollo/client';
import { GET_SOMETHING } from '@/graphql/operations/domain.graphql';

export const useSomething = (id?: number) => {
  const { data, loading, error, refetch } = useQuery(GET_SOMETHING, {
    variables: { id },
    skip: !id, // Skip query if no ID
  });

  return {
    data: data?.something,
    isLoading: loading,
    error,
    refetch,
  };
};
```

### Pattern 2: Mutation Hook

```typescript
import { useMutation } from '@apollo/client';
import { CREATE_SOMETHING } from '@/graphql/operations/domain.graphql';

export const useCreateSomething = () => {
  const [createMutation, { loading, error }] = useMutation(CREATE_SOMETHING, {
    onCompleted: (data) => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    },
  });

  const create = async (input: SomethingInput) => {
    try {
      const result = await createMutation({ variables: { input } });
      return result.data?.createSomething;
    } catch (err) {
      throw err;
    }
  };

  return {
    create,
    isLoading: loading,
    error,
  };
};
```

### Pattern 3: Lazy Query Hook

```typescript
import { useLazyQuery } from '@apollo/client';
import { SEARCH_SOMETHING } from '@/graphql/operations/domain.graphql';

export const useSearchSomething = () => {
  const [search, { data, loading, error }] = useLazyQuery(SEARCH_SOMETHING);

  const executeSearch = (searchTerm: string) => {
    return search({ variables: { term: searchTerm } });
  };

  return {
    search: executeSearch,
    results: data?.search ?? [],
    isLoading: loading,
    error,
  };
};
```

---

## Best Practices

### 1. Use Fragments for Reusability

```typescript
export const USER_CORE_FIELDS = gql`
  fragment UserCoreFields on User {
    id
    first_name
    last_name
    email
  }
`;

export const GET_USER = gql`
  query GetUser($id: Int!) {
    user(id: $id) {
      ...UserCoreFields
      date_of_birth
      phone
    }
  }
  ${USER_CORE_FIELDS}
`;
```

### 2. Organize Operations by Domain

```
src/graphql/operations/
├── auth.graphql.ts
├── users.graphql.ts
├── courses.graphql.ts
├── shop.graphql.ts
└── payments.graphql.ts
```

### 3. Use Type Policies for Cache Normalization

```typescript
// apollo-client.ts
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ['id'],
    },
    Course: {
      keyFields: ['id'],
    },
    Article: {
      keyFields: ['id'],
    },
  },
});
```

### 4. Handle Loading States

```typescript
export const MyComponent = () => {
  const { data, loading, error } = useGetUsersQuery();

  if (loading) return <Spinner />;
  if (error) return <Alert variant="danger">{error.message}</Alert>;
  if (!data?.users) return <EmptyState />;

  return <UserList users={data.users} />;
};
```

### 5. Avoid Over-fetching

```typescript
// ❌ Bad - Fetching too much data
export const GET_USERS_LIST = gql`
  query GetUsersList {
    users {
      id
      first_name
      last_name
      email
      date_of_birth
      adresse
      code_postal
      localite
      numero_national
      telephone
      gsm
      # ... 20+ more fields
    }
  }
`;

// ✅ Good - Fetch only what you need
export const GET_USERS_LIST = gql`
  query GetUsersList {
    users {
      id
      first_name
      last_name
      email
      status
    }
  }
`;
```

---

## Common Patterns

### Authentication Flow

```typescript
// 1. Login mutation
const { login } = useLogin();

await login({
  variables: {
    email: 'user@example.com',
    password: 'password123',
  },
});

// 2. Token is automatically added to headers via authLink
// 3. Subsequent queries use the token
```

### Cache Updates After Mutation

```typescript
const [createUser] = useCreateUserMutation({
  update: (cache, { data }) => {
    if (!data?.createUser) return;

    // Read existing data
    const existing = cache.readQuery({ query: GetUsersDocument });
    
    if (existing?.users) {
      // Write updated data
      cache.writeQuery({
        query: GetUsersDocument,
        data: {
          users: [...existing.users, data.createUser],
        },
      });
    }
  },
});
```

### Error Handling

```typescript
const { data, error } = useGetUsersQuery({
  onError: (error) => {
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(({ message, extensions }) => {
        if (extensions?.code === 'UNAUTHENTICATED') {
          // Handle auth error
          redirectToLogin();
        } else {
          // Show error toast
          showError(message);
        }
      });
    }
    
    if (error.networkError) {
      showError('Network error. Please check your connection.');
    }
  },
});
```

---

## Testing

### Testing Queries

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import { GET_USERS } from '@/graphql/operations/users.graphql';

const mocks = [
  {
    request: {
      query: GET_USERS,
    },
    result: {
      data: {
        users: [
          { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        ],
      },
    },
  },
];

test('renders users', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserList />
    </MockedProvider>
  );

  expect(await screen.findByText('John Doe')).toBeInTheDocument();
});
```

### Testing Mutations

```typescript
const createUserMock = {
  request: {
    query: CREATE_USER,
    variables: {
      input: {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      },
    },
  },
  result: {
    data: {
      createUser: {
        id: 2,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      },
    },
  },
};

test('creates user', async () => {
  const { getByRole } = render(
    <MockedProvider mocks={[createUserMock]} addTypename={false}>
      <CreateUserForm />
    </MockedProvider>
  );

  fireEvent.click(getByRole('button', { name: /submit/i }));

  expect(await screen.findByText('User created successfully')).toBeInTheDocument();
});
```

---

## Troubleshooting

### Issue: Types not generated

**Solution:**
```bash
# 1. Make sure GraphQL server is running
cd ../api && npm run dev

# 2. Generate types
cd ../front-end && npm run codegen
```

### Issue: "Cannot read property 'data' of undefined"

**Solution:** Check query/mutation name matches GraphQL schema

```typescript
// ❌ Wrong - Query name doesn't exist in schema
const { data } = useGetAllUsersQuery(); // Schema has 'users', not 'getAllUsers'

// ✅ Correct
const { data } = useGetUsersQuery();
```

### Issue: Cache not updating after mutation

**Solution:** Use `refetchQueries` or manual cache update

```typescript
const [createUser] = useCreateUserMutation({
  refetchQueries: [{ query: GetUsersDocument }],
});
```

### Issue: CORS errors

**Solution:** Ensure backend CORS configuration allows credentials

```typescript
// api/src/graphql-server.ts
cors: {
  origin: 'http://localhost:5173',
  credentials: true,
}
```

---

## Next Steps

1. ✅ **Setup Complete** - Apollo Client configured
2. 🔄 **Generate Types** - Run `npm run codegen`
3. 📝 **Create Operations** - Define GraphQL queries/mutations
4. 🔨 **Migrate Hooks** - Start with auth hooks
5. 🧪 **Test** - Verify functionality
6. 🚀 **Deploy** - Update production config

---

## Resources

- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Apollo DevTools](https://chrome.google.com/webstore/detail/apollo-client-devtools/)

---

**Last Updated:** 2024  
**Status:** Ready for migration 🚀