# State Management Strategy - ClubManager Frontend

## 📋 Table of Contents
- [Current State](#current-state)
- [Recommended Strategy](#recommended-strategy)
- [Implementation Plan](#implementation-plan)
- [Best Practices](#best-practices)

---

## 🔍 Current State

### What We Have
- **Apollo Client Cache**: Server state for GraphQL queries/mutations
- **localStorage**: Authentication tokens, user data persistence
- **useState/useReducer**: Component-level UI state
- **Redux (commented)**: Previously used for global state

### Issues
1. ❌ State logic duplicated across components
2. ❌ No single source of truth for auth state
3. ❌ localStorage directly accessed in components (tight coupling)
4. ❌ No clear separation between server state and client state

---

## 💡 Recommended Strategy

### Modern Approach: **Apollo Client + Zustand**

```
┌─────────────────────────────────────────────────────────┐
│                    STATE LAYERS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌐 SERVER STATE (Apollo Client Cache)                 │
│  ├─ GraphQL queries (users, courses, orders, etc.)     │
│  ├─ Optimistic updates                                 │
│  └─ Cache normalization                                │
│                                                         │
│  💾 GLOBAL CLIENT STATE (Zustand)                      │
│  ├─ Authentication state (token, user, isAuth)         │
│  ├─ UI preferences (theme, language, sidebar)          │
│  ├─ Shopping cart                                      │
│  ├─ Notifications queue                                │
│  └─ Feature flags                                      │
│                                                         │
│  🎨 LOCAL UI STATE (useState/useReducer)               │
│  ├─ Form inputs                                        │
│  ├─ Modal open/close                                   │
│  ├─ Accordion expand/collapse                          │
│  └─ Temporary selections                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Why Zustand over Redux?
✅ **Simpler**: Less boilerplate, no actions/reducers ceremony
✅ **TypeScript-first**: Better type inference
✅ **Smaller bundle**: ~1KB vs ~20KB (Redux + Redux Toolkit)
✅ **No Provider needed**: Direct store access
✅ **DevTools**: Supports Redux DevTools
✅ **Middleware**: Similar to Redux (persist, immer, etc.)

---

## 🚀 Implementation Plan

### Phase 1: Setup Zustand Store (2 days)

**Install dependencies**:
```bash
npm install zustand immer
npm install --save-dev @types/zustand
```

**Create store structure**:
```typescript
// src/store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createCartSlice, CartSlice } from './slices/cartSlice';
import { createUISlice, UISlice } from './slices/uiSlice';

export type StoreState = AuthSlice & CartSlice & UISlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createAuthSlice(...a),
        ...createCartSlice(...a),
        ...createUISlice(...a),
      })),
      {
        name: 'clubmanager-storage',
        partialize: (state) => ({
          // Only persist auth and cart
          auth: state.auth,
          cart: state.cart,
        }),
      }
    )
  )
);
```

**Example: Auth Slice**:
```typescript
// src/store/slices/authSlice.ts
import { StateCreator } from 'zustand';
import { StoreState } from '../index';

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export type AuthSlice = {
  auth: AuthState;
} & AuthActions;

export const createAuthSlice: StateCreator<
  StoreState,
  [["zustand/immer", never], ["zustand/devtools", never]],
  [],
  AuthSlice
> = (set) => ({
  auth: {
    token: null,
    user: null,
    isAuthenticated: false,
  },
  login: (token, user) =>
    set((state) => {
      state.auth.token = token;
      state.auth.user = user;
      state.auth.isAuthenticated = true;
    }, false, 'auth/login'),
  logout: () =>
    set((state) => {
      state.auth.token = null;
      state.auth.user = null;
      state.auth.isAuthenticated = false;
    }, false, 'auth/logout'),
  updateUser: (user) =>
    set((state) => {
      if (state.auth.user) {
        state.auth.user = { ...state.auth.user, ...user };
      }
    }, false, 'auth/updateUser'),
});
```

**Usage in components**:
```typescript
// ❌ Before (with localStorage)
const userData = JSON.parse(localStorage.getItem('userData') || '{}');
const token = localStorage.getItem('authToken');

// ✅ After (with Zustand)
const { user, token, isAuthenticated } = useStore((state) => state.auth);
const login = useStore((state) => state.login);
const logout = useStore((state) => state.logout);
```

### Phase 2: Migrate from localStorage (1 day)

**Remove direct localStorage access**:
```typescript
// ❌ Bad - scattered throughout codebase
localStorage.setItem('authToken', token);
const userData = JSON.parse(localStorage.getItem('userData') || '{}');

// ✅ Good - centralized in store with persistence middleware
const login = useStore((state) => state.login);
login(token, userData); // Automatically persisted
```

**Create migration hook**:
```typescript
// src/hooks/useMigrateLegacyStorage.ts
export const useMigrateLegacyStorage = () => {
  useEffect(() => {
    const legacyToken = localStorage.getItem('authToken');
    const legacyUser = localStorage.getItem('userData');
    
    if (legacyToken && legacyUser) {
      const user = JSON.parse(legacyUser);
      useStore.getState().login(legacyToken, user);
      
      // Clean up old storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }, []);
};
```

### Phase 3: Clean Apollo Cache Strategy (1 day)

**Configure Apollo Client properly**:
```typescript
// src/core/api/apollo/apollo-client.ts
import { InMemoryCache, ApolloClient } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Merge strategy for paginated lists
        users: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
    User: {
      fields: {
        // Custom merge for nested objects
        profile: {
          merge: true,
        },
      },
    },
  },
});

export const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_API_BASE_URL + '/graphql',
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});
```

---

## 📚 Best Practices

### 1. State Separation Rules

```typescript
// ✅ SERVER STATE (Apollo)
const { data: users } = useGetUsersQuery();
const [updateUser] = useUpdateUserMutation();

// ✅ GLOBAL CLIENT STATE (Zustand)
const cart = useStore((state) => state.cart);
const addToCart = useStore((state) => state.addToCart);

// ✅ LOCAL UI STATE (useState)
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
```

### 2. Selector Optimization

```typescript
// ❌ Bad - re-renders on any state change
const state = useStore();

// ❌ Bad - creates new object on every render
const auth = useStore((state) => ({ 
  user: state.auth.user, 
  token: state.auth.token 
}));

// ✅ Good - only re-renders when user changes
const user = useStore((state) => state.auth.user);

// ✅ Good - with shallow equality for objects
import { shallow } from 'zustand/shallow';
const { user, token } = useStore(
  (state) => ({ user: state.auth.user, token: state.auth.token }),
  shallow
);
```

### 3. Async Actions Pattern

```typescript
// src/store/slices/cartSlice.ts
export const createCartSlice: StateCreator<StoreState, [], [], CartSlice> = (set, get) => ({
  cart: {
    items: [],
    total: 0,
  },
  
  // Sync action
  addItem: (item) =>
    set((state) => {
      state.cart.items.push(item);
      state.cart.total += item.price;
    }),
  
  // Async action
  checkout: async (apolloClient) => {
    const items = get().cart.items;
    
    try {
      const result = await apolloClient.mutate({
        mutation: CREATE_ORDER_MUTATION,
        variables: { items },
      });
      
      if (result.data) {
        set((state) => {
          state.cart.items = [];
          state.cart.total = 0;
        });
        return result.data.createOrder;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  },
});

// Usage
const checkout = useStore((state) => state.checkout);
const handleCheckout = async () => {
  try {
    const order = await checkout(apolloClient);
    navigate(`/orders/${order.id}`);
  } catch (error) {
    toast.error('Checkout failed');
  }
};
```

### 4. Testing Strategy

```typescript
// src/store/__tests__/authSlice.test.ts
import { renderHook, act } from '@testing-library/react';
import { useStore } from '../index';

describe('Auth Slice', () => {
  beforeEach(() => {
    useStore.setState({
      auth: { token: null, user: null, isAuthenticated: false },
    });
  });

  it('should login user', () => {
    const { result } = renderHook(() => useStore());
    
    act(() => {
      result.current.login('token123', { id: 1, name: 'John' });
    });
    
    expect(result.current.auth.isAuthenticated).toBe(true);
    expect(result.current.auth.user?.name).toBe('John');
  });
  
  it('should logout user', () => {
    const { result } = renderHook(() => useStore());
    
    act(() => {
      result.current.login('token123', { id: 1, name: 'John' });
      result.current.logout();
    });
    
    expect(result.current.auth.isAuthenticated).toBe(false);
    expect(result.current.auth.user).toBe(null);
  });
});
```

---

## 📊 Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Auth State** | localStorage directly | Zustand + persist middleware |
| **Cart State** | Redux (commented) | Zustand slice |
| **Server Data** | Apollo + manual caching | Apollo with proper cache config |
| **Type Safety** | Partial | Full TypeScript inference |
| **DevTools** | Limited | Redux DevTools support |
| **Bundle Size** | N/A | +1KB (Zustand) |
| **Boilerplate** | High (Redux) | Minimal (Zustand) |
| **Testing** | Difficult | Easy (isolated slices) |

---

## 🎯 Migration Checklist

### Week 1
- [ ] Install Zustand and middleware
- [ ] Create store structure with slices
- [ ] Implement auth slice
- [ ] Implement cart slice
- [ ] Implement UI preferences slice
- [ ] Add localStorage migration hook

### Week 2
- [ ] Remove direct localStorage access (30+ files)
- [ ] Update useAuth hook to use Zustand
- [ ] Update shopping cart to use Zustand
- [ ] Configure Apollo cache policies
- [ ] Write tests for store slices

### Week 3
- [ ] Remove Redux dependencies (if not needed)
- [ ] Update documentation
- [ ] Code review and cleanup
- [ ] Performance testing

---

## 🔗 Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Apollo Client Cache](https://www.apollographql.com/docs/react/caching/cache-configuration/)
- [State Management Best Practices](https://kentcdodds.com/blog/application-state-management-with-react)
- [When to Use Context vs Zustand](https://tkdodo.eu/blog/zustand-and-react-context)

---

## 💡 Pro Tips

1. **Keep it simple**: Don't over-engineer. Start with Zustand for global client state, Apollo for server state.
2. **Measure first**: Use React DevTools Profiler to identify real performance issues before optimizing.
3. **Gradual migration**: Migrate one feature at a time, don't rewrite everything.
4. **Type safety**: Let TypeScript guide you. If types are complex, your state structure might be too.
5. **DevTools**: Always use Redux DevTools extension for debugging Zustand stores.

---

**Last Updated**: February 2024
**Status**: 🟡 Proposed (Awaiting Implementation)