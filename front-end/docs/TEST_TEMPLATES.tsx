/**
 * ====================================================================
 * TESTING TEMPLATES - ClubManager Frontend
 * ====================================================================
 *
 * Templates réutilisables pour créer rapidement des tests
 * Copier/coller/adapter selon vos besoins
 *
 * @version 1.0.0
 * @created 2025-01-24
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

// ============================================================================
// TABLE DES MATIÈRES
// ============================================================================
/*

1. TEMPLATE - Hook Simple (useState-based)
2. TEMPLATE - Hook GraphQL (Apollo)
3. TEMPLATE - Hook avec Debounce/Timers
4. TEMPLATE - Utils Pures (Formatters)
5. TEMPLATE - Composant Simple
6. TEMPLATE - Composant avec GraphQL
7. TEMPLATE - Store Zustand
8. TEMPLATE - Tests d'Intégration

*/

// ============================================================================
// 1. TEMPLATE - HOOK SIMPLE (useState-based)
// ============================================================================

/**
 * Usage: Tests pour hooks qui gèrent du state local simple
 * Exemples: useToggle, usePrevious, useCounter
 */

/*
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYourHook } from '../../hooks/useYourHook';

describe('useYourHook', () => {
  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useYourHook());

    expect(result.current.value).toBe(EXPECTED_DEFAULT);
  });

  it('should initialize with custom initial value', () => {
    const { result } = renderHook(() => useYourHook(CUSTOM_INITIAL));

    expect(result.current.value).toBe(CUSTOM_INITIAL);
  });

  // ============================================================================
  // State Update Tests
  // ============================================================================

  it('should update state when setter is called', () => {
    const { result } = renderHook(() => useYourHook());

    act(() => {
      result.current.setValue(NEW_VALUE);
    });

    expect(result.current.value).toBe(NEW_VALUE);
  });

  it('should update state with function updater', () => {
    const { result } = renderHook(() => useYourHook(0));

    act(() => {
      result.current.setValue((prev) => prev + 1);
    });

    expect(result.current.value).toBe(1);
  });

  // ============================================================================
  // Reset/Clear Tests
  // ============================================================================

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useYourHook(INITIAL));

    act(() => {
      result.current.setValue(UPDATED);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe(INITIAL);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle null values', () => {
    const { result } = renderHook(() => useYourHook(null));
    expect(result.current.value).toBeNull();
  });

  it('should handle undefined values', () => {
    const { result } = renderHook(() => useYourHook(undefined));
    expect(result.current.value).toBeUndefined();
  });

  // ============================================================================
  // Re-render Tests (Memoization)
  // ============================================================================

  it('should memoize return value', () => {
    const { result, rerender } = renderHook(() => useYourHook());

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
*/

// ============================================================================
// 2. TEMPLATE - HOOK GRAPHQL (Apollo)
// ============================================================================

/**
 * Usage: Tests pour hooks qui utilisent Apollo GraphQL
 * Exemples: useStatsData, useUsers, useOrders
 */

/*
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useYourGraphQLHook } from '../../hooks/useYourGraphQLHook';
import { YOUR_QUERY } from '../../graphql/queries';
import { ReactNode } from 'react';

// Mock GraphQL response
const mockData = {
  yourQuery: {
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
  },
};

// Create Apollo mocks
const createMocks = (overrides = {}) => [
  {
    request: {
      query: YOUR_QUERY,
      variables: { filter: 'all' },
    },
    result: {
      data: {
        ...mockData,
        ...overrides,
      },
    },
  },
];

// Wrapper with Apollo Provider
const createWrapper = (mocks = createMocks()) => {
  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
};

describe('useYourGraphQLHook', () => {
  // ============================================================================
  // Loading State Tests
  // ============================================================================

  it('should start with loading state', () => {
    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ============================================================================
  // Success State Tests
  // ============================================================================

  it('should load data successfully', async () => {
    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should return correct data structure', async () => {
    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.items[0]).toEqual({
      id: 1,
      name: 'Item 1',
    });
  });

  // ============================================================================
  // Error State Tests
  // ============================================================================

  it('should handle GraphQL errors', async () => {
    const errorMocks = [
      {
        request: {
          query: YOUR_QUERY,
          variables: { filter: 'all' },
        },
        error: new Error('Network error'),
      },
    ];

    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(errorMocks),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeNull();
  });

  // ============================================================================
  // Refetch Tests
  // ============================================================================

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refetch).toBeInstanceOf(Function);
  });

  // ============================================================================
  // Variables Tests
  // ============================================================================

  it('should accept custom variables', async () => {
    const customMocks = [
      {
        request: {
          query: YOUR_QUERY,
          variables: { filter: 'custom' },
        },
        result: { data: mockData },
      },
    ];

    const { result } = renderHook(
      () => useYourGraphQLHook({ filter: 'custom' }),
      { wrapper: createWrapper(customMocks) }
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle empty data', async () => {
    const emptyMocks = createMocks({
      yourQuery: { items: [] },
    });

    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(emptyMocks),
    });

    await waitFor(() => {
      expect(result.current.data?.items).toEqual([]);
    });
  });

  it('should handle null data', async () => {
    const nullMocks = createMocks({
      yourQuery: null,
    });

    const { result } = renderHook(() => useYourGraphQLHook(), {
      wrapper: createWrapper(nullMocks),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});
*/

// ============================================================================
// 3. TEMPLATE - HOOK AVEC DEBOUNCE/TIMERS
// ============================================================================

/**
 * Usage: Tests pour hooks avec setTimeout/setInterval/debounce
 * Exemples: useDebounce, useThrottle, useInterval
 */

/*
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYourTimerHook } from '../../hooks/useYourTimerHook';

describe('useYourTimerHook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ============================================================================
  // Basic Timer Tests
  // ============================================================================

  it('should delay execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useYourTimerHook(callback, 500));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending timer', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useYourTimerHook(callback, 500));

    act(() => {
      result.current.cancel();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  it('should cleanup on unmount', () => {
    const callback = vi.fn();
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useYourTimerHook(callback, 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  // ============================================================================
  // Multiple Calls Tests
  // ============================================================================

  it('should reset timer on subsequent calls', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ delay }) => useYourTimerHook(callback, delay),
      { initialProps: { delay: 500 } }
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Re-trigger
    rerender({ delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle zero delay', () => {
    const callback = vi.fn();
    renderHook(() => useYourTimerHook(callback, 0));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle negative delay', () => {
    const callback = vi.fn();
    renderHook(() => useYourTimerHook(callback, -100));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
*/

// ============================================================================
// 4. TEMPLATE - UTILS PURES (Formatters)
// ============================================================================

/**
 * Usage: Tests pour fonctions pures (formatters, validators, etc.)
 * Exemples: formatPrice, validateEmail, calculateDiscount
 */

/*
import { describe, it, expect } from 'vitest';
import {
  yourFormatter,
  yourValidator,
  yourCalculator,
} from '../../utils/your-utils';

describe('yourFormatter', () => {
  // ============================================================================
  // Basic Functionality Tests
  // ============================================================================

  it('should format value correctly', () => {
    expect(yourFormatter(INPUT)).toBe(EXPECTED_OUTPUT);
  });

  it('should handle different input types', () => {
    expect(yourFormatter('string')).toBe('formatted-string');
    expect(yourFormatter(123)).toBe('formatted-number');
    expect(yourFormatter(true)).toBe('formatted-boolean');
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  it('should handle empty string', () => {
    expect(yourFormatter('')).toBe('');
  });

  it('should handle null', () => {
    expect(yourFormatter(null)).toBe('N/A');
  });

  it('should handle undefined', () => {
    expect(yourFormatter(undefined)).toBe('N/A');
  });

  it('should handle zero', () => {
    expect(yourFormatter(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(yourFormatter(-10)).toBe('-10');
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  it('should validate correct format', () => {
    expect(yourValidator('valid@email.com')).toBe(true);
  });

  it('should reject invalid format', () => {
    expect(yourValidator('invalid-email')).toBe(false);
  });

  // ============================================================================
  // Calculation Tests
  // ============================================================================

  it('should calculate correctly', () => {
    expect(yourCalculator(10, 20)).toBe(30);
  });

  it('should handle decimal precision', () => {
    expect(yourCalculator(10.5, 20.3)).toBeCloseTo(30.8, 1);
  });

  // ============================================================================
  // Performance Tests (for heavy calculations)
  // ============================================================================

  it('should perform fast for large inputs', () => {
    const start = performance.now();
    yourCalculator(Array(10000).fill(1));
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // < 100ms
  });
});
*/

// ============================================================================
// 5. TEMPLATE - COMPOSANT SIMPLE
// ============================================================================

/**
 * Usage: Tests pour composants UI simples sans GraphQL
 * Exemples: Button, Card, Badge, EmptyState
 */

/*
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  // ============================================================================
  // Rendering Tests
  // ============================================================================

  it('should render without crashing', () => {
    render(<YourComponent />);
  });

  it('should render with required props', () => {
    render(<YourComponent title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <YourComponent>
        <span>Child Content</span>
      </YourComponent>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  // ============================================================================
  // Props Tests
  // ============================================================================

  it('should apply custom className', () => {
    const { container } = render(<YourComponent className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should apply custom style', () => {
    const { container } = render(
      <YourComponent style={{ color: 'red' }} />
    );

    expect(container.firstChild).toHaveStyle({ color: 'red' });
  });

  it('should render different variants', () => {
    const { rerender } = render(<YourComponent variant="primary" />);
    expect(screen.getByRole('button')).toHaveClass('primary');

    rerender(<YourComponent variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('secondary');
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<YourComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<YourComponent onClick={handleClick} disabled />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should handle keyboard events', async () => {
    const handleKeyDown = vi.fn();
    const user = userEvent.setup();

    render(<YourComponent onKeyDown={handleKeyDown} />);

    const element = screen.getByRole('button');
    await user.type(element, '{Enter}');

    expect(handleKeyDown).toHaveBeenCalled();
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  it('should have correct ARIA attributes', () => {
    render(<YourComponent aria-label="Test Label" />);

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();

    render(<YourComponent />);

    const element = screen.getByRole('button');
    await user.tab();

    expect(element).toHaveFocus();
  });

  // ============================================================================
  // Conditional Rendering Tests
  // ============================================================================

  it('should render loading state', () => {
    render(<YourComponent isLoading />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(<YourComponent error="Error message" />);

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should not render when hidden', () => {
    render(<YourComponent hidden />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Snapshot Tests (optional)
  // ============================================================================

  it('should match snapshot', () => {
    const { container } = render(<YourComponent title="Snapshot Test" />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
*/

// ============================================================================
// 6. TEMPLATE - COMPOSANT AVEC GRAPHQL
// ============================================================================

/**
 * Usage: Tests pour composants qui utilisent GraphQL
 * Exemples: UserList, OrderTable, StatsCard
 */

/*
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { YourComponent } from './YourComponent';
import { YOUR_QUERY } from '../../graphql/queries';

const mockData = {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ],
};

const mocks = [
  {
    request: {
      query: YOUR_QUERY,
    },
    result: {
      data: mockData,
    },
  },
];

describe('YourComponent', () => {
  // ============================================================================
  // Loading State Tests
  // ============================================================================

  it('should show loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <YourComponent />
      </MockedProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // ============================================================================
  // Success State Tests
  // ============================================================================

  it('should render data after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <YourComponent />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('should render correct number of items', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <YourComponent />
      </MockedProvider>
    );

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });
  });

  // ============================================================================
  // Error State Tests
  // ============================================================================

  it('should show error state on GraphQL error', async () => {
    const errorMocks = [
      {
        request: {
          query: YOUR_QUERY,
        },
        error: new Error('GraphQL Error'),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <YourComponent />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Empty State Tests
  // ============================================================================

  it('should show empty state when no data', async () => {
    const emptyMocks = [
      {
        request: {
          query: YOUR_QUERY,
        },
        result: {
          data: { items: [] },
        },
      },
    ];

    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <YourComponent />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });
  });
});
*/

// ============================================================================
// 7. TEMPLATE - STORE ZUSTAND
// ============================================================================

/**
 * Usage: Tests pour stores Zustand
 * Exemples: authStore, notificationStore, uiStore
 */

/*
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYourStore } from '../../store/your-store';

describe('useYourStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useYourStore.setState(useYourStore.getState().getInitialState());
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useYourStore());

    expect(result.current.value).toBe(INITIAL_VALUE);
    expect(result.current.items).toEqual([]);
  });

  // ============================================================================
  // Actions Tests
  // ============================================================================

  it('should update state when action is called', () => {
    const { result } = renderHook(() => useYourStore());

    act(() => {
      result.current.setValue(NEW_VALUE);
    });

    expect(result.current.value).toBe(NEW_VALUE);
  });

  it('should add item to list', () => {
    const { result } = renderHook(() => useYourStore());

    act(() => {
      result.current.addItem({ id: 1, name: 'Item 1' });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({ id: 1, name: 'Item 1' });
  });

  it('should remove item from list', () => {
    const { result } = renderHook(() => useYourStore());

    act(() => {
      result.current.addItem({ id: 1, name: 'Item 1' });
      result.current.addItem({ id: 2, name: 'Item 2' });
    });

    act(() => {
      result.current.removeItem(1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(2);
  });

  // ============================================================================
  // Computed Values Tests
  // ============================================================================

  it('should compute derived values correctly', () => {
    const { result } = renderHook(() => useYourStore());

    act(() => {
      result.current.addItem({ id: 1, price: 10 });
      result.current.addItem({ id: 2, price: 20 });
    });

    expect(result.current.total).toBe(30);
  });

  // ============================================================================
  // Persistence Tests (if using persist middleware)
  // ============================================================================

  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => useYourStore());

    act(() => {
      result.current.setValue('persisted-value');
    });

    const stored = localStorage.getItem('your-store');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).state.value).toBe('persisted-value');
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useYourStore());

    act(() => {
      result.current.setValue('modified');
      result.current.addItem({ id: 1, name: 'Item' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe(INITIAL_VALUE);
    expect(result.current.items).toEqual([]);
  });
});
*/

// ============================================================================
// 8. TEMPLATE - TESTS D'INTÉGRATION
// ============================================================================

/**
 * Usage: Tests de flows complets (user journeys)
 * Exemples: Login flow, Checkout flow, User management flow
 */

/*
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { YourFeaturePage } from './YourFeaturePage';
import { QUERY_1, MUTATION_1 } from '../../graphql';

const mocks = [
  {
    request: { query: QUERY_1 },
    result: { data: MOCK_DATA },
  },
  {
    request: { query: MUTATION_1, variables: { id: 1 } },
    result: { data: { success: true } },
  },
];

const wrapper = ({ children }) => (
  <MemoryRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </MemoryRouter>
);

describe('YourFeature - Integration Tests', () => {
  // ============================================================================
  // Complete Flow Tests
  // ============================================================================

  it('should complete full user flow', async () => {
    const user = userEvent.setup();

    render(<YourFeaturePage />, { wrapper });

    // Step 1: Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Step 2: Search for item
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Item 1');

    // Step 3: Filter results
    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    // Step 4: Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
    });

    // Step 5: Clear filters
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // Step 6: Verify all items shown again
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('should handle error and retry', async () => {
    const user = userEvent.setup();

    // First attempt fails
    const errorMocks = [
      {
        request: { query: QUERY_1 },
        error: new Error('Network error'),
      },
      // Retry succeeds
      {
        request: { query: QUERY_1 },
        result: { data: MOCK_DATA },
      },
    ];

    const errorWrapper = ({ children }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    render(<YourFeaturePage />, { wrapper: errorWrapper });

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });
});
*/

// ============================================================================
// BONUS TIPS & BEST PRACTICES
// ============================================================================

/*
// TIP 1: Use data-testid for complex selectors
<div data-testid="user-card-1">...</div>
screen.getByTestId('user-card-1');

// TIP 2: Prefer semantic queries
screen.getByRole('button', { name: /submit/i });  // ✅ GOOD
screen.getByTestId('submit-button');             // ❌ BAD

// TIP 3: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// TIP 4: Use userEvent over fireEvent
const user = userEvent.setup();
await user.click(button);  // ✅ GOOD (more realistic)
fireEvent.click(button);   // ❌ BAD (less realistic)

// TIP 5: Test user behavior, not implementation
// ✅ GOOD: Test what user sees/does
expect(screen.getByText('Welcome, John')).toBeInTheDocument();

// ❌ BAD: Test internal state
expect(component.state.user.name).toBe('John');

// TIP 6: Use describe blocks to organize tests
describe('YourComponent', () => {
  describe('Rendering', () => { ... });
  describe('Interactions', () => { ... });
  describe('Edge Cases', () => { ... });
});

// TIP 7: Mock external dependencies
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true }),
}));

// TIP 8: Use beforeEach for common setup
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// TIP 9: Test accessibility
expect(screen.getByLabelText('Email')).toBeInTheDocument();
expect(screen.getByRole('button')).toHaveAccessibleName('Submit');

// TIP 10: Use custom render for providers
const customRender = (ui, options) => {
  return render(
    <Providers>
      {ui}
    </Providers>,
    options
  );
};
*/

// ============================================================================
// COMMANDES UTILES
// ============================================================================

/*
# Lancer tous les tests
npm test

# Lancer en mode watch
npm test -- --watch

# Lancer avec UI
npm run test:ui

# Lancer tests d'un fichier spécifique
npm test useUserSearch

# Lancer tests d'une feature
npm test features/users

# Coverage
npm run test:coverage

# Coverage d'une feature
npm run test:coverage -- features/users
*/

// ============================================================================
// STRUCTURE RECOMMANDÉE
// ============================================================================

/*
features/
  users/
    __tests__/
      hooks/
        useUserSearch.test.ts          ← Tests hooks
        useUserFilter.test.ts
      utils/
        user-formatters.test.ts        ← Tests utils
      components/
        UserCard.test.tsx              ← Tests composants
        UserList.test.tsx
      pages/
        ManageUsersPage.test.tsx       ← Tests pages
      integration/
        user-management-flow.test.tsx  ← Tests intégration
*/

// ============================================================================
// RESSOURCES
// ============================================================================

/*
- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/react
- Jest-DOM: https://github.com/testing-library/jest-dom
- User Event: https://testing-library.com/docs/user-event/intro
- Apollo Testing: https://www.apollographql.com/docs/react/development-testing/testing/
*/

export const TEST_TEMPLATES_INFO = {
  version: '1.0.0',
  created: '2025-01-24',
  templates: [
    'Hook Simple',
    'Hook GraphQL',
    'Hook avec Timers',
    'Utils Pures',
    'Composant Simple',
    'Composant GraphQL',
    'Store Zustand',
    'Tests d\'Intégration',
  ],
  status: '✅ Ready to use',
} as const;

console.log('📚 TEST_TEMPLATES.tsx loaded - Copy/Paste templates as needed!');
