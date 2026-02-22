# 🔧 GUIDE TECHNIQUE - Complétion des TODOs Prioritaires

**Guide Pratique avec Exemples de Code**  
**Projet:** ClubManager Frontend  
**Date:** 22 février 2026

---

## 📚 TABLE DES MATIÈRES

1. [Configuration Initiale](#configuration-initiale)
2. [Fixtures & Factories](#fixtures--factories)
3. [Services Critiques - Exemples Complets](#services-critiques)
4. [Formatters - Patterns Réutilisables](#formatters)
5. [Composants UI - Stratégies de Test](#composants-ui)
6. [Helpers & Utilities](#helpers--utilities)
7. [Commandes Utiles](#commandes-utiles)

---

## 🚀 Configuration Initiale

### 1. Créer la Structure de Test Utils

```bash
# Créer les dossiers
mkdir -p front-end/src/__test-utils__/{factories,mocks,fixtures,helpers}

# Créer les fichiers de base
touch front-end/src/__test-utils__/factories/index.ts
touch front-end/src/__test-utils__/mocks/apollo.ts
touch front-end/src/__test-utils__/fixtures/users.ts
touch front-end/src/__test-utils__/helpers/render.tsx
```

### 2. Installer Dépendances Manquantes

```bash
npm install -D @faker-js/faker
npm install -D msw  # Mock Service Worker (optionnel)
```

---

## 🏭 Fixtures & Factories

### `__test-utils__/factories/user.factory.ts`

```typescript
import { faker } from '@faker-js/faker';
import { UserRole, UserStatus } from '@/types';

export const UserFactory = {
  /**
   * Créer un utilisateur complet et valide
   */
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number('+32 4## ## ## ##'),
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    joinDate: faker.date.past({ years: 2 }).toISOString(),
    lastLogin: faker.date.recent({ days: 7 }).toISOString(),
    avatar: faker.image.avatar(),
    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: 'Belgium'
    },
    ...overrides
  }),

  /**
   * Créer un utilisateur avec des champs null/undefined
   */
  buildIncomplete: () => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: null,
    email: faker.internet.email(),
    phone: null,
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    joinDate: faker.date.past().toISOString(),
    lastLogin: undefined,
    avatar: null,
    birthDate: null,
    address: null
  }),

  /**
   * Créer un admin
   */
  buildAdmin: () => UserFactory.build({
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE
  }),

  /**
   * Créer un utilisateur inactif
   */
  buildInactive: () => UserFactory.build({
    status: UserStatus.INACTIVE,
    lastLogin: faker.date.past({ years: 1 }).toISOString()
  }),

  /**
   * Créer plusieurs utilisateurs
   */
  buildList: (count: number, overrides = {}) => {
    return Array.from({ length: count }, () => UserFactory.build(overrides));
  }
};
```

### `__test-utils__/factories/product.factory.ts`

```typescript
import { faker } from '@faker-js/faker';
import { ProductCategory, StockStatus } from '@/types';

export const ProductFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 5, max: 200, dec: 2 })),
    stock: faker.number.int({ min: 0, max: 100 }),
    category: faker.helpers.arrayElement(Object.values(ProductCategory)),
    images: [
      faker.image.url(),
      faker.image.url()
    ],
    sku: faker.string.alphanumeric(8).toUpperCase(),
    weight: faker.number.float({ min: 0.1, max: 5, precision: 0.1 }),
    dimensions: {
      width: faker.number.int({ min: 10, max: 50 }),
      height: faker.number.int({ min: 10, max: 50 }),
      depth: faker.number.int({ min: 10, max: 50 })
    },
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  }),

  buildOutOfStock: () => ProductFactory.build({
    stock: 0
  }),

  buildWithDiscount: () => {
    const originalPrice = parseFloat(faker.commerce.price({ min: 50, max: 200, dec: 2 }));
    const discountPercent = faker.number.int({ min: 10, max: 50 });
    const discountedPrice = originalPrice * (1 - discountPercent / 100);
    
    return ProductFactory.build({
      price: discountedPrice,
      originalPrice,
      discountPercent
    });
  },

  buildList: (count: number) => {
    return Array.from({ length: count }, () => ProductFactory.build());
  }
};
```

### `__test-utils__/factories/course.factory.ts`

```typescript
import { faker } from '@faker-js/faker';
import { DayOfWeek, CourseType } from '@/types';

export const CourseFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    title: `${faker.word.adjective()} ${faker.word.noun()} Course`,
    description: faker.lorem.paragraph(),
    day: faker.helpers.arrayElement(Object.values(DayOfWeek)),
    startTime: '19:00',
    endTime: '20:30',
    duration: 90, // minutes
    type: faker.helpers.arrayElement(Object.values(CourseType)),
    instructors: [
      {
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      }
    ],
    capacity: faker.number.int({ min: 10, max: 30 }),
    enrolled: faker.number.int({ min: 0, max: 25 }),
    location: faker.location.streetAddress(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 50, dec: 2 })),
    createdAt: faker.date.past().toISOString(),
    ...overrides
  }),

  buildFull: () => {
    const capacity = 20;
    return CourseFactory.build({
      capacity,
      enrolled: capacity
    });
  },

  buildList: (count: number) => {
    return Array.from({ length: count }, () => CourseFactory.build());
  }
};
```

---

## 🔐 Services Critiques - Exemples Complets

### 1. Auth Service - Complétion Totale

#### Fichier: `auth.service.test.ts`

```typescript
/**
 * Tests for auth.service.ts - VERSION COMPLÉTÉE
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import authService from '../../auth.service';
import { LOGIN_MUTATION, LOGOUT_MUTATION, REFRESH_TOKEN_MUTATION } from '../../graphql/auth.mutations';

// ============================================================
// MOCKS SETUP
// ============================================================

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// ============================================================
// MOCK DATA
// ============================================================

const validCredentials = {
  email: 'admin@clubmanager.com',
  password: 'SecurePassword123!'
};

const mockAuthResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: '1',
    email: validCredentials.email,
    firstName: 'John',
    lastName: 'Admin',
    role: 'ADMIN'
  },
  expiresIn: 3600 // 1 hour
};

// ============================================================
// APOLLO MOCKS
// ============================================================

const loginSuccessMock = {
  request: {
    query: LOGIN_MUTATION,
    variables: validCredentials
  },
  result: {
    data: {
      login: mockAuthResponse
    }
  }
};

const loginFailureMock = {
  request: {
    query: LOGIN_MUTATION,
    variables: {
      email: validCredentials.email,
      password: 'wrongpassword'
    }
  },
  error: new Error('Invalid credentials')
};

const logoutMock = {
  request: {
    query: LOGOUT_MUTATION
  },
  result: {
    data: {
      logout: { success: true }
    }
  }
};

const refreshTokenMock = {
  request: {
    query: REFRESH_TOKEN_MUTATION,
    variables: { refreshToken: mockAuthResponse.refreshToken }
  },
  result: {
    data: {
      refreshToken: {
        token: 'new-jwt-token',
        expiresIn: 3600
      }
    }
  }
};

// ============================================================
// TESTS
// ============================================================

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined and exported', () => {
      expect(authService).toBeDefined();
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.refreshToken).toBe('function');
    });
  });

  describe('login()', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(
        validCredentials.email,
        validCredentials.password
      );

      expect(result).toEqual(mockAuthResponse);
      expect(mockLocalStorage.getItem('authToken')).toBe(mockAuthResponse.token);
      expect(mockLocalStorage.getItem('refreshToken')).toBe(mockAuthResponse.refreshToken);
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        authService.login(validCredentials.email, 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should validate email format', async () => {
      await expect(
        authService.login('invalid-email', 'password')
      ).rejects.toThrow('Invalid email format');
    });

    it('should validate password strength', async () => {
      await expect(
        authService.login(validCredentials.email, '123')
      ).rejects.toThrow('Password too weak');
    });

    it('should store user data in memory', async () => {
      const result = await authService.login(
        validCredentials.email,
        validCredentials.password
      );

      expect(authService.getCurrentUser()).toEqual(mockAuthResponse.user);
    });
  });

  describe('logout()', () => {
    beforeEach(async () => {
      // Login first
      await authService.login(validCredentials.email, validCredentials.password);
    });

    it('should clear tokens from localStorage', async () => {
      await authService.logout();

      expect(mockLocalStorage.getItem('authToken')).toBeNull();
      expect(mockLocalStorage.getItem('refreshToken')).toBeNull();
    });

    it('should clear user data from memory', async () => {
      await authService.logout();

      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should call logout mutation', async () => {
      const spy = vi.spyOn(authService, 'callLogoutMutation');
      await authService.logout();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('refreshToken()', () => {
    it('should refresh token successfully', async () => {
      mockLocalStorage.setItem('refreshToken', mockAuthResponse.refreshToken);

      const result = await authService.refreshToken();

      expect(result.token).toBe('new-jwt-token');
      expect(mockLocalStorage.getItem('authToken')).toBe('new-jwt-token');
    });

    it('should throw error if no refresh token', async () => {
      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('should logout on refresh failure', async () => {
      mockLocalStorage.setItem('refreshToken', 'invalid-token');
      const logoutSpy = vi.spyOn(authService, 'logout');

      await expect(authService.refreshToken()).rejects.toThrow();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('Token Expiration', () => {
    it('should detect expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.mock';
      mockLocalStorage.setItem('authToken', expiredToken);

      expect(authService.isTokenExpired()).toBe(true);
    });

    it('should detect valid token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjke${futureTimestamp}}.mock`;
      mockLocalStorage.setItem('authToken', validToken);

      expect(authService.isTokenExpired()).toBe(false);
    });

    it('should auto-refresh before expiration', async () => {
      vi.useFakeTimers();
      const refreshSpy = vi.spyOn(authService, 'refreshToken');

      // Set token expiring in 5 minutes
      const expiringToken = createTokenWithExpiry(300);
      mockLocalStorage.setItem('authToken', expiringToken);
      
      authService.startAutoRefresh();

      // Fast-forward 4 minutes (should trigger refresh)
      vi.advanceTimersByTime(4 * 60 * 1000);

      expect(refreshSpy).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Error Recovery', () => {
    it('should retry on network error', async () => {
      let attempts = 0;
      const mockLoginWithRetry = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve(mockAuthResponse);
      });

      authService.login = mockLoginWithRetry;

      const result = await authService.login(
        validCredentials.email,
        validCredentials.password
      );

      expect(attempts).toBe(3);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should fallback gracefully on persistent errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      await expect(
        authService.login('fail@test.com', 'password')
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Login failed')
      );
    });
  });

  describe('Security', () => {
    it('should not store password in memory', async () => {
      await authService.login(validCredentials.email, validCredentials.password);

      const currentUser = authService.getCurrentUser();
      expect(currentUser).not.toHaveProperty('password');
    });

    it('should implement rate limiting on login', async () => {
      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(validCredentials.email, 'wrong');
        } catch {}
      }

      // 6th attempt should be blocked
      await expect(
        authService.login(validCredentials.email, validCredentials.password)
      ).rejects.toThrow('Too many login attempts. Please try again later.');
    });

    it('should clear sensitive data on logout', async () => {
      await authService.login(validCredentials.email, validCredentials.password);
      await authService.logout();

      expect(authService.getCurrentUser()).toBeNull();
      expect(mockLocalStorage.getItem('authToken')).toBeNull();
      expect(mockLocalStorage.getItem('refreshToken')).toBeNull();
    });
  });
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function createTokenWithExpiry(secondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow;
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
}
```

---

### 2. Order Service - Complétion Complète

```typescript
/**
 * Tests for order.service.ts - VERSION COMPLÉTÉE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderFactory } from '@/__test-utils__/factories/order.factory';
import orderService from '../../order.service';
import { 
  CREATE_ORDER_MUTATION,
  UPDATE_ORDER_STATUS_MUTATION,
  CANCEL_ORDER_MUTATION,
  GET_ORDER_BY_ID,
  GET_USER_ORDERS
} from '../../graphql/order.queries';

describe('orderService', () => {
  describe('createOrder()', () => {
    it('should create order with correct total calculation', async () => {
      const orderData = {
        items: [
          { productId: '1', quantity: 2, price: 25.50 },
          { productId: '2', quantity: 1, price: 15.00 }
        ],
        userId: 'user-123'
      };

      const expectedTotal = (2 * 25.50) + (1 * 15.00); // 66.00

      const mockResponse = {
        request: {
          query: CREATE_ORDER_MUTATION,
          variables: { input: expect.objectContaining(orderData) }
        },
        result: {
          data: {
            createOrder: {
              id: 'order-1',
              ...orderData,
              total: expectedTotal,
              status: 'PENDING',
              createdAt: new Date().toISOString()
            }
          }
        }
      };

      const result = await orderService.createOrder(orderData);

      expect(result.total).toBe(expectedTotal);
      expect(result.status).toBe('PENDING');
    });

    it('should validate stock availability before creating order', async () => {
      const orderData = {
        items: [
          { productId: 'out-of-stock', quantity: 10, price: 25.00 }
        ],
        userId: 'user-123'
      };

      // Mock stockService to return insufficient stock
      vi.spyOn(orderService, 'checkStock').mockResolvedValue({
        available: false,
        stockLeft: 3
      });

      await expect(orderService.createOrder(orderData)).rejects.toThrow(
        'Insufficient stock. Only 3 items available.'
      );
    });

    it('should apply discount code if provided', async () => {
      const orderData = {
        items: [{ productId: '1', quantity: 1, price: 100.00 }],
        userId: 'user-123',
        discountCode: 'SAVE20'
      };

      const result = await orderService.createOrder(orderData);

      expect(result.subtotal).toBe(100.00);
      expect(result.discount).toBe(20.00);
      expect(result.total).toBe(80.00);
    });
  });

  describe('updateOrderStatus()', () => {
    it('should update status from PENDING to PAID', async () => {
      const orderId = 'order-123';
      const newStatus = 'PAID';

      const result = await orderService.updateOrderStatus(orderId, newStatus);

      expect(result.status).toBe('PAID');
      expect(result.paidAt).toBeDefined();
    });

    it('should not allow invalid status transitions', async () => {
      const orderId = 'order-completed';
      
      await expect(
        orderService.updateOrderStatus(orderId, 'PENDING')
      ).rejects.toThrow('Cannot change status from COMPLETED to PENDING');
    });

    it('should trigger email notification on status change', async () => {
      const emailSpy = vi.spyOn(orderService, 'sendStatusEmail');
      
      await orderService.updateOrderStatus('order-1', 'SHIPPED');

      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: 'SHIPPED'
        })
      );
    });
  });

  describe('cancelOrder()', () => {
    it('should cancel order and initiate refund', async () => {
      const orderId = 'order-paid';

      const result = await orderService.cancelOrder(orderId, {
        reason: 'Customer request'
      });

      expect(result.status).toBe('CANCELLED');
      expect(result.refundStatus).toBe('PENDING');
      expect(result.cancelledAt).toBeDefined();
    });

    it('should restore stock after cancellation', async () => {
      const order = OrderFactory.build({
        items: [
          { productId: 'product-1', quantity: 5 }
        ]
      });

      const stockSpy = vi.spyOn(orderService, 'restoreStock');

      await orderService.cancelOrder(order.id);

      expect(stockSpy).toHaveBeenCalledWith([
        { productId: 'product-1', quantity: 5 }
      ]);
    });

    it('should not allow cancellation after shipping', async () => {
      const shippedOrder = OrderFactory.build({ status: 'SHIPPED' });

      await expect(
        orderService.cancelOrder(shippedOrder.id)
      ).rejects.toThrow('Cannot cancel order that has been shipped');
    });
  });

  describe('getUserOrders()', () => {
    it('should fetch all orders for a user with pagination', async () => {
      const userId = 'user-123';
      const mockOrders = OrderFactory.buildList(15);

      const result = await orderService.getUserOrders(userId, {
        page: 1,
        limit: 10
      });

      expect(result.data).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.hasMore).toBe(true);
    });

    it('should filter orders by status', async () => {
      const result = await orderService.getUserOrders('user-123', {
        status: 'COMPLETED'
      });

      expect(result.data.every(order => order.status === 'COMPLETED')).toBe(true);
    });

    it('should sort orders by date descending by default', async () => {
      const result = await orderService.getUserOrders('user-123');

      const dates = result.data.map(o => new Date(o.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);

      expect(dates).toEqual(sortedDates);
    });
  });

  describe('Error Recovery', () => {
    it('should rollback on payment failure', async () => {
      const orderData = OrderFactory.build();
      
      vi.spyOn(orderService, 'processPayment').mockRejectedValue(
        new Error('Payment declined')
      );

      const rollbackSpy = vi.spyOn(orderService, 'rollbackOrder');

      await expect(orderService.createOrder(orderData)).rejects.toThrow();

      expect(rollbackSpy).toHaveBeenCalled();
    });

    it('should handle concurrent order creation (race condition)', async () => {
      const product = { id: 'product-limited', stock: 1 };

      const order1Promise = orderService.createOrder({
        items: [{ productId: product.id, quantity: 1 }],
        userId: 'user-1'
      });

      const order2Promise = orderService.createOrder({
        items: [{ productId: product.id, quantity: 1 }],
        userId: 'user-2'
      });

      const results = await Promise.allSettled([order1Promise, order2Promise]);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // Only one should succeed due to stock locking
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
    });
  });
});
```

---

## 📊 Formatters - Patterns Réutilisables

### Template Générique pour Formatter Function

```typescript
/**
 * TEMPLATE RÉUTILISABLE pour TOUS les formatters
 * Copier-coller et adapter
 */

import { describe, it, expect } from 'vitest';
import { formatUserFullName } from '../../user-formatters';
import { UserFactory } from '@/__test-utils__/factories';

describe('formatUserFullName', () => {
  // ========================================
  // BASIC FUNCTIONALITY
  // ========================================
  
  it('should be defined as a function', () => {
    expect(typeof formatUserFullName).toBe('function');
  });

  it('should return expected output for valid input', () => {
    const user = UserFactory.build({
      firstName: 'Jean',
      lastName: 'Dupont'
    });

    const result = formatUserFullName(user);

    expect(result).toBe('Jean Dupont');
  });

  it('should handle different input types', () => {
    const user1 = { firstName: 'Marie', lastName: 'Martin' };
    const user2 = { firstName: 'Pierre', lastName: 'Bernard' };

    expect(formatUserFullName(user1)).toBe('Marie Martin');
    expect(formatUserFullName(user2)).toBe('Pierre Bernard');
  });

  it('should produce consistent results (idempotency)', () => {
    const user = UserFactory.build();
    const result1 = formatUserFullName(user);
    const result2 = formatUserFullName(user);

    expect(result1).toBe(result2);
  });

  // ========================================
  // EDGE CASES
  // ========================================

  it('should handle empty/null/undefined input', () => {
    expect(formatUserFullName({ firstName: null, lastName: null })).toBe('');
    expect(formatUserFullName({ firstName: undefined, lastName: undefined })).toBe('');
    expect(formatUserFullName({ firstName: '', lastName: '' })).toBe('');
  });

  it('should handle invalid input gracefully', () => {
    expect(formatUserFullName(null)).toBe('');
    expect(formatUserFullName(undefined)).toBe('');
    expect(formatUserFullName({})).toBe('');
  });

  it('should handle boundary values', () => {
    // Nom très long
    const longName = 'A'.repeat(100);
    expect(formatUserFullName({
      firstName: longName,
      lastName: longName
    })).toContain('A');

    // Nom d'une lettre
    expect(formatUserFullName({
      firstName: 'A',
      lastName: 'B'
    })).toBe('A B');
  });

  it('should handle special characters and unicode', () => {
    expect(formatUserFullName({
      firstName: 'François',
      lastName: 'O\'Brien'
    })).toBe('François O\'Brien');

    expect(formatUserFullName({
      firstName: '李',
      lastName: '明'
    })).toBe('李 明');

    expect(formatUserFullName({
      firstName: 'José',
      lastName: 'García'
    })).toBe('José García');
  });

  // ========================================
  // TYPE SAFETY
  // ========================================

  it('should return correct type', () => {
    const user = UserFactory.build();
    const result = formatUserFullName(user);

    expect(typeof result).toBe('string');
  });

  it('should handle type coercion correctly', () => {
    // Nombres convertis en string
    const user = { firstName: 123, lastName: 456 };
    const result = formatUserFullName(user as any);

    expect(typeof result).toBe('string');
  });

  // ========================================
  // PERFORMANCE
  // ========================================

  it('should handle large inputs efficiently', () => {
    const users = UserFactory.buildList(1000);
    
    const start = performance.now();
    users.forEach(user => formatUserFullName(user));
    const duration = performance.now() - start;

    // Should complete in less than 100ms for 1000 items
    expect(duration).toBeLessThan(100);
  });

  it('should not mutate input (pure function)', () => {
    const user = UserFactory.build();
    const originalFirstName = user.firstName;
    const originalLastName = user.lastName;

    formatUserFullName(user);

    expect(user.firstName).toBe(originalFirstName);
    expect(user.lastName).toBe(originalLastName);
  });

  // ========================================
  // REAL-WORLD SCENARIOS
  // ========================================

  it('should handle typical use case', () => {
    const user = {
      firstName: 'Jean-François',
      lastName: 'Van Der Berg'
    };

    const result = formatUserFullName(user);

    expect(result).toBe('Jean-François Van Der Berg');
  });

  it('should integrate with other functions', () => {
    const user = UserFactory.build();
    const fullName = formatUserFullName(user);
    const initials = formatUserInitials(user);

    // Initials should match first letters of full name
    const expectedInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    expect(initials).toBe(expectedInitials);
  });
});
```

### Application Rapide à Multiple Fonctions

```typescript
/**
 * Exemple: Compléter 10 formatters en une fois avec fixture
 */

import { UserFactory } from '@/__test-utils__/factories';

describe('User Formatters Suite', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = UserFactory.build({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+32 478 12 34 56',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinDate: '2024-01-15T10:00:00Z',
      birthDate: '1990-05-20T00:00:00Z'
    });
  });

  describe('formatUserFullName', () => {
    it('should format correctly', () => {
      expect(formatUserFullName(mockUser)).toBe('Jean Dupont');
    });
  });

  describe('formatUserEmail', () => {
    it('should lowercase email', () => {
      const user = { ...mockUser, email: 'JEAN.DUPONT@EXAMPLE.COM' };
      expect(formatUserEmail(user)).toBe('jean.dupont@example.com');
    });
  });

  describe('formatUserPhone', () => {
    it('should format international phone', () => {
      expect(formatUserPhone(mockUser)).toBe('+32 478 12 34 56');
    });
  });

  describe('getUserRoleLabel', () => {
    it('should return translated label', () => {
      expect(getUserRoleLabel('MEMBER')).toBe('Membre');
      expect(getUserRoleLabel('ADMIN')).toBe('Administrateur');
    });
  });

  describe('calculateUserAge', () => {
    it('should calculate age correctly', () => {
      const age = calculateUserAge(mockUser.birthDate);
      const expectedAge = new Date().getFullYear() - 1990;
      
      expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(age).toBeLessThanOrEqual(expectedAge);
    });
  });

  // ... Continue pour les autres fonctions
});
```

---

## 🎨 Composants UI - Stratégies de Test

### Pattern: Composant avec Form

```typescript
/**
 * PaymentForm.test.tsx - EXEMPLE COMPLET
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from '../../PaymentForm';
import { renderWithProviders } from '@/__test-utils__/helpers/render';

// Mock Stripe
const mockStripe = {
  createPaymentMethod: vi.fn(),
  confirmCardPayment: vi.fn()
};

const mockElements = {
  getElement: vi.fn()
};

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  CardElement: ({ onChange }) => (
    <input
      data-testid="card-element"
      onChange={(e) => onChange({ complete: e.target.value.length > 0 })}
    />
  )
}));

describe('PaymentForm', () => {
  const defaultProps = {
    amount: 99.99,
    currency: 'EUR',
    onSuccess: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render payment form with amount', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />);

      expect(screen.getByText(/99.99/)).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    it('should display currency symbol', () => {
      renderWithProviders(<PaymentForm {...defaultProps} currency="USD" />);

      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should enable submit button when card is complete', async () => {
      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const cardInput = screen.getByTestId('card-element');
      await user.type(cardInput, '4242424242424242');

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      expect(submitBtn).not.toBeDisabled();
    });

    it('should process payment on submit', async () => {
      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_123',
          status: 'succeeded'
        }
      });

      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const cardInput = screen.getByTestId('card-element');
      await user.type(cardInput, '4242424242424242');

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'pi_123' })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on payment failure', async () => {
      mockStripe.confirmCardPayment.mockRejectedValue({
        message: 'Card declined'
      });

      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/card declined/i)).toBeInTheDocument();
      });
    });

    it('should call onError callback', async () => {
      const error = new Error('Network error');
      mockStripe.confirmCardPayment.mockRejectedValue(error);

      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during payment', async () => {
      let resolvePayment;
      mockStripe.confirmCardPayment.mockReturnValue(
        new Promise(resolve => { resolvePayment = resolve; })
      );

      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      await user.click(submitBtn);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should prevent double submission', async () => {
      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      
      await user.click(submitBtn);
      await user.click(submitBtn);

      expect(mockStripe.confirmCardPayment).toHaveBeenCalledTimes(1);
    });

    it('should handle 3D Secure flow', async () => {
      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: {
          status: 'requires_action',
          next_action: { type: '3d_secure' }
        }
      });

      renderWithProviders(<PaymentForm {...defaultProps} />);
      const user = userEvent.setup();

      const submitBtn = screen.getByRole('button', { name: /pay/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/additional authentication/i)).toBeInTheDocument();
      });
    });
  });
});
```

---

## 🔧 Helpers & Utilities

### `__test-utils__/helpers/render.tsx`

```typescript
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import i18n from '@/i18n/test-config';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  apolloMocks?: MockedResponse[];
  initialRoute?: string;
  i18nResources?: any;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    apolloMocks = [],
    initialRoute = '/',
    i18nResources = {},
    ...options
  }: CustomRenderOptions = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute);

  // Wrapper with all providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={apolloMocks} addTypename={false}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </I18nextProvider>
    </MockedProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Utility to wait for Apollo queries
export async function waitForApollo() {
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### `__test-utils__/mocks/apollo.ts`

```typescript
import { MockedResponse } from '@apollo/client/testing';

export function createQueryMock<TData = any, TVariables = any>(
  query: any,
  variables: TVariables,
  data: TData
): MockedResponse {
  return {
    request: { query, variables },
    result: { data }
  };
}

export function createMutationMock<TData = any, TVariables = any>(
  mutation: any,
  variables: TVariables,
  data: TData
): MockedResponse {
  return {
    request: { query: mutation, variables },
    result: { data }
  };
}

export function createErrorMock(
  query: any,
  variables: any,
  errorMessage: string
): MockedResponse {
  return {
    request: { query, variables },
    error: new Error(errorMessage)
  };
}
```

---

## 📋 Commandes Utiles

### Lancer Tests Spécifiques

```bash
# Test un seul fichier
npm test -- auth.service.test.ts

# Test un seul describe
npm test -- auth.service.test.ts -t "login()"

# Test avec coverage
npm test -- auth.service.test.ts --coverage

# Watch mode
npm test -- auth.service.test.ts --watch

# UI mode (Vitest UI)
npm test -- --ui
```

### Scripts de Génération

```bash
# Générer fixtures pour un domaine
node scripts/generate-fixtures.js users

# Remplir TODOs basiques automatiquement
node scripts/fill-basic-todos.js

# Vérifier coverage par fichier
npm run test:coverage -- --reporter=html
# Ouvrir coverage/index.html
```

### Git Workflow

```bash
# Créer branche
git checkout -b feature/complete-todos-phase1

# Commit par phase
git add front-end/src/**/*formatters.test.ts
git commit -m "✅ Phase 1: Complete all formatters tests"

# Push et PR
git push origin feature/complete-todos-phase1
```

---

## 🎯 Checklist par Fichier

### ✅ auth.service.test.ts
- [ ] Mock localStorage
- [ ] Mock Apollo mutations (login, logout, refresh)
- [ ] Test login success/failure
- [ ] Test logout cleanup
- [ ] Test token refresh
- [ ] Test token expiration
- [ ] Test security (rate limiting)
- [ ] Test error recovery

### ✅ user-formatters.test.ts
- [ ] Create UserFactory fixture
- [ ] Test formatUserFullName (6 TODOs)
- [ ] Test formatUserEmail (6 TODOs)
- [ ] Test formatUserPhone (6 TODOs)
- [ ] Test getUserRoleLabel (6 TODOs)
- [ ] ... (repeat for 25 functions)

### ✅ PaymentForm.test.tsx
- [ ] Mock Stripe hooks
- [ ] Mock Apollo payment mutations
- [ ] Test form rendering
- [ ] Test card input validation
- [ ] Test payment submission
- [ ] Test error states
- [ ] Test loading states
- [ ] Test 3D Secure flow

---

**🎉 Bonne chance ! Avec ces exemples, vous devriez pouvoir compléter les TODOs efficacement !**